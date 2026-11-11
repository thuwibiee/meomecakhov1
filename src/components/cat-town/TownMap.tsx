import React, { useState, useEffect } from 'react';
import { CatTownUserProfile, CatTownConfig, CatBreed } from '../../types.ts';
import { PixelGameTitle } from './PixelGameTitle.tsx';
import { XuCaIcon } from '../XuCaIcon.tsx';
import { retroAudio } from './retroAudio.ts';


interface TownMapProps {
  userBalance: number;
  profile: CatTownUserProfile | null;
  config: CatTownConfig | null;
  isAdmin?: boolean;
  onSelectLocation: (loc: 'fishing' | 'grill' | 'house' | 'fortune') => void;
  onOpenInventory: () => void;
  onOpenShop: () => void;
  onExit: () => void;
  onOpenCatSelection?: () => void;
}

export interface TownLocation {
  id: 'fishing' | 'grill' | 'house' | 'fortune';
  name: string;
  subtitle: string;
  icon: string;
  image: string;
  imageStyle?: React.CSSProperties; // Custom style độc lập cho từng ảnh
  feeText: string;
  feeCoins: number;
  isFree: boolean;
  description: string;
  themeColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  mascotBreed: CatBreed;
  mascotTitle: string;
  mascotQuote: string;
  mascotEmoji: string;
}

// 4 explicit locations with exact images, styles, and custom arcade mascot lore
export const TOWN_LOCATIONS: TownLocation[] = [
  {
    id: 'fishing',
    name: 'HỒ BONG BÓNG',
    subtitle: 'Bến Câu Mèo & Thu Thập Cá',
    icon: '🎣',
    image: 'https://i.postimg.cc/yNsZX86Y/4-Picsart-Background-Remover.png',
    imageStyle: {
      width: '676.202px',
      height: '5026px',
      marginTop: '50px',
      marginLeft: '-17px',
      backgroundColor: '#92EEFF',
    },
    feeText: '20 Xu Cá / lượt',
    feeCoins: 20,
    isFree: false,
    description:
      'Hôm nay câu cá, ngày mai câu được đại gia.',
    themeColor: '#A9C5F2',
    badgeBg: '#EBF3FC',
    badgeBorder: '#0A5EB0',
    badgeText: '#0A5EB0',
    mascotBreed: 'Mèo Cam',
    mascotTitle: 'Cần Thủ Mèo Cam',
    mascotQuote: 'Hôm nay mặt hồ phẳng lặng, cá cắn câu lia lịa luôn sen ơi! 🎣',
    mascotEmoji: '🐟',
  },
  {
    id: 'grill',
    name: 'BẾP XÈO XÈO',
    subtitle: 'Góc Nướng Cá Canh Giờ',
    icon: '🔥',
    image: 'https://i.postimg.cc/43s9bx44/3-Picsart-Background-Remover-(1).png',
    imageStyle: {
      width: '711px',
      height: '1000px',
      marginTop: '-56px',
      marginLeft: '-54px',
      backgroundColor: '#C4A4DA',
    },
    feeText: '10 Xu Cá (kèm cá nguyên liệu)',
    feeCoins: 10,
    isFree: false,
    description:
      'Cá chín là thành công, cá cháy là phong cách.',
    themeColor: '#F7DDA0',
    badgeBg: '#FFF7E6',
    badgeBorder: '#B07D62',
    badgeText: '#B07D62',
    mascotBreed: 'Mèo Mướp',
    mascotTitle: 'Bếp Trưởng Mướp Mập',
    mascotQuote: 'Cá nướng vàng giòn xèo xèo, canh chuẩn giờ nhận bội thu Xu Cá nha! 🔥',
    mascotEmoji: '🍳',
  },
  {
    id: 'house',
    name: 'NHÀ MÈO',
    subtitle: 'Tổ Ấm Thú Cưng Riêng',
    icon: '🏡',
    image: 'https://i.postimg.cc/sgpWhhz3/6-Picsart-Background-Remover.png',
    imageStyle: {
      width: '811px',
      height: '628px',
      marginTop: '-199px',
      marginLeft: '15px',
    },
    feeText: 'Miễn phí',
    feeCoins: 0,
    isFree: true,
    description:
      'Đầu tư bất động sản chưa chắc lời, đầu tư nuôi mèo chắc chắn hết tiền.',
    themeColor: '#FF8FAB',
    badgeBg: '#FFE5EC',
    badgeBorder: '#D6336C',
    badgeText: '#D6336C',
    mascotBreed: 'Mèo Trắng',
    mascotTitle: 'Mèo Bé Ngoan',
    mascotQuote: 'Về nhà thôi sen ơi, phòng êm nệm ấm đang đợi sen vào decor nè! 🏡',
    mascotEmoji: '💖',
  },

  {
    id: 'fortune',
    name: 'LỀU BÓI MEO MEO',
    subtitle: 'Tiên Tri Thần Bí Vui Nhộn',
    icon: '🔮',
    image: 'https://i.postimg.cc/6QtvLp6G/5-Picsart-Background-Remover.png',
    imageStyle: {
      height: '669px',
      marginTop: '-52px',
      backgroundColor: '#C4A4DA',
    },
    feeText: 'Miễn phí (1 lượt / ngày)',
    feeCoins: 0,
    isFree: true,
    description:
      'Bói tình duyên, bói tài lộc, tiện thể bói xem hôm nay có được ăn cá không.',
    themeColor: '#E0AAFF',
    badgeBg: '#C4A4DA',
    badgeBorder: '#7209B7',
    badgeText: '#7209B7',
    mascotBreed: 'Mèo Tam Thể',
    mascotTitle: 'Tiên Tri Meo Meo',
    mascotQuote: 'Quả cầu pha lê báo hiệu hôm nay sen có vận đỏ như son đó! 🔮',
    mascotEmoji: '✨',
  },
];

