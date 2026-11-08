import React, { useState, useEffect, useRef } from 'react';
import { CatTownUserProfile, CatTownConfig, FishingAssetsConfig } from '../../types.ts';
import { firebaseApi } from '../../firebase.ts';
import { XuCaIcon } from '../XuCaIcon.tsx';
import { retroAudio } from './retroAudio.ts';
import {
  DEFAULT_PIXEL_CAT_PLACEHOLDER,
  DEFAULT_PIXEL_DOCK_PLACEHOLDER,
  DEFAULT_PIXEL_FISH_PLACEHOLDER,
  PIXEL_WOODEN_PIER,
  PIXEL_GRASS_BANK_TILE,
} from './pixelPondAssets.ts';
import {
  FISH_DATABASE,
  catchFish,
  getRarityConfig,
  FishDatabaseItem,
  normalizeFishCatalog,
} from './fishDatabase.ts';

// ẢNH GIF BACKGROUND MẶT HỒ BONG BÓNG CHUẨN 2D PIXEL ART (GIỮ NGUYÊN CHUYỂN ĐỘNG & ĐỘ SẮC NÉT)
const POND_BACKGROUND_GIF = 'https://i.postimg.cc/sXGV8Jzt/250f20bffe240524ae135ab7ffa30275.gif';

interface FishingMinigameProps {
  authToken: string | null;
  profile: CatTownUserProfile | null;
  config?: CatTownConfig | null;
  isAdmin?: boolean;
  userBalance: number;
  onBalanceUpdated: (newBal: number) => void;
  onRefreshProfile: () => void;
  onBackToMap: () => void;
  onOpenAuth: () => void;
}

