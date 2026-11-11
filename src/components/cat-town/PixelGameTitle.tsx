import React, { useState, useEffect } from 'react';
import { PixelFishSprite } from './PixelFishSprite.tsx';
import { retroAudio } from './retroAudio.ts';

interface PixelGameTitleProps {
  className?: string;
  onTitleClick?: () => void;
}

export const PixelGameTitle: React.FC<PixelGameTitleProps> = ({
  className = '',
  onTitleClick,
}) => {
  // Opening state machine: 'opening' (first 1.4s) -> 'idle'
  const [isOpening, setIsOpening] = useState<boolean>(true);
  const [showShine, setShowShine] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [burstKey, setBurstKey] = useState<number>(0);

  useEffect(() => {
    // 1. Trigger shine sweep after title pops in (~450ms)
    const shineTimer = setTimeout(() => {
      setShowShine(true);
    }, 450);

    // 2. Settle into idle state after full opening choreography completes (~1400ms)
    const settleTimer = setTimeout(() => {
      setIsOpening(false);
      setShowShine(false);
    }, 1450);

    return () => {
      clearTimeout(shineTimer);
      clearTimeout(settleTimer);
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setBurstKey((prev) => prev + 1);
    try {
      retroAudio.playBlip(880, 0.04);
    } catch {}
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none cursor-pointer group ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onTitleClick}
      style={{
        imageRendering: 'pixelated',
      }}
    >
      {/* ================= 1. OPENING / IDLE PIXEL STARS & SPARKLES ================= */}
      {/* Top Left Star */}
      <span
        className={`absolute -top-3 sm:-top-5 -left-4 sm:-left-8 text-xs sm:text-sm text-[#FF8FAB] pointer-events-none transition-all duration-300 ${
          isOpening ? 'animate-particle-pop' : 'animate-star-twinkle'
        }`}
        style={{ animationDelay: '0.1s' }}
      >
        ✦
      </span>

      {/* Top Center-Right Star */}
      <span
        className={`absolute -top-4 sm:-top-6 right-1/4 text-[10px] sm:text-xs text-[#F7DDA0] pointer-events-none transition-all duration-300 ${
          isOpening ? 'animate-particle-pop' : 'animate-star-twinkle'
        }`}
        style={{ animationDelay: '0.35s' }}
      >
        ★
      </span>

      {/* Far Right Twinkle Star */}
      <span
        className={`absolute -top-1 sm:-top-2 -right-4 sm:-right-8 text-xs sm:text-sm text-[#FF8FAB] pointer-events-none transition-all duration-300 ${
          isOpening ? 'animate-particle-pop' : 'animate-star-twinkle'
        }`}
        style={{ animationDelay: '0.2s' }}
      >
        ✧
      </span>

      {/* Bottom Left Mini Pixel Star */}
      <span
        className={`absolute -bottom-2 -left-2 sm:-left-4 text-[10px] sm:text-xs text-[#F7DDA0] pointer-events-none transition-all duration-300 ${
          isOpening ? 'animate-particle-pop' : 'animate-star-twinkle'
        }`}
        style={{ animationDelay: '0.5s' }}
      >
        ✦
      </span>

      {/* Bottom Right Star */}
      <span
        className={`absolute -bottom-2 -right-3 text-[10px] sm:text-xs text-[#FF8FAB] pointer-events-none transition-all duration-300 ${
          isOpening ? 'animate-particle-pop' : 'animate-star-twinkle'
        }`}
        style={{ animationDelay: '0.65s' }}
      >
        ★
      </span>

      {/* ================= 2. HOVER BURST PARTICLES ================= */}
      {isHovered && (
        <div key={burstKey} className="absolute inset-0 pointer-events-none z-30">
          <span
            className="absolute top-1/4 left-1/4 text-xs text-[#FF8FAB] animate-sparkle-burst"
            style={{ '--burst-offset': 'translate(-18px, -18px)' } as any}
          >
            ✦
          </span>
          <span
            className="absolute top-1/3 right-1/4 text-xs text-[#F7DDA0] animate-sparkle-burst"
            style={{ '--burst-offset': 'translate(20px, -16px)' } as any}
          >
            ★
          </span>
          <span
            className="absolute bottom-1/4 left-1/3 text-xs text-[#D6336C] animate-sparkle-burst"
            style={{ '--burst-offset': 'translate(-16px, 16px)' } as any}
          >
            ✧
          </span>
          <span
            className="absolute bottom-1/3 right-1/3 text-xs text-[#FF8FAB] animate-sparkle-burst"
            style={{ '--burst-offset': 'translate(18px, 18px)' } as any}
          >
            ✦
          </span>
          <span
            className="absolute -top-1 left-1/2 text-xs text-[#FFF9F4] animate-sparkle-burst"
            style={{ '--burst-offset': 'translate(0px, -22px)' } as any}
          >
            ★
          </span>
        </div>
      )}


      {/* ================= 4. MAIN TITLE TEXT CONTAINER ================= */}
      <div
        className={`relative inline-block transition-transform duration-250 ease-out ${
          isOpening ? 'animate-title-pop' : 'animate-title-float'
        } ${isHovered ? 'scale-[1.03]' : 'scale-100'}`}
      >
        {/* The Text Itself */}
        <h1
          className={`relative z-10 font-black tracking-wider leading-[97px] sm:leading-none -mr-[12px] sm:-mr-[24px] select-none transition-all duration-300 text-[72px] sm:text-[94px] ${
            isOpening ? 'text-[#FF8FAB]' : 'text-[#FF8FAB] animate-title-neon'
          }`}
          style={{
            fontFamily: "'Tiny5', monospace",
            paddingLeft: '-4px',
            paddingRight: '-19px',
            // Crisp pixel drop shadow + soft pastel glow
            textShadow: isHovered
              ? '0 0 16px rgba(255, 143, 171, 0.95), 0 0 28px rgba(255, 182, 193, 0.7), 3px 3px 0px #795653'
              : '3px 3px 0px #795653, 0 0 12px rgba(255, 143, 171, 0.4)',
          }}
        >
          THỊ TRẤN CÁ MÈO
        </h1>


        {/* Shine Sweep Overlay (sweeps once on Opening, or on Hover) */}
        {(showShine || isHovered) && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden z-20 animate-title-shine"
            style={{
              mixBlendMode: 'screen',
            }}
          >
            <div
              className="w-16 sm:w-24 h-full bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[-25deg]"
            />
          </div>
        )}

        {/* ================= 5. SWIMMING PIXEL FISH UNDER TITLE ================= */}
        <div className="absolute -bottom-3 sm:-bottom-4 left-0 w-full h-5 pointer-events-none overflow-visible z-10">
          <div className="absolute animate-fish-glide flex items-center gap-1">
            <PixelFishSprite fishId="fish_bong_bong" size={16} />
            <span className="text-[9px] text-[#A9C5F2] opacity-75">🫧</span>
          </div>
        </div>
      </div>
    </div>
  );
};
