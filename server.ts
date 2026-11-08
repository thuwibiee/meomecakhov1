import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  User,
  Character,
  UserCharacterOwnership,
  OrderReceipt,
  WalletTransaction,
  RedeemCode,
  Quest,
  GachaConfig,
  Voucher,
  Feedback,
  Complaint,
  CharacterFeedback,
  AdminAuditLog,
  SpecialOrder,
  SpecialOrderType,
  LoyaltyCardConfig,
  UserLoyaltyCard,
  LoyaltyCompletionLog,
  CatTownConfig,
  CatTownUserProfile,
} from './src/types.ts';
import { setupCatTownRoutes, getDefaultCatTownConfig } from './server/catTown.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

// Persistent database file path
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  users: (User & { passwordHash: string; salt: string; failedAttempts: number; lockedUntil?: number })[];
  characters: Character[];
  user_characters: UserCharacterOwnership[];
  orders: OrderReceipt[];
  wallet_transactions: WalletTransaction[];
  redeem_codes: RedeemCode[];
  code_redemptions: { id: string; code: string; userId: string; redeemedAt: string }[];
  quests: Quest[];
  user_quests: { id: string; userId: string; questId: string; streakCount: number; lastClaimedDate: string }[];
  gacha_config: GachaConfig;
  vouchers: Voucher[];
  feedbacks: Feedback[];
  complaints: Complaint[];
  character_feedbacks: CharacterFeedback[];
  admin_audit_logs: AdminAuditLog[];
  special_orders?: SpecialOrder[];
  loyalty_config?: LoyaltyCardConfig;
  user_loyalty_cards?: UserLoyaltyCard[];
  loyalty_completion_logs?: LoyaltyCompletionLog[];
  cat_town_config?: CatTownConfig;
  cat_town_profiles?: CatTownUserProfile[];
  orderCounter: number;
  requestCounter?: number;
  sessions?: { token: string; userId: string; createdAt: string }[];
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateToken(userId: string): string {
  return `${userId}.${crypto.randomBytes(24).toString('hex')}`;
}

