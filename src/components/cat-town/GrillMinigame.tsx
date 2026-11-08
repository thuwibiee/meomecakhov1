import React, { useState, useEffect, useRef } from 'react';
import { CatTownUserProfile, CatTownInventoryItem } from '../../types.ts';
import { firebaseApi } from '../../firebase.ts';
import { PixelFishSprite } from './PixelFishSprite.tsx';
import { XuCaIcon } from '../XuCaIcon.tsx';

interface GrillMinigameProps {
  authToken: string | null;
  profile: CatTownUserProfile | null;
  userBalance: number;
  onBalanceUpdated: (newBal: number) => void;
  onRefreshProfile: () => void;
  onBackToMap: () => void;
  onOpenAuth: () => void;
}

export const GrillMinigame: React.FC<GrillMinigameProps> = ({
  authToken,
  profile,
  userBalance,
  onBalanceUpdated,
  onRefreshProfile,
  onBackToMap,
  onOpenAuth,
}) => {
  // Available raw fishes in inventory
  const fishInventory = (profile?.inventory || []).filter(
    (item) => item.itemType === 'fish' && item.quantity > 0
  );

  const [selectedFish, setSelectedFish] = useState<CatTownInventoryItem | null>(null);
  const [cookingProgress, setCookingProgress] = useState<number>(0); // 0 to 100
  const [isCooking, setIsCooking] = useState<boolean>(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [result, setResult] = useState<{
    doneness: 'undercooked' | 'perfect' | 'burnt';
    rewardCoins: number;
    message: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Daily turns
  const dailyLimit = 12;
  const turnsUsed = profile?.dailyGrillingCount || 0;
  const turnsRemaining = Math.max(0, dailyLimit - turnsUsed);

  // Clean timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Cooking progress timer
  useEffect(() => {
    if (isCooking) {
      timerRef.current = setInterval(() => {
        setCookingProgress((prev) => {
          if (prev >= 100) {
            // Auto finish as burnt if let too long
            handleFinishCooking(100);
            return 100;
          }
          return prev + 1.8;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCooking]);

  // Start Grilling
  const handleStartGrilling = () => {
    if (!authToken) {
      onOpenAuth();
      return;
    }
    if (!selectedFish) {
      setErrorMessage('Vui lòng chọn 1 chú cá trong túi đồ để đặt lên vỉ nướng!');
      return;
    }
    if (turnsRemaining <= 0) {
      setErrorMessage('Bà đã nướng hết lượt cá hôm nay rồi! Nghỉ ngơi mai nướng tiếp nhé 🔥');
      return;
    }

    setErrorMessage(null);
    setResult(null);
    setCookingProgress(0);
    setIsFlipped(false);
    setIsCooking(true);
  };

  // Flip Fish
  const handleFlipFish = () => {
    if (!isCooking) return;
    setIsFlipped(!isFlipped);
  };

  // Finish Cooking
  const handleFinishCooking = async (forcedProgress?: number) => {
    if (!isCooking || isSubmitting || !selectedFish) return;

    setIsCooking(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const finalProgress = forcedProgress !== undefined ? forcedProgress : cookingProgress;

    // Evaluate doneness:
    // 0 - 45: undercooked
    // 46 - 78: perfect (bonus if flipped)
    // 79 - 100: burnt
    let doneness: 'undercooked' | 'perfect' | 'burnt' = 'undercooked';
    if (finalProgress > 78) {
      doneness = 'burnt';
    } else if (finalProgress >= 46) {
      doneness = 'perfect';
    } else {
      doneness = 'undercooked';
    }

    setIsSubmitting(true);
    try {
      const res = await firebaseApi('/api/cat-town/action/grill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fishItemId: selectedFish.itemId,
          doneness,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi nướng cá');
      }

      setResult({
        doneness,
        rewardCoins: data.rewardCoins,
        message: data.message,
      });

      onBalanceUpdated(data.newBalance);
      onRefreshProfile();
      setSelectedFish(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể ghi nhận kết quả nướng cá.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Top Header Controls */}
      <div className="w-full bg-[#FFF9F4] border-4 border-[#795653] rounded-2xl p-3 mb-4 flex items-center justify-between shadow-[4px_4px_0px_#795653]">
        <button
          onClick={onBackToMap}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FFE5EC] text-[#795653] font-black text-xs rounded-xl border-2 border-[#795653] shadow-[2px_2px_0px_#795653] cursor-pointer active:translate-y-0.5"
          style={{ fontFamily: "'Tiny5', monospace" }}
        >
          <span>←</span>
          <span>BẢN ĐỒ THỊ TRẤN</span>
        </button>

        <div className="text-center">
          <h2
            className="text-base sm:text-lg font-black text-[#B07D62] flex items-center gap-1.5"
            style={{ fontFamily: "'Tiny5', monospace" }}
          >
            <span>🍢</span>
            <span>BẾP XÈO XÈO — NƯỚNG CÁ THƠM LỪNG</span>
          </h2>
          <span className="text-[11px] font-bold text-[#795653]" style={{ fontFamily: "'Tiny5', monospace" }}>
            Lượt nướng hôm nay:{' '}
            <strong className="text-[#D6336C]">{turnsRemaining}/{dailyLimit}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-[#795653] rounded-xl shadow-[2px_2px_0px_#795653]">
          <XuCaIcon className="w-4 h-4 object-contain inline-block" />
          <span className="text-xs font-black text-[#0A5EB0] tabular-nums" style={{ fontFamily: "'Tiny5', monospace" }}>
            {userBalance.toLocaleString('vi-VN')}
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="w-full mb-3 p-3 rounded-2xl bg-[#FFE5EC] border-2 border-[#FF8FAB] text-[#795653] font-bold text-xs flex items-center justify-between shadow-xs">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-[#D6336C] font-black cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Main Kitchen / Grill Screen */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Column: Pick fish from inventory */}
        <div className="bg-[#FFF9F4] border-4 border-[#795653] rounded-3xl p-4 shadow-[4px_4px_0px_#795653] flex flex-col">
          <h3 className="text-xs font-black text-[#795653] uppercase mb-2 flex items-center gap-1.5" style={{ fontFamily: "'Tiny5', monospace" }}>
            <span>🎒</span>
            <span>Chọn Cá Để Nướng ({fishInventory.length})</span>
          </h3>

          {fishInventory.length === 0 ? (
            <div
              className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-[#795653]/70 font-semibold bg-white/70 rounded-2xl border-2 border-dashed border-[#795653]/30"
              style={{ fontFamily: "'Tiny5', monospace" }}
            >
              <span className="text-3xl mb-2">🎣</span>
              <p>Túi đồ của bà chưa có cá tươi.</p>
              <p className="mt-1 text-[11px] text-[#0A5EB0]">
                Hãy ghé <strong>Hồ Bong Bóng</strong> câu vài chú cá trước nhé!
              </p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1">
              {fishInventory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!isCooking) setSelectedFish(item);
                  }}
                  className={`p-2.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                    selectedFish?.id === item.id
                      ? 'bg-[#FFCCD5] border-[#D6336C] shadow-[2px_2px_0px_#D6336C] scale-[1.02]'
                      : 'bg-white hover:bg-[#FFE5EC] border-[#795653]/30 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2" style={{ fontFamily: "'Tiny5', monospace" }}>
                    <PixelFishSprite fishId={item.itemId} size={36} />
                    <div>
                      <div className="text-xs font-black text-[#795653] leading-tight">
                        {item.name}
                      </div>
                      <span className="text-[10px] text-[#526C91] uppercase font-bold">
                        {item.rarity || 'common'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-[#795653]/20 text-xs font-black text-[#D6336C]">
                    x{item.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center / Right: The Charcoal BBQ Grill */}
        <div className="md:col-span-2 bg-[#FEE440]/10 border-4 border-[#795653] rounded-3xl p-5 shadow-[4px_4px_0px_#795653] flex flex-col items-center justify-between relative overflow-hidden">
          {/* Chef Cat Spotlight & Dialogue */}
          <div className="flex items-center gap-3 w-full max-w-md bg-[#FFF9F4] border-2 border-[#795653] p-2.5 rounded-2xl shadow-[2px_2px_0px_#795653] mb-2">
            <div className="relative shrink-0">
              <img
                src={profile?.cat?.avatarUrl || '/assets/cats/cat_02.png'}
                alt={profile?.cat?.name || 'Đầu Bếp Mèo'}
                className="w-12 h-12 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
              <span className="absolute -top-1 -right-1 text-xs">👨‍🍳</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-[#D6336C]" style={{ fontFamily: "'Tiny5', monospace" }}>
                  Bếp Trưởng: {profile?.cat?.name || 'Bé Mèo'}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 bg-[#F7DDA0] border border-[#795653] rounded text-[#795653] font-bold">
                  {profile?.cat?.breed || 'Mèo Đầu Bếp'}
                </span>
              </div>
              <p
                className="text-[10px] text-[#795653]/85 leading-tight mt-0.5"
                style={{ fontFamily: "'Tiny5', monospace", fontWeight: 'bold' }}
              >
                {isCooking
                  ? '⚡ Canh vạch vàng 100 điểm lật cá ngay để nhận tối đa Xu Cá nha sen!'
                  : '🐾 Chọn một chú cá béo trong giỏ bên trái rồi đặt lên vỉ nướng xèo xèo nào!'}
              </p>
            </div>
          </div>

          {/* Grill Title */}
          <div className="text-center mb-1">
            <span
              className="px-3 py-1 bg-white border-2 border-[#795653] rounded-xl text-xs font-black text-[#795653] shadow-[2px_2px_0px_#795653]"
              style={{ fontFamily: "'Tiny5', monospace" }}
            >
              {isCooking ? '🔥 Đang nướng trên than hồng... Canh lấy cá đúng lúc!' : '🪵 Đặt cá lên vỉ để bắt đầu trổ tài!'}
            </span>
          </div>

          {/* Charcoal Grill Graphic */}
          <div className="relative w-full max-w-md h-52 bg-[#3D3A45] rounded-3xl border-4 border-[#795653] shadow-[4px_4px_0px_#795653] p-4 flex flex-col items-center justify-center my-3 overflow-hidden">
            {/* Glowing charcoal coals */}
            <div className="absolute inset-0 bg-radial from-[#FF5400]/40 via-[#9E2A2B]/30 to-[#3D3A45] pointer-events-none" />

            {/* Sizzling smoke & sound sparks */}
            {isCooking && (
              <>
                <div className="absolute top-2 left-1/4 text-sm animate-bounce">💨</div>
                <div className="absolute top-3 right-1/4 text-xs animate-pulse">✨</div>
                <div className="absolute top-6 left-1/2 text-sm animate-pulse">💨</div>
              </>
            )}

            {/* Iron Grill Grate Bars */}
            <div className="absolute inset-x-4 inset-y-6 flex justify-between pointer-events-none opacity-40">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="w-1.5 h-full bg-[#1A181E]" />
              ))}
            </div>

            {/* Fish on Grill */}
            {selectedFish ? (
              <div
                className={`relative z-10 transition-transform duration-300 ${
                  isFlipped ? 'scale-x-[-1]' : ''
                } ${isCooking ? 'animate-pulse' : ''}`}
                style={{ fontFamily: "'Tiny5', monospace" }}
              >
                <PixelFishSprite fishId={selectedFish.itemId} size={84} />
                {/* Visual charred overlay based on progress */}
                {cookingProgress > 50 && (
                  <div
                    className="absolute inset-0 rounded-full mix-blend-multiply pointer-events-none"
                    style={{
                      backgroundColor:
                        cookingProgress > 78
                          ? 'rgba(43, 24, 16, 0.7)'
                          : 'rgba(217, 119, 6, 0.45)',
                    }}
                  />
                )}
              </div>
            ) : (
              <div
                className="relative z-10 text-center text-white/50 text-xs font-bold"
                style={{ fontFamily: "'Tiny5', monospace" }}
              >
                Chọn một con cá từ danh sách bên trái để đặt lên vỉ 🐟
              </div>
            )}
          </div>

          {/* Doneness Progress Bar */}
          {isCooking && (
            <div className="w-full max-w-md bg-white border-3 border-[#795653] rounded-2xl p-3 shadow-[3px_3px_0px_#795653] mb-3">
              <div
                className="flex justify-between items-center text-[10px] font-black uppercase text-[#795653] mb-1"
                style={{ fontFamily: "'Tiny5', monospace" }}
              >
                <span className="text-[#0A5EB0]">Tái (Ít Xu)</span>
                <span className="text-emerald-700">★ CHÍN VÀNG (Nhiều Xu nhất!) ★</span>
                <span className="text-rose-700">Khét lẹt</span>
              </div>

              {/* Progress gauge */}
              <div className="relative w-full h-6 bg-[#E5E7EB] border-2 border-[#795653] rounded-xl overflow-hidden flex">
                <div className="w-[45%] bg-[#A9C5F2]" title="Tái" />
                <div className="w-[33%] bg-emerald-400 border-x-2 border-emerald-600" title="Chín Vàng Tuyệt Hảo" />
                <div className="w-[22%] bg-rose-500" title="Cháy Sém" />

                {/* Current Cooking Indicator Cursor */}
                <div
                  className="absolute top-0 bottom-0 w-2.5 bg-[#2B2830] border-x border-white shadow-md"
                  style={{ left: `${Math.min(98, cookingProgress)}%` }}
                />
              </div>
            </div>
          )}

          {/* Controls: Flip & Finish Buttons */}
          <div className="flex items-center gap-3 w-full max-w-md">
            {!isCooking ? (
              <button
                onClick={handleStartGrilling}
                disabled={!selectedFish || turnsRemaining <= 0}
                className="w-full py-3 bg-[#FF8FAB] hover:bg-[#f37898] disabled:opacity-50 active:translate-y-0.5 text-white font-black text-sm rounded-2xl border-3 border-[#795653] shadow-[3px_3px_0px_#795653] cursor-pointer flex items-center justify-center gap-2"
                style={{ fontFamily: "'Tiny5', monospace" }}
              >
                <span>🔥</span>
                <span>BẮT ĐẦU NƯỚNG CÁ</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleFlipFish}
                  className="flex-1 py-3 bg-[#F7DDA0] hover:bg-[#f5cf80] active:translate-y-0.5 text-[#795653] font-black text-xs sm:text-sm rounded-2xl border-3 border-[#795653] shadow-[3px_3px_0px_#795653] cursor-pointer"
                  style={{ fontFamily: "'Tiny5', monospace" }}
                >
                  🔄 LẬT CÁ ({isFlipped ? 'Mặt Dưới' : 'Mặt Trên'})
                </button>
                <button
                  onClick={() => handleFinishCooking()}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#06D6A0] hover:bg-[#05b587] active:translate-y-0.5 text-[#1E3A8A] font-black text-xs sm:text-sm rounded-2xl border-3 border-[#795653] shadow-[3px_3px_0px_#795653] cursor-pointer"
                  style={{ fontFamily: "'Tiny5', monospace" }}
                >
                  {isSubmitting ? 'ĐANG LẤY...' : '🍽️ LẤY CÁ RA NGAY!'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#795653]/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm bg-[#FFF9F4] rounded-3xl border-4 border-[#795653] p-6 text-center shadow-[6px_6px_0px_#795653] animate-in zoom-in-95">
            <div className="text-3xl mb-2">
              {result.doneness === 'perfect' ? '🌟' : result.doneness === 'burnt' ? '💨' : '🐟'}
            </div>
            <h3
              className="text-base font-black text-[#D6336C] tracking-wide mb-1"
              style={{ fontFamily: "'Tiny5', monospace" }}
            >
              {result.doneness === 'perfect'
                ? 'CHÍN VÀNG ÓNG Ả HOÀN HẢO!'
                : result.doneness === 'burnt'
                ? 'ÔI KHÔNG, CÁ HƠI CHÁY SÉM!'
                : 'CÁ VỪA CHÍN TỚI THƠM LỪNG!'}
            </h3>
            <p
              className="text-xs text-[#795653]/80 font-semibold mb-4"
              style={{ fontFamily: "'Tiny5', monospace" }}
            >
              {result.message}
            </p>

            {/* Reward */}
            <div className="p-3 rounded-2xl bg-[#FFE5EC] border-2 border-[#795653] mb-4 flex items-center justify-center gap-2">
              <XuCaIcon className="w-4 h-4 object-contain inline-block" />
              <span
                className="text-xs font-black"
                style={{
                  color: '#D6336C',
                  fontFamily: "'Tiny5', monospace",
                }}
              >
                +{result.rewardCoins} Xu Cá đã được cộng vào ví!
              </span>
            </div>

            <button
              onClick={() => setResult(null)}
              className="w-full py-2.5 font-black text-xs rounded-xl border-2 border-[#795653] shadow-[2px_2px_0px_#795653] cursor-pointer"
              style={{
                fontFamily: "'Tiny5', monospace",
                backgroundColor: '#FF8FB7',
                color: '#ffffff',
              }}
            >
              TIẾP TỤC NƯỚNG 🍢
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
