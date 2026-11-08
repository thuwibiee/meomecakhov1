import React, { useState } from 'react';
import { CatTownFortune, CatTownUserProfile } from '../../types.ts';
import { firebaseApi } from '../../firebase.ts';
import { PixelCatSprite } from './PixelCatSprite.tsx';
import { XuCaIcon } from '../XuCaIcon.tsx';

interface FortuneMinigameProps {
  authToken: string | null;
  profile: CatTownUserProfile | null;
  userBalance: number;
  onBalanceUpdated: (newBal: number) => void;
  onRefreshProfile: () => void;
  onBackToMap: () => void;
  onOpenAuth: () => void;
}

export const FortuneMinigame: React.FC<FortuneMinigameProps> = ({
  authToken,
  profile,
  userBalance,
  onBalanceUpdated,
  onRefreshProfile,
  onBackToMap,
  onOpenAuth,
}) => {
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [revealedFortune, setRevealedFortune] = useState<CatTownFortune | null>(null);
  const [rewardCoins, setRewardCoins] = useState<number>(0);
  const [hasClaimedToday, setHasClaimedToday] = useState<boolean>(
    !!profile?.dailyFortuneClaimed
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCastFortune = async () => {
    if (!authToken) {
      onOpenAuth();
      return;
    }

    setIsRevealing(true);
    setErrorMessage(null);

    try {
      // Small suspense delay for crystal ball animation
      await new Promise((r) => setTimeout(r, 1200));

      const res = await firebaseApi('/api/cat-town/action/fortune', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi rút quẻ bói');
      }

      setRevealedFortune(data.fortune);
      setRewardCoins(data.rewardCoins);
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
            className="text-base sm:text-lg font-black text-[#7B2CBF] flex items-center gap-1.5"
            style={{ fontFamily: "'Tiny5', monospace" }}
          >
            <span>🔮</span>
            <span>LỀU BÓI MEO MEO — TIÊN TRI ĐẦU NGÀY</span>
          </h2>
          <span className="text-[11px] font-bold text-[#795653]">
            {hasClaimedToday ? '✓ Đã nhận thưởng Xu Cá bói toán hôm nay' : '✨ Hôm nay chưa xem bói (+10 Xu Cá)'}
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

      {/* Main Tent Screen */}
      <div className="w-full bg-gradient-to-b from-[#2B1B3D] via-[#4A285D] to-[#1E102E] border-4 border-[#795653] rounded-3xl p-6 shadow-[6px_6px_0px_#795653] text-white flex flex-col items-center justify-center relative overflow-hidden min-h-[460px]">
        {/* Starry background lights */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-6 left-12 text-xs animate-ping">✨</div>
          <div className="absolute top-12 right-16 text-sm animate-pulse">⭐</div>
          <div className="absolute bottom-20 left-20 text-xs animate-bounce">✨</div>
          <div className="absolute bottom-10 right-28 text-sm animate-pulse">🌟</div>
        </div>

        {/* Tent Decoration Roof Drapery */}
        <div className="absolute top-0 inset-x-0 h-10 flex justify-around pointer-events-none opacity-80">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-16 h-8 bg-[#7209B7] rounded-b-full border-b-2 border-x border-[#FF8FAB]/40 shadow-xs"
            />
          ))}
        </div>

        {/* Center: Fortune Cat with Witch Cloak & Glowing Crystal Ball */}
        <div className="relative z-10 flex flex-col items-center my-4">
          {/* Witch Hat & Cat */}
          <div className="relative">
            {/* Witch Hat */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="w-0 h-0 border-x-[16px] border-x-transparent border-b-[24px] border-b-[#7209B7]" />
              <div className="w-14 h-2 bg-[#9D4EDD] rounded-full -mt-0.5 border border-[#FFD166]" />
            </div>

            <PixelCatSprite
              avatarUrl={profile?.cat?.avatarUrl || '/assets/cats/cat_07.png'}
              breed={profile?.cat?.breed || 'Mèo Đen'}
              size={96}
              mood="love"
            />
          </div>

          {/* Wooden Table with Crystal Ball */}
          <div className="relative -mt-4 flex flex-col items-center">
            {/* Crystal Ball Sphere */}
            <div
              className={`relative w-24 h-24 rounded-full bg-gradient-to-br from-[#E0AAFF] via-[#9D4EDD] to-[#3C096C] border-3 border-[#FFD166] shadow-[0_0_35px_rgba(224,170,255,0.7)] flex items-center justify-center cursor-pointer transition-all ${
                isRevealing ? 'scale-110 animate-spin' : 'hover:scale-105'
              }`}
              onClick={handleCastFortune}
            >
              <span className="text-3xl filter drop-shadow-[0_0_8px_white]">
                {isRevealing ? '🌀' : '🔮'}
              </span>
            </div>

            {/* Ball Stand */}
            <div className="w-14 h-4 bg-[#FFD166] border-2 border-[#795653] rounded-t-lg -mt-1 shadow-md" />
            {/* Table */}
            <div className="w-48 h-8 bg-[#D4A373] border-3 border-[#795653] rounded-xl shadow-[3px_3px_0px_#795653] -mt-1 flex items-center justify-center">
              <span className="text-[10px] text-[#795653] font-black tracking-wider">
                BÀN TIÊN TRI
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="relative z-10 mt-2">
          <button
            onClick={handleCastFortune}
            disabled={isRevealing}
            className="py-3 px-8 bg-[#FF8FAB] hover:bg-[#f37898] disabled:opacity-50 active:translate-y-0.5 text-white font-black text-sm rounded-2xl border-3 border-[#FFD166] shadow-[4px_4px_0px_#795653] cursor-pointer flex items-center gap-2"
            style={{ fontFamily: "'Tiny5', monospace" }}
          >
            <span>✨</span>
            <span>{isRevealing ? 'ĐANG ĐỌC TIA SÁNG...' : 'XEM VẬN MAY HÔM NAY ♡'}</span>
            <span>🔮</span>
          </button>
        </div>
      </div>

      {/* Prophecy Card Modal */}
      {revealedFortune && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#795653]/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm bg-[#FFF9F4] rounded-3xl border-4 border-[#795653] p-6 text-center shadow-[6px_6px_0px_#795653] animate-in zoom-in-95">
            <div className="text-3xl mb-1">📜</div>
            <div
              className="inline-block px-3 py-0.5 rounded-full bg-[#E0AAFF] text-[#5A189A] font-black text-[11px] mb-2 uppercase"
              style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
            >
              {revealedFortune.category}
            </div>

            <h3
              className="text-base font-black text-[#D6336C] mb-2"
              style={{ fontFamily: "'Tiny5 Duo', 'Tiny5', monospace" }}
            >
              {revealedFortune.title}
            </h3>

            {/* Prophecy text */}
            <div
              className="p-4 rounded-2xl bg-[#FFE5EC] border-2 border-[#795653] mb-3 text-left space-y-2"
              style={{ fontFamily: "'Cal Sans', sans-serif" }}
            >
              <p
                className="text-xs leading-relaxed font-semibold"
                style={{ color: '#FF6082' }}
              >
                "{revealedFortune.prophecy}"
              </p>
              <div
                className="border-t border-[#795653]/15 pt-2 flex justify-between text-[11px] font-bold"
                style={{ color: '#FF6082' }}
              >
                <span>Số may mắn: <strong className="text-[#D6336C]">{revealedFortune.luckyNumber}</strong></span>
                <span>Màu may mắn: <strong className="text-[#0A5EB0]">{revealedFortune.luckyColor}</strong></span>
              </div>
              <p
                className="text-[11px] italic pt-1"
                style={{ color: '#a14b64' }}
              >
                💡 <strong>Lời khuyên:</strong> {revealedFortune.advice}
              </p>
            </div>

            {/* Coin reward badge if awarded */}
            {rewardCoins > 0 && (
              <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 bg-[#F7DDA0] border-2 border-[#795653] rounded-full text-xs font-black text-[#795653] shadow-[2px_2px_0px_#795653]">
                <XuCaIcon className="w-4 h-4 object-contain inline-block" />
                <span>+{rewardCoins} Xu Cá thưởng đầu ngày!</span>
              </div>
            )}

            <button
              onClick={() => setRevealedFortune(null)}
              className="w-full py-2.5 font-black text-xs rounded-xl border-2 border-[#795653] shadow-[2px_2px_0px_#795653] cursor-pointer"
              style={{
                fontFamily: "'Tiny5 Duo', 'Tiny5', monospace",
                color: '#dd113f',
                backgroundColor: '#ffb8cc',
              }}
            >
              CẢM ƠN MÈO TIÊN TRI! 🐾
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