// Vietnam Timezone (Asia/Ho_Chi_Minh - GMT+7) YYYY-MM-DD Date Helper
function getVietnamDateStr(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// In-memory token store for session verification
const activeSessions = new Map<string, string>(); // token -> userId

function getInitialDatabase(): DatabaseSchema {
  const adminSalt = crypto.randomBytes(16).toString('hex');
  const adminHash = hashPassword('Chanbaek6104', adminSalt);

  const initialCharacters: Character[] = [
    {
      id: 'char_lac_tu_du',
      name: 'Lạc Tử Du',
      fishCode: 'CK-001',
      age: 24,
      category: 'khô cá con',
      shortBio: 'Hồ ly tiên sinh ngàn năm hóa hình, tính tình ôn nhu tựa ngọc, mỗi ngày đều chuẩn bị sẵn một bàn điểm tâm nóng hổi đợi bà về nhà.',
      fullStory: 'Lạc Tử Du là linh hồ chín đuôi tu luyện nghìn năm tại Côn Luân tiên sơn. Từng được tiệm Mèo Mê Cá Khô cưu mang thời sơ hóa, chàng nguyện ở lại trần thế, đem hương trà thanh nhã và ánh mắt cưng chiều dịu dàng nhất che chở cho một mình chủ tiệm.',
      backstory: 'Lạc Tử Du là linh hồ chín đuôi tu luyện nghìn năm tại tuyết phong Côn Luân. Chàng từng trải qua thiên kiếp, mang thương tích nặng và vô tình được chủ tiệm Mèo Mê Cá Khô che chở trong một đêm tuyết lạnh. Để báo ân, chàng ẩn đi tiên khí, hóa thành công tử nho nhã với nụ cười ấm áp, nguyện làm chỗ dựa dịu dàng nhất cho bà.',
      openScene: 'Gió đêm se lạnh luồn qua khe cửa gỗ. Lạc Tử Du khẽ nghiêng đầu, đuôi hồ ly mềm mại như nhung lướt qua mu bàn tay bà. Chàng đặt tách trà hoa cúc còn nghi ngút khói xuống bàn, đôi mắt phượng cong lên ý cười ôn nhu: "Bà chủ nhỏ, hôm nay mệt rồi phải không? Ta đã nướng sẵn mẻ cá thơm nhất đợi nàng rồi..."',
      price: 30,
      studioUrl: 'https://aistudio.google.com/prompt/lac-tu-du-ho-ly-tien-sinh',
      avatarUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 8,
      createdAt: '2026-10-20T10:00:00Z',
    },
    {
      id: 'char_tieu_than',
      name: 'Tiêu Thần',
      fishCode: 'CK-002',
      age: 26,
      category: 'khô cá một nắng',
      shortBio: 'Chỉ huy trưởng hạm đội tinh tế lừng danh. Ngoài mặt lạnh lùng kỷ luật thép, nhưng trong nhật ký chỉ toàn ghi lại thói quen nhỏ của bà.',
      fullStory: 'Vị thiếu tướng trẻ nhất lịch sử Liên bang Tinh hệ. Giữa hàng ngàn chiến hạm lạnh giá, nơi trú ẩn ấm áp duy nhất của Tiêu Thần chính là góc tiệm cá khô, nơi có một người luôn đợi chàng sau mỗi chuyến viễn chinh không gian.',
      backstory: 'Chỉ huy trưởng tối cao của hạm đội tuần tra Tinh Hải thứ 7. Dưới lớp áo quân phục thẳng thớm và gương mặt lạnh lùng là một trái tim luôn hướng về góc tiệm nhỏ bình yên. Trong kho dữ liệu tuyệt mật trên tàu chỉ huy, chàng dành riêng một thư mục khóa mã sinh trắc học chỉ để lưu ảnh những khoảnh khắc đời thường của bà.',
      openScene: 'Tiếng động cơ phi thuyền trầm thấp dần lắng xuống. Cửa khoang chỉ huy mở ra, Tiêu Thần tháo găng tay da đen, sải bước dài về phía bạn. Đôi mắt màu xám bạc sâu thẳm khẽ dao động: "Báo cáo bà chủ, hạm đội vừa hoàn thành hải trình vượt bão từ trường. Tôi... về nhận thưởng rồi đây."',
      price: 45,
      studioUrl: 'https://aistudio.google.com/prompt/tieu-than-thieu-tuong-tinh-he',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 12,
      createdAt: '2026-10-20T10:00:00Z',
    },
    {
      id: 'char_co_dien',
      name: 'Cố Diễn',
      fishCode: 'CK-003',
      age: 28,
      category: 'khô thượng phẩm',
      shortBio: 'Chủ tịch tập đoàn tài chính kín tiếng, sắc sảo quyết đoán trên thương trường nhưng sẵn sàng dẹp bỏ cuộc họp trăm tỷ chỉ để cùng bà ăn cá khô.',
      fullStory: 'Người đàn ông nắm giữ huyết mạch kinh tế của thành phố cảng, quen thấu tỏ nhân tâm. Chàng thích ghé tiệm lúc chạng vạng, cởi bỏ cà vạt sang trọng, mang tạp dề caro và cùng bà trò chuyện thâu đêm.',
      backstory: 'Người thừa kế độc nhất kiêm CEO tập đoàn tài chính Cố Thị, người có thể hô mưa gọi gió trên thương trường quốc tế. Chàng cực kỳ ghét sự ồn ào và những lời nịnh bợ, nhưng lại say mê hương vị mộc mạc và sự ấm cúng bên trong tiệm Mèo Mê Cá Khô.',
      openScene: 'Cố Diễn nới lỏng chiếc cà vạt lụa màu lam khói, tự tay đóng lại tập tài liệu thương vụ triệu đô. Chàng nhìn bạn qua ánh nến lung linh trong tiệm, khóe môi khẽ nhếch: "Cả ngày hôm nay nghe đối tác thao thao bất tuyệt, tai tôi sắp hỏng rồi. Giờ chỉ muốn ở cạnh em, nghe em cằn nhằn về mấy con cá khô thôi."',
      price: 50,
      studioUrl: 'https://aistudio.google.com/prompt/co-dien-tong-tai-si-tinh',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 15,
      createdAt: '2026-10-20T10:00:00Z',
    },
    {
      id: 'char_da_huyet',
      name: 'Dạ Huyết',
      fishCode: 'CK-004',
      age: 25,
      category: 'khô thượng phẩm',
      shortBio: 'Chúa tể bóng đêm kiêu ngạo tàn nhẫn, một tay định đoạt vận mệnh tam giới nhưng lại ngoan ngoãn cúi đầu để bà xoa tóc mỗi khi đêm về.',
      fullStory: 'Dạ Huyết thức tỉnh sau giấc ngủ vạn năm, coi thường luật lệ thế tục. Nhưng từ khi nếm thử mẻ cá khô thơm lừng của tiệm, chàng tự nguyện thu lại móng vuốt, trở thành chiếc đuôi bám dính bảo hộ bà cả ngày lẫn đêm.',
      backstory: 'Ma tôn thống lĩnh vực thẳm Vô Vọng, thức tỉnh sau giấc ngủ sâu vạn năm. Khắp tam giới ai nghe danh chàng cũng run sợ, nhưng một lần lạc bước vào tiệm cá, chàng lại bị thu phục bởi sự bướng bỉnh và mẻ cá khô giòn tan của bà chủ tiệm.',
      openScene: 'Một làn khói đen tản ra sau lưng bạn, Dạ Huyết cúi người, hơi thở mang theo mùi sương đêm và hoa tử đằng vương trên vành tai. Bàn tay thon dài với móng vuốt sắc bén khẽ chạm nhẹ vào lọn tóc bạn: "Này cô nhóc bướng bỉnh, dám để bổn tọa chờ lâu như thế sao? Nói xem, hôm nay nàng định bù đắp cho ta thế nào?"',
      price: 60,
      studioUrl: 'https://aistudio.google.com/prompt/da-huyet-ma-vuong-kieu-ngao',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 19,
      createdAt: '2026-10-21T08:00:00Z',
    },
    {
      id: 'char_minh_nhat',
      name: 'Minh Nhật',
      fishCode: 'CK-005',
      age: 21,
      category: 'khô hai nắng',
      shortBio: 'Đội trưởng đội bơi lội đại học, nụ cười rạng rỡ như nắng hạ. Luôn chạy bay tới tiệm cá sau giờ tập chỉ mong được bà khen ngợi.',
      fullStory: 'Thanh mai trúc mã cùng lớn lên trong ngõ nhỏ. Cậu biết rõ bà ghét ăn hành cay, thích nhâm nhi cá khô giòn khi xem phim. Dù có bao nhiêu cô gái theo đuổi, ánh mắt cậu mười năm qua chỉ hướng về một người.',
      backstory: 'Đội trưởng đội bơi lội trường đại học thể thao, thanh xuân phơi phới rực rỡ như ánh mặt trời ban trưa. Cậu là thanh mai trúc mã lớn lên cùng bạn, thích bạn từ những ngày còn chia nhau từng que kem, cây kẹo.',
      openScene: 'Minh Nhật khoác chiếc khăn bông trắng trên cổ, mái tóc còn vương vài giọt nước lấp lánh dưới nắng. Cậu nhảy chân sáo qua bậc thềm tiệm, nụ cười rạng rỡ tỏa sáng: "Bà chủ ơi! Hôm nay tui phá kỷ lục bơi 200m bướm rồi nè! Mau mau thưởng cho tui đĩa cá khô đặc biệt đi, tui đói xỉu rồi nè~"',
      price: 25,
      studioUrl: 'https://aistudio.google.com/prompt/minh-nhat-thanh-mai-truc-ma',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 22,
      createdAt: '2026-10-21T09:00:00Z',
    },
    {
      id: 'char_han_da_bang',
      name: 'Hàn Dạ Băng',
      fishCode: 'CK-006',
      age: 27,
      category: 'khô cá một nắng',
      shortBio: 'Y tiên ẩn cư tuyết cốc, y thuật tuyệt thế. Bề ngoài lãnh đạm ít lời nhưng bình thuốc bổ nào đưa cho bà cũng ngập tràn mật ong hoa mai.',
      fullStory: 'Y giả cứu vớt trăm họ nhưng không thể chữa nổi vết thương tương tư trong lòng mình. Chàng cõng hòm thuốc rời khỏi sơn cốc giá lạnh, tình nguyện làm lang trung thường trực chăm sóc giấc ngủ và sức khỏe của chủ tiệm.',
      backstory: 'Thần y vang danh thiên hạ ẩn cư tại Băng Nguyệt Cốc. Tính tình thanh lãnh như sương mai đầu cành, nhưng đối với bà chủ tiệm, chàng luôn tỉ mỉ kê những thang thuốc bổ tẩm mật ong ngọt ngào nhất.',
      openScene: 'Tiếng chuông gió trước hiên tiệm khẽ reo. Hàn Dạ Băng đặt chiếc hòm thuốc bằng gỗ đàn hương xuống góc bàn, ngón tay thanh mảnh nhẹ nhàng bắt mạch nơi cổ tay bạn: "Khí huyết có phần hao tổn, đêm qua nàng lại thức khuya nữa sao? Ngồi yên đó, ta pha trà dưỡng thần cho nàng."',
      price: 35,
      studioUrl: 'https://aistudio.google.com/prompt/han-da-bang-than-y-thanh-lanh',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      salesCount: 7,
      createdAt: '2026-10-21T10:00:00Z',
    },
  ];

  return {
    users: [
      {
        id: 'usr_admin',
        username: 'meomecakho@6104',
        passwordHash: adminHash,
        salt: adminSalt,
        balance: 9999,
        role: 'admin',
        createdAt: '2026-10-20T00:00:00Z',
        failedAttempts: 0,
      },
      {
        id: 'usr_guest_demo',
        username: 'khach_yeu_ca',
        passwordHash: hashPassword('123456', adminSalt),
        salt: adminSalt,
        balance: 100, // Pre-seeded with 100 Xu Cá so user can test immediate character purchases!
        role: 'user',
        createdAt: '2026-10-21T00:00:00Z',
        failedAttempts: 0,
      },
    ],
    characters: initialCharacters,
    user_characters: [],
    orders: [],
    wallet_transactions: [
      {
        id: 'tx_seed_welcome_demo',
        userId: 'usr_guest_demo',
        type: 'ADMIN_ADJUST',
        amount: 100,
        balanceAfter: 100,
        description: 'Quà tặng tân thủ tiệm Mèo Mê Cá Khô',
        createdAt: '2026-10-21T00:00:00Z',
      },
    ],
    redeem_codes: [
      {
        id: 'code_1',
        code: 'MEOME2026',
        rewardCoins: 50,
        maxUses: 1000,
        usedCount: 0,
        expiresAt: '2027-12-31T23:59:59Z',
        maxPerUser: 1,
        isActive: true,
      },
      {
        id: 'code_2',
        code: 'CHAOMUNG50',
        rewardCoins: 50,
        maxUses: 500,
        usedCount: 0,
        expiresAt: '2027-12-31T23:59:59Z',
        maxPerUser: 1,
        isActive: true,
      },
      {
        id: 'code_3',
        code: 'KHAITRUONG',
        rewardCoins: 100,
        maxUses: 200,
        usedCount: 0,
        expiresAt: '2027-12-31T23:59:59Z',
        maxPerUser: 1,
        isActive: true,
      },
    ],
    code_redemptions: [],
    quests: [
      {
        id: 'quest_daily_checkin',
        title: 'Điểm danh hằng ngày',
        description: 'Ghé tiệm điểm danh mõi ngày để nhận ngay 10 xu cá ᰔ',
        rewardCoins: 10,
        type: 'daily_checkin',
        isActive: true,
      },
      {
        id: 'quest_streak_7',
        title: 'Thưởng chuỗi điểm danh 7 ngày',
        description: 'Điểm danh kiên trì đủ 7 ngày liên tiếp nhận thêm 50 Xu Cá.',
        rewardCoins: 50,
        type: 'streak_7',
        isActive: true,
      },
    ],
    user_quests: [],
    gacha_config: {
      spinPrice: 20,
      isPaused: false,
      rates: [
        { coins: 5, rate: 40, label: 'Voucher 5 Xu Cá', rarity: 'common', capsuleType: 'strawberry_milk', capsuleName: 'Capsule 01 — Strawberry Milk' },
        { coins: 10, rate: 30, label: 'Voucher 10 Xu Cá', rarity: 'common', capsuleType: 'fish_blue', capsuleName: 'Capsule 02 — Fish Blue' },
        { coins: 20, rate: 20, label: 'Voucher 20 Xu Cá', rarity: 'rare', capsuleType: 'butter_cream', capsuleName: 'Capsule 03 — Butter Cream' },
        { coins: 50, rate: 8, label: 'Voucher 50 Xu Cá', rarity: 'super_rare', capsuleType: 'pearl_rainbow', capsuleName: 'Capsule 04 — Pearl Rainbow' },
        { coins: 100, rate: 2, label: 'Voucher 100 Xu Cá Đại Cát', rarity: 'legendary', capsuleType: 'pearl_rainbow', capsuleName: 'Capsule 04 — Pearl Rainbow (Đại Cát)' },
      ],
    },
    vouchers: [],
    feedbacks: [],
    complaints: [],
    character_feedbacks: [],
    admin_audit_logs: [
      {
        id: 'log_seed',
        adminUsername: 'admin',
        action: 'INIT_SYSTEM',
        target: 'SYSTEM',
        details: 'Khởi tạo hệ thống Mèo Mê Cá Khô với cơ sở dữ liệu gốc',
        timestamp: '2026-10-20T00:00:00Z',
      },
    ],
    special_orders: [],
    loyalty_config: {
      isEnabled: true,
      rewardCoins: 50,
    },
    user_loyalty_cards: [],
    loyalty_completion_logs: [],
    orderCounter: 1,
    requestCounter: 1,
    sessions: [],
  };
}

// In-memory DB with safe atomic sync
let db: DatabaseSchema;

const CHARACTERS_FILE = path.join(DATA_DIR, 'characters.json');

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.sessions && Array.isArray(parsed.sessions)) {
        for (const s of parsed.sessions) {
          activeSessions.set(s.token, s.userId);
        }
      }
      parsed.complaints = parsed.complaints || [];
      parsed.character_feedbacks = parsed.character_feedbacks || [];
      parsed.special_orders = parsed.special_orders || [];
      parsed.requestCounter = parsed.requestCounter || 1;
      parsed.loyalty_config = parsed.loyalty_config || { isEnabled: true, rewardCoins: 50 };
      parsed.user_loyalty_cards = parsed.user_loyalty_cards || [];
      parsed.loyalty_completion_logs = parsed.loyalty_completion_logs || [];

      // Restore characters from dedicated characters.json if present
      if (fs.existsSync(CHARACTERS_FILE)) {
        try {
          const charsContent = fs.readFileSync(CHARACTERS_FILE, 'utf-8');
          const backupChars = JSON.parse(charsContent);
          if (Array.isArray(backupChars) && backupChars.length > 0) {
            parsed.characters = backupChars;
          }
        } catch (e) {
          console.error('Error reading characters backup file:', e);
        }
      }

      let hasChanges = false;

      // Auto-migrate admin user credentials if using old ones
      if (Array.isArray(parsed.users)) {
        const adminUser = parsed.users.find(
          (u: any) => u.role === 'admin' || u.id === 'usr_admin' || u.username === 'admin' || u.username === 'meomecakho@6104'
        );
        if (adminUser) {
          const expectedSalt = adminUser.salt || crypto.randomBytes(16).toString('hex');
          const expectedHash = hashPassword('Chanbaek6104', expectedSalt);
          if (adminUser.username !== 'meomecakho@6104' || adminUser.passwordHash !== expectedHash) {
            adminUser.username = 'meomecakho@6104';
            adminUser.salt = expectedSalt;
            adminUser.passwordHash = expectedHash;
            adminUser.failedAttempts = 0;
            adminUser.lockedUntil = undefined;
            hasChanges = true;
          }
        }
      }

      // Auto-migrate character backstory, openScene, fishCode & category
      const initial = getInitialDatabase();
      const catMapping: Record<string, string> = {
        'Tiên Hiệp': 'khô cá con',
        'Khoa Huyễn': 'khô cá một nắng',
        'Hiện Đại': 'khô thượng phẩm',
        'Huyền Huyễn': 'khô thượng phẩm',
        'Vườn Trường': 'khô hai nắng',
        'Cổ Đại': 'khô cá một nắng',
      };
      if (Array.isArray(parsed.characters)) {
        let index = 1;
        for (const c of parsed.characters) {
          const match = initial.characters.find((ic) => ic.id === c.id);
          if (!c.fishCode) {
            c.fishCode = match?.fishCode || `CK-${String(index).padStart(3, '0')}`;
            hasChanges = true;
          }
          if (!c.backstory) {
            c.backstory = match?.backstory || c.fullStory || c.shortBio || 'Cốt truyện đang được cập nhật.';
            hasChanges = true;
          }
          if (!c.openScene) {
            c.openScene = match?.openScene || 'Kịch bản phân cảnh mở đầu đang được chuẩn bị.';
            hasChanges = true;
          }
          if (catMapping[c.category]) {
            c.category = catMapping[c.category];
            hasChanges = true;
          }
          index++;
        }
      }

      // Ensure quest_grand_opening is removed and quests have updated rewards/descriptions
      if (Array.isArray(parsed.quests)) {
        const initialQuestsCount = parsed.quests.length;
        parsed.quests = parsed.quests.filter((q: any) => q.id !== 'quest_grand_opening');
        if (parsed.quests.length !== initialQuestsCount) {
          hasChanges = true;
        }
        for (const q of parsed.quests) {
          if (q.id === 'quest_daily_checkin') {
            if (q.rewardCoins !== 10 || q.description !== 'Ghé tiệm điểm danh mõi ngày để nhận ngay 10 xu cá ᰔ') {
              q.rewardCoins = 10;
              q.description = 'Ghé tiệm điểm danh mõi ngày để nhận ngay 10 xu cá ᰔ';
              hasChanges = true;
            }
          }
          if (q.id === 'quest_streak_7') {
            if (q.rewardCoins !== 50 || q.description.includes('20')) {
              q.rewardCoins = 50;
              q.description = 'Điểm danh kiên trì đủ 7 ngày liên tiếp nhận thêm 50 Xu Cá.';
              hasChanges = true;
            }
          }
        }
      }

      // Auto-migrate gacha_config rates to include capsuleType and capsuleName
      if (parsed.gacha_config && Array.isArray(parsed.gacha_config.rates)) {
        for (const rate of parsed.gacha_config.rates) {
          if (!rate.capsuleType) {
            hasChanges = true;
            if (rate.coins <= 5) {
              rate.capsuleType = 'strawberry_milk';
              rate.capsuleName = 'Capsule 01 — Strawberry Milk';
            } else if (rate.coins <= 10) {
              rate.capsuleType = 'fish_blue';
              rate.capsuleName = 'Capsule 02 — Fish Blue';
            } else if (rate.coins <= 25) {
              rate.capsuleType = 'butter_cream';
              rate.capsuleName = 'Capsule 03 — Butter Cream';
            } else {
              rate.capsuleType = 'pearl_rainbow';
              rate.capsuleName = 'Capsule 04 — Pearl Rainbow';
            }
          }
        }
      }

      if (!parsed.cat_town_config) {
        parsed.cat_town_config = getDefaultCatTownConfig();
        hasChanges = true;
      }
      if (!parsed.cat_town_profiles) {
        parsed.cat_town_profiles = [];
        hasChanges = true;
      }

      if (hasChanges) {
        saveDatabase(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error loading db file, using initial data:', err);
  }
  const initial = getInitialDatabase();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(dataToSave: DatabaseSchema = db): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpPath = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    fs.renameSync(tmpPath, DB_FILE);

    // Dedicated characters.json atomic backup
    if (dataToSave.characters && Array.isArray(dataToSave.characters)) {
      const tmpCharsPath = `${CHARACTERS_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpCharsPath, JSON.stringify(dataToSave.characters, null, 2), 'utf-8');
      fs.renameSync(tmpCharsPath, CHARACTERS_FILE);
    }
  } catch (err) {
    console.error('Error saving db file:', err);
  }
}

db = loadDatabase();

// Authentication middleware
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Vui lòng đăng nhập để thực hiện hành động này.' });
    return;
  }
  const token = authHeader.substring(7);
  let userId = activeSessions.get(token);
  if (!userId && db.sessions) {
    const session = db.sessions.find((s) => s.token === token);
    if (session) {
      userId = session.userId;
      activeSessions.set(token, userId);
    }
  }
  // Safety net: If token is validly formatted as usr_admin.<hash> and admin user exists
  if (!userId && token.startsWith('usr_admin.')) {
    const adminUser = db.users.find((u) => u.id === 'usr_admin');
    if (adminUser) {
      userId = 'usr_admin';
      activeSessions.set(token, userId);
    }
  }
  if (!userId) {
    res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
    return;
  }
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    res.status(401).json({ error: 'Người dùng không tồn tại.' });
    return;
  }
  (req as any).user = user;
  next();
}

function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Bạn không có quyền truy cập trang quản trị.' });
    return;
  }
  next();
}

// Helper: Format order ID (ORD-YYYYMMDD-XXXX)
function generateOrderId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const countStr = String(db.orderCounter++).padStart(4, '0');
  saveDatabase();
  return `ORD-${year}${month}${day}-${countStr}`;
}

// Helper: Format Special Order ID (REQ-XXXX, e.g. REQ-0001)
function generateRequestId(): string {
  if (!db.requestCounter) db.requestCounter = 1;
  const countStr = String(db.requestCounter++).padStart(4, '0');
  saveDatabase();
  return `REQ-${countStr}`;
}

// ======================== API ROUTES ========================

// 1. Auth: Register
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    res.status(400).json({ error: 'Tên đăng nhập phải có ít nhất 3 ký tự.' });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 4) {
    res.status(400).json({ error: 'Mật khẩu phải có ít nhất 4 ký tự.' });
    return;
  }

  const cleanUsername = username.trim().toLowerCase();
  const existing = db.users.find((u) => u.username.toLowerCase() === cleanUsername);
  if (existing) {
    res.status(400).json({ error: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác nhé!' });
    return;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const newUserId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const newUser = {
    id: newUserId,
    username: username.trim(),
    passwordHash,
    salt,
    balance: 0,
    role: 'user' as const,
    createdAt: new Date().toISOString(),
    failedAttempts: 0,
  };

  db.users.push(newUser);
  saveDatabase();

  const token = generateToken(newUserId);
  activeSessions.set(token, newUserId);
  if (!db.sessions) db.sessions = [];
  db.sessions.push({ token, userId: newUserId, createdAt: new Date().toISOString() });
  saveDatabase();

  res.json({
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      balance: newUser.balance,
      role: newUser.role,
      createdAt: newUser.createdAt,
    },
  });
});

// 2. Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' });
    return;
  }

  const cleanUsername = username.trim().toLowerCase();
  const user = db.users.find((u) => u.username.toLowerCase() === cleanUsername);
  if (!user) {
    res.status(400).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    return;
  }

  // Rate limiting check
  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    const remainingSec = Math.ceil((user.lockedUntil - Date.now()) / 1000);
    res.status(429).json({ error: `Tài khoản tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${remainingSec} giây.` });
    return;
  }

  const inputHash = hashPassword(password, user.salt);
  if (inputHash !== user.passwordHash) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    if (user.failedAttempts >= 5) {
      user.lockedUntil = Date.now() + 2 * 60 * 1000; // Lock for 2 mins
      saveDatabase();
      res.status(429).json({ error: 'Đăng nhập sai quá 5 lần. Tài khoản bị tạm khóa 2 phút.' });
      return;
    }
    saveDatabase();
    res.status(400).json({ error: `Mật khẩu không đúng. Còn ${5 - user.failedAttempts} lần thử.` });
    return;
  }

  // Login success, reset failed attempts
  user.failedAttempts = 0;
  user.lockedUntil = undefined;

  const token = generateToken(user.id);
  activeSessions.set(token, user.id);
  if (!db.sessions) db.sessions = [];
  db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  saveDatabase();

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      balance: user.balance,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

// 2b. Auth: Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    activeSessions.delete(token);
    if (db.sessions) {
      db.sessions = db.sessions.filter((s) => s.token !== token);
      saveDatabase();
    }
  }
  res.json({ success: true, message: 'Đã đăng xuất phiên an toàn.' });
});

// 3. Auth: Current User Profile
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = (req as any).user;
  res.json({
    user: {
      id: user.id,
      username: user.username,
      balance: user.balance,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

// 4. Characters: Get all (with user ownership flag if authenticated)
app.get('/api/characters', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Check optional auth
  const authHeader = req.headers.authorization;
  let currentUserId: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    currentUserId = activeSessions.get(token) || null;
  }

  const ownedCharacterIds = new Set<string>();
  if (currentUserId) {
    db.user_characters
      .filter((uc) => uc.userId === currentUserId)
      .forEach((uc) => ownedCharacterIds.add(uc.characterId));
  }

  const characters = db.characters
    .filter((c) => c.isAvailable)
    .map((c) => ({
      ...c,
      isOwned: ownedCharacterIds.has(c.id),
    }));

  res.json({ characters });
});

// 5. ATOMIC PURCHASE ROUTE: Buy Character & Generate Receipt
app.post('/api/shop/buy', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const { characterId } = req.body;

  if (!characterId) {
    res.status(400).json({ error: 'Vui lòng chọn nhân vật muốn rước.' });
    return;
  }

  // 1. Fetch character from DB
  const character = db.characters.find((c) => c.id === characterId);
  if (!character || !character.isAvailable) {
    res.status(404).json({ error: 'Em cá này hiện không còn mở bán hoặc không tồn tại.' });
    return;
  }

  // 2. Check if user already owns this character
  const alreadyOwned = db.user_characters.some(
    (uc) => uc.userId === user.id && uc.characterId === characterId
  );
  if (alreadyOwned) {
    res.status(400).json({
      error: 'Bà đã sở hữu chàng này rồi nha! Hãy vào Kho Cá để gặp lại chàng nhé.',
    });
    return;
  }

  // 3. Check coin balance
  if (user.balance < character.price) {
    res.status(400).json({
      error: "Hiện số xu cá của quý khách không đủ mua " + character.name + ", hãy kiếm thêm xu cá và quay lại chọn mua cá nhé -`♡´- ",
      required: character.price,
      currentBalance: user.balance,
    });
    return;
  }

  // 4. ATOMIC TRANSACTION:
  // Deduct coins
  user.balance -= character.price;
  character.salesCount = (character.salesCount || 0) + 1;

  // Generate unique Order ID (ORD-YYYYMMDD-XXXX)
  const orderId = generateOrderId();
  const nowIso = new Date().toISOString();

  // Create Order Receipt record
  const receipt: OrderReceipt = {
    id: orderId,
    userId: user.id,
    characterId: character.id,
    characterName: character.name,
    fishCode: character.fishCode || 'CK-001',
    category: character.category,
    characterAvatar: character.receiptAvatarUrl || character.avatarUrl,
    pricePaid: character.price,
    balanceAfter: user.balance,
    studioUrl: character.studioUrl,
    createdAt: nowIso,
  };
  db.orders.push(receipt);

  // Create Ownership Record in Kho Cá
  const ownership: UserCharacterOwnership = {
    id: `own_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    userId: user.id,
    characterId: character.id,
    orderId: orderId,
    pricePaid: character.price,
    purchasedAt: nowIso,
  };
  db.user_characters.push(ownership);

  // Create Wallet Transaction entry
  const tx: WalletTransaction = {
    id: `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    userId: user.id,
    type: 'BUY_CHARACTER',
    amount: -character.price,
    balanceAfter: user.balance,
    referenceId: orderId,
    description: `Mua cá: ${character.name} (${character.category})`,
    createdAt: nowIso,
  };
  db.wallet_transactions.push(tx);

  // Commit to disk
  saveDatabase();

  res.json({
    success: true,
    message: `Chúc mừng bà đã rước thành công ${character.name}!`,
    receipt,
    updatedBalance: user.balance,
  });
});

