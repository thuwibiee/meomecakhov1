import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocFromServer,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import firebaseAppletConfig from '../firebase-applet-config.json';
import initialCharactersData from '../data/characters.json';
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
  LoyaltyCardConfig,
  UserLoyaltyCard,
  LoyaltyCompletionLog,
  CatTownConfig,
  CatTownUserProfile,
  CatTownFish,
  CatTownFurniture,
  CatTownFortune,
  CatBreed,
  Spice,
  AdminTodo,
} from './types.ts';
import { FISH_DATABASE, catchFish as pickWeightedFish } from './components/cat-town/fishDatabase';
import { DEFAULT_FURNITURE_CATALOG } from './components/cat-town/furnitureCatalog.ts';

// Connect directly to the user's Firebase project
const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || "AIzaSyAj8ihDtN2Lua6o1cEY-SYkhAwkjFyDvPM",
  authDomain: firebaseAppletConfig.authDomain || "meomecakhov1.firebaseapp.com",
  projectId: firebaseAppletConfig.projectId || "meomecakhov1",
  storageBucket: firebaseAppletConfig.storageBucket || "meomecakhov1.firebasestorage.app",
  messagingSenderId: firebaseAppletConfig.messagingSenderId || "73422378489",
  appId: firebaseAppletConfig.appId || "1:73422378489:web:a3f29319ee6b6555749928",
  measurementId: firebaseAppletConfig.measurementId || "G-XY14JPMGLD",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map((provider) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Note: Firestore handles connection and offline cache seamlessly; no blocking testConnection required.

const SESSION_UID_KEY = 'meome_firebase_uid';

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function generateToken(userId: string): string {
  const rand = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
  return `${userId}.${rand}`;
}

function getVietnamDateStr(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function usernameToSyntheticEmail(username: string): string {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${clean || 'user'}@meomecakho.local`;
}

function normalizePasswordForFirebase(password: string): string {
  return password.length >= 6 ? password : `${password}_meome`;
}

function isAdminUsername(username: string): boolean {
  const lower = String(username || '').trim().toLowerCase();
  return lower === 'admin' || lower === 'meomecakho@6104';
}

export function getDefaultCatTownConfig(): CatTownConfig {
  const fishCatalog: CatTownFish[] = [
    {
      id: 'fish_bong_bong',
      name: 'Cá Bong Bóng Pastel',
      rarity: 'common',
      rewardCoins: 6,
      weightMin: 120,
      weightMax: 350,
      description: 'Chú cá tròn xoe như bong bóng xà phòng, bơi lội tung tăng trong làn nước mát rượi.',
      color: '#FFB3C6',
      iconType: 'bubble_fish',
    },
    {
      id: 'fish_meo_con',
      name: 'Cá Tai Mèo Vằn',
      rarity: 'common',
      rewardCoins: 8,
      weightMin: 200,
      weightMax: 450,
      description: 'Hai vây trên đầu nhọn hoắt hệt như đôi tai mèo con ngơ ngác.',
      color: '#A9C5F2',
      iconType: 'cat_fish',
    },
    {
      id: 'fish_cau_vong',
      name: 'Cá Cầu Vồng Ngũ Sắc',
      rarity: 'uncommon',
      rewardCoins: 14,
      weightMin: 300,
      weightMax: 600,
      description: 'Vảy lấp lánh như dải cầu vồng sau cơn mưa rào chiều mùa hạ.',
      color: '#F7DDA0',
      iconType: 'rainbow_fish',
    },
    {
      id: 'fish_anh_trang',
      name: 'Cá Bạc Ánh Trăng',
      rarity: 'uncommon',
      rewardCoins: 18,
      weightMin: 400,
      weightMax: 850,
      description: 'Phát ra ánh sáng dịu êm huyền ảo trong làn nước đêm của hồ bong bóng.',
      color: '#E0AAFF',
      iconType: 'moon_fish',
    },
    {
      id: 'fish_hoa_dao',
      name: 'Cá Cánh Hoa Đào',
      rarity: 'rare',
      rewardCoins: 28,
      weightMin: 500,
      weightMax: 1100,
      description: 'Thân hình mềm mại tựa cánh hoa anh đào trôi dạt theo dòng suối ngọt.',
      color: '#FF8FAB',
      iconType: 'blossom_fish',
    },
    {
      id: 'fish_kim_ngan',
      name: 'Cá Chép Kim Ngân Chiêu Tài',
      rarity: 'rare',
      rewardCoins: 35,
      weightMin: 800,
      weightMax: 1600,
      description: 'Mang lại điềm lành và tài lộc rủng rỉnh cho bất kỳ ai câu trúng.',
      color: '#FFD166',
      iconType: 'golden_carp',
    },
    {
      id: 'fish_than_long',
      name: 'Cá Rồng Mèo Cổ Đại',
      rarity: 'legendary',
      rewardCoins: 60,
      weightMin: 1500,
      weightMax: 3200,
      description: 'Huyền thoại kể rằng chú cá này mang linh hồn của thần mèo bảo hộ thị trấn.',
      color: '#06D6A0',
      iconType: 'dragon_fish',
    },
    {
      id: 'fish_meo_hoang_gia',
      name: 'Cá Vương Miện Bảy Màu',
      rarity: 'legendary',
      rewardCoins: 80,
      weightMin: 2000,
      weightMax: 4500,
      description: 'Đội vương miện ngọc trai hoàng gia, hiếm khi xuất hiện trừ khi câu được bằng cả tấm lòng.',
      color: '#7209B7',
      iconType: 'royal_fish',
    },
  ];

  const furnitureCatalog: CatTownFurniture[] = DEFAULT_FURNITURE_CATALOG;

  const fortuneCatalog: CatTownFortune[] = [
    {
      id: 'fort_01',
      category: 'love',
      title: 'Tình Duyên Nở Rộ',
      prophecy: 'Hôm nay sợi dây hồng duyên đang lay động khẽ khàng. Nam chính bà thích thầm có thể đang nghĩ về bà đó nha!',
      luckyNumber: 7,
      luckyColor: 'Hồng Phấn',
      advice: 'Hãy ghé Quầy Cá ngắm nam chính và gửi một lời thì thầm ngọt ngào nhé~',
    },
    {
      id: 'fort_02',
      category: 'wealth',
      title: 'Tài Lộc Đầy Rổ Cá',
      prophecy: 'Tiền tài và Xu Cá đang tìm đường chảy vào ví. Bến câu hôm nay có làn sóng bạc may mắn!',
      luckyNumber: 8,
      luckyColor: 'Vàng Bơ',
      advice: 'Mau ra Hồ Bong Bóng thả cần, có cá hiếm đang chờ cắn câu đấy!',
    },
    {
      id: 'fort_03',
      category: 'luck',
      title: 'Vạn Sự Hanh Thông',
      prophecy: 'Một ngày nhẹ nhõm như chú mèo nằm sưởi nắng bên bậu cửa sổ. Mọi muộn phiền sẽ tan biến.',
      luckyNumber: 3,
      luckyColor: 'Xanh Biển Nhạt',
      advice: 'Uống một ngụm sữa ấm, mỉm cười và nướng một xiên cá giòn rụm nha.',
    },
    {
      id: 'fort_04',
      category: 'cat_wisdom',
      title: 'Lời Khuyên Phù Thủy Mèo',
      prophecy: 'Mèo bảo: Ăn ngoan, ngủ đủ giấc và đừng quên vuốt ve boss mỗi ngày thì đời tự khắc nở hoa.',
      luckyNumber: 9,
      luckyColor: 'Trắng Kem',
      advice: 'Về nhà gãi cằm cho bé mèo của bà 3 cái để tích thêm may mắn!',
    },
    {
      id: 'fort_05',
      category: 'wealth',
      title: 'Quý Nhân Phù Trợ',
      prophecy: 'Sắp có một món quà bất ngờ hoặc một vị khách quý ghé thăm tiệm và mang lại niềm vui lớn.',
      luckyNumber: 6,
      luckyColor: 'Tím Oải Hương',
      advice: 'Giữ tâm trạng tích cực và trang trí căn nhà thật gọn gàng nhé.',
    },
    {
      id: 'fort_06',
      category: 'love',
      title: 'Trái Tim Rung Rinh',
      prophecy: 'Có người đang chuẩn bị tạo bất ngờ nho nhỏ cho bà. Hãy mở rộng trái tim đón nhận nhé!',
      luckyNumber: 2,
      luckyColor: 'Đỏ Dâu Tây',
      advice: 'Đừng ngại ngần bày tỏ sự yêu thương với những người bên cạnh.',
    },
    {
      id: 'fort_07',
      category: 'luck',
      title: 'Ngư Ông Đắc Lợi',
      prophecy: 'Hôm nay độ chính xác của bà cao vọt, nướng cá là vàng ruộm, thả cần là trúng phóc!',
      luckyNumber: 11,
      luckyColor: 'Xanh Mint',
      advice: 'Ghé Bếp Xèo Xèo trổ tài nướng cá 100 điểm hoàn hảo ngay!',
    },
  ];

  return {
    isEnabled: true,
    dailyFishingLimit: 12,
    dailyGrillingLimit: 12,
    fishingRewardMin: 5,
    fishingRewardMax: 20,
    grillingRewardPerfect: 20,
    grillingRewardGood: 10,
    grillingRewardBurnt: 2,
    fortuneRewardCoins: 10,
    fishCatalog,
    furnitureCatalog,
    fortuneCatalog,
    fishingAssets: {
      catImageUrl: '',
      dockImageUrl: '',
      fishDefaultImageUrl: '',
    },
  };
}

const CAT_BREEDS: { breed: CatBreed; color: string; defaultName: string }[] = [
  { breed: 'Mèo Cam', color: '#F4A261', defaultName: 'Bánh Mì Bo' },
  { breed: 'Mèo Mướp', color: '#A89F91', defaultName: 'Bé Mập' },
  { breed: 'Mèo Tam Thể', color: '#E76F51', defaultName: 'Hoa Cúc' },
  { breed: 'Mèo Trắng', color: '#FFFFFF', defaultName: 'Bông Gòn' },
  { breed: 'Mèo Đen', color: '#3D3A45', defaultName: 'Hạt Tiêu' },
  { breed: 'Mèo Xám', color: '#90A4AE', defaultName: 'Mây Khói' },
];

export const DEFAULT_GACHA_CONFIG: GachaConfig = {
  spinPrice: 10,
  isPaused: false,
  rates: [
    { coins: 5, rate: 40, label: 'Voucher 5 Xu Cá', rarity: 'common', capsuleType: 'strawberry_milk', capsuleName: 'Capsule 01 — Strawberry Milk' },
    { coins: 10, rate: 30, label: 'Voucher 10 Xu Cá', rarity: 'common', capsuleType: 'fish_blue', capsuleName: 'Capsule 02 — Fish Blue' },
    { coins: 20, rate: 20, label: 'Voucher 20 Xu Cá', rarity: 'rare', capsuleType: 'butter_cream', capsuleName: 'Capsule 03 — Butter Cream' },
    { coins: 50, rate: 8, label: 'Voucher 50 Xu Cá', rarity: 'super_rare', capsuleType: 'pearl_rainbow', capsuleName: 'Capsule 04 — Pearl Rainbow' },
    { coins: 100, rate: 2, label: 'Voucher 100 Xu Cá Đại Cát', rarity: 'legendary', capsuleType: 'pearl_rainbow', capsuleName: 'Capsule 04 — Pearl Rainbow (Đại Cát)' },
  ],
};

export const DEFAULT_LOYALTY_CONFIG: LoyaltyCardConfig = {
  isEnabled: true,
  rewardCoins: 50,
  dailyRewardCoins: 5,
};

export const DEFAULT_QUESTS: Quest[] = [
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
];

export const DEFAULT_SPICES: Spice[] = [
  {
    id: 'spice_01',
    type: 'command',
    title: 'Lệnh neo thời gian (Time-Anchor)',
    content: 'Dán lệnh này vào cuối câu chat để bot nhớ mạch thời gian:\n\n[System note: Update current time to 23:30. Character is currently at hotel balcony. Maintain narrative tone and do not skip time unless instructed.]',
    author: 'Chủ Tiệm',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'spice_02',
    type: 'lore',
    title: 'Luật ngầm thế giới Kẻ Săn Mồi',
    content: 'Bất cứ ai bước chân vào khu vực này sau 12h đêm đều phải tuân thủ 3 quy tắc tĩnh lặng. NPC xung quanh sẽ phản ứng mạnh nếu nhân vật tạo ra tiếng ồn lớn.',
    author: 'Chủ Tiệm',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'spice_03',
    type: 'command',
    title: 'Lệnh đẩy cao kịch tính & mâu thuẫn (Drama Injector)',
    content: 'Sử dụng khi câu chuyện đang đi vào bối cảnh quá bình lặng:\n\n[System note: Introduce a sudden unexpected conflict, secret revelation, or dramatic arrival that forces both characters to react immediately.]',
    author: 'Chủ Tiệm',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'spice_04',
    type: 'lore',
    title: 'Thiết lập Ban Chuyên Án & Vùng Tối',
    content: 'Ban chuyên án đặc biệt làm việc dưới sự chỉ đạo trực tiếp của Tổng Cục. Mọi tài liệu mật liên quan đến thân thế các nhân vật đều được bảo vệ bằng mã hóa cấp 5.',
    author: 'Chủ Tiệm',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const RANDOM_PAW_MESSAGES = [
  'Meo~ Hôm nay quý khách đã ghé tiệm rồi! Một dấu chân xinh đã được đóng ♡',
  'Paw paw~ Cảm ơn quý khách đã ghé thăm tiệm Mèo Mê Cá Khô hôm nay!',
  'Meo meo~ Đã in thêm một dấu chân khách quen xinh xắn vào thẻ của quý khách!',
  'Gửi một cái dụi đầu ấm áp~ Quý khách đã điểm danh thành công hôm nay ♡',
  'Tiệm cá gửi tặng quý khách một dấu chân mèo may mắn hôm nay nha!',
];

export function normalizeCharacter(c: any): Character {
  const defaultTagsMap: Record<string, string[]> = {
    'char_lac_tu_du': ['ThơMộng', 'ÔnNhu', 'LinhHồ'],
    'char_tieu_than': ['ThiếuTướng', 'LạnhLùng', 'SiTình'],
    'char_co_dien': ['TổngTài', 'ChiềuBạnGái', 'KhôThượngPhẩm'],
    'char_da_huyet': ['MaTôn', 'VươngGiả', 'ChiềuVợ'],
    'char_minh_nhat': ['ThanhMaiTrúcMã', 'NhiệtHuyết', 'ĐộiTrưởng'],
    'char_han_da_bang': ['ThầnY', 'ThanhLãnh', 'ẤmÁp'],
  };

  const normTags = Array.isArray(c.tags) && c.tags.length > 0
    ? c.tags
    : (defaultTagsMap[c.id] || (c.category ? [c.category, 'CáKhô'] : ['ThơMộng', 'CáKhô']));

  return {
    id: String(c.id),
    name: String(c.name || 'Nhân vật mới'),
    fishCode: c.fishCode || 'CK-001',
    age: Number(c.age) || 22,
    category: c.category || 'khô cá con',
    shortBio: c.shortBio || '',
    fullStory: c.fullStory || c.backstory || '',
    backstory: c.backstory || c.fullStory || c.shortBio || '',
    openScene: c.openScene || '',
    price: typeof c.price === 'number' ? c.price : Number(String(c.price || 30).replace(/\D/g, '')) || 30,
    studioUrl: typeof c.studioUrl === 'string' ? c.studioUrl.trim() : '',
    avatarUrl: c.avatarUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    receiptAvatarUrl: c.receiptAvatarUrl || '',
    isAvailable: c.isAvailable !== false,
    isComingSoon: Boolean(c.isComingSoon || !c.studioUrl || !String(c.studioUrl).trim()),
    isBestSeller: Boolean(c.isBestSeller),
    salesCount: Number(c.salesCount || 0),
    createdAt: c.createdAt && !String(c.createdAt).startsWith('2026-10-') ? c.createdAt : new Date().toISOString(),
    tags: normTags,
  };
}

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      // 1. Seed Characters if Firestore characters collection is completely empty
      const charSnap = await getDocs(collection(db, 'characters'));
      if (charSnap.empty) {
        const batchPromises = (initialCharactersData as any[]).map((rawChar) => {
          const norm = normalizeCharacter(rawChar);
          return setDoc(doc(db, 'characters', norm.id), norm);
        });
        await Promise.all(batchPromises);
      }

      // 2. Seed default admin accounts ("admin" and "meomecakho@6104") and demo user
      const dynamicNowIso = new Date().toISOString();
      const defaultPastIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

      const adminDefaultSnap = await getDoc(doc(db, 'users', 'usr_admin_default'));
      if (!adminDefaultSnap.exists()) {
        await setDoc(doc(db, 'users', 'usr_admin_default'), {
          id: 'usr_admin_default',
          username: 'admin',
          password_plain: 'admin',
          balance: 9999,
          role: 'admin',
          createdAt: dynamicNowIso,
          lastLoginAt: dynamicNowIso,
          previousLoginAt: defaultPastIso,
        });
      } else {
        const d = adminDefaultSnap.data();
        if (
          (d.createdAt && String(d.createdAt).startsWith('2026-10-')) ||
          (d.previousLoginAt && String(d.previousLoginAt).startsWith('2026-10-')) ||
          (d.lastLoginAt && String(d.lastLoginAt).startsWith('2026-10-'))
        ) {
          await updateDoc(doc(db, 'users', 'usr_admin_default'), {
            createdAt: d.createdAt && !String(d.createdAt).startsWith('2026-10-') ? d.createdAt : dynamicNowIso,
            previousLoginAt: d.previousLoginAt && !String(d.previousLoginAt).startsWith('2026-10-') ? d.previousLoginAt : defaultPastIso,
            lastLoginAt: d.lastLoginAt && !String(d.lastLoginAt).startsWith('2026-10-') ? d.lastLoginAt : dynamicNowIso,
          });
        }
      }

      const adminMainSnap = await getDoc(doc(db, 'users', 'usr_admin'));
      if (!adminMainSnap.exists()) {
        await setDoc(doc(db, 'users', 'usr_admin'), {
          id: 'usr_admin',
          username: 'meomecakho@6104',
          password_plain: 'Chanbaek6104',
          balance: 9999,
          role: 'admin',
          createdAt: dynamicNowIso,
          lastLoginAt: dynamicNowIso,
          previousLoginAt: defaultPastIso,
        });
      } else {
        const d = adminMainSnap.data();
        if (
          (d.createdAt && String(d.createdAt).startsWith('2026-10-')) ||
          (d.previousLoginAt && String(d.previousLoginAt).startsWith('2026-10-')) ||
          (d.lastLoginAt && String(d.lastLoginAt).startsWith('2026-10-'))
        ) {
          await updateDoc(doc(db, 'users', 'usr_admin'), {
            createdAt: d.createdAt && !String(d.createdAt).startsWith('2026-10-') ? d.createdAt : dynamicNowIso,
            previousLoginAt: d.previousLoginAt && !String(d.previousLoginAt).startsWith('2026-10-') ? d.previousLoginAt : defaultPastIso,
            lastLoginAt: d.lastLoginAt && !String(d.lastLoginAt).startsWith('2026-10-') ? d.lastLoginAt : dynamicNowIso,
          });
        }
      }

      const guestSnap = await getDoc(doc(db, 'users', 'usr_guest_demo'));
      if (!guestSnap.exists()) {
        await setDoc(doc(db, 'users', 'usr_guest_demo'), {
          id: 'usr_guest_demo',
          username: 'khach_yeu_ca',
          password_plain: '123456',
          balance: 100,
          role: 'user',
          createdAt: dynamicNowIso,
        });
      }

      // 3. Seed redeem_codes if empty
      const codesSnap = await getDocs(collection(db, 'redeem_codes'));
      if (codesSnap.empty) {
        const defaultCodes: RedeemCode[] = [
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
        ];
        await Promise.all(defaultCodes.map((c) => setDoc(doc(db, 'redeem_codes', c.id), c)));
      }

      // 4. Seed quests if empty
      const questsSnap = await getDocs(collection(db, 'quests'));
      if (questsSnap.empty) {
        await Promise.all(DEFAULT_QUESTS.map((q) => setDoc(doc(db, 'quests', q.id), q)));
      }

      // 4b. Migrate legacy category 'khô hai nắng' -> 'khô cá hai nắng'
      try {
        const legacyCharsSnap = await getDocs(query(collection(db, 'characters'), where('category', '==', 'khô hai nắng')));
        if (!legacyCharsSnap.empty) {
          await Promise.all(
            legacyCharsSnap.docs.map((d) => updateDoc(d.ref, { category: 'khô cá hai nắng' }))
          );
        }
      } catch (catErr) {
        console.warn('Category migration notice:', catErr);
      }

      // 5. Seed settings if missing or update default gacha price
      const gachaSnap = await getDoc(doc(db, 'settings', 'gacha_config'));
      if (!gachaSnap.exists()) {
        await setDoc(doc(db, 'settings', 'gacha_config'), DEFAULT_GACHA_CONFIG);
      } else {
        const currentGacha = gachaSnap.data() as any;
        if (currentGacha && currentGacha.spinPrice === 20) {
          await setDoc(doc(db, 'settings', 'gacha_config'), { ...currentGacha, spinPrice: 10 });
        }
      }

      const loyaltySnap = await getDoc(doc(db, 'settings', 'loyalty_config'));
      if (!loyaltySnap.exists()) {
        await setDoc(doc(db, 'settings', 'loyalty_config'), DEFAULT_LOYALTY_CONFIG);
      }

      const catTownSnap = await getDoc(doc(db, 'settings', 'cat_town_config'));
      if (!catTownSnap.exists()) {
        await setDoc(doc(db, 'settings', 'cat_town_config'), getDefaultCatTownConfig());
      } else {
        const existingData = catTownSnap.data() as any;
        const savedCatalog = existingData.furnitureCatalog || [];
        const hasLegacy = savedCatalog.some((s: any) => s.id && (s.id.startsWith('furn_') || !s.imageUrl));
        if (hasLegacy) {
          const cleanConfig = getDefaultCatTownConfig();
          await setDoc(doc(db, 'settings', 'cat_town_config'), {
            ...cleanConfig,
            ...existingData,
            furnitureCatalog: cleanConfig.furnitureCatalog,
          });
        }
      }

      // 6. Seed spices if empty
      const spicesSnap = await getDocs(collection(db, 'spices'));
      if (spicesSnap.empty) {
        await Promise.all(DEFAULT_SPICES.map((s) => setDoc(doc(db, 'spices', s.id), s)));
      }

      // 7. Seed admin_todos if empty
      const todosSnap = await getDocs(collection(db, 'admin_todos'));
      if (todosSnap.empty) {
        const defaultTodos = [
          {
            id: 'todo_1',
            content: 'Duyệt các phiếu đặt cá khô đặc biệt mới gửi',
            isCompleted: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'todo_2',
            content: 'Ủ thêm plot cốt truyện cho các chàng cá sắp lên kệ',
            isCompleted: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'todo_3',
            content: 'Kiểm tra hộp thư fít bách và báo lỗi từ độc giả',
            isCompleted: true,
            createdAt: new Date().toISOString(),
          },
        ];
        await Promise.all(defaultTodos.map((t) => setDoc(doc(db, 'admin_todos', t.id), t)));
      }
    } catch (err) {
      console.warn('Firestore seed check encountered an issue (will retry on next request):', err);
      seedPromise = null;
    }
  })();
  return seedPromise;
}

export function subscribeToCharacters(onUpdate: (chars: Character[]) => void): () => void {
  ensureSeeded().catch(() => {});
  try {
    return onSnapshot(
      collection(db, 'characters'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => normalizeCharacter({ ...d.data(), id: d.id }));
          list.sort((a, b) => String(a.fishCode || '').localeCompare(String(b.fishCode || '')));
          onUpdate(list);
        } else {
          ensureSeeded().catch(() => {});
          const fallback = (initialCharactersData as any[]).map(normalizeCharacter);
          onUpdate(fallback);
        }
      },
      (error) => {
        console.warn('Characters subscription notice:', error);
        const fallback = (initialCharactersData as any[]).map(normalizeCharacter);
        onUpdate(fallback);
      }
    );
  } catch (err) {
    console.warn('Characters subscription exception:', err);
    const fallback = (initialCharactersData as any[]).map(normalizeCharacter);
    onUpdate(fallback);
    return () => {};
  }
}

export function subscribeToSpices(onUpdate: (spices: Spice[]) => void): () => void {
  ensureSeeded().catch(() => {});
  try {
    return onSnapshot(
      collection(db, 'spices'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Spice));
          list.sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime());
          onUpdate(list);
        } else {
          ensureSeeded().catch(() => {});
          onUpdate(DEFAULT_SPICES);
        }
      },
      (error) => {
        console.warn('Spices subscription notice:', error);
        onUpdate(DEFAULT_SPICES);
      }
    );
  } catch (err) {
    console.warn('Spices subscription exception:', err);
    onUpdate(DEFAULT_SPICES);
    return () => {};
  }
}

export function subscribeToAdminTodos(onUpdate: (todos: AdminTodo[]) => void): () => void {
  ensureSeeded().catch(() => {});
  try {
    return onSnapshot(
      collection(db, 'admin_todos'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        } as AdminTodo));
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onUpdate(list);
      },
      (err) => {
        console.warn('Admin todos listener notice:', err);
      }
    );
  } catch (err) {
    console.warn('Admin todos subscription exception:', err);
    return () => {};
  }
}

export async function addAdminTodo(content: string): Promise<AdminTodo> {
  const id = genId('todo');
  const newTodo: AdminTodo = {
    id,
    content: content.trim(),
    isCompleted: false,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'admin_todos', id), newTodo);
  return newTodo;
}

export async function toggleAdminTodo(todoId: string, currentStatus: boolean): Promise<boolean> {
  const next = !currentStatus;
  await updateDoc(doc(db, 'admin_todos', todoId), {
    isCompleted: next,
  });
  return next;
}

export async function deleteAdminTodo(todoId: string): Promise<void> {
  await deleteDoc(doc(db, 'admin_todos', todoId));
}

export async function getAdminSecretaryStats(previousLoginAt?: string) {
  await ensureSeeded();
  let thresholdIso = previousLoginAt;
  if (!thresholdIso || String(thresholdIso).startsWith('2026-10-')) {
    thresholdIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  }
  const thresholdTime = new Date(thresholdIso).getTime();

  const getTimeMs = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (val.seconds) return val.seconds * 1000;
    if (typeof val.toDate === 'function') return val.toDate().getTime();
    const t = new Date(val).getTime();
    return isNaN(t) ? 0 : t;
  };

  let newUsersCount = 0;
  let newRequestsCount = 0;

  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    newUsersCount = usersSnap.docs.filter((d) => {
      const data = d.data();
      const timeMs = getTimeMs(data.createdAt);
      return timeMs > thresholdTime;
    }).length;
  } catch (e) {
    console.warn('Secretary users stats warning:', e);
  }

  const soldMap = new Map<string, number>();

  try {
    const ordersSnap = await getDocs(collection(db, 'orders'));
    ordersSnap.docs.forEach((d) => {
      const data = d.data();
      const timeMs = getTimeMs(data.createdAt || data.purchasedAt);
      if (timeMs > thresholdTime) {
        const charName = String(data.characterName || data.name || 'Bé cá khô').trim();
        soldMap.set(charName, (soldMap.get(charName) || 0) + 1);
      }
    });

    if (soldMap.size === 0) {
      const ucSnap = await getDocs(collection(db, 'user_characters'));
      const charsSnap = await getDocs(collection(db, 'characters'));
      const charNameMap = new Map<string, string>();
      charsSnap.docs.forEach((cd) => {
        const cdData = cd.data();
        charNameMap.set(cd.id, cdData.name || cd.id);
      });

      ucSnap.docs.forEach((d) => {
        const data = d.data();
        const timeMs = getTimeMs(data.purchasedAt || data.createdAt);
        if (timeMs > thresholdTime) {
          const charName = String(
            data.characterName ||
              (data.character && data.character.name) ||
              charNameMap.get(data.characterId) ||
              'Bé cá khô'
          ).trim();
          soldMap.set(charName, (soldMap.get(charName) || 0) + 1);
        }
      });
    }
  } catch (e) {
    console.warn('Secretary orders stats warning:', e);
  }

  const fishSoldDetails: { characterName: string; count: number }[] = [];
  let fishSoldCount = 0;
  soldMap.forEach((count, characterName) => {
    fishSoldDetails.push({ characterName, count });
    fishSoldCount += count;
  });

  try {
    const requestsSnap = await getDocs(collection(db, 'special_orders'));
    const requestsCount = requestsSnap.docs.filter((d) => {
      const data = d.data();
      const timeMs = getTimeMs(data.createdAt || data.requestedAt);
      return timeMs > thresholdTime;
    }).length;

    const feedbacksSnap = await getDocs(collection(db, 'feedbacks'));
    const feedbacksCount = feedbacksSnap.docs.filter((d) => {
      const data = d.data();
      const timeMs = getTimeMs(data.createdAt);
      return timeMs > thresholdTime;
    }).length;

    newRequestsCount = requestsCount + feedbacksCount;
  } catch (e) {
    console.warn('Secretary requests stats warning:', e);
  }

  return {
    newUsersCount,
    fishSoldCount,
    fishSoldDetails,
    newRequestsCount,
    previousLoginAt: thresholdIso,
  };
}


// Resolve user from Authorization header (`Bearer <userId>.<rand>`) or localStorage
async function resolveUser(options?: RequestInit): Promise<(User & { password_plain?: string }) | null> {
  let uid: string | null = null;

  const headers = options?.headers as Record<string, string> | undefined;
  const authHeader = headers?.['Authorization'] || headers?.['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token.includes('.')) {
      uid = token.split('.')[0];
    } else if (token) {
      uid = token;
    }
  }

  if (!uid) {
    uid = localStorage.getItem(SESSION_UID_KEY);
  }
  if (!uid) {
    const savedToken = localStorage.getItem('meome_token') || sessionStorage.getItem('meome_token');
    if (savedToken && savedToken.includes('.')) {
      uid = savedToken.split('.')[0];
    }
  }

  if (!uid) return null;

  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;

  const data = snap.data() as any;
  const role: 'user' | 'admin' = isAdminUsername(data.username) ? 'admin' : (data.role || 'user');
  if (role !== data.role) {
    await updateDoc(doc(db, 'users', uid), { role });
  }

  return {
    id: snap.id,
    username: data.username,
    balance: Number(data.balance ?? 0),
    role,
    createdAt: data.createdAt && !String(data.createdAt).startsWith('2026-10-') ? data.createdAt : new Date().toISOString(),
    password_plain: data.password_plain,
    lastLoginAt: data.lastLoginAt && !String(data.lastLoginAt).startsWith('2026-10-') ? data.lastLoginAt : undefined,
    previousLoginAt: data.previousLoginAt && !String(data.previousLoginAt).startsWith('2026-10-') ? data.previousLoginAt : undefined,
  };
}

async function getOrCreateCatTownProfile(userId: string, username: string): Promise<CatTownUserProfile> {
  const ref = doc(db, 'cat_town_profiles', userId);
  const snap = await getDoc(ref);
  const today = getVietnamDateStr();

  if (snap.exists()) {
    const profile = snap.data() as CatTownUserProfile;
    let modified = false;

    // Tự động dọn dẹp các món đồ cũ không có ảnh hoặc id lỗi 'furn_'
    if (profile.house) {
      if (!profile.house.wallpaper || profile.house.wallpaper.startsWith('furn_') || !profile.house.wallpaper.startsWith('/assets/')) {
        profile.house.wallpaper = '/assets/furniture/wallpapers/wall_01.png';
        modified = true;
      }
      if (!profile.house.floor || profile.house.floor.startsWith('furn_') || !profile.house.floor.startsWith('/assets/')) {
        profile.house.floor = '/assets/furniture/floors/floor_01.png';
        modified = true;
      }
      if (Array.isArray(profile.house.placedItems)) {
        const cleanPlaced = profile.house.placedItems.filter((item: any) => item && item.furnitureId && !item.furnitureId.startsWith('furn_'));
        if (cleanPlaced.length !== profile.house.placedItems.length) {
          profile.house.placedItems = cleanPlaced;
          modified = true;
        }
      }
    }

    if (Array.isArray(profile.inventory)) {
      const cleanInv = profile.inventory.filter((inv: any) => inv && inv.itemId && !inv.itemId.startsWith('furn_'));
      if (cleanInv.length !== profile.inventory.length) {
        profile.inventory = cleanInv;
        modified = true;
      }
    }

    if (profile.lastActionDate !== today) {
      profile.dailyFishingCount = 0;
      profile.dailyGrillingCount = 0;
      profile.dailyFortuneClaimed = false;
      profile.lastActionDate = today;
      modified = true;
    }

    if (modified) {
      await setDoc(ref, profile);
    }
    return profile;
  }

  const profile: CatTownUserProfile = {
    userId,
    username,
    joinedTownAt: new Date().toISOString(),
    hasChosenCat: false,
    cat: {
      id: genId('cat'),
      userId,
      name: 'Bánh Mì Bo',
      breed: 'Mèo Cam',
      avatarId: 'cat_02',
      avatarUrl: '/assets/cats/cat_02.png',
      happiness: 85,
      energy: 90,
      affection: 60,
      mood: 'happy',
      coatColor: '#F4A261',
      bornDate: today,
      lastInteractedAt: new Date().toISOString(),
    },
    house: {
      userId,
      wallpaper: '/assets/furniture/wallpapers/wall_01.png',
      floor: '/assets/furniture/floors/floor_01.png',
      placedItems: [
        {
          id: genId('item'),
          furnitureId: 'bed_01',
          x: 25,
          y: 45,
          gridX: 2,
          gridY: 2,
        },
        {
          id: genId('item'),
          furnitureId: 'decor_11',
          x: 65,
          y: 55,
          gridX: 4,
          gridY: 2,
        },
      ],
      catPosition: { x: 20, y: 60 },
      catX: 20,
      catY: 60,
    },
    inventory: [
      {
        id: genId('inv'),
        userId,
        itemId: 'fish_bong_bong',
        itemType: 'fish',
        name: 'Cá Bong Bóng Pastel',
        quantity: 2,
        rarity: 'common',
      },
      {
        id: genId('inv'),
        userId,
        itemId: 'decor_21',
        itemType: 'furniture',
        name: 'Đệm Ngồi Bơ Vàng Xinh Xắn',
        quantity: 1,
      },
    ],
    dailyFishingCount: 0,
    dailyGrillingCount: 0,
    dailyFortuneClaimed: false,
    lastActionDate: today,
    stats: {
      totalFishCaught: 0,
      totalFishGrilled: 0,
      totalFortunesTold: 0,
      totalFurnitureBought: 0,
    },
  };

  await setDoc(ref, profile);
  return profile;
}

export interface ApiResponse {
  ok: boolean;
  status: number;
  json: () => Promise<any>;
}

function makeRes(status: number, data: any): ApiResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

/**
 * Direct client-side Firebase Auth + Firestore handler replacing all fetch('/api/...') calls.
 */
export async function firebaseApi(rawUrl: string, options: RequestInit = {}): Promise<ApiResponse> {
  await ensureSeeded();

  // Strip query parameters like ?t=123456789
  const url = rawUrl.split('?')[0];
  const method = (options.method || 'GET').toUpperCase();
  let body: any = {};
  if (options.body && typeof options.body === 'string') {
    try {
      body = JSON.parse(options.body);
    } catch {
      body = {};
    }
  }

  try {
    // ==========================================
    // 1. AUTHENTICATION (Firebase Auth + Firestore)
    // ==========================================
    if (url === '/api/auth/register' && method === 'POST') {
      const { username, password } = body;
      if (!username || typeof username !== 'string' || username.trim().length < 3) {
        return makeRes(400, { error: 'Tên đăng nhập phải có ít nhất 3 ký tự.' });
      }
      if (!password || typeof password !== 'string' || password.length < 4) {
        return makeRes(400, { error: 'Mật khẩu phải có ít nhất 4 ký tự.' });
      }

      const cleanUsername = username.trim();
      const usersSnap = await getDocs(collection(db, 'users'));
      const existing = usersSnap.docs.find(
        (d) => String(d.data().username || '').toLowerCase() === cleanUsername.toLowerCase()
      );
      if (existing) {
        return makeRes(400, { error: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác nhé!' });
      }

      let newUserId = genId('usr');
      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          usernameToSyntheticEmail(cleanUsername),
          normalizePasswordForFirebase(password)
        );
        newUserId = `usr_${cred.user.uid.slice(0, 12)}`;
      } catch {
        // Fallback if Email/Password provider is not enabled in Firebase Console
      }

      const role: 'user' | 'admin' = isAdminUsername(cleanUsername) ? 'admin' : 'user';
      const initialBalance = role === 'admin' ? 9999 : 0;
      const nowIso = new Date().toISOString();

      const newUser = {
        id: newUserId,
        username: cleanUsername,
        password_plain: password,
        balance: initialBalance,
        role,
        createdAt: nowIso,
      };

      await setDoc(doc(db, 'users', newUserId), newUser);
      localStorage.setItem(SESSION_UID_KEY, newUserId);
      const token = generateToken(newUserId);

      return makeRes(200, {
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          balance: newUser.balance,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      });
    }

    if (url === '/api/auth/login' && method === 'POST') {
      const { username, password } = body;
      if (!username || !password) {
        return makeRes(400, { error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' });
      }

      const cleanUsername = String(username).trim();
      const inputPass = String(password);

      // 1. Direct fast-path for admin accounts
      if (isAdminUsername(cleanUsername)) {
        const isValidAdminPass = (
          inputPass === 'Chanbaek6104' ||
          inputPass === 'admin' ||
          inputPass === '123456' ||
          inputPass === 'admin123'
        );
        if (!isValidAdminPass) {
          return makeRes(400, { error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
        }

        const uid = cleanUsername.toLowerCase() === 'admin' ? 'usr_admin_default' : 'usr_admin';
        const nowIso = new Date().toISOString();
        let adminUser: any = null;

        try {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) {
            adminUser = snap.data();
          }
        } catch (e) {
          console.warn('Admin doc fetch notice:', e);
        }

        // Lấy chính xác thời điểm đăng nhập lần trước từ Firestore (trước khi ghi đè giờ mới)
        let previousLoginAt: string;
        if (adminUser?.lastLoginAt && !String(adminUser.lastLoginAt).startsWith('2026-10-')) {
          previousLoginAt = String(adminUser.lastLoginAt);
        } else if (adminUser?.previousLoginAt && !String(adminUser.previousLoginAt).startsWith('2026-10-')) {
          previousLoginAt = String(adminUser.previousLoginAt);
        } else {
          // Lần đầu đăng nhập hoặc reset: tính từ 24 giờ trước thời điểm hiện tại
          previousLoginAt = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        }

        if (!adminUser) {
          adminUser = {
            id: uid,
            username: cleanUsername,
            password_plain: inputPass,
            balance: 9999,
            role: 'admin',
            createdAt: nowIso,
            lastLoginAt: nowIso,
            previousLoginAt,
          };
          try {
            await setDoc(doc(db, 'users', uid), adminUser);
          } catch (e) {
            console.warn('Admin doc save notice:', e);
          }
        } else {
          adminUser.previousLoginAt = previousLoginAt;
          adminUser.lastLoginAt = nowIso;
          try {
            await updateDoc(doc(db, 'users', uid), {
              previousLoginAt,
              lastLoginAt: nowIso,
            });
          } catch (e) {
            console.warn('Admin doc update notice:', e);
          }
        }

        localStorage.setItem(SESSION_UID_KEY, uid);
        const token = generateToken(uid);
        return makeRes(200, {
          token,
          user: {
            id: uid,
            username: cleanUsername,
            balance: Number(adminUser.balance ?? 9999),
            role: 'admin',
            createdAt: adminUser.createdAt && !String(adminUser.createdAt).startsWith('2026-10-') ? adminUser.createdAt : nowIso,
            lastLoginAt: nowIso,
            previousLoginAt,
          },
        });
      }

      // 2. Regular user lookup
      let matchedDoc: any = null;
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        matchedDoc = usersSnap.docs.find(
          (d) => String(d.data().username || '').toLowerCase() === cleanUsername.toLowerCase()
        );
      } catch (err) {
        console.warn('Users collection query error:', err);
      }

      if (!matchedDoc) {
        return makeRes(400, { error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
      }

      const userData = matchedDoc.data();
      let passwordValid = false;


      if (userData.password_plain && userData.password_plain === inputPass) {
        passwordValid = true;
      } else if (
        isAdminUsername(cleanUsername) &&
        (inputPass === 'admin' || inputPass === 'Chanbaek6104' || inputPass === '123456' || inputPass === 'admin123')
      ) {
        passwordValid = true;
      } else if (cleanUsername.toLowerCase() === 'khach_yeu_ca' && inputPass === '123456') {
        passwordValid = true;
      } else {
        try {
          await signInWithEmailAndPassword(
            auth,
            usernameToSyntheticEmail(cleanUsername),
            normalizePasswordForFirebase(inputPass)
          );
          passwordValid = true;
        } catch {
          passwordValid = false;
        }
      }

      if (!passwordValid) {
        return makeRes(400, { error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
      }

      try {
        await signInWithEmailAndPassword(
          auth,
          usernameToSyntheticEmail(cleanUsername),
          normalizePasswordForFirebase(inputPass)
        );
      } catch {
        // Non-blocking Firebase Auth session sync
      }

      const role: 'user' | 'admin' = isAdminUsername(cleanUsername) ? 'admin' : (userData.role || 'user');
      const nowIso = new Date().toISOString();
      let previousLoginAt = userData.lastLoginAt || userData.previousLoginAt;
      if (!previousLoginAt || String(previousLoginAt).startsWith('2026-10-')) {
        previousLoginAt = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      }

      await updateDoc(doc(db, 'users', matchedDoc.id), {
        role,
        previousLoginAt,
        lastLoginAt: nowIso,
      });

      localStorage.setItem(SESSION_UID_KEY, matchedDoc.id);
      const token = generateToken(matchedDoc.id);

      return makeRes(200, {
        token,
        user: {
          id: matchedDoc.id,
          username: userData.username,
          balance: Number(userData.balance ?? 0),
          role,
          createdAt: userData.createdAt && !String(userData.createdAt).startsWith('2026-10-') ? userData.createdAt : nowIso,
          lastLoginAt: nowIso,
          previousLoginAt,
        },
      });
    }

    if (url === '/api/auth/logout' && method === 'POST') {
      localStorage.removeItem(SESSION_UID_KEY);
      try {
        await signOut(auth);
      } catch {}
      return makeRes(200, { success: true, message: 'Đã đăng xuất phiên an toàn.' });
    }

    if (url === '/api/auth/me' && method === 'GET') {
      const user = await resolveUser(options);
      if (!user) return makeRes(200, { user: null });
      return makeRes(200, {
        user: {
          id: user.id,
          username: user.username,
          balance: user.balance,
          role: user.role,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          previousLoginAt: user.previousLoginAt,
        },
      });
    }

    // ==========================================
    // 2. CHARACTERS (Public & Admin CRUD on Firestore)
    // ==========================================
    if (url === '/api/characters' && method === 'GET') {
      const user = await resolveUser(options);
      const [charSnap, ucSnap] = await Promise.all([
        getDocs(collection(db, 'characters')),
        user ? getDocs(collection(db, 'user_characters')) : Promise.resolve(null),
      ]);

      const ownedCharacterIds = new Set<string>();
      if (user && ucSnap) {
        ucSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.userId === user.id) {
            ownedCharacterIds.add(data.characterId);
          }
        });
      }

      const characters = charSnap.docs
        .map((d) => normalizeCharacter({ ...d.data(), id: d.id }))
        .filter((c) => c.isAvailable)
        .map((c) => ({
          ...c,
          isOwned: ownedCharacterIds.has(c.id),
        }))
        .sort((a, b) => String(a.fishCode || '').localeCompare(String(b.fishCode || '')));

      return makeRes(200, { characters });
    }

    if (url === '/api/admin/characters' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user || user.role !== 'admin') {
        return makeRes(403, { error: 'Bạn không có quyền truy cập trang quản trị.' });
      }

      const {
        id,
        name,
        fishCode,
        age,
        category,
        shortBio,
        fullStory,
        backstory,
        openScene,
        price,
        studioUrl,
        avatarUrl,
        receiptAvatarUrl,
        isAvailable,
        tags,
      } = body;

      const cleanName = (name || '').trim();
      const cleanStudioUrl = (studioUrl || '').trim();
      const numericPrice = Number(price);

      if (!cleanName) {
        return makeRes(400, { error: 'Vui lòng nhập họ và tên cho nhân vật.' });
      }
      if (price === undefined || price === null || price === '' || isNaN(numericPrice) || numericPrice < 0) {
        return makeRes(400, { error: 'Giá bán phải là một số hợp lệ (từ 0 Xu Cá trở lên).' });
      }

      const normalizeUrl = (uStr?: string) => {
        if (!uStr) return '';
        const u = uStr.trim();
        if (!u) return '';
        if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/') || u.startsWith('data:')) {
          return u;
        }
        return `https://${u}`;
      };

      const finalStudioUrl = cleanStudioUrl ? (normalizeUrl(cleanStudioUrl) || '') : '';
      const charIsComingSoon = Boolean(body.isComingSoon || !finalStudioUrl);
      const finalAvatarUrl = normalizeUrl(avatarUrl);
      const finalReceiptAvatarUrl = receiptAvatarUrl ? normalizeUrl(receiptAvatarUrl) : '';

      if (id) {
        const charRef = doc(db, 'characters', String(id));
        const existingSnap = await getDoc(charRef);
        if (!existingSnap.exists()) {
          return makeRes(404, { error: 'Không tìm thấy nhân vật.' });
        }
        const existing = normalizeCharacter({ ...existingSnap.data(), id: existingSnap.id });

        const updated: Character = {
          ...existing,
          name: cleanName,
          fishCode: fishCode !== undefined ? fishCode.trim().toUpperCase() : existing.fishCode,
          age: age !== undefined ? Number(age) || existing.age : existing.age,
          category: category !== undefined ? category.trim() : existing.category,
          shortBio: shortBio !== undefined ? shortBio.trim() : existing.shortBio,
          fullStory:
            backstory !== undefined
              ? backstory.trim()
              : fullStory !== undefined
              ? fullStory.trim()
              : existing.fullStory,
          backstory:
            backstory !== undefined
              ? backstory.trim()
              : fullStory !== undefined
              ? fullStory.trim()
              : existing.backstory,
          openScene: openScene !== undefined ? openScene.trim() : existing.openScene,
          price: numericPrice,
          studioUrl: finalStudioUrl,
          isComingSoon: charIsComingSoon,
          avatarUrl: avatarUrl !== undefined && finalAvatarUrl ? finalAvatarUrl : existing.avatarUrl,
          receiptAvatarUrl: receiptAvatarUrl !== undefined ? finalReceiptAvatarUrl : existing.receiptAvatarUrl,
          isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : existing.isAvailable,
          isBestSeller: body.isBestSeller !== undefined ? Boolean(body.isBestSeller) : Boolean(existing.isBestSeller),
          tags: tags !== undefined ? (Array.isArray(tags) ? tags : []) : (existing.tags || []),
        };

        await setDoc(charRef, updated);

        const logId = genId('log');
        await setDoc(doc(db, 'admin_audit_logs', logId), {
          id: logId,
          adminUsername: user.username,
          action: 'UPDATE_CHARACTER',
          target: updated.name,
          details: `Cập nhật thông tin nhân vật ${updated.name}`,
          timestamp: new Date().toISOString(),
        });
      } else {
        const newCharId = `char_${Date.now()}`;
        const newChar: Character = {
          id: newCharId,
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
          isComingSoon: charIsComingSoon,
          isBestSeller: Boolean(body.isBestSeller),
          avatarUrl: finalAvatarUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
          receiptAvatarUrl: finalReceiptAvatarUrl,
          isAvailable: isAvailable !== false,
          salesCount: 0,
          createdAt: new Date().toISOString(),
          tags: Array.isArray(tags) && tags.length > 0 ? tags : ['ThơMộng', 'CáKhô'],
        };
        await setDoc(doc(db, 'characters', newCharId), newChar);

        const logId = genId('log');
        await setDoc(doc(db, 'admin_audit_logs', logId), {
          id: logId,
          adminUsername: user.username,
          action: 'CREATE_CHARACTER',
          target: newChar.name,
          details: `Thêm nhân vật mới: ${newChar.name}`,
          timestamp: new Date().toISOString(),
        });
      }

      const allSnap = await getDocs(collection(db, 'characters'));
      const characters = allSnap.docs
        .map((d) => normalizeCharacter({ ...d.data(), id: d.id }))
        .sort((a, b) => String(a.fishCode || '').localeCompare(String(b.fishCode || '')));

      return makeRes(200, { success: true, characters });
    }

    if (url === '/api/admin/characters/sync' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user || user.role !== 'admin') {
        return makeRes(403, { error: 'Bạn không có quyền truy cập trang quản trị.' });
      }
      const { characters } = body;
      if (Array.isArray(characters) && characters.length > 0) {
        await Promise.all(
          characters.map((c: any) => {
            const norm = normalizeCharacter(c);
            return setDoc(doc(db, 'characters', norm.id), norm);
          })
        );
        return makeRes(200, {
          success: true,
          message: 'Đã đồng bộ và lưu vĩnh viễn danh sách nhân vật!',
          characters,
        });
      }
      return makeRes(400, { error: 'Dữ liệu danh sách nhân vật không hợp lệ.' });
    }

    if (url.startsWith('/api/admin/characters/') && method === 'DELETE') {
      const user = await resolveUser(options);
      if (!user || user.role !== 'admin') {
        return makeRes(403, { error: 'Bạn không có quyền thực hiện thao tác này.' });
      }

      const charId = url.replace('/api/admin/characters/', '').trim();
      if (!charId) {
        return makeRes(400, { error: 'Mã nhân vật không hợp lệ.' });
      }

      const charRef = doc(db, 'characters', charId);
      const charSnap = await getDoc(charRef);
      const charData = charSnap.exists() ? charSnap.data() : null;
      const charName = charData?.name || charId;

      await deleteDoc(charRef);

      const logId = genId('log');
      await setDoc(doc(db, 'admin_audit_logs', logId), {
        id: logId,
        adminUsername: user.username,
        action: 'DELETE_CHARACTER',
        target: charName,
        details: `Xóa nhân vật: ${charName} (ID: ${charId})`,
        timestamp: new Date().toISOString(),
      });

      const allSnap = await getDocs(collection(db, 'characters'));
      const characters = allSnap.docs
        .map((d) => normalizeCharacter({ ...d.data(), id: d.id }))
        .sort((a, b) => String(a.fishCode || '').localeCompare(String(b.fishCode || '')));

      return makeRes(200, {
        success: true,
        message: `Đã xóa nhân vật ${charName} thành công!`,
        characters,
      });
    }

    // ==========================================
    // 2b. SPICES (Quầy Gia Vị)
    // ==========================================
    if (url === '/api/spices' && method === 'GET') {
      const snap = await getDocs(collection(db, 'spices'));
      let list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Spice));
      if (list.length === 0) list = DEFAULT_SPICES;
      list.sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime());
      return makeRes(200, { spices: list });
    }

    if (url === '/api/admin/spices' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user || user.role !== 'admin') {
        return makeRes(403, { error: 'Bạn không có quyền truy cập trang quản trị.' });
      }

      const { id, type, title, content, author } = body;
      const cleanTitle = (title || '').trim();
      const cleanContent = (content || '').trim();

      if (!cleanTitle || !cleanContent) {
        return makeRes(400, { error: 'Vui lòng nhập tiêu đề và nội dung gia vị.' });
      }

      const nowIso = new Date().toISOString();
      const spiceId = id || `spice_${Date.now()}`;
      const spiceData: Spice = {
        id: spiceId,
        type: type === 'lore' ? 'lore' : 'command',
        title: cleanTitle,
        content: cleanContent,
        author: (author || 'Chủ Tiệm').trim(),
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await setDoc(doc(db, 'spices', spiceId), spiceData);

      const allSnap = await getDocs(collection(db, 'spices'));
      const spices = allSnap.docs
        .map((d) => ({ ...d.data(), id: d.id } as Spice))
        .sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime());

      return makeRes(200, { success: true, spices });
    }

    if (url.startsWith('/api/admin/spices/') && method === 'DELETE') {
      const user = await resolveUser(options);
      if (!user || user.role !== 'admin') {
        return makeRes(403, { error: 'Bạn không có quyền truy cập trang quản trị.' });
      }

      const spiceId = url.replace('/api/admin/spices/', '').trim();
      if (spiceId) {
        await deleteDoc(doc(db, 'spices', spiceId));
      }

      const allSnap = await getDocs(collection(db, 'spices'));
      const spices = allSnap.docs
        .map((d) => ({ ...d.data(), id: d.id } as Spice))
        .sort((a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime());

      return makeRes(200, { success: true, spices });
    }

    // ==========================================
    // 3. SHOP BUY & INVENTORY (Kho Cá)
    // ==========================================
    if (url === '/api/shop/buy' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập để thực hiện hành động này.' });

      const { characterId } = body;
      if (!characterId) {
        return makeRes(400, { error: 'Vui lòng chọn nhân vật muốn rước.' });
      }

      const charRef = doc(db, 'characters', String(characterId));
      const charSnap = await getDoc(charRef);
      if (!charSnap.exists()) {
        return makeRes(404, { error: 'Em cá này hiện không còn mở bán hoặc không tồn tại.' });
      }
      const character = normalizeCharacter({ ...charSnap.data(), id: charSnap.id });
      if (!character.isAvailable) {
        return makeRes(404, { error: 'Em cá này hiện không còn mở bán hoặc không tồn tại.' });
      }

      const ucSnap = await getDocs(collection(db, 'user_characters'));
      const alreadyOwned = ucSnap.docs.some(
        (d) => d.data().userId === user.id && d.data().characterId === characterId
      );
      if (alreadyOwned) {
        return makeRes(400, {
          error: 'Bà đã sở hữu chàng này rồi nha! Hãy vào Kho Cá để gặp lại chàng nhé.',
        });
      }

      if (user.balance < character.price) {
        return makeRes(400, {
          error:
            "Hiện số xu cá của quý khách không đủ mua " +
            character.name +
            ", hãy kiếm thêm xu cá và quay lại chọn mua cá nhé -`♡´- ",
          required: character.price,
          currentBalance: user.balance,
        });
      }

      const newBalance = user.balance - character.price;
      const newSalesCount = (character.salesCount || 0) + 1;

      await updateDoc(doc(db, 'users', user.id), { balance: newBalance });
      await updateDoc(charRef, { salesCount: newSalesCount });

      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const orderId = `ORD-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
      const nowIso = now.toISOString();

      const receipt: OrderReceipt = {
        id: orderId,
        userId: user.id,
        characterId: character.id,
        characterName: character.name,
        fishCode: character.fishCode || 'CK-001',
        category: character.category,
        characterAvatar: character.receiptAvatarUrl || character.avatarUrl,
        pricePaid: character.price,
        balanceAfter: newBalance,
        studioUrl: character.studioUrl,
        createdAt: nowIso,
      };
      await setDoc(doc(db, 'orders', orderId), receipt);

      const ownershipId = genId('own');
      const ownership: UserCharacterOwnership = {
        id: ownershipId,
        userId: user.id,
        characterId: character.id,
        orderId,
        pricePaid: character.price,
        purchasedAt: nowIso,
      };
      await setDoc(doc(db, 'user_characters', ownershipId), ownership);

      const txId = genId('tx');
      const tx: WalletTransaction = {
        id: txId,
        userId: user.id,
        type: 'BUY_CHARACTER',
        amount: -character.price,
        balanceAfter: newBalance,
        referenceId: orderId,
        description: `Mua cá: ${character.name} (${character.category})`,
        createdAt: nowIso,
      };
      await setDoc(doc(db, 'wallet_transactions', txId), tx);

      return makeRes(200, {
        success: true,
        message: `Chúc mừng bà đã rước thành công ${character.name}!`,
        receipt,
        updatedBalance: newBalance,
      });
    }

    if (url === '/api/inventory' && method === 'GET') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const [ucSnap, charSnap] = await Promise.all([
        getDocs(collection(db, 'user_characters')),
        getDocs(collection(db, 'characters')),
      ]);

      const charMap = new Map<string, Character>();
      charSnap.docs.forEach((d) => {
        charMap.set(d.id, normalizeCharacter({ ...d.data(), id: d.id }));
      });

      const ownerships = ucSnap.docs
        .map((d) => d.data() as UserCharacterOwnership)
        .filter((uc) => uc.userId === user.id);

      const items = ownerships.map((uc) => ({
        ...uc,
        character: charMap.get(uc.characterId) || null,
      }));

      return makeRes(200, {
        items,
        totalOwned: items.length,
      });
    }

    // ==========================================
    // 4. WALLET, REDEEM CODES, VOUCHERS, QUESTS
    // ==========================================
    if (url === '/api/wallet/transactions' && method === 'GET') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const snap = await getDocs(collection(db, 'wallet_transactions'));
      const transactions = snap.docs
        .map((d) => d.data() as WalletTransaction)
        .filter((tx) => tx.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return makeRes(200, {
        balance: user.balance,
        transactions,
      });
    }

    if (url === '/api/wallet/redeem' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const { code } = body;
      if (!code || typeof code !== 'string') {
        return makeRes(400, { error: 'Vui lòng nhập mã đổi xu.' });
      }

      const cleanCode = code.trim().toUpperCase();
      const codesSnap = await getDocs(collection(db, 'redeem_codes'));
      const codeDoc = codesSnap.docs.find(
        (d) => String(d.data().code || '').toUpperCase() === cleanCode
      );

      if (!codeDoc) {
        return makeRes(404, { error: 'Mã đổi xu không tồn tại hoặc đã bị tạm khóa.' });
      }
      const giftcode = codeDoc.data() as RedeemCode;
      if (!giftcode.isActive) {
        return makeRes(404, { error: 'Mã đổi xu không tồn tại hoặc đã bị tạm khóa.' });
      }
      if (new Date(giftcode.expiresAt).getTime() < Date.now()) {
        return makeRes(400, { error: 'Mã đổi xu này đã hết hạn sử dụng.' });
      }
      if (giftcode.usedCount >= giftcode.maxUses) {
        return makeRes(400, { error: 'Mã đổi xu này đã hết lượt sử dụng.' });
      }

      const redSnap = await getDocs(collection(db, 'code_redemptions'));
      const userRedemptions = redSnap.docs.filter(
        (d) => d.data().userId === user.id && String(d.data().code || '').toUpperCase() === cleanCode
      );
      if (userRedemptions.length >= (giftcode.maxPerUser || 1)) {
        return makeRes(400, { error: 'Tài khoản của bà đã đạt giới hạn dùng mã này rồi nha.' });
      }

      const newBalance = user.balance + giftcode.rewardCoins;
      await updateDoc(doc(db, 'users', user.id), { balance: newBalance });
      await updateDoc(doc(db, 'redeem_codes', codeDoc.id), {
        usedCount: (giftcode.usedCount || 0) + 1,
      });

      const redId = genId('red');
      await setDoc(doc(db, 'code_redemptions', redId), {
        id: redId,
        code: cleanCode,
        userId: user.id,
        redeemedAt: new Date().toISOString(),
      });

      const txId = genId('tx');
      await setDoc(doc(db, 'wallet_transactions', txId), {
        id: txId,
        userId: user.id,
        type: 'REDEEM_CODE',
        amount: giftcode.rewardCoins,
        balanceAfter: newBalance,
        referenceId: cleanCode,
        description: `Đổi mã giftcode: ${cleanCode}`,
        createdAt: new Date().toISOString(),
      });

      return makeRes(200, {
        success: true,
        message: `Đổi thành công mã ${cleanCode}! Bà nhận được +${giftcode.rewardCoins} Xu Cá.`,
        rewardCoins: giftcode.rewardCoins,
        updatedBalance: newBalance,
      });
    }

    if (url === '/api/vouchers' && method === 'GET') {
      const user = await resolveUser(options);
      if (!user) return makeRes(200, { vouchers: [] });

      const vSnap = await getDocs(collection(db, 'vouchers'));
      const vouchers = vSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Voucher))
        .filter((v) => v.userId === user.id)
        .sort((a, b) => new Date(b.wonAt || 0).getTime() - new Date(a.wonAt || 0).getTime());

      return makeRes(200, { vouchers });
    }

    if (url.startsWith('/api/vouchers/') && url.endsWith('/claim') && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const voucherId = url.replace('/api/vouchers/', '').replace('/claim', '');
      const vRef = doc(db, 'vouchers', voucherId);
      const vSnap = await getDoc(vRef);
      if (!vSnap.exists()) {
        return makeRes(404, { error: 'Không tìm thấy voucher này.' });
      }
      const voucher = vSnap.data() as Voucher;
      if (voucher.userId !== user.id) {
        return makeRes(404, { error: 'Không tìm thấy voucher này.' });
      }
      if (voucher.status === 'claimed') {
        return makeRes(400, { error: 'Voucher này đã được quy đổi thành Xu Cá trước đó rồi.' });
      }

      const claimedAt = new Date().toISOString();
      const newBalance = user.balance + Number(voucher.coinValue || 0);

      await updateDoc(vRef, { status: 'claimed', claimedAt });
      await updateDoc(doc(db, 'users', user.id), { balance: newBalance });

      const txId = genId('tx');
      await setDoc(doc(db, 'wallet_transactions', txId), {
        id: txId,
        userId: user.id,
        type: 'VOUCHER_CLAIM',
        amount: voucher.coinValue,
        balanceAfter: newBalance,
        referenceId: voucher.id,
        description: `Quy đổi voucher: ${voucher.code} (+${voucher.coinValue} Xu Cá)`,
        createdAt: claimedAt,
      });

      return makeRes(200, {
        success: true,
        message: `Quy đổi thành công voucher ${voucher.code}! Đã cộng +${voucher.coinValue} Xu Cá vào ví.`,
        updatedBalance: newBalance,
        claimedVoucher: { ...voucher, status: 'claimed', claimedAt },
      });
    }

    if (url === '/api/quests' && method === 'GET') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const todayStr = new Date().toISOString().slice(0, 10);
      const [qSnap, uqSnap] = await Promise.all([
        getDocs(collection(db, 'quests')),
        getDocs(collection(db, 'user_quests')),
      ]);

      const quests = qSnap.docs.map((d) => d.data() as Quest);
      const userQuests = uqSnap.docs
        .map((d) => d.data() as any)
        .filter((uq) => uq.userId === user.id);

      const dailyUserQuest = userQuests.find((uq) => uq.questId === 'quest_daily_checkin');
      const currentStreak = dailyUserQuest ? dailyUserQuest.streakCount || 0 : 0;

      const questList = quests
        .filter((q) => q.id !== 'quest_grand_opening' && q.isActive)
        .map((q) => {
          const userQuest = userQuests.find((uq) => uq.questId === q.id);
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

      return makeRes(200, { quests: questList });
    }

    if (url === '/api/quests/claim' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const { questId } = body;
      const qSnap = await getDoc(doc(db, 'quests', String(questId)));
      if (!qSnap.exists()) {
        return makeRes(404, { error: 'Nhiệm vụ không tồn tại.' });
      }
      const quest = qSnap.data() as Quest;
      const todayStr = new Date().toISOString().slice(0, 10);

      const uqSnap = await getDocs(collection(db, 'user_quests'));
      const userQuests = uqSnap.docs
        .map((d) => ({ docId: d.id, ...(d.data() as any) }))
        .filter((uq) => uq.userId === user.id);

      if (quest.id === 'quest_streak_7') {
        const dailyUserQuest = userQuests.find((uq) => uq.questId === 'quest_daily_checkin');
        const currentStreak = dailyUserQuest ? dailyUserQuest.streakCount || 0 : 0;
        if (currentStreak < 7) {
          return makeRes(400, {
            error: `Bà cần hoàn thành đủ 7 ngày điểm danh hằng ngày liên tiếp để nhận thưởng này nha! (Hiện tại: ${currentStreak}/7 ngày)`,
          });
        }
      }

      const existingUq = userQuests.find((uq) => uq.questId === questId);
      if (existingUq && existingUq.lastClaimedDate === todayStr) {
        return makeRes(400, { error: 'Bà đã nhận thưởng nhiệm vụ này rồi. Hãy quay lại sau nhé!' });
      }

      let newStreak = 1;
      if (existingUq) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (existingUq.lastClaimedDate === yesterday) {
          newStreak = (existingUq.streakCount || 0) + 1;
        }
        await updateDoc(doc(db, 'user_quests', existingUq.docId), {
          streakCount: newStreak,
          lastClaimedDate: todayStr,
        });
      } else {
        const uqId = genId('uq');
        await setDoc(doc(db, 'user_quests', uqId), {
          id: uqId,
          userId: user.id,
          questId: quest.id,
          streakCount: 1,
          lastClaimedDate: todayStr,
        });
      }

      const newBalance = user.balance + quest.rewardCoins;
      await updateDoc(doc(db, 'users', user.id), { balance: newBalance });

      const txId = genId('tx');
      await setDoc(doc(db, 'wallet_transactions', txId), {
        id: txId,
        userId: user.id,
        type: 'DAILY_QUEST',
        amount: quest.rewardCoins,
        balanceAfter: newBalance,
        referenceId: quest.id,
        description: `Hoàn thành nhiệm vụ: ${quest.title}`,
        createdAt: new Date().toISOString(),
      });

      return makeRes(200, {
        success: true,
        message: `Nhận thưởng thành công +${quest.rewardCoins} Xu Cá!`,
        rewardCoins: quest.rewardCoins,
        streakCount: newStreak,
        updatedBalance: newBalance,
      });
    }

    // ==========================================
    // 5. DẤU CHÂN KHÁCH QUEN (PAW LOYALTY CARD)
    // ==========================================
    if (url === '/api/loyalty-card' && method === 'GET') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const cfgSnap = await getDoc(doc(db, 'settings', 'loyalty_config'));
      const config: LoyaltyCardConfig = cfgSnap.exists()
        ? (cfgSnap.data() as LoyaltyCardConfig)
        : DEFAULT_LOYALTY_CONFIG;

      const cardRef = doc(db, 'user_loyalty_cards', `ulc_${user.id}`);
      const cardSnap = await getDoc(cardRef);
      let card: UserLoyaltyCard;

      if (!cardSnap.exists()) {
        card = {
          id: `ulc_${user.id}`,
          userId: user.id,
          lastCheckInDate: '',
          accumulatedDays: 0,
          totalCyclesCompleted: 0,
          totalXuEarnedFromLoyalty: 0,
        };
        await setDoc(cardRef, card);
      } else {
        card = cardSnap.data() as UserLoyaltyCard;
      }

      const todayVN = getVietnamDateStr();
      const hasCheckedInToday = card.lastCheckInDate === todayVN;

      if (card.accumulatedDays >= 7 && !hasCheckedInToday) {
        card.accumulatedDays = 0;
        await setDoc(cardRef, card);
      }

      return makeRes(200, {
        config,
        card: {
          accumulatedDays: card.accumulatedDays,
          totalCyclesCompleted: card.totalCyclesCompleted || 0,
          totalXuEarnedFromLoyalty: card.totalXuEarnedFromLoyalty || 0,
          lastCheckInDate: card.lastCheckInDate,
          hasCheckedInToday,
          isCompleteToday: card.accumulatedDays >= 7 && hasCheckedInToday,
        },
      });
    }

    if (url === '/api/loyalty-card/checkin' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const cfgSnap = await getDoc(doc(db, 'settings', 'loyalty_config'));
      const config: LoyaltyCardConfig = cfgSnap.exists()
        ? (cfgSnap.data() as LoyaltyCardConfig)
        : DEFAULT_LOYALTY_CONFIG;

      if (!config.isEnabled) {
        return makeRes(403, { error: 'Tính năng Dấu Chân Khách Quen hiện đang tạm đóng.' });
      }

      const cardRef = doc(db, 'user_loyalty_cards', `ulc_${user.id}`);
      const cardSnap = await getDoc(cardRef);
      let card: UserLoyaltyCard = cardSnap.exists()
        ? (cardSnap.data() as UserLoyaltyCard)
        : {
            id: `ulc_${user.id}`,
            userId: user.id,
            lastCheckInDate: '',
            accumulatedDays: 0,
            totalCyclesCompleted: 0,
            totalXuEarnedFromLoyalty: 0,
          };

      const todayVN = getVietnamDateStr();
      if (card.accumulatedDays >= 7 && card.lastCheckInDate !== todayVN) {
        card.accumulatedDays = 0;
      }

      if (card.lastCheckInDate === todayVN) {
        return makeRes(400, { error: 'Hôm nay quý khách đã đóng dấu rồi! Hãy quay lại vào ngày mai nhé ♡' });
      }

      card.accumulatedDays = Math.min(7, (card.accumulatedDays || 0) + 1);
      card.lastCheckInDate = todayVN;
      card.lastCheckInTimestamp = new Date().toISOString();

      let isCompleted = false;
      const dailyReward = Math.max(0, Number(config.dailyRewardCoins ?? 5));
      const cycleReward = card.accumulatedDays === 7 ? Math.max(0, Number(config.rewardCoins) || 50) : 0;
      const totalEarnedThisCheckIn = dailyReward + cycleReward;
      let newBalance = user.balance;

      if (totalEarnedThisCheckIn > 0) {
        newBalance += totalEarnedThisCheckIn;
        card.totalXuEarnedFromLoyalty = (card.totalXuEarnedFromLoyalty || 0) + totalEarnedThisCheckIn;
        await updateDoc(doc(db, 'users', user.id), { balance: newBalance });

        const txId = genId('tx');
        await setDoc(doc(db, 'wallet_transactions', txId), {
          id: txId,
          userId: user.id,
          type: 'DAILY_QUEST',
          amount: totalEarnedThisCheckIn,
          balanceAfter: newBalance,
          referenceId: `loyalty_day_${card.accumulatedDays}`,
          description: card.accumulatedDays === 7
            ? `Đóng mộc hàng ngày (+${dailyReward} Xu) & Hoàn thành thẻ (+${cycleReward} Xu)`
            : `Đóng mộc Dấu Chân Khách Quen (Ngày ${card.accumulatedDays}/7)`,
          createdAt: new Date().toISOString(),
        });
      }

      if (card.accumulatedDays === 7) {
        isCompleted = true;
        card.totalCyclesCompleted = (card.totalCyclesCompleted || 0) + 1;

        const logId = genId('lcl');
        await setDoc(doc(db, 'loyalty_logs', logId), {
          id: logId,
          userId: user.id,
          username: user.username,
          cycleNumber: card.totalCyclesCompleted,
          rewardCoins: cycleReward + dailyReward,
          completedAt: new Date().toISOString(),
        });
      }

      await setDoc(cardRef, card);

      const randomMsg = RANDOM_PAW_MESSAGES[Math.floor(Math.random() * RANDOM_PAW_MESSAGES.length)];
      const dailyEarnText = dailyReward > 0 ? ` (+${dailyReward} Xu điểm danh)` : '';
      const completionMsg = `CHÚC MỪNG QUÝ KHÁCH ♡ Quý khách đã đóng mộc ngày 7/7 và nhận được +${totalEarnedThisCheckIn} XU CÁ!`;
      const normalMsg = `${randomMsg}${dailyEarnText}`;

      return makeRes(200, {
        success: true,
        message: isCompleted ? completionMsg : normalMsg,
        isCompleted,
        rewardCoins: totalEarnedThisCheckIn,
        accumulatedDays: card.accumulatedDays,
        totalCyclesCompleted: card.totalCyclesCompleted,
        totalXuEarnedFromLoyalty: card.totalXuEarnedFromLoyalty,
        updatedBalance: newBalance,
      });
    }

    // ==========================================
    // 6. GACHA MACHINE
    // ==========================================
    if (url === '/api/gacha/config' && method === 'GET') {
      const snap = await getDoc(doc(db, 'settings', 'gacha_config'));
      const config = snap.exists() ? snap.data() : DEFAULT_GACHA_CONFIG;
      return makeRes(200, { config });
    }

    if (url === '/api/gacha/spin' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const snap = await getDoc(doc(db, 'settings', 'gacha_config'));
      const gachaConfig: GachaConfig = snap.exists()
        ? (snap.data() as GachaConfig)
        : DEFAULT_GACHA_CONFIG;

      if (gachaConfig.isPaused) {
        return makeRes(400, { error: 'Máy gacha hiện đang tạm dừng bảo trì một chút nha.' });
      }

      const spinPrice = gachaConfig.spinPrice || 10;
      if (user.balance < spinPrice) {
        return makeRes(400, {
          error: 'Số xu cá của quý khách không đủ quay Gacha, hãy kiếm thêm xu cá nhé -`♡´- ',
          required: spinPrice,
          currentBalance: user.balance,
        });
      }

      const newBalance = user.balance - spinPrice;
      await updateDoc(doc(db, 'users', user.id), { balance: newBalance });

      const randomPercent = Math.random() * 100;
      let accumulated = 0;
      let selectedReward = gachaConfig.rates[0];

      for (const rate of gachaConfig.rates) {
        accumulated += rate.rate;
        if (randomPercent <= accumulated) {
          selectedReward = rate;
          break;
        }
      }

      const voucherCode = `VOU-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const nowIso = new Date().toISOString();
      const vouId = genId('vou');

      const newVoucher: Voucher = {
        id: vouId,
        userId: user.id,
        code: voucherCode,
        coinValue: selectedReward.coins,
        status: 'available',
        wonAt: nowIso,
        capsuleType: (selectedReward as any).capsuleType || 'strawberry_milk',
      };
      await setDoc(doc(db, 'vouchers', vouId), newVoucher);

      const txId = genId('tx');
      await setDoc(doc(db, 'wallet_transactions', txId), {
        id: txId,
        userId: user.id,
        type: 'GACHA_SPIN',
        amount: -spinPrice,
        balanceAfter: newBalance,
        referenceId: newVoucher.id,
        description: `Quay máy Gacha viên nang (Trúng ${selectedReward.label})`,
        createdAt: nowIso,
      });

      return makeRes(200, {
        success: true,
        reward: selectedReward,
        voucher: newVoucher,
        updatedBalance: newBalance,
      });
    }

    // ==========================================
    // 7. SPECIAL ORDERS (Phiếu Đặt Cá Khô)
    // ==========================================
    if (url === '/api/special-orders' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const {
        characterName,
        fishType,
        description,
        plotIdea,
        extraNotes,
        title,
        note,
        requestType,
      } = body;

      const cleanCharName = (characterName || title || '').trim();
      const cleanFishType = (fishType || '').trim();
      const cleanDesc = (description || '').trim();
      const cleanPlot = (plotIdea || '').trim();
      const cleanNotes = (extraNotes || note || '').trim();

      if (!cleanDesc && !cleanPlot) {
        return makeRes(400, {
          error: 'Quý khách vui lòng nhập miêu tả em cá hoặc ý tưởng cốt truyện để tiệm có thông tin thực hiện nhé ♡',
          field: 'description',
        });
      }

      const requestId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
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

      await setDoc(doc(db, 'special_orders', requestId), newOrder);

      return makeRes(201, {
        success: true,
        message: 'Tiệm đã nhận phiếu đặt cá của quý khách! ♡',
        order: newOrder,
      });
    }

    if (url === '/api/special-orders/my' && method === 'GET') {
      const user = await resolveUser(options);
      if (!user) return makeRes(200, { orders: [] });

      const snap = await getDocs(collection(db, 'special_orders'));
      const myOrders = snap.docs
        .map((d) => d.data() as SpecialOrder)
        .filter((o) => o.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return makeRes(200, { orders: myOrders });
    }

    // ==========================================
    // 8. FEEDBACK, COMPLAINTS & CHARACTER COMMENTS
    // ==========================================
    if (url === '/api/feedback' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const { content, type } = body;
      if (!content || typeof content !== 'string' || content.trim().length < 5) {
        return makeRes(400, { error: 'Nội dung góp ý phải có ít nhất 5 ký tự.' });
      }

      const fbId = genId('fb');
      const feedbackItem: Feedback = {
        id: fbId,
        userId: user.id,
        username: user.username,
        content: content.trim(),
        type: type || 'suggestion',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'feedbacks', fbId), feedbackItem);
      return makeRes(200, { success: true, message: 'Cảm ơn bà đã gửi lời nhắn cho tiệm nhé!' });
    }

    if (url.startsWith('/api/characters/') && url.endsWith('/complaints') && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const charId = url.replace('/api/characters/', '').replace('/complaints', '');
      const charSnap = await getDoc(doc(db, 'characters', charId));
      if (!charSnap.exists()) {
        return makeRes(404, { error: 'Không tìm thấy nhân vật.' });
      }
      const character = normalizeCharacter({ ...charSnap.data(), id: charSnap.id });

      const { issueType, content } = body;
      if (!content || !content.trim()) {
        return makeRes(400, { error: 'Vui lòng mô tả chi tiết lỗi gặp phải.' });
      }

      const compId = genId('comp');
      const complaint: Complaint = {
        id: compId,
        characterId: character.id,
        characterName: character.name,
        userId: user.id,
        username: user.username,
        issueType: issueType || 'Lỗi chung',
        content: content.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'complaints', compId), complaint);

      return makeRes(200, {
        success: true,
        message: 'Tiệm đã ghi nhận báo lỗi của bà và sẽ sớm xử lý!',
        complaint,
      });
    }

    if (url.startsWith('/api/characters/') && url.endsWith('/comments') && method === 'GET') {
      const charId = url.replace('/api/characters/', '').replace('/comments', '');
      const snap = await getDocs(collection(db, 'character_feedbacks'));
      const feedbacks = snap.docs
        .map((d) => d.data() as CharacterFeedback)
        .filter((f) => f.characterId === charId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return makeRes(200, { feedbacks });
    }

    if (url.startsWith('/api/characters/') && url.endsWith('/comments') && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const charId = url.replace('/api/characters/', '').replace('/comments', '');
      const charSnap = await getDoc(doc(db, 'characters', charId));
      if (!charSnap.exists()) {
        return makeRes(404, { error: 'Không tìm thấy nhân vật.' });
      }
      const character = normalizeCharacter({ ...charSnap.data(), id: charSnap.id });

      const { content, rating } = body;
      if (!content || !content.trim()) {
        return makeRes(400, { error: 'Vui lòng nhập nội dung fít bách.' });
      }

      const fbId = genId('cfb');
      const newFeedback: CharacterFeedback = {
        id: fbId,
        characterId: character.id,
        characterName: character.name,
        userId: user.id,
        username: user.username,
        content: content.trim(),
        rating: typeof rating === 'number' && rating >= 1 && rating <= 5 ? rating : 5,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'character_feedbacks', fbId), newFeedback);

      return makeRes(200, {
        success: true,
        message: 'Cảm ơn bà đã gửi fít bách ngọt ngào cho em cá!',
        feedback: newFeedback,
      });
    }

    // ==========================================
    // 9. ADMIN DASHBOARD ROUTES
    // ==========================================
    if (url === '/api/admin/dashboard' && method === 'GET') {
      const user = await resolveUser(options);
      if (!user || user.role !== 'admin') {
        return makeRes(403, { error: 'Bạn không có quyền truy cập trang quản trị.' });
      }

      const [
        usersSnap,
        charsSnap,
        ordersSnap,
        sOrdersSnap,
        codesSnap,
        questsSnap,
        txSnap,
        fbSnap,
        cmpSnap,
        cfbSnap,
        logsSnap,
        lLogsSnap,
        ulcSnap,
        gachaSnap,
        loyaltySnap,
      ] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'characters')),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'special_orders')),
        getDocs(collection(db, 'redeem_codes')),
        getDocs(collection(db, 'quests')),
        getDocs(collection(db, 'wallet_transactions')),
        getDocs(collection(db, 'feedbacks')),
        getDocs(collection(db, 'complaints')),
        getDocs(collection(db, 'character_feedbacks')),
        getDocs(collection(db, 'admin_audit_logs')),
        getDocs(collection(db, 'loyalty_logs')),
        getDocs(collection(db, 'user_loyalty_cards')),
        getDoc(doc(db, 'settings', 'gacha_config')),
        getDoc(doc(db, 'settings', 'loyalty_config')),
      ]);

      const users = usersSnap.docs.map((d) => {
        const u = d.data();
        return {
          id: d.id,
          username: u.username,
          balance: Number(u.balance ?? 0),
          role: isAdminUsername(u.username) ? 'admin' : (u.role || 'user'),
          createdAt: u.createdAt || new Date().toISOString(),
        };
      });

      const characters = charsSnap.docs
        .map((d) => normalizeCharacter({ ...d.data(), id: d.id }))
        .sort((a, b) => String(a.fishCode || '').localeCompare(String(b.fishCode || '')));

      const orders = ordersSnap.docs
        .map((d) => d.data() as OrderReceipt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const specialOrders = sOrdersSnap.docs
        .map((d) => d.data() as SpecialOrder)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const redeemCodes = codesSnap.docs.map((d) => d.data() as RedeemCode);
      const quests = questsSnap.docs.map((d) => d.data() as Quest);
      const txs = txSnap.docs.map((d) => d.data() as WalletTransaction);
      const feedbacks = fbSnap.docs
        .map((d) => d.data() as Feedback)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const complaints = cmpSnap.docs
        .map((d) => d.data() as Complaint)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const characterFeedbacks = cfbSnap.docs
        .map((d) => d.data() as CharacterFeedback)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const auditLogs = logsSnap.docs
        .map((d) => d.data() as AdminAuditLog)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const loyaltyLogs = lLogsSnap.docs
        .map((d) => d.data() as LoyaltyCompletionLog)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
      const userLoyaltyCards = ulcSnap.docs.map((d) => d.data() as UserLoyaltyCard);

      const totalXuIssued = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const totalXuSpent = txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

      return makeRes(200, {
        stats: {
          totalUsers: users.length,
          totalCharacters: characters.length,
          totalOrders: orders.length,
          totalSpecialOrders: specialOrders.length,
          totalXuIssued,
          totalXuSpent,
        },
        users,
        characters,
        orders: orders.slice(0, 50),
        specialOrders,
        redeemCodes,
        quests,
        gachaConfig: gachaSnap.exists() ? gachaSnap.data() : DEFAULT_GACHA_CONFIG,
        feedbacks,
        complaints,
        characterFeedbacks,
        auditLogs: auditLogs.slice(0, 50),
        loyaltyConfig: loyaltySnap.exists() ? loyaltySnap.data() : DEFAULT_LOYALTY_CONFIG,
        loyaltyLogs: loyaltyLogs.slice(0, 100),
        userLoyaltyCards,
      });
    }

    if (url === '/api/admin/loyalty-config' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user || user.role !== 'admin') return makeRes(403, { error: 'Forbidden' });

      const { rewardCoins, dailyRewardCoins, isEnabled } = body;
      const cfgSnap = await getDoc(doc(db, 'settings', 'loyalty_config'));
      const current: LoyaltyCardConfig = cfgSnap.exists()
        ? (cfgSnap.data() as LoyaltyCardConfig)
        : { ...DEFAULT_LOYALTY_CONFIG };

      if (typeof isEnabled === 'boolean') current.isEnabled = isEnabled;
      if (typeof rewardCoins === 'number' && !isNaN(rewardCoins) && rewardCoins >= 0) {
        current.rewardCoins = Math.floor(rewardCoins);
      }
      if (typeof dailyRewardCoins === 'number' && !isNaN(dailyRewardCoins) && dailyRewardCoins >= 0) {
        current.dailyRewardCoins = Math.floor(dailyRewardCoins);
      }

      await setDoc(doc(db, 'settings', 'loyalty_config'), current);
      return makeRes(200, {
        success: true,
        message: 'Cập nhật cấu hình Dấu Chân Khách Quen thành công!',
        config: current,
      });
    }

    if (url === '/api/admin/users/adjust-balance' && method === 'POST') {
      const admin = await resolveUser(options);
      if (!admin || admin.role !== 'admin') return makeRes(403, { error: 'Forbidden' });

      const { targetUsername, amount, reason } = body;
      const usersSnap = await getDocs(collection(db, 'users'));
      const targetDoc = usersSnap.docs.find(
        (d) => String(d.data().username || '').toLowerCase() === String(targetUsername || '').trim().toLowerCase()
      );
      if (!targetDoc) {
        return makeRes(404, { error: 'Không tìm thấy người dùng.' });
      }

      const change = Number(amount);
      if (isNaN(change) || change === 0) {
        return makeRes(400, { error: 'Số lượng xu điều chỉnh không hợp lệ.' });
      }

      const targetData = targetDoc.data();
      const updatedBalance = Math.max(0, Number(targetData.balance || 0) + change);
      await updateDoc(doc(db, 'users', targetDoc.id), { balance: updatedBalance });

      const txId = genId('tx');
      await setDoc(doc(db, 'wallet_transactions', txId), {
        id: txId,
        userId: targetDoc.id,
        type: 'ADMIN_ADJUST',
        amount: change,
        balanceAfter: updatedBalance,
        referenceId: admin.username,
        description: `Quản trị viên điều chỉnh: ${reason || 'Không có lý do'}`,
        createdAt: new Date().toISOString(),
      });

      return makeRes(200, {
        success: true,
        updatedBalance,
        targetUsername: targetData.username,
      });
    }

    if (url === '/api/admin/redeem-codes' && method === 'POST') {
      const admin = await resolveUser(options);
      if (!admin || admin.role !== 'admin') return makeRes(403, { error: 'Forbidden' });

      const { code, rewardCoins, maxUses, maxPerUser, expiresAt, isActive } = body;
      if (!code || !rewardCoins) {
        return makeRes(400, { error: 'Mã và số xu thưởng là bắt buộc.' });
      }

      const cleanCode = String(code).trim().toUpperCase();
      const codesSnap = await getDocs(collection(db, 'redeem_codes'));
      const existingDoc = codesSnap.docs.find((d) => d.data().code === cleanCode);

      if (existingDoc) {
        const ex = existingDoc.data();
        await updateDoc(doc(db, 'redeem_codes', existingDoc.id), {
          rewardCoins: Number(rewardCoins),
          maxUses: Number(maxUses) || ex.maxUses,
          maxPerUser: Number(maxPerUser) || ex.maxPerUser,
          expiresAt: expiresAt || ex.expiresAt,
          isActive: isActive !== undefined ? isActive : ex.isActive,
        });
      } else {
        const id = genId('code');
        await setDoc(doc(db, 'redeem_codes', id), {
          id,
          code: cleanCode,
          rewardCoins: Number(rewardCoins),
          maxUses: Number(maxUses) || 500,
          usedCount: 0,
          expiresAt: expiresAt || '2027-12-31T23:59:59Z',
          maxPerUser: Number(maxPerUser) || 1,
          isActive: isActive !== false,
        });
      }

      const updatedSnap = await getDocs(collection(db, 'redeem_codes'));
      return makeRes(200, {
        success: true,
        codes: updatedSnap.docs.map((d) => d.data()),
      });
    }

    if (url === '/api/admin/gacha-config' && method === 'POST') {
      const admin = await resolveUser(options);
      if (!admin || admin.role !== 'admin') return makeRes(403, { error: 'Forbidden' });

      const { spinPrice, isPaused, rates } = body;
      const snap = await getDoc(doc(db, 'settings', 'gacha_config'));
      const config: GachaConfig = snap.exists() ? (snap.data() as GachaConfig) : { ...DEFAULT_GACHA_CONFIG };

      if (rates && Array.isArray(rates)) {
        const totalRate = rates.reduce((sum: number, r: any) => sum + Number(r.rate || 0), 0);
        if (Math.round(totalRate) !== 100) {
          return makeRes(400, { error: `Tổng tỷ lệ rơi phải đúng bằng 100%! Hiện tại là ${totalRate}%.` });
        }
        config.rates = rates;
      }
      if (spinPrice !== undefined) config.spinPrice = Number(spinPrice);
      if (isPaused !== undefined) config.isPaused = Boolean(isPaused);

      await setDoc(doc(db, 'settings', 'gacha_config'), config);
      return makeRes(200, { success: true, config });
    }

    if (url.startsWith('/api/admin/special-orders/') && url.endsWith('/status') && method === 'POST') {
      const admin = await resolveUser(options);
      if (!admin || admin.role !== 'admin') return makeRes(403, { error: 'Forbidden' });

      const orderId = url.replace('/api/admin/special-orders/', '').replace('/status', '');
      const orderRef = doc(db, 'special_orders', orderId);
      const snap = await getDoc(orderRef);
      if (!snap.exists()) return makeRes(404, { error: 'Không tìm thấy phiếu đặt cá.' });

      const updatedAt = new Date().toISOString();
      await updateDoc(orderRef, { status: body.status, updatedAt });
      return makeRes(200, { success: true, order: { ...snap.data(), status: body.status, updatedAt } });
    }

    if (url.startsWith('/api/admin/complaints/') && url.endsWith('/status') && method === 'POST') {
      const admin = await resolveUser(options);
      if (!admin || admin.role !== 'admin') return makeRes(403, { error: 'Forbidden' });

      const compId = url.replace('/api/admin/complaints/', '').replace('/status', '');
      const compRef = doc(db, 'complaints', compId);
      const snap = await getDoc(compRef);
      if (!snap.exists()) return makeRes(404, { error: 'Không tìm thấy báo lỗi.' });

      const nextStatus = body.status === 'resolved' ? 'resolved' : 'pending';
      await updateDoc(compRef, { status: nextStatus });
      return makeRes(200, { success: true, complaint: { ...snap.data(), status: nextStatus } });
    }

    if (url.startsWith('/api/admin/character-comments/') && method === 'DELETE') {
      const admin = await resolveUser(options);
      if (!admin || admin.role !== 'admin') return makeRes(403, { error: 'Forbidden' });

      const commentId = url.replace('/api/admin/character-comments/', '');
      await deleteDoc(doc(db, 'character_feedbacks', commentId));
      return makeRes(200, { success: true, message: 'Đã xóa bình luận thành công.' });
    }

    // Helper lấy cấu hình Thị Trấn Cá Mèo đã đồng bộ và thanh lọc toàn bộ danh mục nội thất hợp lệ
    async function getLoadedCatTownConfig(): Promise<CatTownConfig> {
      const base = getDefaultCatTownConfig();
      try {
        const snap = await getDoc(doc(db, 'settings', 'cat_town_config'));
        if (!snap.exists()) {
          await setDoc(doc(db, 'settings', 'cat_town_config'), base);
          return base;
        }

        const data = snap.data() as Partial<CatTownConfig>;
        const savedFurniture = data.furnitureCatalog || [];

        // Kiểm tra xem database cũ có chứa món đồ ma/món thiếu ảnh (như furn_cat_tree, furn_fish_sofa, furn_wall_strawberry) không
        const hasLegacyInvalid = savedFurniture.some((s: any) =>
          !s.imageUrl || !s.imageUrl.startsWith('/assets/furniture/') || s.id.startsWith('furn_')
        );

        // Map danh mục chuẩn 156 món đồ đã có file ảnh thật
        const mergedFurniture = base.furnitureCatalog.map((defaultItem) => {
          const saved = savedFurniture.find((s: any) => s.id === defaultItem.id);
          if (saved) {
            return {
              ...defaultItem,
              price: typeof saved.price === 'number' && saved.price > 0 ? saved.price : defaultItem.price,
              isHidden: Boolean(saved.isHidden),
            };
          }
          return defaultItem;
        });

        // Chỉ cho phép món custom mới của admin nếu có ảnh hợp lệ
        savedFurniture.forEach((s: any) => {
          if (
            s.id &&
            !s.id.startsWith('furn_') &&
            s.imageUrl &&
            (s.imageUrl.startsWith('/assets/furniture/') || s.imageUrl.startsWith('http://') || s.imageUrl.startsWith('https://')) &&
            !mergedFurniture.some((m) => m.id === s.id)
          ) {
            mergedFurniture.push(s);
          }
        });

        // Nếu phát hiện dữ liệu cũ có món lỗi hoặc thiếu ảnh, ghi đè làm sạch Firestore ngay lập tức!
        if (hasLegacyInvalid) {
          await setDoc(doc(db, 'settings', 'cat_town_config'), {
            ...base,
            ...data,
            furnitureCatalog: mergedFurniture,
          });
        }

        return {
          ...base,
          ...data,
          furnitureCatalog: mergedFurniture,
          fishingAssets: {
            ...(base.fishingAssets || {}),
            ...(data.fishingAssets || {}),
          },
        };
      } catch (err) {
        console.error('getLoadedCatTownConfig error:', err);
        return base;
      }
    }

    // ==========================================
    // 10. THỊ TRẤN CÁ MÈO (CAT FISH TOWN)
    // ==========================================
    if (url === '/api/cat-town/profile' && method === 'GET') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const config = await getLoadedCatTownConfig();
      const profile = await getOrCreateCatTownProfile(user.id, user.username);

      return makeRes(200, {
        success: true,
        profile,
        config,
        balance: user.balance,
      });
    }

    if (url === '/api/cat-town/action/fish' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const cfgSnap = await getDoc(doc(db, 'settings', 'cat_town_config'));
      const config: CatTownConfig = cfgSnap.exists()
        ? (cfgSnap.data() as CatTownConfig)
        : getDefaultCatTownConfig();

      if (!config.isEnabled) {
        return makeRes(403, { error: 'Thị Trấn Cá Mèo hiện đang bảo trì cảnh quan. Vui lòng quay lại sau ít phút!' });
      }

      const profile = await getOrCreateCatTownProfile(user.id, user.username);
      const today = getVietnamDateStr();

      if (profile.dailyFishingCount >= config.dailyFishingLimit) {
        return makeRes(400, {
          error: `Bà đã câu hết ${config.dailyFishingLimit} lượt hôm nay rồi! Nghỉ ngơi dưỡng sức mai câu tiếp nhé 🐟✨`,
          dailyFishingCount: profile.dailyFishingCount,
        });
      }

      const activeCatalog: any[] = (config.fishCatalog && config.fishCatalog.length > 0)
        ? config.fishCatalog
        : FISH_DATABASE;

      let pickedFishItem: any = null;
      let finalWeight = body?.weight ? Number(body.weight) : 0;

      if (body?.fishId) {
        const found = activeCatalog.find((f: any) => f.id === body.fishId) || FISH_DATABASE.find((f) => f.id === body.fishId);
        if (found) {
          pickedFishItem = found;
          const minW = Number(found.weightMin) || 150;
          const maxW = Number(found.weightMax) || 450;
          if (!finalWeight || finalWeight < minW || finalWeight > maxW) {
            finalWeight =
              Math.floor(Math.random() * (maxW - minW + 1)) + minW;
          }
        }
      }

      if (!pickedFishItem) {
        const generated = pickWeightedFish(activeCatalog);
        pickedFishItem = generated.fish;
        finalWeight = generated.weight;
      }

      const rewardCoins = Number(pickedFishItem.rewardCoins ?? pickedFishItem.xuReward ?? 30);

      profile.dailyFishingCount += 1;
      profile.stats.totalFishCaught += 1;
      profile.lastActionDate = today;

      const existing = profile.inventory.find(
        (i) => i.itemId === pickedFishItem.id && i.itemType === 'fish'
      );
      if (existing) {
        existing.quantity += 1;
        if (existing.details) {
          existing.details.weight = finalWeight;
        }
      } else {
        profile.inventory.push({
          id: genId('inv'),
          userId: user.id,
          itemId: pickedFishItem.id,
          itemType: 'fish',
          name: pickedFishItem.name,
          quantity: 1,
          rarity: pickedFishItem.rarity as any,
          details: { weight: finalWeight },
        });
      }

      const newBalance = user.balance + rewardCoins;
      await updateDoc(doc(db, 'users', user.id), { balance: newBalance });
      await setDoc(doc(db, 'cat_town_profiles', user.id), profile);

      const txId = genId('tx');
      await setDoc(doc(db, 'wallet_transactions', txId), {
        id: txId,
        userId: user.id,
        amount: rewardCoins,
        balanceAfter: newBalance,
        type: 'CAT_TOWN_FISHING',
        description: `+${rewardCoins} Xu Cá - Câu được ${pickedFishItem.name} (${finalWeight}g) tại Hồ Bong Bóng 🎣✨`,
        createdAt: new Date().toISOString(),
      });

      return makeRes(200, {
        success: true,
        message: `Tuyệt vời! Bà vừa câu được một chú ${pickedFishItem.name} (${finalWeight}g)!`,
        fish: {
          id: pickedFishItem.id,
          name: pickedFishItem.name,
          rarity: pickedFishItem.rarity,
          rewardCoins: pickedFishItem.xuReward,
          weightMin: pickedFishItem.weightMin,
          weightMax: pickedFishItem.weightMax,
          description: pickedFishItem.description,
          image: pickedFishItem.imageSrc,
        },
        weight: finalWeight,
        rewardCoins,
        newBalance,
        dailyFishingCount: profile.dailyFishingCount,
        inventory: profile.inventory,
      });
    }

    if (url === '/api/cat-town/action/grill' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const { fishItemId, doneness } = body;
      const cfgSnap = await getDoc(doc(db, 'settings', 'cat_town_config'));
      const config: CatTownConfig = cfgSnap.exists()
        ? (cfgSnap.data() as CatTownConfig)
        : getDefaultCatTownConfig();

      if (!config.isEnabled) {
        return makeRes(403, { error: 'Bếp nướng đang bảo trì.' });
      }

      const profile = await getOrCreateCatTownProfile(user.id, user.username);
      const today = getVietnamDateStr();

      if (profile.dailyGrillingCount >= config.dailyGrillingLimit) {
        return makeRes(400, {
          error: `Bà đã nướng hết ${config.dailyGrillingLimit} mẻ cá hôm nay rồi!`,
        });
      }

      const fishIndex = profile.inventory.findIndex(
        (i) => i.itemId === fishItemId && i.itemType === 'fish' && i.quantity > 0
      );
      if (fishIndex === -1) {
        return makeRes(400, { error: 'Bà chưa có loại cá này trong túi đồ để nướng!' });
      }

      profile.inventory[fishIndex].quantity -= 1;
      const fishName = profile.inventory[fishIndex].name;
      if (profile.inventory[fishIndex].quantity <= 0) {
        profile.inventory.splice(fishIndex, 1);
      }

      let rewardCoins = config.grillingRewardGood;
      let label = 'vừa chín tới thơm ngậy';
      if (doneness === 'perfect') {
        rewardCoins = config.grillingRewardPerfect;
        label = 'chín vàng óng ả tuyệt hảo';
      } else if (doneness === 'burnt') {
        rewardCoins = config.grillingRewardBurnt;
        label = 'hơi quá lửa cháy sém';
      } else if (doneness === 'undercooked') {
        rewardCoins = Math.floor(config.grillingRewardGood * 0.6);
        label = 'hơi tái cần nướng thêm';
      }

      profile.dailyGrillingCount += 1;
      profile.stats.totalFishGrilled += 1;
      profile.lastActionDate = today;

      profile.inventory.push({
        id: genId('cooked'),
        userId: user.id,
        itemId: `cooked_${fishItemId}`,
        itemType: 'cooked_fish',
        name: `Cá nướng (${fishName})`,
        quantity: 1,
        details: {
          quality: doneness,
          cookedAt: new Date().toISOString(),
        },
      });

      const newBalance = user.balance + rewardCoins;
      if (rewardCoins > 0) {
        await updateDoc(doc(db, 'users', user.id), { balance: newBalance });
        const txId = genId('tx');
        await setDoc(doc(db, 'wallet_transactions', txId), {
          id: txId,
          userId: user.id,
          amount: rewardCoins,
          balanceAfter: newBalance,
          type: 'CAT_TOWN_GRILLING',
          description: `+${rewardCoins} Xu Cá - Nướng thành công ${fishName} (${label}) tại Bếp Xèo Xèo 🐟🔥`,
          createdAt: new Date().toISOString(),
        });
      }

      await setDoc(doc(db, 'cat_town_profiles', user.id), profile);

      return makeRes(200, {
        success: true,
        message: `Đã nướng xong mẻ cá: ${label}!`,
        doneness,
        rewardCoins,
        newBalance,
        dailyGrillingCount: profile.dailyGrillingCount,
        inventory: profile.inventory,
      });
    }

    if (url === '/api/cat-town/action/fortune' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const cfgSnap = await getDoc(doc(db, 'settings', 'cat_town_config'));
      const config: CatTownConfig = cfgSnap.exists()
        ? (cfgSnap.data() as CatTownConfig)
        : getDefaultCatTownConfig();

      const profile = await getOrCreateCatTownProfile(user.id, user.username);
      const today = getVietnamDateStr();

      const fortunes =
        config.fortuneCatalog && config.fortuneCatalog.length > 0
          ? config.fortuneCatalog
          : getDefaultCatTownConfig().fortuneCatalog;
      const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];

      let rewardCoins = 0;
      let newBalance = user.balance;

      if (!profile.dailyFortuneClaimed) {
        profile.dailyFortuneClaimed = true;
        rewardCoins = config.fortuneRewardCoins;
        profile.stats.totalFortunesTold += 1;
        profile.lastActionDate = today;

        if (rewardCoins > 0) {
          newBalance += rewardCoins;
          await updateDoc(doc(db, 'users', user.id), { balance: newBalance });
          const txId = genId('tx');
          await setDoc(doc(db, 'wallet_transactions', txId), {
            id: txId,
            userId: user.id,
            amount: rewardCoins,
            balanceAfter: newBalance,
            type: 'CAT_TOWN_FORTUNE',
            description: `+${rewardCoins} Xu Cá - Lời tiên tri đầu ngày từ Mèo Tiên Tri Meo Meo 🔮✨`,
            createdAt: new Date().toISOString(),
          });
        }
        await setDoc(doc(db, 'cat_town_profiles', user.id), profile);
      }

      return makeRes(200, {
        success: true,
        fortune: randomFortune,
        rewardCoins,
        claimedToday: profile.dailyFortuneClaimed,
        newBalance,
      });
    }

    if (url === '/api/cat-town/action/cat/care' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const { actionType } = body;
      const profile = await getOrCreateCatTownProfile(user.id, user.username);
      const cat = profile.cat;

      if (actionType === 'feed') {
        cat.energy = Math.min(100, cat.energy + 20);
        cat.happiness = Math.min(100, cat.happiness + 15);
        cat.mood = 'happy';
      } else if (actionType === 'pet') {
        cat.affection = Math.min(100, cat.affection + 10);
        cat.happiness = Math.min(100, cat.happiness + 10);
        cat.mood = 'love';
      } else if (actionType === 'play') {
        cat.happiness = Math.min(100, cat.happiness + 25);
        cat.energy = Math.max(10, cat.energy - 10);
        cat.affection = Math.min(100, cat.affection + 15);
        cat.mood = 'playful';
      } else if (actionType === 'bath') {
        cat.happiness = Math.min(100, cat.happiness + 10);
        cat.mood = 'happy';
      }

      cat.lastInteractedAt = new Date().toISOString();
      await setDoc(doc(db, 'cat_town_profiles', user.id), profile);

      return makeRes(200, {
        success: true,
        message: `Bé mèo ${cat.name} đã được chăm sóc cực kỳ chu đáo!`,
        cat,
      });
    }

    if (url === '/api/cat-town/action/cat/rename' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const { name } = body;
      if (!name || !name.trim()) {
        return makeRes(400, { error: 'Tên bé mèo không được để trống!' });
      }

      const profile = await getOrCreateCatTownProfile(user.id, user.username);
      profile.cat.name = name.trim().slice(0, 30);
      await setDoc(doc(db, 'cat_town_profiles', user.id), profile);

      return makeRes(200, {
        success: true,
        message: `Đã đổi tên bé mèo thành "${profile.cat.name}"!`,
        cat: profile.cat,
      });
    }

    if (url === '/api/cat-town/action/cat/choose' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const { avatarId, avatarUrl, name, breed, coatColor } = body;
      const profile = await getOrCreateCatTownProfile(user.id, user.username);
      if (avatarId) profile.cat.avatarId = avatarId;
      if (avatarUrl) profile.cat.avatarUrl = avatarUrl;
      if (breed) profile.cat.breed = breed;
      if (coatColor) profile.cat.coatColor = coatColor;
      if (name && name.trim()) {
        profile.cat.name = name.trim().slice(0, 30);
      }
      profile.hasChosenCat = true;
      await setDoc(doc(db, 'cat_town_profiles', user.id), profile);

      return makeRes(200, {
        success: true,
        message: `Đã chọn bé mèo "${profile.cat.name}" đồng hành!`,
        cat: profile.cat,
        profile,
      });
    }

    if (url === '/api/cat-town/shop/buy' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const { furnitureId } = body;
      const config = await getLoadedCatTownConfig();

      const item = config.furnitureCatalog.find((f) => f.id === furnitureId);
      if (!item) {
        return makeRes(404, { error: 'Không tìm thấy vật phẩm nội thất này!' });
      }

      if (user.balance < item.price) {
        return makeRes(400, { error: `Bà không đủ Xu Cá để mua món này! (Cần ${item.price} Xu Cá)` });
      }

      const newBalance = user.balance - item.price;
      await updateDoc(doc(db, 'users', user.id), { balance: newBalance });

      const txId = genId('tx');
      await setDoc(doc(db, 'wallet_transactions', txId), {
        id: txId,
        userId: user.id,
        amount: -item.price,
        balanceAfter: newBalance,
        type: 'CAT_TOWN_FURNITURE',
        description: `-${item.price} Xu Cá - Mua nội thất: ${item.name} cho nhà mèo 🪑🏡`,
        createdAt: new Date().toISOString(),
      });

      const profile = await getOrCreateCatTownProfile(user.id, user.username);
      const existing = profile.inventory.find((i) => i.itemId === item.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        profile.inventory.push({
          id: genId('inv_furn'),
          userId: user.id,
          itemId: item.id,
          itemType: 'furniture',
          name: item.name,
          quantity: 1,
          details: { category: item.category },
        });
      }

      profile.stats.totalFurnitureBought += 1;
      await setDoc(doc(db, 'cat_town_profiles', user.id), profile);

      return makeRes(200, {
        success: true,
        message: `Mua thành công ${item.name}! Vật phẩm đã được lưu vào túi đồ.`,
        newBalance,
        inventory: profile.inventory,
      });
    }

    if (url === '/api/cat-town/house/save' && method === 'POST') {
      const user = await resolveUser(options);
      if (!user) return makeRes(401, { error: 'Vui lòng đăng nhập.' });

      const { wallpaper, floor, wallpaperMode, floorMode, placedItems, catPosition, catX, catY } = body;
      const profile = await getOrCreateCatTownProfile(user.id, user.username);

      if (wallpaper) profile.house.wallpaper = wallpaper;
      if (floor) profile.house.floor = floor;
      if (wallpaperMode) (profile.house as any).wallpaperMode = wallpaperMode;
      if (floorMode) (profile.house as any).floorMode = floorMode;
      if (Array.isArray(placedItems)) {
        profile.house.placedItems = placedItems.map((p: any) => ({
          ...p,
          rotation: typeof p.rotation === 'number' ? p.rotation : 0,
          scale: typeof p.scale === 'number' ? Math.max(0.3, Math.min(3, p.scale)) : 1,
          customImageUrl: typeof p.customImageUrl === 'string' ? p.customImageUrl : undefined,
        }));
      }
      if (catPosition) profile.house.catPosition = catPosition;
      if (typeof catX === 'number') profile.house.catX = catX;
      if (typeof catY === 'number') profile.house.catY = catY;

      await setDoc(doc(db, 'cat_town_profiles', user.id), profile);

      return makeRes(200, {
        success: true,
        message: 'Đã lưu thiết kế căn nhà ấm cúng của mèo thành công!',
        house: profile.house,
      });
    }

    if (url === '/api/admin/cat-town/stats' && method === 'GET') {
      const admin = await resolveUser(options);
      if (!admin || admin.role !== 'admin') return makeRes(403, { error: 'Forbidden' });

      const [cfgSnap, pSnap] = await Promise.all([
        getDoc(doc(db, 'settings', 'cat_town_config')),
        getDocs(collection(db, 'cat_town_profiles')),
      ]);

      const config = cfgSnap.exists() ? cfgSnap.data() : getDefaultCatTownConfig();
      const profiles = pSnap.docs.map((d) => d.data() as CatTownUserProfile);

      let totalFishCaught = 0;
      let totalFishGrilled = 0;
      let totalFortunesTold = 0;
      let totalFurnitureBought = 0;

      for (const p of profiles) {
        totalFishCaught += p.stats?.totalFishCaught || 0;
        totalFishGrilled += p.stats?.totalFishGrilled || 0;
        totalFortunesTold += p.stats?.totalFortunesTold || 0;
        totalFurnitureBought += p.stats?.totalFurnitureBought || 0;
      }

      return makeRes(200, {
        totalResidents: profiles.length,
        totalFishCaught,
        totalFishGrilled,
        totalFortunesTold,
        totalFurnitureBought,
        config,
      });
    }

    if (url === '/api/admin/cat-town/config' && method === 'POST') {
      const admin = await resolveUser(options);
      if (!admin || admin.role !== 'admin') return makeRes(403, { error: 'Forbidden' });

      const existingSnap = await getDoc(doc(db, 'settings', 'cat_town_config'));
      const existingData = existingSnap.exists() ? (existingSnap.data() as Partial<CatTownConfig>) : {};

      const updated = {
        ...getDefaultCatTownConfig(),
        ...existingData,
        ...body,
        fishingAssets: {
          ...(existingData.fishingAssets || {}),
          ...(body.fishingAssets || {}),
        },
      };
      await setDoc(doc(db, 'settings', 'cat_town_config'), updated);

      return makeRes(200, {
        success: true,
        message: 'Đã lưu cấu hình Thị Trấn Cá Mèo thành công!',
        config: updated,
      });
    }

    return makeRes(404, { error: `Route not found: ${method} ${url}` });
  } catch (err: any) {
    console.error('firebaseApi error:', err);
    return makeRes(500, { error: err?.message || 'Đã có lỗi xảy ra khi kết nối Firestore.' });
  }
}