export const TownMap: React.FC<TownMapProps> = ({
  userBalance,
  profile,
  config,
  isAdmin = false,
  onSelectLocation,
  onOpenInventory,
  onOpenShop,
  onExit,
  onOpenCatSelection,
}) => {
  // Screen state: 'start' (Start Screen) | 'selector' (Level Selector Arcade)
  const [currentScreen, setCurrentScreen] = useState<'start' | 'selector'>('start');
  // Carousel index for Level Selector (0 to 3)
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  // Screen transition animation state
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  // Stage switch reveal animation
  const [isStageRevealing, setIsStageRevealing] = useState<boolean>(false);
  // Day / Sunset / Night ambiance state
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('day');
  // Sound muted state
  const [isMuted, setIsMuted] = useState<boolean>(() => retroAudio.getIsMuted());

  const activeLocation = TOWN_LOCATIONS[currentIndex];

  // Navigate to previous location
  const handlePrev = () => {
    retroAudio.playStageSwitch();
    triggerStageReveal();
    setCurrentIndex((prev) => (prev === 0 ? TOWN_LOCATIONS.length - 1 : prev - 1));
  };

  // Navigate to next location
  const handleNext = () => {
    retroAudio.playStageSwitch();
    triggerStageReveal();
    setCurrentIndex((prev) => (prev === TOWN_LOCATIONS.length - 1 ? 0 : prev + 1));
  };

  // Touch & Swipe gestures on mobile & tablet
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setIsSwiping(true);
    setSwipeOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || !isSwiping) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX;
    const diffY = currentY - (touchStartY || currentY);

    // If user is scrolling vertically, don't drag
    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffX) < 15) {
      return;
    }
    // Clamped elastic offset
    const clamped = Math.max(-40, Math.min(40, diffX));
    setSwipeOffset(clamped);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) {
      setIsSwiping(false);
      setSwipeOffset(0);
      return;
    }
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - (touchStartY || touchEndY);

    if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
    setIsSwiping(false);
    setSwipeOffset(0);
  };

  // Jump directly to a stage
  const handleSelectStageIndex = (idx: number) => {
    if (idx === currentIndex) return;
    retroAudio.playStageSwitch();
    triggerStageReveal();
    setCurrentIndex(idx);
  };

  // Trigger stage reveal effect
  const triggerStageReveal = () => {
    setIsStageRevealing(true);
    setTimeout(() => {
      setIsStageRevealing(false);
    }, 280);
  };

  // Handle entering town from Start Screen
  const handleStartGame = () => {
    retroAudio.playConfirm();
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen('selector');
      setIsTransitioning(false);
      triggerStageReveal();
    }, 250);
  };

  // Enter active location
  const handleEnterLocation = () => {
    retroAudio.playConfirm();
    onSelectLocation(activeLocation.id);
  };

  // Toggle ambient day/night
  const handleToggleTimeOfDay = () => {
    retroAudio.playBlip(700, 0.05);
    setTimeOfDay((prev) => {
      if (prev === 'day') return 'sunset';
      if (prev === 'sunset') return 'night';
      return 'day';
    });
  };

  // Toggle audio
  const handleToggleAudio = () => {
    const nextMuted = retroAudio.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      retroAudio.playBlip(600, 0.08);
    }
  };

  // Keyboard navigation support for retro console feeling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentScreen === 'start') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartGame();
        }
      } else if (currentScreen === 'selector') {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          handlePrev();
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          handleNext();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleEnterLocation();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          retroAudio.playBlip(320, 0.06);
          setCurrentScreen('start');
        } else if (e.key === '1') {
          handleSelectStageIndex(0);
        } else if (e.key === '2') {
          handleSelectStageIndex(1);
        } else if (e.key === '3') {
          handleSelectStageIndex(2);
        } else if (e.key === '4') {
          handleSelectStageIndex(3);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, currentIndex, activeLocation.id]);

  // Ambient lighting overlay styles based on time of day
  const getAmbianceFilter = () => {
    if (timeOfDay === 'sunset') {
      return 'brightness(0.95) saturate(1.15) hue-rotate(-8deg)';
    }
    if (timeOfDay === 'night') {
      return 'brightness(0.82) saturate(0.9) hue-rotate(25deg)';
    }
    return 'none';
  };

  return (
    <div
      className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* ================= TOP HUD HEADER ================= */}
      <header className="w-full bg-[#FFF9F4] border-4 border-[#795653] rounded-2xl p-2.5 sm:p-3 mb-3 flex items-center justify-between shadow-[4px_4px_0px_#795653] z-20">
        {/* Left: Exit button & Cat Profile */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              retroAudio.playBlip(360, 0.06);
              onExit();
            }}
            className="pixel-btn-press flex items-center gap-1.5 px-3 py-1.5 bg-[#FFE5EC] hover:bg-[#FFB3C6] text-[#795653] font-bold text-xs rounded-xl border-2 border-[#795653] cursor-pointer"
            style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
          >
            <span>←</span>
            <span>VỀ TIỆM CÁ</span>
          </button>

          {profile && (
            <button
              onClick={() => onOpenCatSelection && onOpenCatSelection()}
              title="Bấm để đổi bé mèo hoặc đổi tên mèo"
              className="pixel-btn-press hidden sm:flex items-center gap-2 px-3 py-1 bg-[#FFFDF7] hover:bg-[#FFE5EC] border-2 border-[#795653] rounded-xl text-xs font-bold text-[#795653] cursor-pointer shadow-[2px_2px_0px_#795653]"
            >
              <img
                src={profile.cat.avatarUrl || '/assets/cats/cat_02.png'}
                alt={profile.cat.name}
                className="w-5 h-5 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
              <span
                className="text-[#D6336C] font-black"
                style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
              >
                {profile.cat.name}
              </span>
              <span className="text-[10px] text-[#795653]/60">✏️</span>
            </button>
          )}
        </div>

        {/* Center: Screen mode badge (Selector only) */}
        {currentScreen === 'selector' && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[#F7DDA0] border-2 border-[#795653] rounded-xl shadow-[2px_2px_0px_#795653]">
            <span className="text-xs">🎮</span>
            <span
              className="text-xs font-black text-[#795653]"
              style={{ fontFamily: "'Tiny5', monospace" }}
            >
              STAGE [{currentIndex + 1}/4]: {activeLocation.name}
            </span>
          </div>
        )}

        {/* Right: Sound, Day/Night toggle, Balance & Inventory/Shop Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Audio Mute/Unmute */}
          <button
            onClick={handleToggleAudio}
            title={isMuted ? 'Bật âm thanh hiệu ứng' : 'Tắt âm thanh hiệu ứng'}
            className="pixel-btn-press px-2 py-1.5 bg-[#FFFDF7] hover:bg-[#FFE5EC] text-[#795653] font-bold text-xs rounded-xl border-2 border-[#795653] cursor-pointer"
          >
            <span>{isMuted ? '🔇' : '🔊'}</span>
          </button>

          {/* Time of Day Toggle */}
          <button
            onClick={handleToggleTimeOfDay}
            title={`Thời gian: ${timeOfDay === 'day' ? 'Ban Ngày' : timeOfDay === 'sunset' ? 'Hoàng Hôn' : 'Ban Đêm'}`}
            className="pixel-btn-press px-2 py-1.5 bg-[#FFFDF7] hover:bg-[#F7DDA0] text-[#795653] font-bold text-xs rounded-xl border-2 border-[#795653] cursor-pointer"
          >
            <span>{timeOfDay === 'day' ? '☀️' : timeOfDay === 'sunset' ? '🌅' : '🌙'}</span>
          </button>

          <button
            onClick={() => {
              retroAudio.playBlip(550, 0.05);
              onOpenInventory();
            }}
            title="Túi Đồ Thị Trấn"
            className="pixel-btn-press px-2.5 py-1.5 bg-[#F7DDA0] hover:bg-[#ffe39c] text-[#795653] font-bold text-xs rounded-xl border-2 border-[#795653] flex items-center gap-1 cursor-pointer"
            style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
          >
            <span>🎒</span>
            <span className="hidden sm:inline text-[11px] font-black">TÚI ĐỒ</span>
          </button>

          <button
            onClick={() => {
              retroAudio.playBlip(580, 0.05);
              onOpenShop();
            }}
            title="Cửa Hàng Nội Thất Thị Trấn"
            className="pixel-btn-press px-2.5 py-1.5 bg-[#FF8FAB] hover:bg-[#f87898] text-white font-bold text-xs rounded-xl border-2 border-[#795653] flex items-center gap-1 cursor-pointer"
            style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
          >
            <span>🪑</span>
            <span className="hidden sm:inline text-[11px] font-black">SHOP</span>
          </button>

          {/* User Balance */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-white border-2 border-[#795653] rounded-xl shadow-[2px_2px_0px_#795653]">
            <XuCaIcon className="w-4 h-4 object-contain inline-block" />
            <span
              className="text-xs sm:text-sm font-black text-[#0A5EB0] tabular-nums"
              style={{ fontFamily: "'Tiny5', monospace" }}
            >
              {userBalance.toLocaleString('vi-VN')}
            </span>
          </div>
        </div>
      </header>

      {/* ================= MAIN RETRO STAGE CONTAINER ================= */}
      <div
        className={`relative w-full rounded-3xl border-4 sm:border-6 border-[#795653] shadow-[8px_8px_0px_#795653] overflow-hidden transition-all duration-300 ${
          isTransitioning ? 'opacity-0 scale-98' : 'opacity-100 scale-100'
        }`}
        style={{
          backgroundImage: `url('/assets/aistudio/image_e49acb89.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          minHeight: '620px',
          filter: getAmbianceFilter(),
        }}
      >
        {/* Pixel Scanline & Dithering Overlay for arcade vibe */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10 z-10"
          style={{
            backgroundImage: `linear-gradient(rgba(121, 86, 83, 0.25) 50%, transparent 50%)`,
            backgroundSize: '100% 4px',
          }}
        />

        {/* Ambient environmental particles (Sakura petals & sparkles) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          <div
            className="absolute top-2 left-[12%] text-sm opacity-80 animate-petal-fall"
            style={{ animationDelay: '0s' }}
          >
            🌸
          </div>
          <div
            className="absolute top-1 left-[38%] text-xs opacity-75 animate-petal-fall"
            style={{ animationDelay: '2.5s' }}
          >
            🌸
          </div>
          <div
            className="absolute top-3 right-[24%] text-sm opacity-85 animate-petal-fall"
            style={{ animationDelay: '4.2s' }}
          >
            🌸
          </div>
          <div
            className="absolute top-2 right-[8%] text-xs opacity-70 animate-petal-fall"
            style={{ animationDelay: '1.2s' }}
          >
            🌸
          </div>
          {timeOfDay === 'night' && (
            <>
              <div className="absolute top-8 left-[22%] text-xs animate-star-twinkle">✨</div>
              <div className="absolute top-16 right-[30%] text-xs animate-star-twinkle" style={{ animationDelay: '0.8s' }}>⭐</div>
              <div className="absolute top-12 right-[15%] text-xs animate-star-twinkle" style={{ animationDelay: '1.5s' }}>✨</div>
            </>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SCREEN 1: START SCREEN (MÀN HÌNH BẮT ĐẦU)                     */}
        {/* ------------------------------------------------------------- */}
        {currentScreen === 'start' && (
          <div className="relative w-full min-h-[620px] flex flex-col items-center justify-between p-6 sm:p-10 select-none">
            {/* Center: Main Retro Game Title */}
            <div className="flex flex-col items-center text-center my-auto py-4">
              {/* "WELCOME TO" - updated with focused styles */}
              <div
                className="font-black text-[#795653] tracking-[0.3em] uppercase bg-[#FFF9F4]/90 px-5 rounded-xl border-2 border-[#795653] shadow-[2px_2px_0px_#795653] flex items-center justify-center"
                style={{
                  fontFamily: "'Tiny5 Duo', 'Tiny5', monospace",
                  marginTop: '5px',
                  marginBottom: '85px',
                  width: '328.505px',
                  height: '50.9358px',
                  fontSize: '20px',
                  paddingTop: '5px',
                  paddingLeft: '19px',
                }}
              >
                ★ WELCOME TO ★
              </div>


              {/* PIXEL GAME TITLE ANIMATION – THỊ TRẤN CÁ MÈO */}
              <PixelGameTitle
                className="my-3 sm:my-5"
                onTitleClick={handleStartGame}
              />
            </div>


            {/* Bottom Action Button: "VÀO THỊ TRẤN" with tactile Button Press effect */}
            <div className="flex flex-col items-center gap-2 mb-6">
              <button
                onClick={handleStartGame}
                className="pixel-btn-press-lg px-8 sm:px-12 py-3.5 sm:py-4 bg-[#FF8FAB] hover:bg-[#ff7599] text-white font-black text-base sm:text-xl rounded-2xl border-4 border-[#795653] cursor-pointer flex items-center gap-2 select-none"
                style={{
                  fontFamily: "'Tiny5', monospace",
                }}
              >
                <span>VÀO THỊ TRẤN</span>
                <span className="text-xl sm:text-2xl animate-pulse">▶</span>
              </button>

              <span
                className="text-[10px] sm:text-xs font-bold text-[#795653]/90 bg-[#FFF9F4]/90 px-3 py-1 rounded-lg border border-[#795653]/30 shadow-2xs"
                style={{
                  fontFamily: "'Tiny5', monospace",
                  marginTop: '28px',
                  marginBottom: '-10px',
                }}
              >
                [ Bấm nút hoặc nhấn phím ENTER để bắt đầu ]
              </span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SCREEN 2: LEVEL SELECTOR ARCADE (CHỌN KHU VỰC CHƠI)           */}
        {/* ------------------------------------------------------------- */}
        {currentScreen === 'selector' && (
          <div className="relative w-full min-h-[580px] sm:min-h-[620px] bg-[#FFF9F4]/85 backdrop-blur-xs flex flex-col items-center justify-between px-1.5 py-3 sm:p-5 select-none z-10">
            {/* Top Row: Back to Start Screen & Arcade Stage Indicator */}
            <div className="w-full flex items-center justify-between mb-2 px-1 sm:px-0">
              <button
                onClick={() => {
                  retroAudio.playBlip(340, 0.06);
                  setCurrentScreen('start');
                }}
                className="pixel-btn-press px-2.5 sm:px-3 py-1.5 bg-[#FFFDF7] hover:bg-[#FFE5EC] text-[#795653] font-bold text-[11px] sm:text-xs rounded-xl border-2 border-[#795653] flex items-center gap-1 cursor-pointer shrink-0"
                style={{ fontFamily: "'Tiny5', monospace" }}
              >
                <span>◀</span>
                <span>VỀ MÀN HÌNH CHÍNH</span>
              </button>

              {/* Stage Selection Indicator Badge */}
              <div className="flex items-center gap-1.5 bg-[#FFFDF7] px-2.5 sm:px-3 py-1 rounded-xl border-2 border-[#795653] shadow-[2px_2px_0px_#795653] shrink-0">
                <span className="text-xs">🚩</span>
                <span
                  className="text-xs font-black text-[#D6336C]"
                  style={{ fontFamily: "'Tiny5', monospace" }}
                >
                  STAGE {currentIndex + 1} / 4
                </span>
              </div>
            </div>

            {/* Central Stage Carousel with Arcade Controls & Swipe */}
            <div
              className="w-full flex items-center justify-center lg:gap-5 my-auto py-1"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Left Arrow Button: "◀" with retro 3D button press (ONLY ON DESKTOP, HIDDEN ON MOBILE & TABLET) */}
              <button
                onClick={handlePrev}
                title="Khu vực trước đó (Phím Mũi tên trái hoặc phím A)"
                className="hidden lg:flex pixel-btn-press shrink-0 items-center justify-center w-14 h-14 bg-[#FFFDF7] hover:bg-[#F7DDA0] active:scale-95 text-[#795653] font-black rounded-2xl border-4 border-[#795653] cursor-pointer shadow-[3px_3px_0px_#795653] select-none z-20"
                style={{ fontFamily: "'Tiny5', monospace" }}
                aria-label="Khu vực trước đó"
              >
                <span className="text-2xl leading-none">◀</span>
              </button>

              {/* Central Main Stage Frame (Active Location) */}
              <div
                className="w-full max-w-sm sm:max-w-md lg:max-w-lg flex flex-col items-center select-none touch-pan-y"
                style={{
                  transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined,
                  transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
              >
                {/* 1. Khung Hình Ảnh Trung Tâm với Pixel Reveal effect & animated preview */}
                <div
                  className={`relative w-full aspect-[4/3] max-h-[240px] sm:max-h-[310px] bg-[#FFFDF7] border-3 sm:border-5 border-[#795653] rounded-2xl shadow-[4px_4px_0px_#795653] sm:shadow-[6px_6px_0px_#795653] overflow-hidden flex items-center justify-center p-1 sm:p-2 transition-all ${
                    isStageRevealing ? 'animate-stage-reveal' : ''
                  }`}
                  style={{
                    backgroundColor: activeLocation.badgeBg,
                  }}
                >
                  {/* Decorative pixel corner brackets */}
                  <div className="absolute top-2 left-2 text-xs font-black text-[#795653]/60 pointer-events-none select-none z-20">
                    ┌
                  </div>
                  <div className="absolute top-2 right-2 text-xs font-black text-[#795653]/60 pointer-events-none select-none z-20">
                    ┐
                  </div>
                  <div className="absolute bottom-2 left-2 text-xs font-black text-[#795653]/60 pointer-events-none select-none z-20">
                    └
                  </div>
                  <div className="absolute bottom-2 right-2 text-xs font-black text-[#795653]/60 pointer-events-none select-none z-20">
                    ┘
                  </div>

                  {/* Location-specific Animated Environment Overlays */}
                  {activeLocation.id === 'fishing' && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                      {/* Floating Bubbles */}
                      <div className="absolute bottom-4 left-6 text-base animate-bubble-rise" style={{ animationDelay: '0s' }}>
                        🫧
                      </div>
                      <div className="absolute bottom-6 left-20 text-xs animate-bubble-rise" style={{ animationDelay: '1.4s' }}>
                        🫧
                      </div>
                      <div className="absolute bottom-2 right-12 text-sm animate-bubble-rise" style={{ animationDelay: '0.7s' }}>
                        🫧
                      </div>
                      <div className="absolute bottom-5 right-24 text-xs animate-bubble-rise" style={{ animationDelay: '2.1s' }}>
                        🫧
                      </div>
                      {/* Water ripple badge */}
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-[#0A5EB0]/80 text-white text-[10px] rounded-md font-bold" style={{ fontFamily: "'Tiny5', monospace" }}>
                        💧 Nước sâu mát rượi
                      </div>
                    </div>
                  )}

                  {activeLocation.id === 'grill' && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                      {/* Smoke Puffs */}
                      <div className="absolute bottom-12 left-1/3 text-sm animate-smoke-puff" style={{ animationDelay: '0s' }}>
                        💨
                      </div>
                      <div className="absolute bottom-14 right-1/3 text-xs animate-smoke-puff" style={{ animationDelay: '1.2s' }}>
                        💨
                      </div>
                      <div className="absolute top-4 right-8 text-xs text-amber-500 animate-pulse font-bold">
                        ⚡ Than hồng xèo xèo
                      </div>
                    </div>
                  )}

                  {activeLocation.id === 'house' && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                      {/* Floating Hearts & Sleep Zzz */}
                      <div className="absolute top-4 left-6 text-sm animate-pixel-bob text-pink-500">
                        💖
                      </div>
                      <div className="absolute top-6 right-10 text-xs animate-pixel-bob text-pink-400" style={{ animationDelay: '0.8s' }}>
                        💤
                      </div>
                      <div className="absolute bottom-3 left-3 text-[10px] px-2 py-0.5 bg-[#D6336C]/80 text-white rounded-md font-bold" style={{ fontFamily: "'Tiny5', monospace" }}>
                        🛋️ Tổ ấm hạnh phúc
                      </div>
                    </div>
                  )}

                  {activeLocation.id === 'fortune' && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                      {/* Mystic Twinkling Stars */}
                      <div className="absolute top-5 left-10 text-xs animate-star-twinkle text-purple-600">
                        ✨
                      </div>
                      <div className="absolute top-8 right-12 text-sm animate-star-twinkle text-amber-400" style={{ animationDelay: '0.9s' }}>
                        ⭐
                      </div>
                      <div className="absolute bottom-4 left-6 text-xs animate-star-twinkle text-pink-400" style={{ animationDelay: '1.4s' }}>
                        🔮
                      </div>
                    </div>
                  )}

                  {/* TÁCH RIÊNG 4 ẢNH CHO 4 KHU VỰC VỚI STYLE ĐỘC LẬP TỪNG ẢNH */}
                  <div
                    className="w-full h-full flex items-center justify-center overflow-hidden"
                    style={{
                      backgroundColor: activeLocation.id === 'fortune' ? '#C4A4DA' : undefined,
                    }}
                  >
                    {/* 1. KHU VỰC 1: HỒ BONG BÓNG (Câu cá) */}
                    {activeLocation.id === 'fishing' && (
                      <img
                        id="town-img-fishing"
                        data-location="fishing"
                        src={activeLocation.image}
                        alt="Hồ Bong Bóng"
                        className="max-w-none object-contain object-center scale-[1.2] hover:scale-[1.25] transition-transform duration-300 filter drop-shadow-md select-none"
                        style={{
                          width: '676.202px',
                          height: '5026px',
                          marginTop: '50px',
                          marginLeft: '-17px',
                          backgroundColor: '#2790D5',
                          backgroundImage: "url('https://i.postimg.cc/sXGV8Jzt/250f20bffe240524ae135ab7ffa30275.gif')",
                          backgroundSize: '180px 180px',
                          backgroundRepeat: 'repeat',
                          imageRendering: 'pixelated',
                          transformOrigin: 'center center',
                          ...activeLocation.imageStyle,
                        }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://placehold.co/400x300/FFF9F4/795653?text=Ho+Bong+Bong';
                        }}
                      />
                    )}

                    {/* 2. KHU VỰC 2: BẾP XÈO XÈO (Nướng cá) */}
                    {activeLocation.id === 'grill' && (
                      <img
                        id="town-img-grill"
                        data-location="grill"
                        src={activeLocation.image}
                        alt="Bếp Xèo Xèo"
                        className="max-w-none object-contain object-center scale-[1.2] hover:scale-[1.25] transition-transform duration-300 filter drop-shadow-md select-none"
                        style={{
                          width: '711px',
                          height: '1000px',
                          marginTop: '-56px',
                          marginLeft: '-54px',
                          backgroundColor: '#C4A4DA',
                          imageRendering: 'pixelated',
                          transformOrigin: 'center center',
                          ...activeLocation.imageStyle,
                        }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://placehold.co/400x300/FFF9F4/795653?text=Bep+Xeo+Xeo';
                        }}
                      />
                    )}

                    {/* 3. KHU VỰC 3: NHÀ MÈO (Nhà riêng & Thú cưng) */}
                    {activeLocation.id === 'house' && (
                      <img
                        id="town-img-house"
                        data-location="house"
                        src={activeLocation.image}
                        alt="Nhà Mèo"
                        className="max-w-none object-contain object-center scale-[1.2] hover:scale-[1.25] transition-transform duration-300 filter drop-shadow-md select-none"
                        style={{
                          width: '811px',
                          height: '628px',
                          marginTop: '-199px',
                          marginLeft: '15px',
                          imageRendering: 'pixelated',
                          transformOrigin: 'center center',
                          ...activeLocation.imageStyle,
                        }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://placehold.co/400x300/FFF9F4/795653?text=Nha+Meo';
                        }}
                      />
                    )}

                    {/* 4. KHU VỰC 4: LỀU BÓI MEO MEO (Tiên tri) */}
                    {activeLocation.id === 'fortune' && (
                      <img
                        id="town-img-fortune"
                        data-location="fortune"
                        src={activeLocation.image}
                        alt="Lều Bói Meo Meo"
                        className="max-w-none object-contain object-center scale-[1.2] hover:scale-[1.25] transition-transform duration-300 filter drop-shadow-md select-none"
                        style={{
                          height: '669px',
                          marginTop: '-52px',
                          backgroundColor: '#C4A4DA',
                          imageRendering: 'pixelated',
                          transformOrigin: 'center center',
                          ...activeLocation.imageStyle,
                        }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://placehold.co/400x300/FFF9F4/795653?text=Leu+Boi';
                        }}
                      />
                    )}
                  </div>

                  {/* Floating Tag Badge top-right with active stage tag */}
                  <div
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-[#FFF9F4]/95 border-2 border-[#795653] rounded-lg text-[10px] sm:text-xs font-black shadow-[2px_2px_0px_#795653] z-20 flex items-center gap-1"
                    style={{
                      fontFamily: "'Tiny5', monospace",
                      color: activeLocation.badgeBorder,
                    }}
                  >
                    <span>{activeLocation.icon}</span>
                    <span>
                      {activeLocation.id === 'house'
                        ? 'TỔ ẤM MÈO'
                        : `STAGE ${currentIndex + 1}`}
                    </span>
                  </div>
                </div>

                {/* 2. Stage Pagination Dots / Indicators (Tap or Swipe to change stage) */}
                <div className="flex items-center justify-center gap-2 mt-2 mb-0.5">
                  {TOWN_LOCATIONS.map((loc, idx) => (
                    <button
                      key={loc.id}
                      onClick={() => handleSelectStageIndex(idx)}
                      className={`transition-all duration-300 rounded-full cursor-pointer flex items-center justify-center ${
                        currentIndex === idx
                          ? 'w-7 h-2.5 bg-[#FF8FAB] border-2 border-[#795653] shadow-[1px_1px_0px_#795653]'
                          : 'w-2.5 h-2.5 bg-white/90 hover:bg-[#FFE5EC] border-2 border-[#795653]/50'
                      }`}
                      title={`${loc.icon} ${loc.name}`}
                      aria-label={`Chuyển đến ${loc.name}`}
                    />
                  ))}
                </div>

                {/* Mobile / Tablet Swipe Hint */}
                <div className="lg:hidden flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-bold text-[#795653]/70 mb-1" style={{ fontFamily: "'Tiny5', monospace" }}>
                  <span className="animate-pulse">‹</span>
                  <span>Vuốt trái / phải để đổi game</span>
                  <span className="animate-pulse">›</span>
                </div>

                {/* 3. Bảng Thông Tin (Info Panel - Arcade Style) */}
                <div className="w-full mt-1.5 sm:mt-2 bg-[#FFF9F4] border-3 sm:border-4 border-[#795653] rounded-2xl shadow-[4px_4px_0px_#795653] sm:shadow-[5px_5px_0px_#795653] p-2.5 sm:p-4 flex flex-col items-center text-center">
                  {/* Tên Khu Vực */}
                  <h2
                    className="text-base sm:text-xl font-black text-[#D6336C] tracking-wide flex items-center justify-center gap-1.5"
                    style={{ fontFamily: "'Tiny5', monospace" }}
                  >
                    <span>{activeLocation.icon}</span>
                    <span style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }} className="text-xl sm:text-[25px] leading-tight">
                      {activeLocation.name}
                    </span>
                  </h2>

                  {/* Dòng Giới Thiệu */}
                  <p
                    className="mt-1 text-xs sm:text-sm text-[#795653] font-bold leading-relaxed max-w-sm"
                    style={{ fontFamily: "'Tiny5', monospace" }}
                  >
                    {activeLocation.description}
                  </p>

                  {/* Phí Vào Cửa (Chỉ hiển thị cho các khu vực có phí / lượt chơi, bỏ hoàn toàn khung trạng thái ở Nhà Mèo) */}
                  {activeLocation.id !== 'house' && (
                    <div className="mt-2 px-3 py-1 bg-white border-2 border-[#795653] rounded-xl shadow-[2px_2px_0px_#795653] flex items-center gap-1.5">
                      <XuCaIcon className="w-4 h-4 object-contain inline-block shrink-0" />
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-md ${
                          activeLocation.isFree
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-400'
                            : 'bg-[#FFF2D6] text-[#B07D62] border border-[#795653]/30'
                        }`}
                        style={{ fontFamily: "'Tiny5', monospace" }}
                      >
                        {activeLocation.feeText}
                      </span>
                    </div>
                  )}

                  {/* Nút Xác Nhận Chơi (Action Button with Retro Button Press) */}
                  <button
                    onClick={handleEnterLocation}
                    className="pixel-btn-press mt-2.5 sm:mt-3 w-full sm:w-auto px-6 sm:px-12 py-2 sm:py-3 bg-[#FF8FAB] hover:bg-[#ff7599] text-white font-black text-xs sm:text-base rounded-xl border-3 sm:border-4 border-[#795653] cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 select-none"
                    style={{
                      fontFamily: "'Tiny5 Duo', 'Tiny5', monospace",
                    }}
                  >
                    <span className="text-sm sm:text-[18px]">
                      {activeLocation.id === 'house' ? 'VÀO NHÀ MÈO' : 'VÀO KHU VỰC'}
                    </span>
                    <span className="text-sm sm:text-lg animate-pulse">▶</span>
                  </button>
                </div>
              </div>

              {/* Right Arrow Button: "▶" with retro 3D button press (ONLY ON DESKTOP, HIDDEN ON MOBILE & TABLET) */}
              <button
                onClick={handleNext}
                title="Khu vực kế tiếp (Phím Mũi tên phải hoặc phím D)"
                className="hidden lg:flex pixel-btn-press shrink-0 items-center justify-center w-14 h-14 bg-[#FFFDF7] hover:bg-[#F7DDA0] active:scale-95 text-[#795653] font-black rounded-2xl border-4 border-[#795653] cursor-pointer shadow-[3px_3px_0px_#795653] select-none z-20"
                style={{ fontFamily: "'Tiny5', monospace" }}
                aria-label="Khu vực kế tiếp"
              >
                <span className="text-2xl leading-none">▶</span>
              </button>
            </div>

            {/* Bottom Keyboard & Touch Tip */}
            <footer className="mt-2 text-center text-[10px] sm:text-xs text-[#795653]/80 font-bold bg-[#FFF9F4] px-3 py-1 rounded-lg border border-[#795653]/30 max-w-full" style={{ fontFamily: "'Tiny5', monospace" }}>
              <span className="lg:hidden">💡 Lướt trái / phải để chọn game muốn chơi · Chạm nút để vào chơi</span>
              <span className="hidden lg:inline">💡 Phím tắt: [ ◀ / ▶ ] hoặc [ A / D ] chuyển khu · [ ENTER ] vào chơi · [ ESC ] màn hình chính</span>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};