// 6. Inventory (Kho Cá): Get user's collected characters
app.get('/api/inventory', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const ownerships = db.user_characters.filter((uc) => uc.userId === user.id);

  const items = ownerships.map((uc) => {
    const character = db.characters.find((c) => c.id === uc.characterId);
    return {
      ...uc,
      character: character || null,
    };
  });

  res.json({
    items,
    totalOwned: items.length,
  });
});

// 7. Get Order Receipt by orderId
app.get('/api/orders/:orderId', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { orderId } = req.params;

  const order = db.orders.find((o) => o.id === orderId);
  if (!order || (order.userId !== user.id && user.role !== 'admin')) {
    res.status(404).json({ error: 'Không tìm thấy hóa đơn đơn hàng này.' });
    return;
  }

  res.json({ order });
});

// 8. Fish Coin Wallet: Get transaction history
app.get('/api/wallet/transactions', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const transactions = db.wallet_transactions
    .filter((tx) => tx.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    balance: user.balance,
    transactions,
  });
});

// 9. Fish Coin Wallet: Redeem Giftcode
app.post('/api/wallet/redeem', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Vui lòng nhập mã đổi xu.' });
    return;
  }

  const cleanCode = code.trim().toUpperCase();
  const giftcode = db.redeem_codes.find((c) => c.code.toUpperCase() === cleanCode);

  if (!giftcode || !giftcode.isActive) {
    res.status(404).json({ error: 'Mã đổi xu không tồn tại hoặc đã bị tạm khóa.' });
    return;
  }

  if (new Date(giftcode.expiresAt).getTime() < Date.now()) {
    res.status(400).json({ error: 'Mã đổi xu này đã hết hạn sử dụng.' });
    return;
  }

  if (giftcode.usedCount >= giftcode.maxUses) {
    res.status(400).json({ error: 'Mã đổi xu này đã hết lượt sử dụng.' });
    return;
  }

  const userRedemptions = db.code_redemptions.filter(
    (r) => r.userId === user.id && r.code.toUpperCase() === cleanCode
  );
  if (userRedemptions.length >= giftcode.maxPerUser) {
    res.status(400).json({ error: 'Tài khoản của bà đã đạt giới hạn dùng mã này rồi nha.' });
    return;
  }

  // Credit balance
  user.balance += giftcode.rewardCoins;
  giftcode.usedCount += 1;

  db.code_redemptions.push({
    id: `red_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    code: cleanCode,
    userId: user.id,
    redeemedAt: new Date().toISOString(),
  });

  const tx: WalletTransaction = {
    id: `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    userId: user.id,
    type: 'REDEEM_CODE',
    amount: giftcode.rewardCoins,
    balanceAfter: user.balance,
    referenceId: cleanCode,
    description: `Đổi mã giftcode: ${cleanCode}`,
    createdAt: new Date().toISOString(),
  };
  db.wallet_transactions.push(tx);

  saveDatabase();

  res.json({
    success: true,
    message: `Đổi thành công mã ${cleanCode}! Bà nhận được +${giftcode.rewardCoins} Xu Cá.`,
    rewardCoins: giftcode.rewardCoins,
    updatedBalance: user.balance,
  });
});

