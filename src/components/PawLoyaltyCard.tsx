import React, { useState, useEffect } from 'react';
import { LoyaltyStatusResponse } from '../types.ts';
import { firebaseApi } from '../firebase.ts';
import { Sparkles, Check, X } from 'lucide-react';
import { XuCaIcon } from './XuCaIcon.tsx';

interface PawLoyaltyCardProps {
  authToken: string | null;
  userBalance: number;
  onBalanceUpdated: (newBalance: number) => void;
  onOpenAuth?: () => void;
}

// Cute SVG Paw Print Component (for watermark / placeholder in unstamped cells)
export const CatPawIcon: React.FC<{ className?: string; isStamped?: boolean }> = ({
  className = 'w-5 h-5',
  isStamped = false,
}) => (
  <svg
    viewBox="0 0 100 100"
    className={`${className} transition-transform duration-300`}
    fill={isStamped ? '#D81C63' : 'currentColor'}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M 50 42 C 34 42 22 56 26 74 C 29 86 42 90 50 86 C 58 90 71 86 74 74 C 78 56 66 42 50 42 Z"
      opacity={isStamped ? 0.95 : 0.35}
    />
    <ellipse cx="22" cy="38" rx="8" ry="11" transform="rotate(-28 22 38)" opacity={isStamped ? 0.95 : 0.35} />
    <ellipse cx="39" cy="24" rx="8.5" ry="12" transform="rotate(-10 39 24)" opacity={isStamped ? 0.95 : 0.35} />
    <ellipse cx="61" cy="24" rx="8.5" ry="12" transform="rotate(10 61 24)" opacity={isStamped ? 0.95 : 0.35} />
    <ellipse cx="78" cy="38" rx="8" ry="11" transform="rotate(28 78 38)" opacity={isStamped ? 0.95 : 0.35} />
  </svg>
);

// Cute Wooden Stamp Icon for Active Day
const StampMocGraphic: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="32" cy="12" rx="10" ry="7" fill="#C68B59" />
    <ellipse cx="32" cy="11" rx="8" ry="5" fill="#E0A96D" />
    <path d="M 27 15 C 27 22 24 28 22 35 L 42 35 C 40 28 37 22 37 15 Z" fill="#B07D62" />
    <rect x="20" y="35" width="24" height="5" rx="1.5" fill="#F7DDA0" stroke="#D4A373" strokeWidth="0.8" />
    <path d="M 16 40 L 48 40 L 52 50 L 12 50 Z" fill="#8C5042" />
    <rect x="12" y="50" width="40" height="4" rx="1" fill="#FF8FAB" />
    <circle cx="32" cy="52" r="1.5" fill="#FFF9F4" />
  </svg>
);

// Synthesize pleasant stamp "thud" using Web Audio API
const playStampAudio = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Ignore audio permission restrictions
  }
};

