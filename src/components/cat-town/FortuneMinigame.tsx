import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CatTownFortune, CatTownUserProfile } from '../../types.ts';
import { firebaseApi } from '../../firebase.ts';
import { XuCaIcon } from '../XuCaIcon.tsx';
import { retroAudio } from './retroAudio.ts';

interface FortuneMinigameProps {
  authToken: string | null;
  profile: CatTownUserProfile | null;
  userBalance: number;
  onBalanceUpdated: (newBal: number) => void;
  onRefreshProfile: () => void;
  onBackToMap: () => void;
  onOpenAuth: () => void;
}

// Background Image for Fortune Tent
const FORTUNE_TENT_BG_URL = 'https://i.postimg.cc/dQGfYSVy/2af1fa28-5a1e-44f6-951d-db9cec602a17.png';

// Witch Cat Sprite Sheet provided by user
const WITCH_CAT_SHEET_URL = 'https://i.postimg.cc/c44vS2BB/99f3fe6c-4aae-4883-8b5a-965b0942eec7.png';

// 10 Distinct Witch Cat Pose Names
const WITCH_CAT_POSES = [
  { id: 1, name: 'Phù Thủy Tập Trung 🔮' },
  { id: 2, name: 'Phù Thủy Cười Tủm Tỉm 🧹' },
  { id: 3, name: 'Phù Thủy Đăm Chiêu ⭐' },
  { id: 4, name: 'Phù Thủy Mèo ✨' },
  { id: 5, name: 'Phù Thủy Nhìn Cầu Pha Lê 💎' },
  { id: 6, name: 'Phù Thủy Kinh Ngạc 😮' },
  { id: 7, name: 'Phù Thủy Lấp Lánh 🌟' },
  { id: 8, name: 'Phù Thủy Thì Thầm 📜' },
  { id: 9, name: 'Phù Thủy Cát Tường 🍀' },
  { id: 10, name: 'Phù Thủy Mơ Màng 🌙' },
];

// Exact pixel-perfect bounding boxes for the 10 witch cat poses extracted from PNG analysis
const WITCH_CAT_BOUNDING_BOXES = [
  { x1: 81, y1: 19, x2: 386, y2: 352 },  // Cat #1
  { x1: 472, y1: 19, x2: 808, y2: 342 }, // Cat #2
  { x1: 896, y1: 23, x2: 1206, y2: 348 },// Cat #3
  { x1: 29, y1: 400, x2: 411, y2: 669 }, // Cat #4
  { x1: 512, y1: 382, x2: 811, y2: 670 },// Cat #5
  { x1: 895, y1: 382, x2: 1204, y2: 682 },// Cat #6
  { x1: 38, y1: 713, x2: 288, y2: 1025 },// Cat #7
  { x1: 356, y1: 716, x2: 606, y2: 1023 },// Cat #8
  { x1: 627, y1: 724, x2: 959, y2: 1044 },// Cat #9
  { x1: 974, y1: 713, x2: 1251, y2: 1019 },// Cat #10
];

/**
 * Dedicated Canvas Slicer Component:
 * Uses pixel-exact coordinates to slice the 10-witch-cat sheet into 10 perfectly isolated,
 * zero-bleed square images without any adjacent sprite overlap or bleed.
 */