// 10. Quests: Get quests & status
app.get('/api/quests', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const todayStr = new Date().toISOString().slice(0, 10);

  const dailyUserQuest = db.user_quests.find(
    (uq) => uq.userId === user.id && uq.questId === 'quest_daily_checkin'
  );
  const currentStreak = dailyUserQuest ? (dailyUserQuest.streakCount || 0) : 0;

  const questList = db.quests
    .filter((q) => q.id !== 'quest_grand_opening' && q.isActive)
    .map((q) => {
      const userQuest = db.user_quests.find(
        (uq) => uq.userId === user.id && uq.questId === q.id
      );

      let status: 'not_started' | 'can_claim' | 'claimed' = 'can_claim';

      if (q.id === 'quest_streak_7') {
        if (userQuest && userQuest.lastClaimedDate) {
          status = 'claimed';
        } else if (currentStreak < 7) {
          status = 'not_started';
        } else {
          status = 'can_claim';
        }
      } else if (userQuest && userQuest.lastClaimedDate === todayStr) {
        status = 'claimed';
      }

      return {
        ...q,
        userStatus: {
          status,
          streakCount: currentStreak,
          lastClaimedAt: userQuest?.lastClaimedDate,
        },
      };
    });

  res.json({ quests: questList });
});

// 11. Quests: Claim quest reward
app.post('/api/quests/claim', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const { questId } = req.body;

  const quest = db.quests.find((q) => q.id === questId && q.id !== 'quest_grand_opening' && q.isActive);
  if (!quest) {
    res.status(404).json({ error: 'Nhiệm vụ không tồn tại.' });
    return;
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  // Check 7-day streak requirement
  if (quest.id === 'quest_streak_7') {
    const dailyUserQuest = db.user_quests.find(
      (uq) => uq.userId === user.id && uq.questId === 'quest_daily_checkin'
    );
    const currentStreak = dailyUserQuest ? (dailyUserQuest.streakCount || 0) : 0;
    if (currentStreak < 7) {
      res.status(400).json({
        error: `Bà cần hoàn thành đủ 7 ngày điểm danh hằng ngày liên tiếp để nhận thưởng này nha! (Hiện tại: ${currentStreak}/7 ngày)`,
      });
      return;
    }
  }

  let userQuest = db.user_quests.find(
    (uq) => uq.userId === user.id && uq.questId === questId
  );

  if (userQuest && userQuest.lastClaimedDate === todayStr) {
    res.status(400).json({ error: 'Bà đã nhận thưởng nhiệm vụ này rồi. Hãy quay lại sau nhé!' });
    return;
  }

  let newStreak = 1;
  if (userQuest) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (userQuest.lastClaimedDate === yesterday) {
      newStreak = (userQuest.streakCount || 0) + 1;
    }
    userQuest.streakCount = newStreak;
    userQuest.lastClaimedDate = todayStr;
  } else {
    userQuest = {
      id: `uq_${Date.now()}`,
      userId: user.id,
      questId: quest.id,
      streakCount: 1,
      lastClaimedDate: todayStr,
    };
    db.user_quests.push(userQuest);
  }

  // Credit reward
  user.balance += quest.rewardCoins;

  const tx: WalletTransaction = {
    id: `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    userId: user.id,
    type: 'DAILY_QUEST',
    amount: quest.rewardCoins,
    balanceAfter: user.balance,
    referenceId: quest.id,
    description: `Hoàn thành nhiệm vụ: ${quest.title}`,
    createdAt: new Date().toISOString(),
  };
  db.wallet_transactions.push(tx);

  saveDatabase();

  res.json({
    success: true,
    message: `Nhận thưởng thành công +${quest.rewardCoins} Xu Cá!`,
    rewardCoins: quest.rewardCoins,
    streakCount: newStreak,
    updatedBalance: user.balance,
  });
});

// ==================== DẤU CHÂN KHÁCH QUEN (PAW LOYALTY CARD) ====================

const RANDOM_PAW_MESSAGES = [
  'Meo~ Hôm nay quý khách đã ghé tiệm rồi! Một dấu chân xinh đã được đóng ♡',
  'Paw paw~ Cảm ơn quý khách đã ghé thăm tiệm Mèo Mê Cá Khô hôm nay!',
  'Meo meo~ Đã in thêm một dấu chân khách quen xinh xắn vào thẻ của quý khách!',
  'Gửi một cái dụi đầu ấm áp~ Quý khách đã điểm danh thành công hôm nay ♡',
  'Tiệm cá gửi tặng quý khách một dấu chân mèo may mắn hôm nay nha!',
];

// Get Loyalty Card Status
app.get('/api/loyalty-card', authMiddleware, (req, res) => {
  const user = (req as any).user;
  db.loyalty_config = db.loyalty_config || { isEnabled: true, rewardCoins: 50 };
  db.user_loyalty_cards = db.user_loyalty_cards || [];

  let card = db.user_loyalty_cards.find((c) => c.userId === user.id);
  if (!card) {
    card = {
      id: `ulc_${user.id}`,
      userId: user.id,
      lastCheckInDate: '',
      accumulatedDays: 0,
      totalCyclesCompleted: 0,
      totalXuEarnedFromLoyalty: 0,
    };
    db.user_loyalty_cards.push(card);
    saveDatabase();
  }

  const todayVN = getVietnamDateStr();
  const hasCheckedInToday = card.lastCheckInDate === todayVN;

  // Reset to 0/7 on subsequent day after completion
  if (card.accumulatedDays >= 7 && !hasCheckedInToday) {
    card.accumulatedDays = 0;
    saveDatabase();
  }

  res.json({
    config: db.loyalty_config,
    card: {
      accumulatedDays: card.accumulatedDays,
      totalCyclesCompleted: card.totalCyclesCompleted || 0,
      totalXuEarnedFromLoyalty: card.totalXuEarnedFromLoyalty || 0,
      lastCheckInDate: card.lastCheckInDate,
      hasCheckedInToday,
      isCompleteToday: card.accumulatedDays >= 7 && hasCheckedInToday,
    },
  });
});

// Check-in on Loyalty Card
app.post('/api/loyalty-card/checkin', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  db.loyalty_config = db.loyalty_config || { isEnabled: true, rewardCoins: 50 };
  db.user_loyalty_cards = db.user_loyalty_cards || [];
  db.loyalty_completion_logs = db.loyalty_completion_logs || [];

  if (!db.loyalty_config.isEnabled) {
    res.status(403).json({ error: 'Tính năng Dấu Chân Khách Quen hiện đang tạm đóng.' });
    return;
  }

  let card = db.user_loyalty_cards.find((c) => c.userId === user.id);
  if (!card) {
    card = {
      id: `ulc_${user.id}`,
      userId: user.id,
      lastCheckInDate: '',
      accumulatedDays: 0,
      totalCyclesCompleted: 0,
      totalXuEarnedFromLoyalty: 0,
    };
    db.user_loyalty_cards.push(card);
  }

  const todayVN = getVietnamDateStr();

  // If previous cycle completed and today is a new day, reset to 0 before stamping
  if (card.accumulatedDays >= 7 && card.lastCheckInDate !== todayVN) {
    card.accumulatedDays = 0;
  }

  if (card.lastCheckInDate === todayVN) {
    res.status(400).json({ error: 'Hôm nay quý khách đã đóng dấu rồi! Hãy quay lại vào ngày mai nhé ♡' });
    return;
  }

  // Increment accumulated days
  card.accumulatedDays = Math.min(7, (card.accumulatedDays || 0) + 1);
  card.lastCheckInDate = todayVN;
  card.lastCheckInTimestamp = new Date().toISOString();

  let isCompleted = false;
  let rewardCoins = 0;

  if (card.accumulatedDays === 7) {
    isCompleted = true;
    rewardCoins = Math.max(0, Number(db.loyalty_config.rewardCoins) || 50);

    // Atomic credit to balance
    user.balance += rewardCoins;
    card.totalCyclesCompleted = (card.totalCyclesCompleted || 0) + 1;
    card.totalXuEarnedFromLoyalty = (card.totalXuEarnedFromLoyalty || 0) + rewardCoins;

    const tx: WalletTransaction = {
      id: `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId: user.id,
      type: 'DAILY_QUEST',
      amount: rewardCoins,
      balanceAfter: user.balance,
      referenceId: `loyalty_cycle_${card.totalCyclesCompleted}`,
      description: `Hoàn thành thẻ Dấu Chân Khách Quen (Chu kỳ #${card.totalCyclesCompleted})`,
      createdAt: new Date().toISOString(),
    };
    db.wallet_transactions.push(tx);

    db.loyalty_completion_logs.unshift({
      id: `lcl_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId: user.id,
      username: user.username,
      cycleNumber: card.totalCyclesCompleted,
      rewardCoins: rewardCoins,
      completedAt: new Date().toISOString(),
    });
  }

  saveDatabase();

  const randomMsg = RANDOM_PAW_MESSAGES[Math.floor(Math.random() * RANDOM_PAW_MESSAGES.length)];
  const completionMsg = `CHÚC MỪNG QUÝ KHÁCH ♡ Quý khách đã hoàn thành thẻ Dấu Chân Khách Quen và nhận được +${rewardCoins} XU CÁ!`;

  res.json({
    success: true,
    message: isCompleted ? completionMsg : randomMsg,
    isCompleted,
    rewardCoins,
    accumulatedDays: card.accumulatedDays,
    totalCyclesCompleted: card.totalCyclesCompleted,
    totalXuEarnedFromLoyalty: card.totalXuEarnedFromLoyalty,
    updatedBalance: user.balance,
  });
});

// Admin: Get Loyalty Config & Logs
app.get('/api/admin/loyalty-config', authMiddleware, adminMiddleware, (req, res) => {
  db.loyalty_config = db.loyalty_config || { isEnabled: true, rewardCoins: 50 };
  db.loyalty_completion_logs = db.loyalty_completion_logs || [];
  db.user_loyalty_cards = db.user_loyalty_cards || [];

  res.json({
    config: db.loyalty_config,
    logs: db.loyalty_completion_logs.slice(0, 100),
    stats: {
      totalCards: db.user_loyalty_cards.length,
      totalCompletedCycles: db.user_loyalty_cards.reduce((sum, c) => sum + (c.totalCyclesCompleted || 0), 0),
      totalCoinsRewarded: db.user_loyalty_cards.reduce((sum, c) => sum + (c.totalXuEarnedFromLoyalty || 0), 0),
    },
  });
});

// Admin: Update Loyalty Config
app.post('/api/admin/loyalty-config', authMiddleware, adminMiddleware, (req, res) => {
  const adminUser = (req as any).user;
  const { rewardCoins, isEnabled } = req.body;

  db.loyalty_config = db.loyalty_config || { isEnabled: true, rewardCoins: 50 };

  if (typeof isEnabled === 'boolean') {
    db.loyalty_config.isEnabled = isEnabled;
  }
  if (typeof rewardCoins === 'number' && !isNaN(rewardCoins) && rewardCoins >= 0) {
    db.loyalty_config.rewardCoins = Math.floor(rewardCoins);
  }

  const log: AdminAuditLog = {
    id: `log_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    adminUsername: adminUser.username,
    action: 'UPDATE_LOYALTY_CONFIG',
    target: 'LOYALTY_CONFIG',
    details: `Cập nhật Dấu Chân Khách Quen: thưởng ${db.loyalty_config.rewardCoins} Xu, trạng thái: ${db.loyalty_config.isEnabled ? 'Bật' : 'Tắt'}`,
    timestamp: new Date().toISOString(),
  };
  db.admin_audit_logs.push(log);

  saveDatabase();

  res.json({
    success: true,
    message: 'Cập nhật cấu hình Dấu Chân Khách Quen thành công!',
    config: db.loyalty_config,
  });
});

