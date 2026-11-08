import React from 'react';

export const DoodleFrameBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      <svg
        className="w-full h-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        stroke="#FFAEC0"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0px 1px 1px rgba(255, 174, 192, 0.4))' }}
      >
        {/* ================= TOP EDGE ================= */}
        {/* Top Center: Cute Cat Ears & Whiskers Outline */}
        <g transform="translate(530, 35)">
          {/* Left Cat Ear */}
          <path d="M 0 50 Q 5 15 25 20 Q 40 25 45 45" />
          <path d="M 10 32 L 20 28" strokeWidth="2.5" />
          <path d="M -5 70 L 5 62" strokeWidth="2.5" />
          <path d="M -8 80 L 7 74" strokeWidth="2.5" />

          {/* Right Cat Ear */}
          <path d="M 95 45 Q 100 25 115 20 Q 135 15 140 50" />
          <path d="M 120 28 L 130 32" strokeWidth="2.5" />
          <path d="M 135 62 L 145 70" strokeWidth="2.5" />
          <path d="M 133 74 L 148 80" strokeWidth="2.5" />
        </g>

        {/* Top-Left: Heart with wavy tail */}
        <g transform="translate(180, 75)">
          <path d="M 30 25 C 20 10 0 15 0 35 C 0 50 25 65 30 70 C 35 65 60 50 60 35 C 60 15 40 10 30 25 Z" transform="scale(0.55)" />
          <path d="M 35 30 Q 60 45 90 28 Q 115 18 135 32" strokeWidth="3" />
        </g>

        {/* Top-Left: Star */}
        <g transform="translate(90, 55)">
          <path d="M 25 0 L 32 15 L 48 18 L 36 30 L 39 46 L 25 38 L 11 46 L 14 30 L 2 18 L 18 15 Z" transform="scale(0.8)" />
        </g>

        {/* Top-Left: Sparkle cross */}
        <g transform="translate(60, 45)">
          <path d="M 15 5 L 15 25 M 5 15 L 25 15" strokeWidth="3" />
          <circle cx="32" cy="12" r="1.5" fill="#FFAEC0" />
        </g>

        {/* Top-Right: Cute 5-petal flower */}
        <g transform="translate(940, 45)">
          <circle cx="25" cy="25" r="7" />
          <circle cx="25" cy="11" r="7" />
          <circle cx="38" cy="20" r="7" />
          <circle cx="34" cy="35" r="7" />
          <circle cx="16" cy="35" r="7" />
          <circle cx="12" cy="20" r="7" />
        </g>

        {/* Top-Right: Sparkle cross */}
        <g transform="translate(1030, 30)">
          <path d="M 15 5 L 15 25 M 5 15 L 25 15" strokeWidth="3" />
          <circle cx="28" cy="10" r="1.5" fill="#FFAEC0" />
        </g>

        {/* Top-Right: Swirl loop doodle */}
        <g transform="translate(830, 80)">
          <path d="M 0 20 Q 30 5 45 25 Q 55 40 40 42 Q 25 40 40 20 Q 60 -5 95 10" />
        </g>

        {/* Top-Right: Comic starburst explosion */}
        <g transform="translate(1040, 95)">
          <path d="M 20 0 L 28 14 L 45 8 L 38 25 L 55 35 L 35 40 L 40 58 L 22 45 L 8 55 L 15 36 L 0 25 L 16 20 Z" transform="scale(0.85)" />
        </g>

        {/* ================= LEFT EDGE ================= */}
        {/* Treble Clef */}
        <g transform="translate(30, 150)">
          <path d="M 20 55 C 20 30 40 20 40 10 C 40 0 25 -5 15 5 C 5 15 5 40 25 55 C 45 70 45 95 30 110 C 15 125 -5 110 -5 95" transform="scale(0.65)" />
          <path d="M 18 5 L 18 85 Q 18 95 10 95 Q 5 95 5 88" transform="scale(0.65)" />
        </g>

        {/* Sparkles */}
        <g transform="translate(45, 260)">
          <path d="M 15 0 Q 15 15 0 15 Q 15 15 15 30 Q 15 15 30 15 Q 15 15 15 0 Z" fill="#FFAEC0" stroke="none" transform="scale(0.7)" />
          <circle cx="40" cy="35" r="2.5" fill="#FFAEC0" />
        </g>

        {/* Love Letter Envelope with Heart */}
        <g transform="translate(20, 360)">
          <rect x="0" y="0" width="75" height="52" rx="7" />
          <path d="M 0 0 L 37.5 30 L 75 0" />
          <path d="M 37.5 25 C 34 20 28 22 28 27 C 28 32 37.5 38 37.5 40 C 37.5 38 47 32 47 27 C 47 22 41 20 37.5 25 Z" fill="#FFAEC0" stroke="none" />
        </g>

        {/* Asterisk and Star dots */}
        <g transform="translate(35, 470)">
          <path d="M 12 0 L 12 24 M 0 12 L 24 12 M 4 4 L 20 20 M 4 20 L 20 4" strokeWidth="2.5" transform="scale(0.65)" />
          <path d="M 38 12 Q 38 22 28 22 Q 38 22 38 32 Q 38 22 48 22 Q 38 22 38 12 Z" fill="#FFAEC0" stroke="none" transform="scale(0.7)" />
        </g>

        {/* Cat Paw Print */}
        <g transform="translate(32, 570)">
          {/* Main paw pad */}
          <path d="M 22 35 C 10 35 5 48 15 62 C 22 72 38 72 45 62 C 55 48 50 35 38 35 C 34 35 30 38 30 38 C 30 38 26 35 22 35 Z" fill="#FFAEC0" stroke="#FFAEC0" strokeWidth="3" transform="scale(0.75)" />
          {/* 4 Toe beans */}
          <ellipse cx="14" cy="22" rx="5" ry="6" fill="#FFAEC0" stroke="#FFAEC0" strokeWidth="2" />
          <ellipse cx="26" cy="15" rx="5.5" ry="7" fill="#FFAEC0" stroke="#FFAEC0" strokeWidth="2" />
          <ellipse cx="40" cy="17" rx="5.5" ry="7" fill="#FFAEC0" stroke="#FFAEC0" strokeWidth="2" />
          <ellipse cx="50" cy="26" rx="5" ry="6" fill="#FFAEC0" stroke="#FFAEC0" strokeWidth="2" />
        </g>

        {/* Bottom Left Doodle Wave/Speech flourish */}
        <g transform="translate(20, 680)">
          <path d="M 10 -15 L 25 -15" strokeWidth="3" />
          <path d="M 12 10 Q 5 20 18 45 Q 35 75 75 80 Q 95 82 110 90" strokeWidth="3.5" />
        </g>

        {/* ================= BOTTOM EDGE ================= */}
        {/* Cute Bow Ribbon */}
        <g transform="translate(210, 680)">
          {/* Left loop */}
          <path d="M 45 40 C 20 15 5 35 30 55 C 40 62 48 50 50 45" strokeWidth="4" />
          {/* Right loop */}
          <path d="M 55 45 C 57 50 65 62 75 55 C 100 35 85 15 60 40" strokeWidth="4" />
          {/* Center knot */}
          <circle cx="52" cy="43" r="6" fill="#FFAEC0" />
          {/* Ribbons hanging down */}
          <path d="M 48 48 Q 40 70 30 85 Q 25 90 20 90 Q 25 80 44 52" strokeWidth="3.5" />
          <path d="M 56 48 Q 65 70 80 85 Q 85 90 90 90 Q 82 80 60 52" strokeWidth="3.5" />
        </g>

        {/* Sparkles around bow */}
        <g transform="translate(320, 700)">
          <path d="M 15 0 Q 15 15 0 15 Q 15 15 15 30 Q 15 15 30 15 Q 15 15 15 0 Z" fill="#FFAEC0" stroke="none" transform="scale(0.6)" />
          <circle cx="35" cy="25" r="2" fill="#FFAEC0" />
          <circle cx="48" cy="10" r="2.5" fill="#FFAEC0" />
        </g>

        {/* Center Bottom: Pair of Angel Wings */}
        <g transform="translate(440, 710)">
          {/* Left Wing */}
          <path d="M 45 35 C 35 15 10 15 0 25 C 0 35 12 40 22 40 C 5 45 10 55 25 50 C 18 55 25 62 38 52 C 45 48 46 38 45 35 Z" strokeWidth="3.5" />
          {/* Right Wing */}
          <path d="M 65 35 C 75 15 100 15 110 25 C 110 35 98 40 88 40 C 105 45 100 55 85 50 C 92 55 85 62 72 52 C 65 48 64 38 65 35 Z" strokeWidth="3.5" />
        </g>

        {/* Bottom Sparkle Crosses */}
        <g transform="translate(640, 715)">
          <path d="M 10 0 L 10 20 M 0 10 L 20 10" strokeWidth="2.5" />
          <circle cx="35" cy="15" r="4" fill="none" strokeWidth="2.5" />
        </g>

        <g transform="translate(740, 710)">
          <path d="M 18 0 Q 18 18 0 18 Q 18 18 18 36 Q 18 18 36 18 Q 18 18 18 0 Z" fill="#FFAEC0" stroke="none" transform="scale(0.7)" />
        </g>

        {/* Bottom Right: Music Notes */}
        <g transform="translate(840, 660)">
          {/* Single Note */}
          <path d="M 20 40 L 20 10 Q 30 15 35 12" strokeWidth="3.5" />
          <ellipse cx="14" cy="42" rx="7" ry="5" fill="#FFAEC0" />

          {/* Double Beam Note */}
          <g transform="translate(40, 20)">
            <ellipse cx="12" cy="42" rx="7" ry="5" fill="#FFAEC0" />
            <ellipse cx="42" cy="42" rx="7" ry="5" fill="#FFAEC0" />
            <path d="M 18 40 L 18 10 L 48 10 L 48 40" strokeWidth="3.5" />
            <path d="M 18 16 L 48 16" strokeWidth="2.5" />
          </g>
        </g>

        {/* Bottom Right Sparkle Cross */}
        <g transform="translate(970, 680)">
          <path d="M 12 0 L 12 24 M 0 12 L 24 12" strokeWidth="3" />
        </g>

        {/* ================= RIGHT EDGE ================= */}
        {/* Sparkle 4-point Star */}
        <g transform="translate(1080, 260)">
          <path d="M 20 0 Q 20 20 0 20 Q 20 20 20 40 Q 20 20 40 20 Q 20 20 20 0 Z" fill="#FFAEC0" stroke="none" transform="scale(0.8)" />
          <circle cx="-15" cy="50" r="2.5" fill="#FFAEC0" />
        </g>

        {/* Japanese Kaomoji: ( ^ ▽ ^ ) */}
        <g transform="translate(980, 360)">
          {/* Left parenthesis */}
          <path d="M 10 10 Q 0 35 10 60" strokeWidth="3.5" />
          {/* Left eye: happy caret */}
          <path d="M 25 35 L 35 20 L 45 35" strokeWidth="3.5" />
          {/* Cute open mouth: triangle */}
          <path d="M 55 35 L 75 35 L 65 52 Z" strokeWidth="3" />
          {/* Right eye: happy caret */}
          <path d="M 85 35 L 95 20 L 105 35" strokeWidth="3.5" />
          {/* Right parenthesis */}
          <path d="M 120 10 Q 130 35 120 60" strokeWidth="3.5" />
        </g>

        {/* Swirl spiral doodle */}
        <g transform="translate(1100, 450)">
          <path d="M 25 25 C 20 18 10 22 12 32 C 15 42 32 42 38 30 C 42 16 25 5 12 12 C -2 20 -2 45 15 55" strokeWidth="3" transform="scale(0.7)" />
        </g>

        {/* Sparkles on middle right */}
        <g transform="translate(1120, 560)">
          <path d="M 10 0 L 10 20 M 0 10 L 20 10" strokeWidth="3" />
          <circle cx="15" cy="30" r="2" fill="#FFAEC0" />
        </g>

        {/* Heart cluster on bottom right area */}
        <g transform="translate(950, 520)">
          <path d="M 12 10 C 8 4 0 6 0 14 C 0 20 10 26 12 28 C 14 26 24 20 24 14 C 24 6 16 4 12 10 Z" fill="#FFAEC0" stroke="none" transform="scale(0.6)" />
          <path d="M 30 18 C 27 14 20 15 20 21 C 20 25 27 30 28 32 C 29 30 36 25 36 21 C 36 15 31 14 30 18 Z" fill="#FFAEC0" stroke="none" transform="scale(0.5)" />
        </g>
      </svg>
    </div>
  );
};