const WitchCatCanvasSprite: React.FC<{ poseIndex: number; className?: string }> = ({ poseIndex, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = WITCH_CAT_SHEET_URL;

    img.onload = () => {
      const normIndex = Math.abs(poseIndex) % WITCH_CAT_BOUNDING_BOXES.length;
      const box = WITCH_CAT_BOUNDING_BOXES[normIndex];

      const sx = box.x1;
      const sy = box.y1;
      const sw = box.x2 - box.x1;
      const sh = box.y2 - box.y1;

      // Draw onto square canvas frame (280x280)
      canvas.width = 280;
      canvas.height = 280;

      ctx.clearRect(0, 0, 280, 280);
      ctx.imageSmoothingEnabled = false;

      // Fit into square frame maintaining aspect ratio with centered padding
      const scale = Math.min(260 / sw, 260 / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      const dx = (280 - dw) / 2;
      const dy = (280 - dh) / 2;

      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    };
  }, [poseIndex]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full object-contain ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

// Witty Witch Cat Speech Quotes (Hệ thống câu thoại hóm hỉnh)
const WITCH_CAT_QUOTES = [
  'Meow~ Hôm nay muốn hỏi chuyện gì?',
  'Đưa Xu Cá đây... à nhầm, đưa tay đây mèo xem!',
  'Mèo thấy một tương lai rất sáng... hình như là cá nướng.',
  'Đừng lo, vận mệnh của bạn đang nằm trong chân mèo!',
  'Chào mừng đến với nơi vận mệnh được quyết định bởi một con mèo.',
  'Tình yêu đang ở rất gần... gần thế nào thì mèo chưa chắc.',
  'Mèo khuyên bạn nên yêu bản thân. Và yêu mèo nữa.',
  'Mèo vừa xem được một đoạn tương lai. Có người sắp nói dối rằng mình không ghen.',
  'Có một anh chàng rất thích nói "tùy em", nhưng em chọn gì cũng không vừa lòng.',
  'Mèo thấy một người đang ghen. Không phải mèo, mèo đang độc thân.',
  'Một người nào đó sắp nhắn tin rồi xóa, xóa rồi nhắn. Mèo mệt thay.',
  'Có người ngoài miệng nói không quan tâm, trong lòng mở hẳn cuộc họp cổ đông.',
  'Mèo tiên tri thấy một chiếc red flag. Nhưng khách hình như thích màu đỏ?',
  'Ai đó sắp có một ngày rất đẹp. Trừ khi người yêu cũ xuất hiện.',
  'Mèo không tiết lộ danh tính, nhưng người đó đẹp trai và rất phiền.',
  'Có người đang nhớ bạn. Mèo không biết là ai, nhưng chắc chắn không phải chủ tiệm cá.',
  'Mèo vừa nhìn thấy một chàng trai từ phương xa. Đường xa vạn dặm, nhưng nghiệp tình còn xa hơn.',
  'Tương lai có một đám cưới... mèo không biết nên chúc mừng hay chuẩn bị chạy.',
  'Có người trông lạnh lùng như tuyết Tân Cương, nhưng mèo nghi trong lòng đang có bão.',
  'Có người tính toán giỏi lắm, trừ chuyện tình cảm của chính mình.',
  'Bói quẻ xong nhớ năng nổ thả cần ở Hồ Bong Bóng nha, lộc tràn rổ cá đó!',
  'Tiền tài như nước, nhưng không biết quản lý là nước chảy ra sông.',
  'Mèo vừa bấm quẻ: Hôm nay ăn ngon, ngủ kỹ, đừng thức khuya xem tin nhắn cũ!',
];

// Fortune Categories
interface FortuneCategoryOption {
  id: 'love' | 'wealth' | 'luck' | 'cat_wisdom';
  name: string;
  icon: string;
  badgeColor: string;
  borderColor: string;
  description: string;
}

const CATEGORIES: FortuneCategoryOption[] = [
  {
    id: 'love',
    name: 'Tình Duyên',
    icon: '💖',
    badgeColor: 'bg-[#FF8FAB]',
    borderColor: 'border-[#D6336C]',
    description: 'Chuyện con tim, Crush, Red Flags & Duyên Nợ',
  },
  {
    id: 'wealth',
    name: 'Tài Lộc',
    icon: '💰',
    badgeColor: 'bg-[#F7DDA0]',
    borderColor: 'border-[#B07D62]',
    description: 'Rổ Xu Cá, Vận May Tiền Tệ & Làm Ăn',
  },
  {
    id: 'luck',
    name: 'Vận May',
    icon: '🌟',
    badgeColor: 'bg-[#A9C5F2]',
    borderColor: 'border-[#526C91]',
    description: 'Cát Cụ Hanh Thông, Quý Nhân Phù Trợ',
  },
  {
    id: 'cat_wisdom',
    name: 'Phù Thủy Mèo',
    icon: '🔮',
    badgeColor: 'bg-[#C4A4DA]',
    borderColor: 'border-[#7209B7]',
    description: 'Lời Khuyên Trí Tuệ & Bí Kíp Phù Thủy Mèo',
  },
];

export const FortuneMinigame: React.FC<FortuneMinigameProps> = ({
  authToken,
  profile,
  userBalance,
  onBalanceUpdated,
  onRefreshProfile,
  onBackToMap,
  onOpenAuth,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'love' | 'wealth' | 'luck' | 'cat_wisdom'>('love');
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [revealedFortune, setRevealedFortune] = useState<CatTownFortune | null>(null);
  const [rewardCoins, setRewardCoins] = useState<number>(0);
  const [hasClaimedToday, setHasClaimedToday] = useState<boolean>(!!profile?.dailyFortuneClaimed);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // FIXED SINGLE WITCH CAT POSE FOR THE ENTIRE SESSION (No auto-switching!)
  const fixedPoseIndex = useMemo(() => Math.floor(Math.random() * 10), []);
  const currentPose = WITCH_CAT_POSES[fixedPoseIndex];

  // Random Speech Quote - stable during session unless clicked
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState<number>(() => Math.floor(Math.random() * WITCH_CAT_QUOTES.length));

  const handleNextQuote = () => {
    retroAudio.playBlip(520, 0.04);
    setCurrentQuoteIndex((prev) => (prev + 1) % WITCH_CAT_QUOTES.length);
  };

  const handleSelectCategory = (catId: 'love' | 'wealth' | 'luck' | 'cat_wisdom') => {
    retroAudio.playBlip(440, 0.05);
    setSelectedCategory(catId);
  };

  const handleCastFortune = async () => {
    if (!authToken) {
      onOpenAuth();
      return;
    }

    setIsRevealing(true);
    setErrorMessage(null);
    retroAudio.playBlip(800, 0.1);

    try {
      // Small suspense spellcasting animation delay
      await new Promise((r) => setTimeout(r, 1100));

      const res = await firebaseApi('/api/cat-town/action/fortune', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ category: selectedCategory }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi rút quẻ bói.');
      }

      setRevealedFortune(data.fortune);
      setRewardCoins(data.rewardCoins || 0);
      setHasClaimedToday(true);

      if (data.rewardCoins > 0) {
        onBalanceUpdated(data.newBalance);
      }
      onRefreshProfile();
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể xem bói lúc này.');
    } finally {
      setIsRevealing(false);
    }
  };

  const activeCategoryObj = useMemo(() => {
    return CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];
  }, [selectedCategory]);

  return (
    <div
      className="relative w-full max-w-5xl mx-auto flex flex-col items-center select-none"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Top Header Bar */}
      <header className="w-full bg-[#FFF9F4] border-4 border-[#795653] rounded-2xl p-2.5 sm:p-3 mb-3 flex items-center justify-between shadow-[4px_4px_0px_#795653] z-20">
        <button
          onClick={() => {
            retroAudio.playBlip(360, 0.05);
            onBackToMap();
          }}
          className="pixel-btn-press flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFDF7] hover:bg-[#FFE5EC] text-[#795653] font-bold text-xs rounded-xl border-2 border-[#795653] shadow-[2px_2px_0px_#795653] cursor-pointer"
          style={{ fontFamily: "'Tiny5', monospace" }}
        >
          <span>←</span>
          <span>BẢN ĐỒ THỊ TRẤN</span>
        </button>

        <div className="text-center">
          <h2
            className="text-sm sm:text-base md:text-lg font-black text-[#7209B7] flex items-center gap-1.5"
            style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
          >
            <span>🔮</span>
            <span>LỀU BÓI MEO MEO — LỀU TIÊN TRI MA THUẬT</span>
          </h2>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FFFDF7] border-2 border-[#795653] rounded-xl shadow-[2px_2px_0px_#795653]">
          <XuCaIcon className="w-4 h-4 object-contain inline-block shrink-0" />
          <span
            className="text-xs font-black text-[#D6336C] tabular-nums"
            style={{ fontFamily: "'Tiny5', monospace" }}
          >
            {userBalance.toLocaleString('vi-VN')}
          </span>
        </div>
      </header>

      {/* Error Toast */}
      {errorMessage && (
        <div className="w-full mb-3 p-3 rounded-2xl bg-[#FFE5EC] border-2 border-[#D6336C] text-[#795653] font-bold text-xs flex items-center justify-between shadow-xs z-30">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-[#D6336C] font-black cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Main Tent Room Layout with Background Image */}
      <div
        className="w-full border-4 sm:border-5 border-[#795653] rounded-3xl p-3 sm:p-5 shadow-[8px_8px_0px_#795653] text-white relative overflow-hidden flex flex-col gap-4"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(18, 8, 31, 0.45), rgba(30, 16, 46, 0.65)), url('${FORTUNE_TENT_BG_URL}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          imageRendering: 'pixelated',
        }}
      >
        {/* Decorative Top Velvet Drapery */}
        <div className="absolute top-0 inset-x-0 h-8 flex justify-around pointer-events-none z-10 opacity-90">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-20 h-7 bg-[#7209B7] rounded-b-full border-b-2 border-x border-[#FF8FAB]/50 shadow-xs"
            />
          ))}
        </div>

        {/* Ambient Twinkling Stars in Background */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-50">
          <div className="absolute top-10 left-10 text-xs animate-ping">✨</div>
          <div className="absolute top-16 right-20 text-sm animate-pulse">⭐</div>
          <div className="absolute top-36 left-28 text-xs animate-star-twinkle text-purple-300">✨</div>
          <div className="absolute bottom-24 right-12 text-sm animate-bounce text-pink-300">🌟</div>
          <div className="absolute bottom-12 left-16 text-xs animate-pulse text-amber-300">⭐</div>
        </div>


        {/* Main 3-Column Grid Content */}
        <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch pt-4">
          
          {/* ================= LEFT COLUMN: CATEGORY SELECTOR ================= */}
          <div className="lg:col-span-3 bg-[#1D0C2E]/92 backdrop-blur-xs border-3 border-[#7209B7] rounded-2xl p-3 shadow-[4px_4px_0px_#12081F] flex flex-col justify-between">
            <div>
              <div
                className="text-xs font-black text-[#FFD166] mb-2.5 flex items-center gap-1.5 uppercase tracking-wider"
                style={{ fontFamily: "'Tiny5', monospace" }}
              >
                <span>📜</span>
                <span>CHỌN LOẠI QUẺ BÓI</span>
              </div>

              <div className="space-y-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`w-full p-2.5 rounded-xl border-2 transition-all flex items-center gap-2.5 text-left cursor-pointer ${
                        isSelected
                          ? `${cat.badgeColor} ${cat.borderColor} text-[#795653] font-black shadow-[3px_3px_0px_#12081F] scale-[1.02]`
                          : 'bg-[#12081F]/80 hover:bg-[#2B1745] border-[#7209B7]/60 text-white/90'
                      }`}
                      style={{ fontFamily: "'Tiny5', monospace" }}
                    >
                      <span className="text-lg shrink-0">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black tracking-wide leading-tight">
                          {cat.name}
                        </div>
                        <div
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-[#795653]/90 font-bold' : 'text-purple-200/70'
                          }`}
                        >
                          {cat.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ================= CENTER COLUMN: WITCH CAT & CRYSTAL BALL ================= */}
          <div className="lg:col-span-6 flex flex-col items-center justify-between min-h-[360px] sm:min-h-[400px] relative px-2">
            
            {/* Top Random Speech Bubble */}
            <div
              onClick={handleNextQuote}
              className="relative max-w-sm w-full bg-[#FFF9F4] text-[#795653] border-3 border-[#795653] rounded-2xl p-2.5 shadow-[4px_4px_0px_#12081F] text-center cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 mb-2 z-20"
              title="Bấm để đổi câu thoại ngẫu nhiên"
            >
              <div
                className="text-xs font-black leading-snug"
                style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace", color: '#D6336C' }}
              >
                "{WITCH_CAT_QUOTES[currentQuoteIndex]}"
              </div>
              <div className="text-[9px] text-[#795653]/60 font-bold mt-1" style={{ fontFamily: "'Tiny5', monospace" }}>
                [ Bấm vào thoại để xem lời phán tiếp theo 🐾 ]
              </div>
              {/* Speech bubble tail pointing down */}
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[8px] border-x-transparent border-t-[10px] border-t-[#795653]" />
            </div>

            {/* Fixed Sliced Witch Cat Image Container */}
            <div className="relative flex flex-col items-center my-auto">
              <div
                className="relative w-36 sm:w-44 h-36 sm:h-44 rounded-2xl overflow-hidden border-3 border-[#7209B7] bg-[#221038]/90 shadow-[0_0_25px_rgba(157,78,221,0.6)] flex items-center justify-center transition-all"
                title={`Mèo Phù Thủy Tiên Tri — ${currentPose.name}`}
              >
                {/* 1 of 10 Clean Canvas Sliced Image */}
                <WitchCatCanvasSprite poseIndex={fixedPoseIndex} className="animate-witch-cat" />

                {/* Expression Badge Overlay */}
                <div className="absolute top-1 right-1 bg-[#7209B7] text-[#FFD166] text-[9px] px-1.5 py-0.5 rounded-md font-bold border border-[#FFD166] shadow-xs">
                  🧹 {currentPose.name}
                </div>
              </div>

              {/* Crystal Ball & Velvet Table */}
              <div className="relative -mt-6 flex flex-col items-center z-20">
                {/* Wisps of Magical Smoke */}
                <div className="absolute -top-10 inset-x-0 flex justify-center pointer-events-none">
                  <span className="animate-magic-smoke text-sm">🔮</span>
                  <span className="animate-magic-smoke text-xs" style={{ animationDelay: '1s' }}>✨</span>
                  <span className="animate-magic-smoke text-sm" style={{ animationDelay: '2s' }}>💨</span>
                </div>

                {/* Glowing Crystal Ball */}
                <div
                  onClick={handleCastFortune}
                  className={`relative w-20 sm:w-24 h-20 sm:h-24 rounded-full bg-gradient-to-br from-[#E0AAFF] via-[#9D4EDD] to-[#3C096C] border-3 border-[#FFD166] flex items-center justify-center cursor-pointer transition-all animate-crystal-pulse ${
                    isRevealing ? 'scale-110 rotate-180 duration-1000' : 'hover:scale-108'
                  }`}
                  title="Nhấn vào Quả Cầu Pha Lê để bói toán"
                >
                  <span className="text-3xl sm:text-4xl filter drop-shadow-[0_0_12px_white] animate-pulse">
                    {isRevealing ? '🌀' : '🔮'}
                  </span>
                </div>

                {/* Crystal Ball Stand */}
                <div className="w-12 sm:w-14 h-3 bg-[#FFD166] border-2 border-[#795653] rounded-t-md -mt-1 shadow-md" />

                {/* Velvet Table */}
                <div className="w-48 sm:w-56 h-7 bg-[#7209B7] border-3 border-[#795653] rounded-xl shadow-[4px_4px_0px_#12081F] -mt-1 flex items-center justify-center">
                  <span
                    className="text-[10px] sm:text-xs text-[#FFD166] font-black tracking-widest uppercase"
                    style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
                  >
                    ✦ BÀN TIÊN TRI ✦
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Primary Action Button */}
            <div className="w-full mt-3">
              <button
                onClick={handleCastFortune}
                disabled={isRevealing}
                className="liquid-glass-btn relative w-full py-3.5 px-6 rounded-2xl bg-[#FF8FAB] hover:bg-[#FF7599] disabled:opacity-50 text-white font-black text-sm sm:text-base border-3 border-[#FFD166] shadow-[4px_4px_0px_#12081F] cursor-pointer flex items-center justify-center gap-2 overflow-hidden transition-transform active:scale-98"
                style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
              >
                <span className="shimmer-liquid" />
                <span className="relative z-10 flex items-center gap-2">
                  <span>🔮</span>
                  <span>{isRevealing ? 'ĐANG ĐỌC TIA SÁNG BÓI...' : `BẮT ĐẦU BÓI QUẺ (${activeCategoryObj.name})`}</span>
                  <span>✨</span>
                </span>
              </button>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: DAILY STATUS & HISTORY ================= */}
          <div className="lg:col-span-3 bg-[#1D0C2E]/92 backdrop-blur-xs border-3 border-[#7209B7] rounded-2xl p-3 shadow-[4px_4px_0px_#12081F] flex flex-col justify-between">
            <div>
              <div
                className="text-xs font-black text-[#FFD166] mb-2 flex items-center gap-1.5 uppercase tracking-wider"
                style={{ fontFamily: "'Tiny5', monospace" }}
              >
                <span>⭐</span>
                <span>TRẠNG THÁI HÔM NAY</span>
              </div>

              {/* Status Box */}
              <div className="p-2.5 rounded-xl bg-[#12081F]/80 border-2 border-[#7209B7]/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-200/80 font-bold" style={{ fontFamily: 'Tiny5' }}>Thưởng đầu ngày:</span>
                  <span
                    className={`font-black px-2 py-0.5 rounded-md text-[10px] ${
                      hasClaimedToday
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/50'
                        : 'bg-[#FF8FAB]/20 text-[#FF8FAB] border border-[#FF8FAB]/50 animate-pulse'
                    }`}
                    style={{ fontFamily: 'Tiny5' }}
                  >
                    {hasClaimedToday ? '✓ ĐÃ NHẬN' : '+10 XU CÁ'}
                  </span>
                </div>

                <div className="text-[11px] text-purple-200/90 leading-relaxed" style={{ fontFamily: 'Tiny5' }}>
                  {hasClaimedToday
                    ? 'Bạn đã nhận 10 Xu Cá quẻ đầu ngày! Bạn vẫn có thể tiếp tục xem bói thỏa thích.'
                    : 'Quẻ bói đầu tiên hôm nay sẽ tặng bạn +10 Xu Cá thưởng may mắn!'}
                </div>
              </div>

              {/* Category Spotlight info */}
              <div className="mt-3 p-2.5 rounded-xl bg-[#2B1745] border border-[#FF8FAB]/40 space-y-1">
                <div className="text-xs font-black text-[#FF8FAB] flex items-center gap-1" style={{ fontFamily: 'Tiny5' }}>
                  <span>{activeCategoryObj.icon}</span>
                  <span>Đang chọn: {activeCategoryObj.name}</span>
                </div>
                <p className="text-[10px] text-purple-100/80 leading-normal" style={{ fontFamily: 'Tiny5' }}>
                  {activeCategoryObj.description}
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Prophecy Result Modal */}
      {revealedFortune && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#12081F]/80 backdrop-blur-xs animate-in fade-in select-none">
          <div className="relative w-full max-w-md bg-[#FFF9F4] rounded-3xl border-4 sm:border-5 border-[#795653] p-5 sm:p-6 text-center shadow-[8px_8px_0px_#12081F] animate-in zoom-in-95 overflow-hidden">
            {/* Top Decorative Sparkles */}
            <div className="absolute top-2 left-4 text-sm animate-bounce">✨</div>
            <div className="absolute top-2 right-4 text-sm animate-bounce" style={{ animationDelay: '0.4s' }}>🌟</div>

            <div className="text-4xl mb-1 animate-pulse">🔮</div>

            <div
              className="inline-block px-3.5 py-0.5 rounded-full bg-[#7209B7] text-[#FFD166] font-black text-xs mb-2 uppercase border border-[#FFD166]"
              style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
            >
              {revealedFortune.category === 'love'
                ? 'QUẺ TÌNH DUYÊN 💖'
                : revealedFortune.category === 'wealth'
                ? 'QUẺ TÀI LỘC 💰'
                : revealedFortune.category === 'cat_wisdom'
                ? 'BÍ KÍP PHÙ THỦY MÈO 🔮'
                : 'QUẺ VẬN MAY 🌟'}
            </div>

            <h3
              className="text-base sm:text-lg font-black text-[#D6336C] mb-3 tracking-wide"
              style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
            >
              {revealedFortune.title}
            </h3>

            {/* Witch Cat Personal Comment */}
            <div className="mb-3 p-2 bg-[#FFE5EC] border-2 border-[#FF8FAB] rounded-xl text-xs font-bold text-[#D6336C] flex items-center gap-2">
              <span className="text-base shrink-0">🧙‍♀️</span>
              <span className="text-left text-[11px] leading-tight" style={{ fontFamily: 'Tiny5' }}>
                "{WITCH_CAT_QUOTES[currentQuoteIndex]}"
              </span>
            </div>

            {/* Prophecy Details Box */}
            <div
              className="p-4 rounded-2xl bg-white border-2 border-[#795653] mb-4 text-left space-y-2.5 shadow-inner"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              <p className="text-xs sm:text-sm leading-relaxed font-semibold text-[#E13F7C]">
                "{revealedFortune.prophecy}"
              </p>

              <div className="border-t border-b border-[#795653]/15 py-2 flex items-center justify-between text-xs font-bold text-[#795653]">
                <span>Con số cát tường: <strong className="text-[#D6336C]">{revealedFortune.luckyNumber}</strong></span>
                <span>Màu may mắn: <strong className="text-[#0A5EB0]">{revealedFortune.luckyColor}</strong></span>
              </div>

              <p className="text-xs italic text-[#795653]/90 pt-0.5">
                💡 <strong>Lời khuyên Phù Thủy Mèo:</strong> {revealedFortune.advice}
              </p>
            </div>

            {/* Daily Reward Badge */}
            {rewardCoins > 0 && (
              <div className="mb-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F7DDA0] border-2 border-[#795653] rounded-full text-xs font-black text-[#795653] shadow-[2px_2px_0px_#795653]">
                <XuCaIcon className="w-4 h-4 object-contain inline-block shrink-0" />
                <span>Thưởng quẻ đầu ngày: +{rewardCoins} Xu Cá!</span>
              </div>
            )}

            <button
              onClick={() => {
                retroAudio.playConfirm();
                setRevealedFortune(null);
              }}
              className="pixel-btn-press w-full py-3 font-black text-xs sm:text-sm rounded-xl border-3 border-[#795653] shadow-[3px_3px_0px_#795653] cursor-pointer"
              style={{
                fontFamily: "'Tiny5 Duo', 'Tiny5', monospace",
                color: '#ffffff',
                backgroundColor: '#FF8FAB',
              }}
            >
              CẢM ƠN PHÙ THỦY MÈO! 🐾
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