// 12. Gacha: Get Config
app.get('/api/gacha/config', (req, res) => {
  res.json({
    config: db.gacha_config,
  });
});

// 13. Gacha: Spin Capsule Machine
app.post('/api/gacha/spin', authMiddleware, (req, res) => {
  const user = (req as any).user as User;

  if (db.gacha_config.isPaused) {
    res.status(400).json({ error: 'Máy gacha hiện đang tạm dừng bảo trì một chút nha.' });
    return;
  }

  const spinPrice = db.gacha_config.spinPrice || 20;
  if (user.balance < spinPrice) {
    res.status(400).json({
      error: 'Số xu cá của quý khách không đủ quay Gacha, hãy kiếm thêm xu cá nhé -`♡´- ',
      required: spinPrice,
      currentBalance: user.balance,
    });
    return;
  }

  // Deduct spin fee
  user.balance -= spinPrice;

  // Server-side authoritative random based on drop rates
  const randomPercent = Math.random() * 100;
  let accumulated = 0;
  let selectedReward = db.gacha_config.rates[0];

  for (const rate of db.gacha_config.rates) {
    accumulated += rate.rate;
    if (randomPercent <= accumulated) {
      selectedReward = rate;
      break;
    }
  }

  // Generate Voucher code (VOU-YYYYMMDD-XXXX)
  const voucherCode = `VOU-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const nowIso = new Date().toISOString();

  const newVoucher: Voucher = {
    id: `vou_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    userId: user.id,
    code: voucherCode,
    coinValue: selectedReward.coins,
    status: 'available',
    wonAt: nowIso,
    capsuleType: (selectedReward as any).capsuleType || 'strawberry_milk',
  };
  db.vouchers.push(newVoucher);

  // Record spin transaction
  const tx: WalletTransaction = {
    id: `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    userId: user.id,
    type: 'GACHA_SPIN',
    amount: -spinPrice,
    balanceAfter: user.balance,
    referenceId: newVoucher.id,
    description: `Quay máy Gacha viên nang (Trúng ${selectedReward.label})`,
    createdAt: nowIso,
  };
  db.wallet_transactions.push(tx);

  saveDatabase();

  res.json({
    success: true,
    reward: selectedReward,
    voucher: newVoucher,
    updatedBalance: user.balance,
  });
});

// 14. Vouchers: Get user vouchers
app.get('/api/vouchers', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const vouchers = db.vouchers
    .filter((v) => v.userId === user.id)
    .sort((a, b) => new Date(b.wonAt).getTime() - new Date(a.wonAt).getTime());

  res.json({ vouchers });
});

// 15. Vouchers: Claim voucher into Fish Coin Wallet
app.post('/api/vouchers/:id/claim', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const { id } = req.params;

  const voucher = db.vouchers.find((v) => v.id === id && v.userId === user.id);
  if (!voucher) {
    res.status(404).json({ error: 'Không tìm thấy voucher này.' });
    return;
  }

  if (voucher.status === 'claimed') {
    res.status(400).json({ error: 'Voucher này đã được quy đổi thành Xu Cá trước đó rồi.' });
    return;
  }

  voucher.status = 'claimed';
  voucher.claimedAt = new Date().toISOString();
  user.balance += voucher.coinValue;

  const tx: WalletTransaction = {
    id: `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    userId: user.id,
    type: 'VOUCHER_CLAIM',
    amount: voucher.coinValue,
    balanceAfter: user.balance,
    referenceId: voucher.id,
    description: `Quy đổi voucher: ${voucher.code} (+${voucher.coinValue} Xu Cá)`,
    createdAt: new Date().toISOString(),
  };
  db.wallet_transactions.push(tx);

  saveDatabase();

  res.json({
    success: true,
    message: `Quy đổi thành công voucher ${voucher.code}! Đã cộng +${voucher.coinValue} Xu Cá vào ví.`,
    updatedBalance: user.balance,
    claimedVoucher: voucher,
  });
});

