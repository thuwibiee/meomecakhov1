import express, { Request, Response } from 'express';
import crypto from 'crypto';
import {
  CatTownConfig,
  CatTownUserProfile,
  CatTownFish,
  CatTownFurniture,
  CatTownFortune,
  CatBreed,
  WalletTransaction,
} from '../src/types.ts';
import { DEFAULT_FURNITURE_CATALOG } from '../src/components/cat-town/furnitureCatalog.ts';

export function getDefaultCatTownConfig(): CatTownConfig {
  const fishCatalog: CatTownFish[] = [
    {
      id: 'fish_07',
      name: 'Sò Ngọc Trai Cực Kì Hiếm',
      rarity: 'legendary',
      rewardCoins: 200,
      dropRate: 2,
      image: '/assets/fishing/fish_07.png',
      weightMin: 1500,
      weightMax: 3200,
      description: 'Báu vật linh thiêng dưới đáy Hồ Bong Bóng! Vỏ sò 7 sắc cầu vồng ngậm viên ngọc trai phát sáng rực rỡ.',
      color: '#FFD166',
      iconType: 'pearl_shell',
    },
    {
      id: 'fish_01',
      name: 'Cá Xiêm Hoa Anh Đào',
      rarity: 'legendary',
      rewardCoins: 160,
      dropRate: 3,
      image: '/assets/fishing/fish_01.png',
      weightMin: 900,
      weightMax: 2100,
      description: 'Cá cực kì hiếm! Mang sắc hồng cánh sen ngọt ngào và đóa hoa anh đào cài vây kiêu sa.',
      color: '#FF8FAB',
      iconType: 'sakura_betta',
    },
    {
      id: 'fish_03',
      name: 'Cá Xiêm Lam Hoàng Kim',
      rarity: 'epic',
      rewardCoins: 100,
      dropRate: 6,
      image: '/assets/fishing/fish_03.png',
      weightMin: 600,
      weightMax: 1300,
      description: 'Cá betta hoàng tộc, đuôi xòe tròn như vầng trăng rằm tỏa sắc vàng lam lộng lẫy.',
      color: '#A855F7',
      iconType: 'gold_blue_betta',
    },
    {
      id: 'fish_10',
      name: 'Cá Chép Nâu Đuôi Đỏ',
      rarity: 'epic',
      rewardCoins: 80,
      dropRate: 6,
      image: '/assets/fishing/fish_10.png',
      weightMin: 520,
      weightMax: 1150,
      description: 'Cá chép cổ thụ mang dáng dấp dũng mãnh, vảy nâu gấm và đuôi đỏ uy nghi.',
      color: '#C084FC',
      iconType: 'brown_carp',
    },
    {
      id: 'fish_02',
      name: 'Cá Vàng Ryukin Ánh Bạc',
      rarity: 'rare',
      rewardCoins: 60,
      dropRate: 8,
      image: '/assets/fishing/fish_02.png',
      weightMin: 400,
      weightMax: 850,
      description: 'Chú cá vàng Ryukin dáng tròn quý phái, vây đuôi ánh bạc lấp lánh dưới nắng.',
      color: '#3B82F6',
      iconType: 'ryukin_goldfish',
    },
    {
      id: 'fish_09',
      name: 'Cá Rô Phi Vây Cam',
      rarity: 'rare',
      rewardCoins: 50,
      dropRate: 8,
      image: '/assets/fishing/fish_09.png',
      weightMin: 310,
      weightMax: 720,
      description: 'Thân xanh ngọc bích phối vây cam rực lửa, loài cá nhanh nhẹn bậc nhất đầm nước.',
      color: '#60A5FA',
      iconType: 'tilapia_orange',
    },
    {
      id: 'fish_04',
      name: 'Cá Bướm Xanh Sọc Đen',
      rarity: 'rare',
      rewardCoins: 50,
      dropRate: 9,
      image: '/assets/fishing/fish_04.png',
      weightMin: 280,
      weightMax: 620,
      description: 'Họa tiết sọc đen trên nền ngọc lục bảo, viền vây vàng chanh tựa chú bướm rập rờn dưới nước.',
      color: '#38BDF8',
      iconType: 'butterfly_fish',
    },
    {
      id: 'fish_05',
      name: 'Cá Hồi Suối Xanh Rêu',
      rarity: 'common',
      rewardCoins: 30,
      dropRate: 12,
      image: '/assets/fishing/fish_05.png',
      weightMin: 200,
      weightMax: 480,
      description: 'Chú cá suối thân thuộc, đốm xanh rêu mát lành, thịt thơm ngọt rất hợp đem nướng.',
      color: '#795653',
      iconType: 'moss_trout',
    },
    {
      id: 'fish_06',
      name: 'Cá Tròn Mắt To Đỏ Rực',
      rarity: 'common',
      rewardCoins: 30,
      dropRate: 12,
      image: '/assets/fishing/fish_06.png',
      weightMin: 180,
      weightMax: 420,
      description: 'Tròn ủng như quả cà chua đỏ, đôi mắt to ngơ ngác cực kỳ đáng yêu khi bị kéo lên bờ.',
      color: '#EF4444',
      iconType: 'round_red_fish',
    },
    {
      id: 'fish_08',
      name: 'Cá Bánh Mì Bơ Vàng',
      rarity: 'common',
      rewardCoins: 30,
      dropRate: 12,
      image: '/assets/fishing/fish_08.png',
      weightMin: 160,
      weightMax: 390,
      description: 'Mập mạp tròn xoe, màu vàng bơ thơm phức như vừa ra lò từ tiệm bánh mèo.',
      color: '#F59E0B',
      iconType: 'bread_butter_fish',
    },
    {
      id: 'fish_11',
      name: 'Cá Bầu Trời Xanh Biển',
      rarity: 'common',
      rewardCoins: 30,
      dropRate: 12,
      image: '/assets/fishing/fish_11.png',
      weightMin: 170,
      weightMax: 410,
      description: 'Xanh trong vắt như bầu trời không một gợn mây, thích bơi theo đàn sát bờ nước.',
      color: '#0EA5E9',
      iconType: 'sky_blue_fish',
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
      title: 'Lời Khuyên Đại Tiên Mèo',
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

export function setupCatTownRoutes(
  app: express.Express,
  db: any,
  saveDatabase: () => void,
  authMiddleware: any,
  adminMiddleware: any,
  getVietnamDateStr: () => string
) {
  // Ensure DB arrays exist
  if (!db.cat_town_config) {
    db.cat_town_config = getDefaultCatTownConfig();
  }
  if (!db.cat_town_profiles) {
    db.cat_town_profiles = [];
  }

  function getOrCreateProfile(userId: string, username: string): CatTownUserProfile {
    let profile = db.cat_town_profiles.find((p: CatTownUserProfile) => p.userId === userId);
    const today = getVietnamDateStr();

    if (!profile) {
      // Starter cat defaults to Orange Tabby with hasChosenCat: false
      profile = {
        userId,
        username,
        joinedTownAt: new Date().toISOString(),
        hasChosenCat: false,
        cat: {
          id: `cat_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
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
              id: `item_${Date.now()}_1`,
              furnitureId: 'bed_01',
              gridX: 2,
              gridY: 2,
            },
            {
              id: `item_${Date.now()}_2`,
              furnitureId: 'decor_11',
              gridX: 4,
              gridY: 2,
            },
          ],
        },
        inventory: [
          {
            id: `inv_${Date.now()}_1`,
            userId,
            itemId: 'fish_bong_bong',
            itemType: 'fish',
            name: 'Cá Bong Bóng Pastel',
            quantity: 2,
            rarity: 'common',
          },
          {
            id: `inv_${Date.now()}_2`,
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
      db.cat_town_profiles.push(profile);
      saveDatabase();
    } else {
      let modified = false;
      // Sanitize legacy items in existing profile
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

      // Check day rollover for daily counters
      if (profile.lastActionDate !== today) {
        profile.dailyFishingCount = 0;
        profile.dailyGrillingCount = 0;
        profile.dailyFortuneClaimed = false;
        profile.lastActionDate = today;
        modified = true;
      }

      if (modified) {
        saveDatabase();
      }
    }

    return profile;
  }

  // 1. GET PROFILE & CONFIG
  app.get('/api/cat-town/profile', authMiddleware, (req: Request, res: Response) => {
    const user = (req as any).user;
    const config: CatTownConfig = db.cat_town_config || getDefaultCatTownConfig();
    const profile = getOrCreateProfile(user.id, user.username);

    // Refresh wallet balance from DB
    const freshUser = db.users.find((u: any) => u.id === user.id);
    const balance = freshUser?.balance ?? user.balance ?? 0;

    res.json({
      success: true,
      profile,
      config,
      balance,
    });
  });

  // 2. ACTION: FISHING
  app.post('/api/cat-town/action/fish', authMiddleware, (req: Request, res: Response) => {
    const user = (req as any).user;
    const config: CatTownConfig = db.cat_town_config || getDefaultCatTownConfig();

    if (!config.isEnabled) {
      res.status(403).json({ error: 'Thị Trấn Cá Mèo hiện đang bảo trì cảnh quan. Vui lòng quay lại sau ít phút!' });
      return;
    }

    const profile = getOrCreateProfile(user.id, user.username);
    const today = getVietnamDateStr();

    if (profile.dailyFishingCount >= config.dailyFishingLimit) {
      res.status(400).json({
        error: `Bà đã câu hết ${config.dailyFishingLimit} lượt hôm nay rồi! Nghỉ ngơi dưỡng sức mai câu tiếp nhé 🐟✨`,
        dailyFishingCount: profile.dailyFishingCount,
      });
      return;
    }

    // Determine fish based on client caught fish or active catalog weighted random
    const catalog = config.fishCatalog && config.fishCatalog.length > 0 ? config.fishCatalog : getDefaultCatTownConfig().fishCatalog;
    let pickedFish = req.body?.fishId ? catalog.find((f: any) => f.id === req.body.fishId) : null;
    
    if (!pickedFish) {
      const totalDrop = catalog.reduce((s: number, f: any) => s + (Number(f.dropRate) || 10), 0) || 100;
      const rand = Math.random() * totalDrop;
      let cum = 0;
      for (const f of catalog) {
        cum += Number(f.dropRate) || 10;
        if (rand <= cum) {
          pickedFish = f;
          break;
        }
      }
      if (!pickedFish) pickedFish = catalog[0];
    }

    const weightMin = Number(pickedFish.weightMin) || 100;
    const weightMax = Number(pickedFish.weightMax) || 500;
    const weight = req.body?.weight && typeof req.body.weight === 'number'
      ? req.body.weight
      : Math.floor(Math.random() * (weightMax - weightMin + 1)) + weightMin;
    const rewardCoins = Number((pickedFish as any).rewardCoins ?? (pickedFish as any).xuReward ?? 30);

    // Update Profile Inventory & counters
    profile.dailyFishingCount += 1;
    profile.stats.totalFishCaught += 1;
    profile.lastActionDate = today;

    // Add to inventory
    const existing = profile.inventory.find((i) => i.itemId === pickedFish.id && i.itemType === 'fish');
    if (existing) {
      existing.quantity += 1;
    } else {
      profile.inventory.push({
        id: `inv_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        userId: user.id,
        itemId: pickedFish.id,
        itemType: 'fish',
        name: pickedFish.name,
        quantity: 1,
        rarity: pickedFish.rarity,
        details: { weight },
      });
    }

    // Award Xu Cá directly to user's wallet
    const dbUser = db.users.find((u: any) => u.id === user.id);
    if (dbUser) {
      dbUser.balance = (dbUser.balance || 0) + rewardCoins;

      const tx: WalletTransaction = {
        id: `tx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        userId: user.id,
        amount: rewardCoins,
        balanceAfter: dbUser.balance,
        type: 'CAT_TOWN_FISHING',
        description: `+${rewardCoins} Xu Cá - Câu được ${pickedFish.name} (${weight}g) tại Hồ Bong Bóng 🎣✨`,
        createdAt: new Date().toISOString(),
      };
      db.wallet_transactions = db.wallet_transactions || [];
      db.wallet_transactions.push(tx);
    }

    saveDatabase();

    res.json({
      success: true,
      message: `Tuyệt vời! Bà vừa câu được một chú ${pickedFish.name} (${weight}g)!`,
      fish: pickedFish,
      weight,
      rewardCoins,
      newBalance: dbUser?.balance || 0,
      dailyFishingCount: profile.dailyFishingCount,
      inventory: profile.inventory,
    });
  });

  // 3. ACTION: GRILLING FISH
  app.post('/api/cat-town/action/grill', authMiddleware, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { fishItemId, doneness } = req.body; // doneness: 'undercooked' | 'perfect' | 'burnt'
    const config: CatTownConfig = db.cat_town_config || getDefaultCatTownConfig();

    if (!config.isEnabled) {
      res.status(403).json({ error: 'Bếp nướng đang bảo trì.' });
      return;
    }

    const profile = getOrCreateProfile(user.id, user.username);
    const today = getVietnamDateStr();

    if (profile.dailyGrillingCount >= config.dailyGrillingLimit) {
      res.status(400).json({
        error: `Bà đã nướng hết ${config.dailyGrillingLimit} mẻ cá hôm nay rồi!`,
      });
      return;
    }

    // Find and consume fish from inventory
    const fishIndex = profile.inventory.findIndex((i) => i.itemId === fishItemId && i.itemType === 'fish' && i.quantity > 0);
    if (fishIndex === -1) {
      res.status(400).json({ error: 'Bà chưa có loại cá này trong túi đồ để nướng!' });
      return;
    }

    // Deduct one fish
    profile.inventory[fishIndex].quantity -= 1;
    const fishName = profile.inventory[fishIndex].name;
    if (profile.inventory[fishIndex].quantity <= 0) {
      profile.inventory.splice(fishIndex, 1);
    }

    // Calculate coin reward
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

    // Add cooked fish to inventory
    profile.inventory.push({
      id: `cooked_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
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

    // Award Xu Cá
    const dbUser = db.users.find((u: any) => u.id === user.id);
    if (dbUser && rewardCoins > 0) {
      dbUser.balance = (dbUser.balance || 0) + rewardCoins;

      const tx: WalletTransaction = {
        id: `tx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        userId: user.id,
        amount: rewardCoins,
        balanceAfter: dbUser.balance,
        type: 'CAT_TOWN_GRILLING',
        description: `+${rewardCoins} Xu Cá - Nướng thành công ${fishName} (${label}) tại Bếp Xèo Xèo 🐟🔥`,
        createdAt: new Date().toISOString(),
      };
      db.wallet_transactions = db.wallet_transactions || [];
      db.wallet_transactions.push(tx);
    }

    saveDatabase();

    res.json({
      success: true,
      message: `Đã nướng xong mẻ cá: ${label}!`,
      doneness,
      rewardCoins,
      newBalance: dbUser?.balance || 0,
      dailyGrillingCount: profile.dailyGrillingCount,
      inventory: profile.inventory,
    });
  });

  // 4. ACTION: FORTUNE TELLING
  app.post('/api/cat-town/action/fortune', authMiddleware, (req: Request, res: Response) => {
    const user = (req as any).user;
    const config: CatTownConfig = db.cat_town_config || getDefaultCatTownConfig();

    const profile = getOrCreateProfile(user.id, user.username);
    const today = getVietnamDateStr();

    const fortunes = config.fortuneCatalog && config.fortuneCatalog.length > 0 ? config.fortuneCatalog : getDefaultCatTownConfig().fortuneCatalog;
    const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];

    let rewardCoins = 0;
    const dbUser = db.users.find((u: any) => u.id === user.id);

    if (!profile.dailyFortuneClaimed) {
      profile.dailyFortuneClaimed = true;
      rewardCoins = config.fortuneRewardCoins;
      profile.stats.totalFortunesTold += 1;
      profile.lastActionDate = today;

      if (dbUser && rewardCoins > 0) {
        dbUser.balance = (dbUser.balance || 0) + rewardCoins;

        const tx: WalletTransaction = {
          id: `tx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
          userId: user.id,
          amount: rewardCoins,
          balanceAfter: dbUser.balance,
          type: 'CAT_TOWN_FORTUNE',
          description: `+${rewardCoins} Xu Cá - Lời tiên tri đầu ngày từ Mèo Tiên Tri Meo Meo 🔮✨`,
          createdAt: new Date().toISOString(),
        };
        db.wallet_transactions = db.wallet_transactions || [];
        db.wallet_transactions.push(tx);
      }
      saveDatabase();
    }

    res.json({
      success: true,
      fortune: randomFortune,
      rewardCoins,
      claimedToday: profile.dailyFortuneClaimed,
      newBalance: dbUser?.balance || 0,
    });
  });

  // 5. ACTION: CAT CARE
  app.post('/api/cat-town/action/cat/care', authMiddleware, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { actionType } = req.body; // 'feed' | 'pet' | 'play' | 'bath'
    const profile = getOrCreateProfile(user.id, user.username);
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
    saveDatabase();

    res.json({
      success: true,
      message: `Bé mèo ${cat.name} đã được chăm sóc cực kỳ chu đáo!`,
      cat,
    });
  });

  // 6. ACTION: RENAME CAT
  app.post('/api/cat-town/action/cat/rename', authMiddleware, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Tên bé mèo không được để trống!' });
      return;
    }

    const profile = getOrCreateProfile(user.id, user.username);
    profile.cat.name = name.trim().slice(0, 30);
    saveDatabase();

    res.json({
      success: true,
      message: `Đã đổi tên bé mèo thành "${profile.cat.name}"!`,
      cat: profile.cat,
    });
  });

  // 6b. ACTION: CHOOSE / CUSTOMIZE CAT (AVATAR & NAME)
  app.post('/api/cat-town/action/cat/choose', authMiddleware, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { avatarId, avatarUrl, name, breed, coatColor } = req.body;

    const profile = getOrCreateProfile(user.id, user.username);
    if (avatarId) profile.cat.avatarId = avatarId;
    if (avatarUrl) profile.cat.avatarUrl = avatarUrl;
    if (breed) profile.cat.breed = breed;
    if (coatColor) profile.cat.coatColor = coatColor;
    if (name && name.trim()) {
      profile.cat.name = name.trim().slice(0, 30);
    }
    profile.hasChosenCat = true;
    saveDatabase();

    res.json({
      success: true,
      message: `Đã chọn bé mèo "${profile.cat.name}" đồng hành!`,
      cat: profile.cat,
      profile,
    });
  });

  // 7. FURNITURE SHOP: BUY ITEM
  app.post('/api/cat-town/shop/buy', authMiddleware, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { furnitureId } = req.body;
    const config: CatTownConfig = db.cat_town_config || getDefaultCatTownConfig();

    const item = config.furnitureCatalog.find((f) => f.id === furnitureId);
    if (!item) {
      res.status(404).json({ error: 'Không tìm thấy vật phẩm nội thất này!' });
      return;
    }

    const dbUser = db.users.find((u: any) => u.id === user.id);
    if (!dbUser || (dbUser.balance || 0) < item.price) {
      res.status(400).json({ error: `Bà không đủ Xu Cá để mua món này! (Cần ${item.price} Xu Cá)` });
      return;
    }

    // Deduct Xu Cá
    dbUser.balance -= item.price;

    const tx: WalletTransaction = {
      id: `tx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: user.id,
      amount: -item.price,
      balanceAfter: dbUser.balance,
      type: 'CAT_TOWN_FURNITURE',
      description: `-${item.price} Xu Cá - Mua nội thất: ${item.name} cho nhà mèo 🪑🏡`,
      createdAt: new Date().toISOString(),
    };
    db.wallet_transactions = db.wallet_transactions || [];
    db.wallet_transactions.push(tx);

    // Add to town inventory
    const profile = getOrCreateProfile(user.id, user.username);
    const existing = profile.inventory.find((i) => i.itemId === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      profile.inventory.push({
        id: `inv_furn_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        userId: user.id,
        itemId: item.id,
        itemType: 'furniture',
        name: item.name,
        quantity: 1,
        details: { category: item.category },
      });
    }

    profile.stats.totalFurnitureBought += 1;
    saveDatabase();

    res.json({
      success: true,
      message: `Mua thành công ${item.name}! Vật phẩm đã được lưu vào túi đồ.`,
      newBalance: dbUser.balance,
      inventory: profile.inventory,
    });
  });

  // 8. HOUSE DECORATION: SAVE LAYOUT
  app.post('/api/cat-town/house/save', authMiddleware, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { wallpaper, floor, wallpaperMode, floorMode, placedItems, catPosition, catX, catY } = req.body;
    const profile = getOrCreateProfile(user.id, user.username);

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

    saveDatabase();

    res.json({
      success: true,
      message: 'Đã lưu thiết kế căn nhà ấm cúng của mèo thành công!',
      house: profile.house,
    });
  });

  // 9. ADMIN: GET STATS & CONFIG
  app.get('/api/admin/cat-town/stats', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
    const config = db.cat_town_config || getDefaultCatTownConfig();
    const profiles: CatTownUserProfile[] = db.cat_town_profiles || [];

    const totalResidents = profiles.length;
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

    res.json({
      totalResidents,
      totalFishCaught,
      totalFishGrilled,
      totalFortunesTold,
      totalFurnitureBought,
      config,
    });
  });

  // 10. ADMIN: UPDATE CONFIG
  app.post('/api/admin/cat-town/config', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
    const admin = (req as any).user;
    const newConfig = req.body;

    if (!newConfig || typeof newConfig !== 'object') {
      res.status(400).json({ error: 'Cấu hình không hợp lệ.' });
      return;
    }

    db.cat_town_config = {
      ...getDefaultCatTownConfig(),
      ...newConfig,
    };

    db.admin_audit_logs = db.admin_audit_logs || [];
    db.admin_audit_logs.push({
      id: `log_${Date.now()}`,
      adminUsername: admin.username,
      action: 'UPDATE_CAT_TOWN_CONFIG',
      target: 'CatTownConfig',
      details: 'Cập nhật cấu hình trò chơi Thị Trấn Cá Mèo',
      timestamp: new Date().toISOString(),
    });

    saveDatabase();

    res.json({
      success: true,
      message: 'Đã lưu cấu hình Thị Trấn Cá Mèo thành công!',
      config: db.cat_town_config,
    });
  });
}