export const FishingMinigame: React.FC<FishingMinigameProps> = ({
  authToken,
  profile,
  config,
  isAdmin = false,
  userBalance,
  onBalanceUpdated,
  onRefreshProfile,
  onBackToMap,
  onOpenAuth,
}) => {
  // Game states: 'idle' | 'casting' | 'waiting' | 'hooked' | 'reeling' | 'caught' | 'lost'
  const [gameState, setGameState] = useState<
    'idle' | 'casting' | 'waiting' | 'hooked' | 'reeling' | 'caught' | 'lost'
  >('idle');
  const [gaugePosition, setGaugePosition] = useState<number>(10);
  const [gaugeDirection, setGaugeDirection] = useState<'right' | 'left'>('right');
  const [targetZone, setTargetZone] = useState<{ start: number; end: number }>({ start: 35, end: 65 });
  const [caughtFishData, setCaughtFishData] = useState<{
    fish: FishDatabaseItem;
    weight: number;
    rewardCoins: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(false);

  // Modals: Bể cá (Compendium) & Admin Asset Customizer
  const [isCompendiumOpen, setIsCompendiumOpen] = useState(false);
  const [isAdminAssetModalOpen, setIsAdminAssetModalOpen] = useState(false);
  const [customCatUrl, setCustomCatUrl] = useState(config?.fishingAssets?.catImageUrl || '');
  const [customDockUrl, setCustomDockUrl] = useState(config?.fishingAssets?.dockImageUrl || '');
  const [customFishUrl, setCustomFishUrl] = useState(config?.fishingAssets?.fishDefaultImageUrl || '');
  const [isSavingAssets, setIsSavingAssets] = useState(false);
  const [adminSaveMessage, setAdminSaveMessage] = useState<string | null>(null);

  // Sync state if config updates
  useEffect(() => {
    if (config?.fishingAssets) {
      setCustomCatUrl(config.fishingAssets.catImageUrl || '');
      setCustomDockUrl(config.fishingAssets.dockImageUrl || '');
      setCustomFishUrl(config.fishingAssets.fishDefaultImageUrl || '');
    }
  }, [config]);

  const animationRef = useRef<number | null>(null);
  const waitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Remaining daily turns
  const dailyLimit = config?.dailyFishingLimit || 12;
  const turnsUsed = profile?.dailyFishingCount || 0;
  const turnsRemaining = Math.max(0, dailyLimit - turnsUsed);
  // Danh sách cá hoạt động (đồng bộ từ cấu hình Admin Hồ Bong Bóng)
  const effectiveFishList = normalizeFishCatalog(config?.fishCatalog);

  // Active sprite URLs (với fallback chuẩn xác đến asset Pixel thật)
  const activeCatSprite =
    profile?.cat?.avatarUrl ||
    (config?.fishingAssets?.catImageUrl && config.fishingAssets.catImageUrl.trim()) ||
    (customCatUrl && customCatUrl.trim()) ||
    DEFAULT_PIXEL_CAT_PLACEHOLDER;

  const activeDockSprite =
    (config?.fishingAssets?.dockImageUrl && config.fishingAssets.dockImageUrl.trim()) ||
    (customDockUrl && customDockUrl.trim()) ||
    PIXEL_WOODEN_PIER;

  const activeFishPopupSprite =
    (config?.fishingAssets?.fishDefaultImageUrl && config.fishingAssets.fishDefaultImageUrl.trim()) ||
    (customFishUrl && customFishUrl.trim()) ||
    caughtFishData?.fish.imageSrc ||
    DEFAULT_PIXEL_FISH_PLACEHOLDER;

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
    };
  }, []);

  // Moving slider animation during reeling phase
  useEffect(() => {
    if (gameState === 'reeling') {
      const step = () => {
        setGaugePosition((prev) => {
          let next = prev + (gaugeDirection === 'right' ? 2.6 : -2.6);
          if (next >= 95) {
            setGaugeDirection('left');
            return 95;
          }
          if (next <= 5) {
            setGaugeDirection('right');
            return 5;
          }
          return next;
        });
        animationRef.current = requestAnimationFrame(step);
      };
      animationRef.current = requestAnimationFrame(step);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, gaugeDirection]);

  // Handle Start Cast
  const handleStartCast = () => {
    if (!authToken) {
      onOpenAuth();
      return;
    }
    if (turnsRemaining <= 0) {
      setErrorMessage(`Bà đã hết lượt câu hôm nay rồi (${dailyLimit}/${dailyLimit})! Nghỉ ngơi mai câu tiếp nhé 🐟`);
      return;
    }

    retroAudio.playBlip(540, 0.06);
    setErrorMessage(null);
    setCaughtFishData(null);
    setGameState('waiting');

    // Random bite time between 1.5s - 3s
    const biteDelay = Math.floor(Math.random() * 1500) + 1500;
    waitTimeoutRef.current = setTimeout(() => {
      // Trigger bite!
      retroAudio.playBlip(780, 0.08);
      setGameState('hooked');
      // Set random target sweet spot zone
      const zoneWidth = 28;
      const start = Math.floor(Math.random() * (70 - zoneWidth)) + 15;
      setTargetZone({ start, end: start + zoneWidth });

      // Automatically move to reeling phase
      setTimeout(() => {
        setGameState('reeling');
      }, 550);
    }, biteDelay);
  };

  // Handle Reel In Click (Thuật toán Weighted Random + Sync Firebase)
  const handleReelIn = async () => {
    if (gameState !== 'reeling') return;

    // Check if slider is inside target zone
    const isSuccess = gaugePosition >= targetZone.start && gaugePosition <= targetZone.end;

    if (!isSuccess) {
      retroAudio.playBlip(300, 0.12);
      setGameState('lost');
      return;
    }

    // THUẬT TOÁN RANDOM CÁ (WEIGHTED RANDOM DỰA TRÊN dropRate CỦA ADMIN)
    const caught = catchFish(effectiveFishList);

    // Call API to register catch & claim Xu Cá & sync to Firestore
    setIsApiLoading(true);
    try {
      const res = await firebaseApi('/api/cat-town/action/fish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fishId: caught.fish.id,
          weight: caught.weight,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi câu cá');
      }

      retroAudio.playConfirm();
      setCaughtFishData({
        fish: caught.fish,
        weight: data.weight || caught.weight,
        rewardCoins: data.rewardCoins || caught.fish.xuReward,
      });
      setGameState('caught');
      onBalanceUpdated(data.newBalance);
      onRefreshProfile();
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể gửi kết quả câu cá.');
      setGameState('idle');
    } finally {
      setIsApiLoading(false);
    }
  };

  // Save Admin Custom Pixel Assets to Firestore
  const handleSaveAdminAssets = async () => {
    if (!authToken || !isAdmin) return;
    setIsSavingAssets(true);
    setAdminSaveMessage(null);
    try {
      const updatedAssets: FishingAssetsConfig = {
        catImageUrl: customCatUrl.trim(),
        dockImageUrl: customDockUrl.trim(),
        fishDefaultImageUrl: customFishUrl.trim(),
      };

      const res = await firebaseApi('/api/admin/cat-town/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...(config || {}),
          fishingAssets: updatedAssets,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi lưu asset');
      }

      setAdminSaveMessage('Đã lưu và công khai asset đồ họa thành công!');
      setTimeout(() => {
        setIsAdminAssetModalOpen(false);
        setAdminSaveMessage(null);
        onRefreshProfile();
      }, 1200);
    } catch (err: any) {
      setAdminSaveMessage(`Lỗi: ${err.message}`);
    } finally {
      setIsSavingAssets(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* ================= 1. RETRO TOP NAV BAR ================= */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3">
        {/* Nút Quay Lại Bản Đồ (Khối vuông viền nâu retro) */}
        <button
          onClick={() => {
            retroAudio.playBlip(420, 0.05);
            onBackToMap();
          }}
          className="retro-pixel-btn px-4 py-2 bg-[#FFF9F4] text-[#795653] font-black text-xs cursor-pointer flex items-center gap-1.5"
          style={{ fontFamily: "'Tiny5', 'Press Start 2P', monospace" }}
        >
          <span>◄</span>
          <span>BẢN ĐỒ THỊ TRẤN</span>
        </button>

        {/* Action Toggles: Bể Cá (Drop rates) & Admin Tool */}
        <div className="flex items-center gap-2">
          {/* Nút Xem Bể Cá & Tỷ Lệ Xuất Hiện */}
          <button
            onClick={() => {
              retroAudio.playBlip(560, 0.05);
              setIsCompendiumOpen(true);
            }}
            className="retro-pixel-btn px-3 py-2 bg-[#FFF9F4] hover:bg-[#FFE5EC] text-[#795653] font-black text-xs cursor-pointer flex items-center gap-1.5"
            style={{ fontFamily: "'Tiny5', 'Press Start 2P', monospace" }}
          >
            <span>🐟</span>
            <span>BỂ CÁ & TỶ LỆ (11 LOÀI)</span>
          </button>

          {/* Nút Admin Đổi Asset */}
          {isAdmin && (
            <button
              onClick={() => {
                retroAudio.playBlip(600, 0.05);
                setIsAdminAssetModalOpen(true);
              }}
              className="retro-pixel-btn px-3 py-2 bg-[#FF8FAB] text-white font-black text-xs cursor-pointer flex items-center gap-1.5"
              style={{ fontFamily: "'Tiny5', 'Press Start 2P', monospace" }}
            >
              <span>⚙️</span>
              <span>ĐỔI ẢNH (ADMIN)</span>
            </button>
          )}

          {/* Badge Lượt câu hôm nay (Hồng dâu & Kem sữa) */}
          <div
            className="px-3.5 py-2 bg-[#FFF9F4] border-3 border-[#795653] rounded-none text-xs font-black text-[#795653] shadow-[3px_3px_0px_#795653] flex items-center gap-2"
            style={{ fontFamily: "'Tiny5', 'Press Start 2P', monospace" }}
          >
            <span>🎣 LƯỢT:</span>
            <span className="text-[#D6336C]">
              {turnsRemaining} / {dailyLimit}
            </span>
          </div>

          {/* Badge Số dư Xu Cá */}
          <div
            className="px-3.5 py-2 bg-[#FFF9F4] border-3 border-[#795653] rounded-none text-xs font-black text-[#795653] shadow-[3px_3px_0px_#795653] flex items-center gap-1.5"
            style={{ fontFamily: "'Tiny5', 'Press Start 2P', monospace" }}
          >
            <XuCaIcon className="w-4 h-4 object-contain inline-block" />
            <span className="text-[#795653]">{userBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Error / Alert banner */}
      {errorMessage && (
        <div className="w-full bg-[#FFE5EC] border-3 border-[#D6336C] rounded-none p-2.5 mb-3 text-xs text-[#795653] font-black flex items-center justify-between shadow-[3px_3px_0px_#D6336C]">
          <span style={{ fontFamily: "'Tiny5', monospace" }}>⚠️ {errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[#D6336C] font-black cursor-pointer px-2"
            style={{ fontFamily: "'Tiny5', monospace" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ================= 2. MAIN POND GAME SCREEN (BACKGROUND ẢNH GIF HỒ BONG BÓNG + BỜ CỎ XANH + CẦU GỖ) ================= */}
      <div
        className="relative w-full aspect-[16/10] min-h-[460px] max-h-[520px] rounded-none border-4 border-[#795653] shadow-[6px_6px_0px_#795653] overflow-hidden flex flex-col justify-between"
        style={{
          backgroundColor: '#2790D5',
          backgroundImage: `url(${POND_BACKGROUND_GIF})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '240px 240px',
          imageRendering: 'pixelated',
        }}
      >
        {/* ================= 1. BỜ CỎ XANH (GREEN GRASS SHORE BANK) ================= */}
        <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none select-none flex flex-col">
          {/* Green Lawn Base Strip */}
          <div className="w-full h-11 sm:h-12 bg-[#BFD56F] border-b border-[#98BD4D] relative">
            {/* Wildflower, clover and mushroom decorations */}
            <div className="absolute top-2 left-6 text-xs">🌸</div>
            <div className="absolute top-3 left-24 text-[10px]">🌼</div>
            <div className="absolute top-2.5 left-48 text-[11px]">🌿</div>
            <div className="absolute top-2 right-12 text-xs">🍄</div>
            <div className="absolute top-3 right-36 text-[10px]">🌸</div>
            <div className="absolute top-2.5 right-64 text-[11px]">🌼</div>
          </div>

          {/* Stepped Grass Fringe, Rocks & White Foam Water Line */}
          <div
            className="w-full h-7 sm:h-8 -mt-0.5"
            style={{
              backgroundImage: `url(${PIXEL_GRASS_BANK_TILE})`,
              backgroundRepeat: 'repeat-x',
              backgroundSize: 'auto 100%',
              imageRendering: 'pixelated',
            }}
          />
        </div>

        {/* ================= WATER RIPPLES & BUBBLES TRÊN MẶT NƯỚC HỒ ================= */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-5">
          {/* Row 2 Ripples (Mid-water) */}
          <div className="absolute top-[52%] left-[12%] flex items-center gap-1 opacity-90 animate-pixel-ripple">
            <span className="w-14 h-[2px] bg-white inline-block shadow-[0_1px_0_#526C91]" />
            <span className="w-4 h-[2px] bg-white inline-block" />
          </div>
          <div className="absolute top-[55%] right-[15%] flex items-center gap-1 opacity-70 animate-pixel-ripple-slow">
            <span className="w-10 h-[2px] bg-[#6E93CC] inline-block shadow-[0_1px_0_#FFFFFF]" />
            <span className="w-2 h-[2px] bg-white inline-block" />
          </div>

          {/* Row 3 Ripples (Deep-water) */}
          <div className="absolute bottom-20 left-[18%] flex items-center gap-1 opacity-85 animate-pixel-ripple">
            <span className="w-16 h-[2px] bg-white inline-block shadow-[0_1px_0_#526C91]" />
            <span className="w-3 h-[2px] bg-[#526C91] inline-block" />
          </div>
          <div className="absolute bottom-12 right-[12%] flex items-center gap-1 opacity-80 animate-pixel-ripple-slow">
            <span className="w-10 h-[2px] bg-white inline-block shadow-[0_1px_0_#526C91]" />
            <span className="w-2 h-[2px] bg-white inline-block" />
          </div>

          {/* Floating water bubbles */}
          <div className="absolute top-28 left-16 text-sm animate-bubble-rise opacity-75">🫧</div>
          <div className="absolute top-36 right-28 text-xs animate-bubble-rise opacity-65" style={{ animationDelay: '1.2s' }}>🫧</div>
          <div className="absolute bottom-16 left-1/3 text-base animate-bubble-rise opacity-80" style={{ animationDelay: '2s' }}>🫧</div>

          {/* Swimming fish silhouettes under water */}
          <div
            className="absolute top-[62%] left-1/4 w-9 h-2.5 bg-[#1E3A8A] opacity-35 animate-pulse"
            style={{ imageRendering: 'pixelated' }}
          />
          <div
            className="absolute top-[58%] right-1/4 w-11 h-3 bg-[#1E3A8A] opacity-35 animate-pulse"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Top Status Banner (Bố trí gọn gàng trên bờ cỏ xanh) */}
        <div className="relative z-30 flex items-center justify-between w-full p-2 pt-1.5 pointer-events-none">
          <div
            className="px-3 py-1 bg-[#FFF9F4] border-2 border-[#795653] rounded-none text-[11px] sm:text-xs font-black text-[#795653] shadow-[2px_2px_0px_#795653] flex items-center gap-1.5"
            style={{ fontFamily: "'Tiny5', 'Press Start 2P', monospace" }}
          >
            <span>🏷️</span>
            <span>
              {gameState === 'idle' && 'BẾN CẦU GỖ: MẶT HỒ PHẲNG LẶNG, SẴN SÀNG THẢ CẦN!'}
              {gameState === 'waiting' && 'SUỴT... CẦU GỖ TĨNH LẶNG, CÁ ĐANG TIẾN LẠI GẦN PHAO...'}
              {gameState === 'hooked' && 'CÁ CẮN CÂU DƯỚI CHÂN CẦU RỒI! CHUẨN BỊ GIẬT!'}
              {gameState === 'reeling' && 'CANH KIM VÀO VÙNG TRÚNG ĐỂ KÉO CÁ LÊN CẦU!'}
              {gameState === 'caught' && 'KÉO ĐƯỢC CÁ BÉO MÚP LÊN CẦU GỖ RỒI SEN ƠI!'}
              {gameState === 'lost' && 'CÁ QUẪY NƯỚC CHẠY THOÁT RA XA MẤT TIÊU!'}
            </span>
          </div>
        </div>

        {/* ================= 2. CẦU GỖ NỐI TỪ BỜ CỎ XANH RA ĐẾN NỬA HỒ NƯỚC (RETRO 2D PIXEL DOCK) ================= */}
        <div className="absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none select-none">
          {/* <!-- CHÈN LINK ẢNH PIXEL CỦA BẠN VÀO ĐÂY --> */}
          <img
            src={activeDockSprite || PIXEL_WOODEN_PIER}
            alt="Cầu Gỗ Nối Từ Bờ Cỏ Ra Nửa Hồ"
            className="w-32 sm:w-36 md:w-40 h-[260px] sm:h-[285px] md:h-[305px] object-contain select-none drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]"
            style={{ imageRendering: 'pixelated' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = PIXEL_WOODEN_PIER;
            }}
          />
        </div>

        {/* ================= 3. BÉ MÈO CÂU CÁ Ở ĐẦU CẦU GỖ (NỬA HỒ NƯỚC) ================= */}
        <div className="absolute top-[160px] sm:top-[180px] md:top-[195px] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none select-none">
          {/* Tag tên chú mèo của người chơi */}
          <div
            className="px-2 py-0.5 mb-1 bg-[#FFF9F4] border border-[#795653] rounded-md text-[10px] font-black text-[#D6336C] shadow-[1px_1px_0px_#795653] whitespace-nowrap"
            style={{ fontFamily: "'Tiny5', monospace" }}
          >
            🐾 {profile?.cat?.name || 'Cần Thủ Mèo'}
          </div>
          {/* <!-- CHÈN LINK ẢNH PIXEL CỦA BẠN VÀO ĐÂY --> */}
          <img
            src={activeCatSprite}
            alt={profile?.cat?.name || "Bé Mèo Cần Thủ Pixel"}
            className={`w-20 sm:w-22 md:w-24 h-20 sm:h-22 md:h-24 object-contain select-none transition-transform duration-200 ${
              gameState === 'hooked' ? 'animate-bounce' : gameState === 'reeling' ? 'scale-105' : ''
            }`}
            style={{ imageRendering: 'pixelated' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = profile?.cat?.avatarUrl || DEFAULT_PIXEL_CAT_PLACEHOLDER;
            }}
          />
        </div>

        {/* ================= 4. PHAO CÂU CÁ TRÊN MẶT NƯỚC HỒ (TRƯỚC MỎM CẦU) ================= */}
        {(gameState === 'waiting' || gameState === 'hooked' || gameState === 'reeling') && (
          <div
            className={`absolute top-[260px] sm:top-[285px] md:top-[305px] left-1/2 ml-10 sm:ml-12 z-30 transition-all ${
              gameState === 'hooked' ? 'animate-bounce scale-125' : 'animate-pulse'
            }`}
          >
            {/* 2D Pixel Float Bobber */}
            <div
              className="w-3.5 h-5 bg-[#FF4D6D] border-2 border-[#795653] shadow-[1px_1px_0px_#795653] rounded-none relative"
              style={{ imageRendering: 'pixelated' }}
            >
              <div className="absolute bottom-0 w-full h-2.5 bg-white" />
              <div className="absolute -top-1.5 left-0.5 w-1 h-1.5 bg-[#795653]" />
            </div>
            {/* Pixel Ripple under bobber */}
            <div className="w-6 h-1 border-t-2 border-white -ml-1.5 mt-0.5 animate-ping" />
          </div>
        )}

        {/* Spacer for middle lake area */}
        <div className="flex-1" />

        {/* ================= 4. RETRO PIXEL CONTROLS & TIMING METER ================= */}
        <div className="relative z-20 w-full flex flex-col items-center">
          {/* Reeling Timing Mini-Gauge */}
          {gameState === 'reeling' && (
            <div className="w-full max-w-md bg-[#FFF9F4] border-4 border-[#795653] rounded-none p-3 shadow-[4px_4px_0px_#795653] mb-3">
              <div
                className="text-center text-xs font-black text-[#D6336C] mb-2"
                style={{ fontFamily: "'Tiny5', 'Press Start 2P', monospace" }}
              >
                ⚡ NHẤP "GIẬT CẦN" KHI KIM VÀO VÙNG TRÚNG! ⚡
              </div>

              {/* Gauge Track (Square retro box) */}
              <div className="relative w-full h-8 bg-[#FFFDF7] border-3 border-[#795653] rounded-none overflow-hidden">
                {/* Target Sweet Spot Zone (Hồng Pastel) */}
                <div
                  className="absolute top-0 bottom-0 bg-[#FF8FAB] border-x-2 border-[#795653] flex items-center justify-center text-[10px] font-black text-[#795653]"
                  style={{
                    left: `${targetZone.start}%`,
                    width: `${targetZone.end - targetZone.start}%`,
                    fontFamily: "'Tiny5', monospace",
                  }}
                >
                  TRÚNG
                </div>

                {/* Moving Indicator Cursor */}
                <div
                  className="absolute top-0 bottom-0 w-3 bg-[#D6336C] border-x-2 border-[#795653] -ml-1.5"
                  style={{ left: `${gaugePosition}%` }}
                />
              </div>

              {/* Nút Giật Cần: Màu Hồng Dâu #FF8FAB, không dùng xanh lá */}
              <button
                onClick={handleReelIn}
                disabled={isApiLoading}
                className="retro-pixel-btn w-full mt-2.5 py-3 bg-[#FF8FAB] hover:bg-[#ff7599] text-white font-black text-sm cursor-pointer flex items-center justify-center gap-1.5"
                style={{
                  fontFamily: "'Tiny5', 'Press Start 2P', monospace",
                  textShadow: '1px 1px 0px #795653',
                }}
              >
                <span>🎣</span>
                <span>{isApiLoading ? 'ĐANG KÉO CÁ LÊN...' : 'GIẬT CẦN NGAY!'}</span>
              </button>
            </div>
          )}

          {/* Idle / Lost Action Buttons (NÚT BẤM MÀU HỒNG DÂU #FF8FAB / KEM SỮA #FFF9F4) */}
          {(gameState === 'idle' || gameState === 'lost') && (
            <div className="flex gap-3">
              <button
                onClick={handleStartCast}
                disabled={turnsRemaining <= 0}
                className="retro-pixel-btn px-8 py-3.5 bg-[#FF8FAB] hover:bg-[#ff7599] disabled:bg-[#CCCCCC] disabled:cursor-not-allowed text-white font-black text-sm cursor-pointer flex items-center gap-2"
                style={{
                  fontFamily: "'Tiny5', 'Press Start 2P', monospace",
                  textShadow: '1px 1px 0px #795653',
                }}
              >
                <span>🎣</span>
                <span>{gameState === 'lost' ? 'THỬ THẢ CẦN LẠI' : 'THẢ CẦN CÂU CÁ'}</span>
              </button>
            </div>
          )}

          {/* Waiting animation message */}
          {gameState === 'waiting' && (
            <div
              className="py-2.5 px-6 bg-[#FFF9F4] border-3 border-[#795653] rounded-none text-xs font-black text-[#795653] shadow-[3px_3px_0px_#795653] animate-pulse"
              style={{ fontFamily: "'Tiny5', monospace" }}
            >
              🐾 Suỵt... Giữ im lặng để cá bơi đến gần phao...
            </div>
          )}
        </div>
      </div>

      {/* ================= 5. SUCCESS CAUGHT POPUP MODAL (DYNAMIC POPUP UI THEO FISH_DATABASE) ================= */}
      {gameState === 'caught' && caughtFishData && (
        <div
          onClick={() => setGameState('idle')}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#795653]/65 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-[#FFF9F4] border-4 border-[#795653] p-5 sm:p-6 text-center shadow-[6px_6px_0px_#795653] rounded-none animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto cursor-default"
          >
            {/* Header banner */}
            <div className="text-3xl mb-1 animate-bounce">🎉</div>
            <h3
              className="text-lg sm:text-xl font-black text-[#D6336C] tracking-wide mb-1"
              style={{
                fontFamily: "'Tiny5', 'Press Start 2P', monospace",
                textShadow: '2px 2px 0px #FFF',
              }}
            >
              BẮT ĐƯỢC CÁ RỒI!
            </h3>
            <p
              className="text-xs text-[#795653] font-bold mb-3"
              style={{ fontFamily: "'Tiny5', monospace" }}
            >
              Chúc mừng bà đã kéo thành công một chú cá béo múp! 🐟✨
            </p>

            {/* Fish Display Box (Render linh hoạt theo Rarity & Database) */}
            {(() => {
              const rarityCfg = getRarityConfig(caughtFishData.fish.rarity);
              return (
                <div
                  className="p-3.5 bg-[#FFF0F5] border-3 border-[#795653] rounded-none mb-4 flex flex-col items-center shadow-[3px_3px_0px_#795653]"
                  style={{
                    boxShadow: `3px 3px 0px #795653, 0 0 16px ${rarityCfg.borderColor}50`,
                  }}
                >
                  {/* Badge Rarity: Màu text thay đổi theo cấp độ (Trắng -> Xanh -> Tím -> Vàng) */}
                  <div
                    className="px-2.5 py-0.5 border-2 border-[#795653] text-[10px] font-black uppercase tracking-wider mb-2"
                    style={{
                      fontFamily: "'Tiny5', 'Press Start 2P', monospace",
                      backgroundColor: rarityCfg.bgBadge,
                      color: rarityCfg.textColor,
                      textShadow: rarityCfg.label === 'COMMON' ? '1px 1px 0px #795653' : '1px 1px 0px #000',
                    }}
                  >
                    {rarityCfg.tagText} ({caughtFishData.fish.dropRate}%)
                  </div>

                  {/* CON CÁ TRONG POPUP: DÙNG THẺ IMG VỚI IMAGE-RENDERING: PIXELATED */}
                  {/* <!-- CHÈN LINK ẢNH PIXEL CỦA BẠN VÀO ĐÂY --> */}
                  <div className="relative w-32 h-32 flex items-center justify-center my-1">
                    <img
                      src={caughtFishData.fish.imageSrc || activeFishPopupSprite}
                      alt={caughtFishData.fish.name}
                      className="max-w-full max-h-full object-contain select-none transition-transform animate-in zoom-in"
                      style={{ imageRendering: 'pixelated' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_PIXEL_FISH_PLACEHOLDER;
                      }}
                    />
                  </div>

                  {/* Tên cá */}
                  <h4
                    className="text-base font-black mt-1"
                    style={{
                      color: rarityCfg.nameColor,
                      fontFamily: "'Tiny5', 'Press Start 2P', monospace",
                      textShadow: '1px 1px 0px #FFF',
                    }}
                  >
                    {caughtFishData.fish.name}
                  </h4>

                  {/* Độ hiếm và Cân nặng (gắn thêm chữ 'g') */}
                  <div
                    className="flex items-center gap-2 text-xs font-black uppercase mt-1"
                    style={{ fontFamily: "'Tiny5', monospace" }}
                  >
                    <span
                      style={{
                        color: rarityCfg.textColor === '#FFFFFF' ? '#795653' : rarityCfg.textColor,
                        textShadow: rarityCfg.textColor !== '#FFFFFF' ? '1px 1px 0px #795653' : 'none',
                      }}
                    >
                      CẤP: {caughtFishData.fish.rarity}
                    </span>
                    <span className="text-[#795653]">•</span>
                    <span className="text-[#1E3A8A]">
                      CÂN NẶNG: {caughtFishData.weight}g
                    </span>
                  </div>

                  {/* Mô tả cá */}
                  <p
                    className="text-xs text-[#795653] mt-1.5 max-w-xs font-semibold leading-relaxed"
                    style={{ fontFamily: "'Tiny5', monospace" }}
                  >
                    {caughtFishData.fish.description}
                  </p>

                  {/* Nút hiển thị số Xu thưởng (VD: "+ 50 Xu Cá vào ví!" hoặc "+ 200 Xu Cá vào ví!") */}
                  <button
                    onClick={() => {
                      retroAudio.playConfirm();
                    }}
                    className="retro-pixel-btn mt-3 w-full py-2 bg-[#F7DDA0] hover:bg-[#ffe399] border-2 border-[#795653] rounded-none text-xs font-black text-[#795653] shadow-[2px_2px_0px_#795653] flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{ fontFamily: "'Tiny5', 'Press Start 2P', monospace" }}
                  >
                    <XuCaIcon className="w-4 h-4 object-contain inline-block" />
                    <span>+ {caughtFishData.rewardCoins} Xu Cá vào ví!</span>
                  </button>
                </div>
              );
            })()}

            {/* Action buttons (NÚT CÂU TIẾP ĐỔI SANG MÀU HỒNG DÂU / KEM SỮA, BỎ XANH LÁ) */}
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  retroAudio.playBlip(620, 0.05);
                  setGameState('idle');
                }}
                className="retro-pixel-btn flex-1 py-3 bg-[#FF8FAB] hover:bg-[#ff7599] text-white font-black text-xs cursor-pointer flex items-center justify-center gap-1"
                style={{
                  fontFamily: "'Tiny5', 'Press Start 2P', monospace",
                  textShadow: '1px 1px 0px #795653',
                }}
              >
                <span>CÂU TIẾP</span>
                <span>🎣</span>
              </button>
              <button
                onClick={() => {
                  retroAudio.playBlip(400, 0.05);
                  onBackToMap();
                }}
                className="retro-pixel-btn flex-1 py-3 bg-[#FFF9F4] hover:bg-[#FFE5EC] text-[#795653] font-black text-xs cursor-pointer flex items-center justify-center gap-1"
                style={{ fontFamily: "'Tiny5', 'Press Start 2P', monospace" }}
              >
                <span>VỀ BẢN ĐỒ</span>
                <span>🗺️</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 6. BỂ CÁ COMPENDIUM MODAL (DANH SÁCH 11 LOÀI CÁ & TỶ LỆ CÂU) ================= */}
      {isCompendiumOpen && (
        <div
          onClick={() => setIsCompendiumOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#795653]/65 backdrop-blur-xs animate-in fade-in overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-[#FFF9F4] border-4 border-[#795653] p-4 sm:p-5 shadow-[6px_6px_0px_#795653] rounded-none max-h-[90vh] flex flex-col cursor-default"
          >
            <div className="flex items-center justify-between border-b-2 border-[#795653] pb-2 mb-3">
              <h3
                className="text-sm font-black text-[#D6336C] flex items-center gap-1.5"
                style={{ fontFamily: "'Tiny5', 'Press Start 2P', monospace" }}
              >
                <span>🐟</span>
                <span>BỂ CÁ HỒ BONG BÓNG — TỶ LỆ XUẤT HIỆN</span>
              </h3>
              <button
                onClick={() => setIsCompendiumOpen(false)}
                className="retro-pixel-btn px-2.5 py-0.5 bg-[#FFE5EC] text-[#795653] font-black text-xs cursor-pointer"
                style={{ fontFamily: "'Tiny5', monospace" }}
              >
                ✕
              </button>
            </div>

            <p
              className="text-xs text-[#795653] mb-3 leading-relaxed"
              style={{ fontFamily: "'Tiny5', monospace" }}
            >
              Dưới đây là {effectiveFishList.length} loài cá cư ngụ tại Hồ Bong Bóng. Tỷ lệ xuất hiện (Drop Rate) được tính toán theo cơ chế trọng số ngẫu nhiên (Weighted Random).
            </p>

            {/* Fish List Grid */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {effectiveFishList.map((fish) => {
                const rCfg = getRarityConfig(fish.rarity);
                return (
                  <div
                    key={fish.id}
                    className="p-2.5 bg-white border-2 border-[#795653] rounded-none flex items-center gap-3 shadow-[2px_2px_0px_#795653]"
                  >
                    {/* Fish Image */}
                    <div className="w-16 h-16 bg-[#FFF0F5] border border-[#795653] flex items-center justify-center shrink-0">
                      <img
                        src={fish.imageSrc}
                        alt={fish.name}
                        className="w-14 h-14 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_PIXEL_FISH_PLACEHOLDER;
                        }}
                      />
                    </div>

                    {/* Fish info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-black"
                          style={{
                            color: rCfg.nameColor,
                            fontFamily: "'Tiny5', 'Press Start 2P', monospace",
                          }}
                        >
                          {fish.name}
                        </span>
                        <span
                          className="px-2 py-0.2 border border-[#795653] text-[9px] font-black uppercase"
                          style={{
                            backgroundColor: rCfg.bgBadge,
                            color: rCfg.textColor,
                            fontFamily: "'Tiny5', monospace",
                          }}
                        >
                          {rCfg.label} • {fish.dropRate}%
                        </span>
                      </div>
                      <p
                        className="text-[11px] text-[#795653] mt-0.5 line-clamp-2"
                        style={{ fontFamily: "'Tiny5', monospace" }}
                      >
                        {fish.description}
                      </p>
                      <div
                        className="flex items-center gap-3 text-[10px] text-[#795653] font-bold mt-1"
                        style={{ fontFamily: "'Tiny5', monospace" }}
                      >
                        <span>Cân nặng: {fish.weightMin}g - {fish.weightMax}g</span>
                        <span className="text-[#D6336C]">Thưởng: +{fish.xuReward} Xu</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= 7. ADMIN ASSET CUSTOMIZER MODAL (CHỈ ADMIN THẤY & LƯU PUBLIC) ================= */}
      {isAdmin && isAdminAssetModalOpen && (
        <div
          onClick={() => setIsAdminAssetModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#795653]/60 backdrop-blur-xs animate-in fade-in overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[#FFF9F4] border-4 border-[#795653] p-5 shadow-[6px_6px_0px_#795653] rounded-none max-h-[90vh] overflow-y-auto cursor-default"
          >
            <div className="flex items-center justify-between border-b-2 border-[#795653] pb-2 mb-3">
              <h3
                className="text-sm font-black text-[#D6336C] flex items-center gap-1.5"
                style={{ fontFamily: "'Tiny5', 'Press Start 2P', monospace" }}
              >
                <span>⚙️</span>
                <span>TÙY CHỈNH ASSET PIXEL (ADMIN)</span>
              </h3>
              <button
                onClick={() => setIsAdminAssetModalOpen(false)}
                className="retro-pixel-btn px-2 py-0.5 bg-[#FFE5EC] text-[#795653] font-black text-xs cursor-pointer"
                style={{ fontFamily: "'Tiny5', monospace" }}
              >
                ✕
              </button>
            </div>

            <p
              className="text-xs text-[#795653] mb-3 leading-relaxed"
              style={{ fontFamily: "'Tiny5', monospace" }}
            >
              Dán đường link ảnh đồ họa Pixel của bạn vào đây. Sau khi bấm <strong>"LƯU & CÔNG KHAI"</strong>, dữ liệu sẽ tự động lưu lên Firestore và hiển thị công khai cho mọi người chơi!
            </p>

            <div className="space-y-3">
              {/* Cat Sprite URL */}
              <div>
                <label
                  className="block text-xs font-black text-[#795653] mb-1"
                  style={{ fontFamily: "'Tiny5', monospace" }}
                >
                  🐱 LINK ẢNH MÈO CÂU CÁ (SPRITE):
                </label>
                <input
                  type="text"
                  value={customCatUrl}
                  onChange={(e) => setCustomCatUrl(e.target.value)}
                  placeholder="https://.../pixel-cat.png (để trống để dùng mặc định)"
                  className="w-full px-2.5 py-1.5 bg-white border-2 border-[#795653] text-xs font-mono rounded-none text-[#795653] focus:outline-none focus:border-[#D6336C]"
                />
              </div>

              {/* Dock Sprite URL */}
              <div>
                <label
                  className="block text-xs font-black text-[#795653] mb-1"
                  style={{ fontFamily: "'Tiny5', monospace" }}
                >
                  🪵 LINK ẢNH CẦU GỖ BẾN CÂU (SPRITE):
                </label>
                <input
                  type="text"
                  value={customDockUrl}
                  onChange={(e) => setCustomDockUrl(e.target.value)}
                  placeholder="https://.../pixel-wooden-pier.png (để trống để dùng cầu gỗ mặc định)"
                  className="w-full px-2.5 py-1.5 bg-white border-2 border-[#795653] text-xs font-mono rounded-none text-[#795653] focus:outline-none focus:border-[#D6336C]"
                />
              </div>

              {/* Default Fish Popup URL */}
              <div>
                <label
                  className="block text-xs font-black text-[#795653] mb-1"
                  style={{ fontFamily: "'Tiny5', monospace" }}
                >
                  🐟 LINK ẢNH CON CÁ (POPUP REWARD):
                </label>
                <input
                  type="text"
                  value={customFishUrl}
                  onChange={(e) => setCustomFishUrl(e.target.value)}
                  placeholder="https://.../pixel-fish.png (để trống để dùng theo bể cá)"
                  className="w-full px-2.5 py-1.5 bg-white border-2 border-[#795653] text-xs font-mono rounded-none text-[#795653] focus:outline-none focus:border-[#D6336C]"
                />
              </div>
            </div>

            {adminSaveMessage && (
              <div
                className={`mt-3 p-2 text-xs font-black rounded-none border-2 ${
                  adminSaveMessage.includes('Lỗi')
                    ? 'bg-[#FFE5EC] border-[#D6336C] text-[#D6336C]'
                    : 'bg-[#E8F5E9] border-[#2E7D32] text-[#2E7D32]'
                }`}
                style={{ fontFamily: "'Tiny5', monospace" }}
              >
                {adminSaveMessage}
              </div>
            )}

            {/* Modal Buttons */}
            <div className="flex gap-2.5 mt-4">
              <button
                onClick={handleSaveAdminAssets}
                disabled={isSavingAssets}
                className="retro-pixel-btn flex-1 py-2.5 bg-[#FF8FAB] hover:bg-[#ff7599] text-white font-black text-xs cursor-pointer flex items-center justify-center gap-1.5"
                style={{
                  fontFamily: "'Tiny5', 'Press Start 2P', monospace",
                  textShadow: '1px 1px 0px #795653',
                }}
              >
                <span>💾</span>
                <span>{isSavingAssets ? 'ĐANG LƯU...' : 'LƯU & CÔNG KHAI'}</span>
              </button>
              <button
                onClick={() => setIsAdminAssetModalOpen(false)}
                className="retro-pixel-btn px-4 py-2.5 bg-[#FFF9F4] hover:bg-[#FFE5EC] text-[#795653] font-black text-xs cursor-pointer"
                style={{ fontFamily: "'Tiny5', monospace" }}
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