// 16. User Feedback / Bug Reports
app.post('/api/feedback', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { content, type } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length < 5) {
    res.status(400).json({ error: 'Nội dung góp ý phải có ít nhất 5 ký tự.' });
    return;
  }

  const feedbackItem: Feedback = {
    id: `fb_${Date.now()}`,
    userId: user.id,
    username: user.username,
    content: content.trim(),
    type: type || 'suggestion',
    createdAt: new Date().toISOString(),
  };

  db.feedbacks.unshift(feedbackItem);
  saveDatabase();

  res.json({ success: true, message: 'Cảm ơn bà đã gửi lời nhắn cho tiệm nhé!' });
});

// 17. Special Orders (Phiếu Đặt Cá Khô)
app.post('/api/special-orders', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const {
    characterName,
    fishType,
    description,
    plotIdea,
    extraNotes,
    title,
    note,
    requestType,
  } = req.body;

  const cleanCharName = (characterName || title || '').trim();
  const cleanFishType = (fishType || '').trim();
  const cleanDesc = (description || '').trim();
  const cleanPlot = (plotIdea || '').trim();
  const cleanNotes = (extraNotes || note || '').trim();

  // Validate: Must have either description or plotIdea so the shop has info
  if (!cleanDesc && !cleanPlot) {
    res.status(400).json({
      error: 'Quý khách vui lòng nhập miêu tả em cá hoặc ý tưởng cốt truyện để tiệm có thông tin thực hiện nhé ♡',
      field: 'description',
    });
    return;
  }

  if (cleanCharName.length > 150) {
    res.status(400).json({ error: 'Tên cá khô tối đa 150 ký tự.', field: 'characterName' });
    return;
  }

  if (cleanFishType.length > 300) {
    res.status(400).json({ error: 'Mô tả loại cá tối đa 300 ký tự.', field: 'fishType' });
    return;
  }

  if (cleanDesc.length > 5000) {
    res.status(400).json({ error: 'Miêu tả cá khô tối đa 5000 ký tự.', field: 'description' });
    return;
  }

  if (cleanPlot.length > 8000) {
    res.status(400).json({ error: 'Ý tưởng cốt truyện tối đa 8000 ký tự.', field: 'plotIdea' });
    return;
  }

  if (cleanNotes.length > 3000) {
    res.status(400).json({ error: 'Thông tin khác tối đa 3000 ký tự.', field: 'extraNotes' });
    return;
  }

  db.special_orders = db.special_orders || [];
  const nowMs = Date.now();
  // Anti-spam check: prevent rapid duplicate submission within 10 seconds
  const duplicate = db.special_orders.find(
    (o) =>
      o.userId === user.id &&
      o.description === cleanDesc &&
      o.plotIdea === cleanPlot &&
      nowMs - new Date(o.createdAt).getTime() < 10000
  );
  if (duplicate) {
    res.status(429).json({ error: 'Quý khách vừa gửi phiếu này rồi nè, vui lòng đợi một chút nhé ♡' });
    return;
  }

  const requestId = generateRequestId();
  const nowIso = new Date().toISOString();
  const displayTitle = cleanCharName || (cleanFishType ? `Cá: ${cleanFishType}` : `Phiếu Đặt Cá #${requestId}`);

  const newOrder: SpecialOrder = {
    id: requestId,
    requestId,
    userId: user.id,
    username: user.username,
    characterName: cleanCharName || undefined,
    fishType: cleanFishType || undefined,
    description: cleanDesc,
    plotIdea: cleanPlot || undefined,
    extraNotes: cleanNotes || undefined,
    title: displayTitle,
    requestTypeName: 'PHIẾU ĐẶT CÁ KHÔ',
    requestType: (requestType as any) || 'custom_fish_order',
    status: 'received',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  db.special_orders.unshift(newOrder);
  saveDatabase();

  res.status(201).json({
    success: true,
    message: 'Tiệm đã nhận phiếu đặt cá của quý khách! ♡',
    order: newOrder,
  });
});