export const PawLoyaltyCard: React.FC<PawLoyaltyCardProps> = ({
  authToken,
  onBalanceUpdated,
  onOpenAuth,
}) => {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [stampingDay, setStampingDay] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [completionModal, setCompletionModal] = useState<{ isOpen: boolean; rewardCoins: number } | null>(null);

  // Fetch Loyalty Card status
  const fetchLoyaltyStatus = async () => {
    if (!authToken) return;
    setIsLoading(true);
    try {
      const res = await firebaseApi(`/api/loyalty-card?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Cache-Control': 'no-cache',
        },
      });
      const data = await res.json();
      if (res.ok) {
        setLoyaltyData(data);
      }
    } catch (err) {
      console.error('Failed to load loyalty card status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoyaltyStatus();
  }, [authToken]);

  // Handle stamping today's paw
  const handleCheckIn = async (targetDay: number) => {
    if (!authToken) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (loyaltyData?.card.hasCheckedInToday || isCheckingIn) return;

    setIsCheckingIn(true);
    setStampingDay(targetDay);
    setToastMessage(null);
    playStampAudio();

    try {
      const res = await firebaseApi('/api/loyalty-card/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Điểm danh không thành công.');
      }

      setTimeout(() => {
        setStampingDay(null);
      }, 700);

      // If cycle completed!
      if (data.isCompleted) {
        setTimeout(() => {
          setCompletionModal({
            isOpen: true,
            rewardCoins: data.rewardCoins,
          });
        }, 500);
      } else {
        setToastMessage(data.message);
      }

      if (typeof data.updatedBalance === 'number') {
        onBalanceUpdated(data.updatedBalance);
      }

      fetchLoyaltyStatus();
    } catch (err: any) {
      setStampingDay(null);
      setToastMessage(err.message || 'Lỗi khi điểm danh. Vui lòng thử lại sau.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const accumulatedDays = loyaltyData?.card.accumulatedDays || 0;
  const hasCheckedInToday = !!loyaltyData?.card.hasCheckedInToday;
  const rewardCoins = loyaltyData?.config.rewardCoins || 50;
  const isCompleteToday = accumulatedDays >= 7 && hasCheckedInToday;
  const nextTargetDay = accumulatedDays < 7 ? accumulatedDays + 1 : 1;

  // Click handler on any cell
  const handleCellClick = (day: number) => {
    if (!authToken) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (hasCheckedInToday) {
      setToastMessage(`Hôm nay bạn đã đóng mộc rồi ♡ Hẹn gặp lại vào ngày mai nhé!`);
      return;
    }

    if (day <= accumulatedDays) {
      setToastMessage(`Dấu chân ngày này đã được đóng rồi nè ♡`);
      return;
    }

    if (day === nextTargetDay) {
      handleCheckIn(day);
      return;
    }

    if (day > nextTargetDay) {
      setToastMessage(`Hãy ghé tiệm điểm danh để mở khóa dấu tiếp theo nhé ♡`);
    }
  };

  return (
    <div className="w-full space-y-2.5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FFE5EC] border-2 border-[#FF8FAB]/40 text-[#795653] text-xs font-bold flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-sm">🐾</span>
            <span style={{ fontFamily: "'Cal Sans', sans-serif" }}>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[#795653]/60 hover:text-[#795653] p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Loyalty Card - Beautiful Lace Heart & Ribbon Design (Matching Attached Reference Image) */}
      <div
        className="relative w-full rounded-3xl border-2 border-[#FF8FAB]/60 pt-7 sm:pt-9 pb-7 sm:pb-9 px-3.5 sm:px-6 shadow-[4px_4px_0px_rgba(255,143,171,0.35)] overflow-hidden"
        style={{
          backgroundColor: '#FFFDFE',
          backgroundImage: `url('/assets/loyalty/heart_pattern.png')`,
          backgroundRepeat: 'repeat',
          backgroundSize: '150px 100px',
        }}
      >
        {/* ================= 1. TOP LACE HEART RIBBON WITH CORNER BOWS (ATTACHMENT STYLE) ================= */}
        <div className="absolute top-0 inset-x-0 h-10 sm:h-12 pointer-events-none select-none z-0 overflow-hidden">
          <img
            src="/assets/loyalty/lace_top.png"
            alt="Lace top ribbon"
            className="w-full h-full object-fill drop-shadow-2xs"
          />
        </div>

        {/* ================= 2. BOTTOM LACE HEART RIBBON WITH CORNER BOWS (ATTACHMENT STYLE) ================= */}
        <div className="absolute bottom-0 inset-x-0 h-10 sm:h-12 pointer-events-none select-none z-0 overflow-hidden">
          <img
            src="/assets/loyalty/lace_bottom.png"
            alt="Lace bottom ribbon"
            className="w-full h-full object-fill drop-shadow-2xs"
          />
        </div>

        {/* Floating subtle sparkles for extra charm */}
        <div className="absolute top-12 right-14 text-[#FF8FAB]/60 text-xs pointer-events-none select-none animate-pulse">
          ✦
        </div>
        <div className="absolute bottom-12 left-16 text-[#FF8FAB]/50 text-xs pointer-events-none select-none">
          ✧
        </div>

        {/* ================= 3. HEADER & STATS BAR (PRESERVING COLORS & FONTS) ================= */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#FF8FAB]/25 pb-3 mb-3 bg-white/70 backdrop-blur-xs px-3.5 py-2 rounded-2xl shadow-2xs border border-white/80">
          {/* Title & Subtitle */}
          <div>
            <div
              className="flex items-center gap-1.5"
              style={{
                fontFamily: "'Cal Sans', sans-serif",
                marginLeft: '-13px',
                fontSize: '22px',
              }}
            >
              <span className="text-[#FF8FAB] text-xs">୨ৎ</span>
              <h2
                className="font-black tracking-wide drop-shadow-2xs"
                style={{
                  fontFamily: "'Cal Sans', sans-serif",
                  fontSize: '30px',
                  color: '#D81C63',
                  letterSpacing: '0.4px',
                }}
              >
                𑣲⋆ THẺ TÍCH XU ⋆𑣲
              </h2>
              <span className="text-[#FF8FAB] text-xs">୨ৎ</span>
            </div>
            <p
              className="uppercase font-extrabold tracking-widest"
              style={{
                fontFamily: "'Cal Sans', sans-serif",
                color: '#f075ae',
                marginTop: '3px',
                marginLeft: '13px',
                fontSize: '12px',
              }}
            >
              MÈO MÊ CÁ KHÔ · PAW LOYALTY CARD
            </p>
          </div>

          {/* Quick Stats: Progress Counter + Reward Pill */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Progress Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs border border-[#FF8FAB]/60 text-xs font-black shadow-2xs">
              <span className="text-[#D81C63]">🐾</span>
              <span
                className="text-xs font-black"
                style={{
                  fontFamily: "'Cal Sans', sans-serif",
                  color: accumulatedDays >= 7 ? '#10B981' : '#D81C63',
                }}
              >
                {accumulatedDays} / 7
              </span>
              <span
                className="text-[10px] font-bold"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#f075ae' }}
              >
                dấu
              </span>
            </div>

            {/* Reward Pill */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-black shadow-2xs"
              style={{
                backgroundColor: '#c6e6ff',
                color: '#1e6698',
                borderColor: '#1e6698',
              }}
            >
              <XuCaIcon className="w-3.5 h-3.5 object-contain" />
              <span
                className="text-[11px]"
                style={{
                  fontFamily: "'Cal Sans', sans-serif",
                  marginTop: '0px',
                  marginLeft: '-4px',
                  fontWeight: 'bold',
                }}
              >
                Thưởng: +{rewardCoins} xu
              </span>
            </div>
          </div>
        </div>

        {/* ================= 4. COMPACT 4x2 GRID (8 CELLS) ================= */}
        <div className="w-full max-w-md sm:max-w-lg mx-auto grid grid-cols-4 gap-2.5 sm:gap-3 relative z-10 mb-3.5">
          {/* Cells 1 -> 7: Daily Paw Stamps (NO "N1", "N2" text labels) */}
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const isStamped = day <= accumulatedDays;
            const isTodayTarget = !hasCheckedInToday && day === nextTargetDay;
            const isCurrentlyStamping = stampingDay === day;

            return (
              <div
                key={day}
                onClick={() => handleCellClick(day)}
                role="button"
                tabIndex={isTodayTarget ? 0 : -1}
                title={
                  isTodayTarget
                    ? 'Chạm vào để đóng mộc nhận +10 Xu Cá ngay!'
                    : isStamped
                    ? 'Dấu chân mèo (Đã đóng)'
                    : 'Dấu chân mèo'
                }
                className={`relative aspect-square max-w-[76px] sm:max-w-[84px] w-full mx-auto rounded-2xl p-1.5 sm:p-2 flex flex-col items-center justify-center border-2 transition-all duration-200 select-none overflow-hidden ${
                  isTodayTarget
                    ? 'bg-white border-[#D81C63] ring-2 ring-[#FF8FAB]/80 ring-offset-1 shadow-[0_2px_10px_rgba(216,28,99,0.25)] cursor-pointer hover:scale-105 active:scale-95'
                    : isStamped
                    ? 'bg-white/90 border-[#FFB6C1] shadow-[2px_2px_0px_rgba(255,143,171,0.35)] cursor-pointer hover:scale-105'
                    : 'bg-white/60 border-dashed border-[#FF8FAB]/45 opacity-65 cursor-pointer hover:opacity-85'
                }`}
              >
                {/* Ink Ripple Ring Animation on Stamp Hit */}
                {isCurrentlyStamping && (
                  <span className="absolute inset-0 rounded-2xl border-4 border-[#D81C63] animate-ink-ripple pointer-events-none" />
                )}

                {/* Stamped Paw Logo with Shimmer & Gentle Hover */}
                {isCurrentlyStamping ? (
                  <div className="relative animate-stamp-slam flex items-center justify-center">
                    <img
                      src="/assets/loyalty/stamped_logo_trimmed.png"
                      alt="Đang đóng dấu"
                      className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />
                  </div>
                ) : isStamped ? (
                  /* Stamped Logo with Gentle Hover and Shimmer Sweep */
                  <div className="relative w-full h-full flex items-center justify-center group overflow-hidden rounded-xl">
                    <img
                      src="/assets/loyalty/stamped_logo_trimmed.png"
                      alt="Đã đóng dấu"
                      className="w-10 h-10 sm:w-11 sm:h-11 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 drop-shadow-2xs select-none"
                    />
                    {/* Shimmer light sweep */}
                    <div className="stamped-paw-shimmer" />
                  </div>
                ) : isTodayTarget ? (
                  /* Active Stamp Target: Inviting cute stamp icon with bounce */
                  <div className="flex flex-col items-center justify-center animate-stamp-bob group py-0.5">
                    <StampMocGraphic className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-xs" />
                    <span
                      className="text-[7.5px] sm:text-[8px] font-black text-[#D81C63] uppercase tracking-tighter leading-none mt-1"
                      style={{ fontFamily: "'Cal Sans', sans-serif" }}
                    >
                      ĐÓNG DẤU
                    </span>
                  </div>
                ) : (
                  /* Unstamped Placeholder (Cute soft watermark paw) */
                  <div className="flex items-center justify-center opacity-40">
                    <CatPawIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#FF8FAB]" isStamped={false} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Cell 8: Phần Thưởng (Cropped Cat Ear Gift Box Image, NO "7D" text label) */}
          <div
            className={`relative aspect-square max-w-[76px] sm:max-w-[84px] w-full mx-auto rounded-2xl p-1.5 sm:p-2 flex flex-col items-center justify-between border-2 transition-all duration-300 shadow-xs cursor-pointer group ${
              isCompleteToday ? 'scale-102 ring-2 ring-amber-400' : 'hover:scale-105'
            }`}
            style={{
              backgroundColor: '#c6e6ff',
              color: '#1e6698',
              borderColor: '#1e6698',
            }}
            title="Phần thưởng hoàn thành thẻ 7 ngày"
          >
            {/* Cropped Gift Box Image with Hover Bounce & Sparkles */}
            <div
              className="flex-1 flex items-center justify-center relative w-full pt-0.5"
              style={{ fontSize: '18px' }}
            >
              <img
                src="/assets/loyalty/gift_box.png"
                alt="Hộp quà mèo phần thưởng"
                className={`w-9 h-9 sm:w-11 sm:h-11 object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-110 ${
                  isCompleteToday ? 'animate-bounce' : ''
                }`}
              />
              {isCompleteToday && (
                <Sparkles className="w-3 h-3 text-[#1e6698] absolute -top-0.5 -right-0.5 animate-pulse" />
              )}
            </div>

            {/* Label (No 7D, neat and clean) */}
            <span
              className="font-black leading-none uppercase tracking-tight text-center pb-0.5"
              style={{
                fontFamily: "'Cal Sans', sans-serif",
                color: '#1e6698',
                fontSize: '10px',
              }}
            >
              {isCompleteToday ? 'ĐÃ NHẬN' : `+${rewardCoins} XU`}
            </span>
          </div>
        </div>

        {/* ================= 5. STATUS BANNER (PRESERVING EXACT TEXT & COLORS) ================= */}
        <div className="relative z-10 w-full text-center mt-3 sm:mt-4">
          {hasCheckedInToday ? (
            <div className="inline-flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-full bg-white/95 backdrop-blur-xs border border-[#FF8FAB]/50 text-xs font-bold shadow-2xs">
              <Check className="w-3.5 h-3.5 text-[#D81C63] stroke-[3]" />
              <span style={{ fontFamily: "'Cal Sans', sans-serif", color: '#bc2e64' }}>
                Đã đóng mộc hôm nay! Hẹn gặp lại quý khách vào ngày mai ♡
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleCellClick(nextTargetDay)}
              disabled={isCheckingIn}
              className="inline-flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-full bg-white/95 hover:bg-[#FFE5EC] border-2 border-[#FF8FAB] text-xs font-black shadow-2xs transition-all cursor-pointer hover:scale-102 active:scale-98"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              <span className="text-sm">🐾</span>
              <span style={{ color: '#bc2e64' }}>
                {isCheckingIn
                  ? 'Đang đóng mộc...'
                  : 'Đóng dấu chân mèo tích điểm nhận ngay 10 xu cá ⪩ ⪨ ꠹'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ================= 6. CYCLE COMPLETION REWARD MODAL (POPUP) ================= */}
      {completionModal?.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#795653]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-sm rounded-3xl bg-[#FFF9F4] border-[3.5px] border-[#FF8FAB] shadow-[8px_8px_0px_#FF8FAB] p-5 sm:p-6 flex flex-col items-center text-center overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Close button */}
            <button
              onClick={() => setCompletionModal(null)}
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white text-[#795653] border-2 border-[#FF8FAB] shadow-[2px_2px_0px_#FF8FAB] flex items-center justify-center cursor-pointer hover:bg-[#FFE5EC]"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Kawaii Ribbon Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE5EC] border-2 border-[#FF8FAB] text-[#D81C63] text-xs font-black shadow-xs mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>HOÀN THÀNH XUẤT SẮC</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>

            {/* Gift Graphic using cropped gift box */}
            <div className="w-20 h-20 rounded-2xl bg-[#c6e6ff] border-2 border-[#1e6698]/40 shadow-[3px_3px_0px_#1e6698] flex items-center justify-center my-1.5 p-2">
              <img
                src="/assets/loyalty/gift_box.png"
                alt="Hộp quà mèo"
                className="w-full h-full object-contain animate-bounce"
              />
            </div>

            {/* Congratulatory Text */}
            <h3
              className="text-lg font-black text-[#D81C63] mt-1.5 mb-1"
              style={{ fontFamily: "'Calistoga', serif" }}
            >
              CHÚC MỪNG QUÝ KHÁCH ♡
            </h3>
            <p
              className="text-xs text-[#795653]/85 leading-relaxed mb-3.5 px-2"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              Quý khách đã hoàn thành thẻ Dấu Chân Khách Quen và nhận được{' '}
              <strong className="text-[#D81C63] font-black">+{completionModal.rewardCoins} XU CÁ</strong>!
            </p>

            {/* Reward Card */}
            <div className="w-full bg-[#FFE5EC] rounded-2xl border-2 border-dashed border-[#FF8FAB] p-2.5 mb-4 flex items-center justify-center gap-2">
              <XuCaIcon className="w-7 h-7 object-contain" />
              <span
                className="text-xl font-black text-[#D81C63]"
                style={{ fontFamily: "'Calistoga', serif" }}
              >
                +{completionModal.rewardCoins} Xu Cá
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setCompletionModal(null)}
              className="w-full py-2.5 px-5 rounded-full bg-[#FF8FAB] hover:bg-[#ff7aa0] text-white font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#D81C63] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              TUYỆT VỜI, CẢMƠN TIỆM CÁ! ♡
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
