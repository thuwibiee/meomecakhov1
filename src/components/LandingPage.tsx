import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onEnterShop: () => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
  username?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterShop,
  onOpenAuth,
  isLoggedIn,
  username,
}) => {
  const brandLogoUrl = 'https://i.postimg.cc/TPjt5rnx/b24a8c9f-0a83-491c-9de4-aa41c4e77342.png';
  const backgroundImageSrc = '/assets/aistudio/image_acaed8f2.png';
  const centerGraphicUrl = 'https://i.postimg.cc/d007bbtX/eaf565fb-ee92-4d57-86d6-52d7edab795d.png';

  const [isPressed, setIsPressed] = useState(false);

  // Gentle wind chime sound synthesizer (Web Audio API)
  const playWindChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Pentatonic crystal wind chime frequencies (E6, G6, A6, C7, D7, E7)
      const notes = [
        { freq: 1567.98, delay: 0 },
        { freq: 2093.00, delay: 0.08 },
        { freq: 1318.51, delay: 0.16 },
        { freq: 2349.32, delay: 0.24 },
        { freq: 1760.00, delay: 0.35 },
        { freq: 2637.02, delay: 0.46 },
      ];

      notes.forEach(({ freq, delay }) => {
        const startTime = ctx.currentTime + delay;

        // Fundamental pure tone (Sine)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        // Metallic glass chime overtone
        const overtone = ctx.createOscillator();
        const overtoneGain = ctx.createGain();
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * 2.76, startTime);

        // Gentle crystalline decay
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.0);

        overtoneGain.gain.setValueAtTime(0, startTime);
        overtoneGain.gain.linearRampToValueAtTime(0.05, startTime + 0.005);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.0);

        osc.connect(gain);
        gain.connect(ctx.destination);
        overtone.connect(overtoneGain);
        overtoneGain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 2.05);
        overtone.start(startTime);
        overtone.stop(startTime + 1.05);
      });
    } catch (e) {
      console.warn('AudioContext playback error:', e);
    }
  };

  const handleButtonClick = () => {
    setIsPressed(true);
    playWindChime();
    // Provide a noticeable dynamic color-shift feedback while chimes tinkle before navigating
    setTimeout(() => {
      setIsPressed(false);
      onEnterShop();
    }, 420);
  };

  return (
    <div className="relative min-h-screen bg-[#f8cad8] text-[#795653] flex flex-col justify-between overflow-hidden selection:bg-[#F6A6B8]/30">
      {/* Background matching design of attached image: Scalloped lace trim, soft pink aura & dreamy stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <img
          src={backgroundImageSrc}
          alt="Mèo Mê Cá Khô Background"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-[#f7a8c4]/20 mix-blend-multiply pointer-events-none" />
      </div>

      {/* Top Banner Navigation: Only the brand image logo, without text */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center">
          <img
            src={brandLogoUrl}
            alt="Mèo Mê Cá Khô"
            referrerPolicy="no-referrer"
            className="h-11 sm:h-12 w-auto object-contain rounded-2xl shadow-xs"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#526C91] bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-full border border-[#526C91]/20 shadow-2xs">
                Chào mừng, {username} 🌸
              </span>
              <button
                onClick={onEnterShop}
                className="py-2 px-4 rounded-xl bg-[#F6A6B8] hover:bg-[#f391a6] text-[#795653] font-bold text-xs shadow-xs border border-[#A6536A]/30 transition-all cursor-pointer"
              >
                Vào Tiệm Cá
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="py-2 px-3.5 rounded-xl border border-[#795653]/30 hover:bg-[#795653]/5 font-bold text-xs transition-colors cursor-pointer bg-white/80 backdrop-blur-xs"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#E13F7C' }}
              >
                Đăng Nhập / Đăng Ký
              </button>
              <button
                onClick={onEnterShop}
                className="py-2 px-4 rounded-xl hover:bg-[#f391a6] font-bold text-xs shadow-xs border border-[#A6536A]/30 transition-all flex items-center gap-1.5 cursor-pointer"
                style={{ fontFamily: "'Cal Sans', sans-serif", color: '#E13F7C', backgroundColor: '#FFC0DE' }}
              >
                <span>Xem Quầy Cá</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Hero Section: Center graphic art + 3D Liquid Glass CTA button with Shimmer effect */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 flex flex-col items-center justify-center text-center my-auto py-2 sm:py-6">
        {/* Center Artwork Image - Zoomed in much larger */}
        <div className="w-full flex items-center justify-center mb-6 sm:mb-8">
          <img
            src={centerGraphicUrl}
            alt="Mèo Mê Cá Khô Artwork"
            referrerPolicy="no-referrer"
            className="w-[340px] sm:w-[500px] md:w-[640px] lg:w-[740px] max-w-[92vw] max-h-[460px] sm:max-h-[560px] object-contain drop-shadow-lg select-none pointer-events-none transition-transform duration-300 hover:scale-101"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* CTA Button moved down slightly with Shimmer Effect - Scaled down slightly */}
        <div className="flex items-center justify-center w-full">
          <button
            onClick={handleButtonClick}
            className={`liquid-glass-btn relative py-2.5 sm:py-3.5 px-7 sm:px-11 rounded-full font-black text-sm sm:text-base md:text-lg tracking-wider flex items-center justify-center gap-2.5 cursor-pointer select-none active:outline-hidden transition-all duration-300 ${
              isPressed ? 'btn-pressed' : ''
            }`}
            style={{
              color: '#D6336C',
              textShadow: '0 1px 2px rgba(255, 255, 255, 0.95)',
            }}
          >
            {/* Shimmer sweep effect */}
            <span className="shimmer-liquid" />

            <span
              className="relative z-10 tracking-wide font-black"
              style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: '21px' }}
            >
              SỐP PING CHỌN CÁ 𓆝 ⋆.
            </span>
          </button>
        </div>
      </main>

      {/* Balanced bottom spacing */}
      <div className="h-8 relative z-10"></div>
    </div>
  );
};