app.get('/api/special-orders/my', authMiddleware, (req, res) => {
  const user = (req as any).user;
  db.special_orders = db.special_orders || [];
  const myOrders = db.special_orders.filter((o) => o.userId === user.id);
  res.json({ orders: myOrders });
});

app.get('/api/special-orders/:id', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  db.special_orders = db.special_orders || [];
  const order = db.special_orders.find((o) => o.id === id || o.requestId === id);
  if (!order) {
    res.status(404).json({ error: 'Không tìm thấy phiếu đặt cá.' });
    return;
  }
  // Only the creator and admin can view the order content
  if (order.userId !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'Bạn không có quyền xem phiếu đặt cá này.' });
    return;
  }
  res.json({ order });
});

// ======================== ADMIN API ROUTES ========================

// Admin: Get Dashboard Stats & Lists
app.get('/api/admin/dashboard', authMiddleware, adminMiddleware, (req, res) => {
  res.json({
    stats: {
      totalUsers: db.users.length,
      totalCharacters: db.characters.length,
      totalOrders: db.orders.length,
      totalSpecialOrders: (db.special_orders || []).length,
      totalXuIssued: db.wallet_transactions
        .filter((tx) => tx.amount > 0)
        .reduce((sum, tx) => sum + tx.amount, 0),
      totalXuSpent: db.wallet_transactions
        .filter((tx) => tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
    },
    users: db.users.map((u) => ({
      id: u.id,
      username: u.username,
      balance: u.balance,
      role: u.role,
      createdAt: u.createdAt,
    })),
    characters: db.characters,
    orders: db.orders.slice(-50).reverse(),
    specialOrders: (db.special_orders || []).slice().reverse(),
    redeemCodes: db.redeem_codes,
    quests: db.quests,
    gachaConfig: db.gacha_config,
    feedbacks: db.feedbacks,
    complaints: (db.complaints || []).slice().reverse(),
    characterFeedbacks: (db.character_feedbacks || []).slice().reverse(),
    auditLogs: db.admin_audit_logs.slice(-50).reverse(),
    loyaltyConfig: db.loyalty_config || { isEnabled: true, rewardCoins: 50 },
    loyaltyLogs: (db.loyalty_completion_logs || []).slice(0, 100),
    userLoyaltyCards: db.user_loyalty_cards || [],
  });
});

// Admin: Update Special Order Status
app.post('/api/admin/special-orders/:id/status', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.special_orders = db.special_orders || [];
  const order = db.special_orders.find((o) => o.id === id || o.requestId === id);
  if (!order) {
    res.status(404).json({ error: 'Không tìm thấy phiếu đặt cá.' });
    return;
  }
  order.status = status || order.status;
  order.updatedAt = new Date().toISOString();
  saveDatabase();
  res.json({ success: true, order });
});

// Admin: Add or Edit Character
app.post('/api/admin/characters', authMiddleware, adminMiddleware, (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const user = (req as any).user;
  const { id, name, fishCode, age, category, shortBio, fullStory, backstory, openScene, price, studioUrl, avatarUrl, receiptAvatarUrl, isAvailable } = req.body;

  const cleanName = (name || '').trim();
  const cleanStudioUrl = (studioUrl || 'https://aistudio.google.com/').trim();
  const numericPrice = Number(price);

  if (!cleanName) {
    res.status(400).json({ error: 'Vui lòng nhập họ và tên cho nhân vật.' });
    return;
  }
  if (price === undefined || price === null || price === '' || isNaN(numericPrice) || numericPrice < 0) {
    res.status(400).json({ error: 'Giá bán phải là một số hợp lệ (từ 0 Xu Cá trở lên).' });
    return;
  }

  const normalizeUrl = (url?: string) => {
    if (!url) return '';
    const u = url.trim();
    if (!u) return '';
    if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/') || u.startsWith('data:')) {
      return u;
    }
    return `https://${u}`;
  };

  const finalStudioUrl = normalizeUrl(cleanStudioUrl) || 'https://aistudio.google.com/';
  const finalAvatarUrl = normalizeUrl(avatarUrl);
  const finalReceiptAvatarUrl = receiptAvatarUrl ? normalizeUrl(receiptAvatarUrl) : '';

  if (id) {
    const existing = db.characters.find((c) => c.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Không tìm thấy nhân vật.' });
      return;
    }
    existing.name = cleanName;
    if (fishCode !== undefined) existing.fishCode = fishCode.trim().toUpperCase();
    if (age !== undefined) existing.age = Number(age) || existing.age;
    if (category !== undefined) existing.category = category.trim();
    if (shortBio !== undefined) existing.shortBio = shortBio.trim();
    if (backstory !== undefined) {
      existing.backstory = backstory.trim();
      existing.fullStory = backstory.trim();
    } else if (fullStory !== undefined) {
      existing.fullStory = fullStory.trim();
      existing.backstory = fullStory.trim();
    }
    if (openScene !== undefined) existing.openScene = openScene.trim();
    existing.price = numericPrice;
    existing.studioUrl = finalStudioUrl;
    if (avatarUrl !== undefined && finalAvatarUrl) {
      existing.avatarUrl = finalAvatarUrl;
    }
    if (receiptAvatarUrl !== undefined) existing.receiptAvatarUrl = finalReceiptAvatarUrl;
    if (isAvailable !== undefined) existing.isAvailable = Boolean(isAvailable);

    // Sync any user character ownerships with updated character info
    if (db.user_characters) {
      db.user_characters.forEach((uc) => {
        if (uc.characterId === existing.id) {
          uc.character = { ...existing };
        }
      });
    }

    db.admin_audit_logs.push({
      id: `log_${Date.now()}`,
      adminUsername: user.username,
      action: 'UPDATE_CHARACTER',
      target: existing.name,
      details: `Cập nhật thông tin nhân vật ${existing.name}`,
      timestamp: new Date().toISOString(),
    });
  } else {
    const newChar: Character = {
      id: `char_${Date.now()}`,
      name: cleanName,
      fishCode: fishCode ? fishCode.trim().toUpperCase() : `CK-${Math.floor(100 + Math.random() * 900)}`,
      age: Number(age) || 20,
      category: category ? category.trim() : 'khô thượng phẩm',
      shortBio: shortBio || '',
      fullStory: backstory || fullStory || '',
      backstory: backstory || fullStory || shortBio || '',
      openScene: openScene || '',
      price: numericPrice,
      studioUrl: finalStudioUrl,
      avatarUrl: finalAvatarUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      receiptAvatarUrl: finalReceiptAvatarUrl,
      isAvailable: isAvailable !== false,
      salesCount: 0,
      createdAt: new Date().toISOString(),
    };
    db.characters.push(newChar);

    db.admin_audit_logs.push({
      id: `log_${Date.now()}`,
      adminUsername: user.username,
      action: 'CREATE_CHARACTER',
      target: newChar.name,
      details: `Thêm nhân vật mới: ${newChar.name}`,
      timestamp: new Date().toISOString(),
    });
  }

  saveDatabase();
  res.json({ success: true, characters: db.characters });
});

// Admin: Bulk sync and force-save characters list
app.post('/api/admin/characters/sync', authMiddleware, adminMiddleware, (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const user = (req as any).user;
  const { characters } = req.body;

  if (Array.isArray(characters) && characters.length > 0) {
    db.characters = characters;
    saveDatabase();

    db.admin_audit_logs.push({
      id: `log_${Date.now()}`,
      adminUsername: user.username,
      action: 'SYNC_CHARACTERS',
      target: 'CHARACTERS_LIST',
      details: `Đồng bộ vĩnh viễn ${characters.length} nhân vật từ client`,
      timestamp: new Date().toISOString(),
    });
    saveDatabase();

    res.json({ success: true, message: 'Đã đồng bộ và lưu vĩnh viễn danh sách nhân vật!', characters: db.characters });
    return;
  }
  res.status(400).json({ error: 'Dữ liệu danh sách nhân vật không hợp lệ.' });
});

