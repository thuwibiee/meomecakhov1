import { CatTownFishRarity } from '../../types';

export type FishRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface FishDatabaseItem {
  id: string;
  name: string;
  rarity: FishRarity;
  xuReward: number;
  dropRate: number; // Tỷ lệ phần trăm xuất hiện (Tổng các con cộng lại = 100)
  imageSrc: string; /* THAY LINK ẢNH PIXEL VÀO ĐÂY */
  weightMin: number;
  weightMax: number;
  description: string;
}

// BỂ CÁ (FISH_DATABASE): 11 loại cá độc đáo với đầy đủ các cấp độ hiếm
// Tỷ lệ xuất hiện: LEGENDARY (5%) + EPIC (12%) + RARE (25%) + COMMON (58%) = 100%
export const FISH_DATABASE: FishDatabaseItem[] = [
  {
    id: 'fish_07',
    name: 'Sò Ngọc Trai Cực Kì Hiếm',
    rarity: 'LEGENDARY',
    xuReward: 200, // NGỌC TRAI CỰC KÌ HIẾM (200 XU CÁ)
    dropRate: 2,
    imageSrc: '/assets/fishing/fish_07.png', /* THAY LINK ẢNH PIXEL VÀO ĐÂY */
    weightMin: 1500,
    weightMax: 3200,
    description: 'Báu vật linh thiêng dưới đáy Hồ Bong Bóng! Vỏ sò 7 sắc cầu vồng ngậm viên ngọc trai phát sáng rực rỡ.',
  },
  {
    id: 'fish_01',
    name: 'Cá Xiêm Hoa Anh Đào',
    rarity: 'LEGENDARY',
    xuReward: 160, // CÁ CỰC KÌ HIẾM
    dropRate: 3,
    imageSrc: '/assets/fishing/fish_01.png', /* THAY LINK ẢNH PIXEL VÀO ĐÂY */
    weightMin: 900,
    weightMax: 2100,
    description: 'Cá cực kì hiếm! Mang sắc hồng cánh sen ngọt ngào và đóa hoa anh đào cài vây kiêu sa.',
  },
  {
    id: 'fish_03',
    name: 'Cá Xiêm Lam Hoàng Kim',
    rarity: 'EPIC',
    xuReward: 100,
    dropRate: 6,
    imageSrc: '/assets/fishing/fish_03.png', /* THAY LINK ẢNH PIXEL VÀO ĐÂY */
    weightMin: 600,
    weightMax: 1300,
    description: 'Cá betta hoàng tộc, đuôi xòe tròn như vầng trăng rằm tỏa sắc vàng lam lộng lẫy.',
  },
  {
    id: 'fish_10',
    name: 'Cá Chép Nâu Đuôi Đỏ',
    rarity: 'EPIC',
    xuReward: 80,
    dropRate: 6,
    imageSrc: '/assets/fishing/fish_10.png', /* THAY LINK ẢNH PIXEL VÀO ĐÂY */
    weightMin: 520,
    weightMax: 1150,
    description: 'Cá chép cổ thụ mang dáng dấp dũng mãnh, vảy nâu gấm và đuôi đỏ uy nghi.',
  },
  {
    id: 'fish_02',
    name: 'Cá Vàng Ryukin Ánh Bạc',
    rarity: 'RARE',
    xuReward: 60, // CÁ HIẾM
    dropRate: 8,
    imageSrc: '/assets/fishing/fish_02.png', /* THAY LINK ẢNH PIXEL VÀO ĐÂY */
    weightMin: 400,
    weightMax: 850,
    description: 'Chú cá vàng Ryukin dáng tròn quý phái, vây đuôi ánh bạc lấp lánh dưới nắng.',
  },
  {
    id: 'fish_09',
    name: 'Cá Rô Phi Vây Cam',
    rarity: 'RARE',
    xuReward: 50,
    dropRate: 8,
    imageSrc: '/assets/fishing/fish_09.png', /* THAY LINK ẢNH PIXEL VÀO ĐÂY */
    weightMin: 310,
    weightMax: 720,
    description: 'Thân xanh ngọc bích phối vây cam rực lửa, loài cá nhanh nhẹn bậc nhất đầm nước.',
  },
  {
    id: 'fish_04',
    name: 'Cá Bướm Xanh Sọc Đen',
    rarity: 'RARE',
    xuReward: 50,
    dropRate: 9,
    imageSrc: '/assets/fishing/fish_04.png', /* THAY LINK ẢNH PIXEL VÀO ĐÂY */
    weightMin: 280,
    weightMax: 620,
    description: 'Họa tiết sọc đen trên nền ngọc lục bảo, viền vây vàng chanh tựa chú bướm rập rờn dưới nước.',
  },
  {
    id: 'fish_05',
    name: 'Cá Hồi Suối Xanh Rêu',
    rarity: 'COMMON',
    xuReward: 30,
    dropRate: 12,
    imageSrc: '/assets/fishing/fish_05.png', /* THAY LINK ẢNH PIXEL VÀO ĐÂY */
    weightMin: 200,
    weightMax: 480,
    description: 'Chú cá suối thân thuộc, đốm xanh rêu mát lành, thịt thơm ngọt rất hợp đem nướng.',
  },
  {
    id: 'fish_06',
    name: 'Cá Tròn Mắt To Đỏ Rực',
    rarity: 'COMMON',
    xuReward: 30,
    dropRate: 12,
    imageSrc: '/assets/fishing/fish_06.png', /* THAY LINK ẢNH PIXEL VÀO ĐÂY */
    weightMin: 180,
    weightMax: 420,
    description: 'Tròn ủng như quả cà chua đỏ, đôi mắt to ngơ ngác cực kỳ đáng yêu khi bị kéo lên bờ.',
  },
  {
    id: 'fish_08',
    name: 'Cá Bánh Mì Bơ Vàng',
    rarity: 'COMMON',
    xuReward: 30,
    dropRate: 12,
    imageSrc: '/assets/fishing/fish_08.png', /* THAY LINK ẢNH PIXEL VÀO ĐÂY */
    weightMin: 160,
    weightMax: 390,
    description: 'Mập mạp tròn xoe, màu vàng bơ thơm phức như vừa ra lò từ tiệm bánh mèo.',
  },
  {
    id: 'fish_11',
    name: 'Cá Bầu Trời Xanh Biển',
    rarity: 'COMMON',
    xuReward: 30,
    dropRate: 12,
    imageSrc: '/assets/fishing/fish_11.png', /* THAY LINK ẢNH PIXEL VÀO ĐÂY */
    weightMin: 170,
    weightMax: 410,
    description: 'Xanh trong vắt như bầu trời không một gợn mây, thích bơi theo đàn sát bờ nước.',
  },
];