// Admin: Adjust user balance manually
app.post('/api/admin/users/adjust-balance', authMiddleware, adminMiddleware, (req, res) => {
  const admin = (req as any).user;
  const { targetUsername, amount, reason } = req.body;

  const target = db.users.find((u) => u.username.toLowerCase() === (targetUsername || '').trim().toLowerCase());
  if (!target) {
    res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    return;
  }

  const change = Number(amount);
  if (isNaN(change) || change === 0) {
    res.status(400).json({ error: 'Số lượng xu điều chỉnh không hợp lệ.' });
    return;
  }

  target.balance = Math.max(0, target.balance + change);

  const tx: WalletTransaction = {
    id: `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    userId: target.id,
    type: 'ADMIN_ADJUST',
    amount: change,
    balanceAfter: target.balance,
    referenceId: admin.username,
    description: `Quản trị viên điều chỉnh: ${reason || 'Không có lý do'}`,
    createdAt: new Date().toISOString(),
  };
  db.wallet_transactions.push(tx);

  db.admin_audit_logs.push({
    id: `log_${Date.now()}`,
    adminUsername: admin.username,
    action: 'ADJUST_BALANCE',
    target: target.username,
    details: `${change > 0 ? '+' : ''}${change} Xu Cá. Lý do: ${reason}`,
    timestamp: new Date().toISOString(),
  });

  saveDatabase();
  res.json({ success: true, updatedBalance: target.balance, targetUsername: target.username });
});

// Admin: Create or update Giftcode
app.post('/api/admin/redeem-codes', authMiddleware, adminMiddleware, (req, res) => {
  const admin = (req as any).user;
  const { code, rewardCoins, maxUses, maxPerUser, expiresAt, isActive } = req.body;

  if (!code || !rewardCoins) {
    res.status(400).json({ error: 'Mã và số xu thưởng là bắt buộc.' });
    return;
  }

  const cleanCode = code.trim().toUpperCase();
  const existing = db.redeem_codes.find((c) => c.code === cleanCode);

  if (existing) {
    existing.rewardCoins = Number(rewardCoins);
    existing.maxUses = Number(maxUses) || existing.maxUses;
    existing.maxPerUser = Number(maxPerUser) || existing.maxPerUser;
    if (expiresAt) existing.expiresAt = expiresAt;
    if (isActive !== undefined) existing.isActive = isActive;
  } else {
    db.redeem_codes.push({
      id: `code_${Date.now()}`,
      code: cleanCode,
      rewardCoins: Number(rewardCoins),
      maxUses: Number(maxUses) || 500,
      usedCount: 0,
      expiresAt: expiresAt || '2027-12-31T23:59:59Z',
      maxPerUser: Number(maxPerUser) || 1,
      isActive: isActive !== false,
    });
  }

  db.admin_audit_logs.push({
    id: `log_${Date.now()}`,
    adminUsername: admin.username,
    action: 'SAVE_GIFTCODE',
    target: cleanCode,
    details: `Tạo/cập nhật giftcode ${cleanCode} với giá trị ${rewardCoins} Xu`,
    timestamp: new Date().toISOString(),
  });

  saveDatabase();
  res.json({ success: true, codes: db.redeem_codes });
});

// Admin: Update Gacha Rates
app.post('/api/admin/gacha-config', authMiddleware, adminMiddleware, (req, res) => {
  const admin = (req as any).user;
  const { spinPrice, isPaused, rates } = req.body;

  if (rates && Array.isArray(rates)) {
    const totalRate = rates.reduce((sum: number, r: any) => sum + Number(r.rate || 0), 0);
    if (Math.round(totalRate) !== 100) {
      res.status(400).json({ error: `Tổng tỷ lệ rơi phải đúng bằng 100%! Hiện tại là ${totalRate}%.` });
      return;
    }
    db.gacha_config.rates = rates;
  }

  if (spinPrice !== undefined) db.gacha_config.spinPrice = Number(spinPrice);
  if (isPaused !== undefined) db.gacha_config.isPaused = Boolean(isPaused);

  db.admin_audit_logs.push({
    id: `log_${Date.now()}`,
    adminUsername: admin.username,
    action: 'UPDATE_GACHA',
    target: 'GACHA_CONFIG',
    details: `Cập nhật cấu hình gacha: giá quay ${db.gacha_config.spinPrice} Xu`,
    timestamp: new Date().toISOString(),
  });

  saveDatabase();
  res.json({ success: true, config: db.gacha_config });
});

// ======================== CHARACTER COMPLAINTS & FEEDBACKS ========================

// Submit character complaint (User)
app.post('/api/characters/:id/complaints', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { issueType, content } = req.body;

  const character = db.characters.find((c) => c.id === id);
  if (!character) {
    res.status(404).json({ error: 'Không tìm thấy nhân vật.' });
    return;
  }

  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Vui lòng mô tả chi tiết lỗi gặp phải.' });
    return;
  }

  const complaint: Complaint = {
    id: `comp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    characterId: character.id,
    characterName: character.name,
    userId: user.id,
    username: user.username,
    issueType: issueType || 'Lỗi chung',
    content: content.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.complaints = db.complaints || [];
  db.complaints.push(complaint);
  saveDatabase();

  res.json({
    success: true,
    message: 'Tiệm đã ghi nhận báo lỗi của bà và sẽ sớm xử lý!',
    complaint,
  });
});

// Get character complaints (Admin)
app.get('/api/admin/complaints', authMiddleware, adminMiddleware, (req, res) => {
  const complaints = (db.complaints || []).slice().reverse();
  res.json({ complaints });
});

// Update complaint status (Admin)
app.post('/api/admin/complaints/:id/status', authMiddleware, adminMiddleware, (req, res) => {
  const admin = (req as any).user;
  const { id } = req.params;
  const { status } = req.body;

  db.complaints = db.complaints || [];
  const complaint = db.complaints.find((c) => c.id === id);
  if (!complaint) {
    res.status(404).json({ error: 'Không tìm thấy báo lỗi.' });
    return;
  }

  complaint.status = status === 'resolved' ? 'resolved' : 'pending';

  db.admin_audit_logs.push({
    id: `log_${Date.now()}`,
    adminUsername: admin.username,
    action: 'UPDATE_COMPLAINT_STATUS',
    target: complaint.characterName,
    details: `Chuyển trạng thái báo lỗi #${complaint.id} sang: ${complaint.status}`,
    timestamp: new Date().toISOString(),
  });

  saveDatabase();
  res.json({ success: true, complaint });
});

// Get feedbacks / comments for a character (Public)
app.get('/api/characters/:id/comments', (req, res) => {
  const { id } = req.params;
  db.character_feedbacks = db.character_feedbacks || [];
  const feedbacks = db.character_feedbacks
    .filter((f) => f.characterId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ feedbacks });
});

// Post a feedback / comment for a character (User)
app.post('/api/characters/:id/comments', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { content, rating } = req.body;

  const character = db.characters.find((c) => c.id === id);
  if (!character) {
    res.status(404).json({ error: 'Không tìm thấy nhân vật.' });
    return;
  }

  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Vui lòng nhập nội dung fít bách.' });
    return;
  }

  const newFeedback: CharacterFeedback = {
    id: `fb_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    characterId: character.id,
    characterName: character.name,
    userId: user.id,
    username: user.username,
    content: content.trim(),
    rating: typeof rating === 'number' && rating >= 1 && rating <= 5 ? rating : 5,
    createdAt: new Date().toISOString(),
  };

  db.character_feedbacks = db.character_feedbacks || [];
  db.character_feedbacks.push(newFeedback);
  saveDatabase();

  res.json({
    success: true,
    message: 'Cảm ơn bà đã gửi fít bách ngọt ngào cho em cá!',
    feedback: newFeedback,
  });
});

// Get all character comments (Admin)
app.get('/api/admin/character-comments', authMiddleware, adminMiddleware, (req, res) => {
  const feedbacks = (db.character_feedbacks || []).slice().reverse();
  res.json({ feedbacks });
});

// Delete a character comment (Admin)
app.delete('/api/admin/character-comments/:id', authMiddleware, adminMiddleware, (req, res) => {
  const admin = (req as any).user;
  const { id } = req.params;

  db.character_feedbacks = db.character_feedbacks || [];
  const idx = db.character_feedbacks.findIndex((f) => f.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Không tìm thấy bình luận.' });
    return;
  }

  const removed = db.character_feedbacks.splice(idx, 1)[0];

  db.admin_audit_logs.push({
    id: `log_${Date.now()}`,
    adminUsername: admin.username,
    action: 'DELETE_CHARACTER_COMMENT',
    target: removed.characterName,
    details: `Xóa bình luận của ${removed.username}: "${removed.content.slice(0, 30)}..."`,
    timestamp: new Date().toISOString(),
  });

  saveDatabase();
  res.json({ success: true, message: 'Đã xóa bình luận thành công.' });
});

// ======================== THỊ TRẤN CÁ MÈO (CAT FISH TOWN) ROUTES ========================
setupCatTownRoutes(app, db, () => saveDatabase(), authMiddleware, adminMiddleware, getVietnamDateStr);

// ======================== VITE INTEGRATION ========================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server "Mèo Mê Cá Khô" running at http://0.0.0.0:${port}`);
  });
}

startServer();