// Hàm cấu hình màu sắc theo Rarity (Trắng -> Xanh -> Tím -> Vàng)
export function getRarityConfig(rarity: FishRarity | CatTownFishRarity | string) {
  const norm = String(rarity).toUpperCase();
  switch (norm) {
    case 'LEGENDARY':
      return {
        label: 'LEGENDARY',
        textColor: '#FBBF24', // Vàng rực rỡ
        bgBadge: '#78350F',
        borderColor: '#F59E0B',
        glowShadow: '0 0 10px rgba(245, 158, 11, 0.6)',
        nameColor: '#B45309',
        tagText: '★ HUYỀN THOẠI ★',
      };
    case 'EPIC':
      return {
        label: 'EPIC',
        textColor: '#C084FC', // Tím mộng mơ
        bgBadge: '#4C1D95',
        borderColor: '#A855F7',
        glowShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
        nameColor: '#6B21A8',
        tagText: '◆ SỬ THI ◆',
      };
    case 'RARE':
      return {
        label: 'RARE',
        textColor: '#60A5FA', // Xanh dương tươi sáng
        bgBadge: '#1E3A8A',
        borderColor: '#3B82F6',
        glowShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
        nameColor: '#1D4ED8',
        tagText: '▲ HIẾM ▲',
      };
    case 'COMMON':
    default:
      return {
        label: 'COMMON',
        textColor: '#FFFFFF', // Trắng
        bgBadge: '#4A3E3D',
        borderColor: '#795653',
        glowShadow: '0 0 4px rgba(255, 255, 255, 0.3)',
        nameColor: '#795653',
        tagText: '● THƯỜNG ●',
      };
  }
}

// Helper chuẩn hóa danh mục cá từ cấu hình Admin hoặc database
export function normalizeFishCatalog(catalog?: any[] | null): FishDatabaseItem[] {
  if (!catalog || !Array.isArray(catalog) || catalog.length === 0) {
    return FISH_DATABASE;
  }
  return catalog.map((item, idx) => ({
    id: item.id || `fish_${String(idx + 1).padStart(2, '0')}`,
    name: item.name || 'Cá Kỳ Lạ',
    rarity: (String(item.rarity || 'COMMON').toUpperCase() as FishRarity),
    xuReward: Number(item.rewardCoins ?? item.xuReward ?? 30),
    dropRate: Number(item.dropRate ?? 10),
    imageSrc: item.imageSrc || item.image || `/assets/fishing/${item.id || 'fish_01'}.png`,
    weightMin: Number(item.weightMin ?? 150),
    weightMax: Number(item.weightMax ?? 450),
    description: item.description || '',
  }));
}

/**
 * THUẬT TOÁN RANDOM CÁ (WEIGHTED RANDOM)
 * Lựa chọn cá dựa trên trọng số dropRate (tổng = 100%)
 * Có thể nhận danh mục cá động từ Admin Dashboard
 */
export function catchFish(customPool?: FishDatabaseItem[]): { fish: FishDatabaseItem; weight: number } {
  const pool = customPool && customPool.length > 0 ? customPool : FISH_DATABASE;
  const totalDropRate = pool.reduce((sum, f) => sum + (Number(f.dropRate) || 0), 0) || 100;
  const rand = Math.random() * totalDropRate;
  let cumulative = 0;

  for (const item of pool) {
    cumulative += Number(item.dropRate) || 0;
    if (rand <= cumulative) {
      const min = Number(item.weightMin) || 100;
      const max = Number(item.weightMax) || 500;
      const weight = Math.floor(Math.random() * (max - min + 1)) + min;
      return { fish: item, weight };
    }
  }

  // Fallback nếu có sai số nhỏ
  const fallback = pool[pool.length - 1] || FISH_DATABASE[0];
  return { fish: fallback, weight: fallback.weightMin };
}
