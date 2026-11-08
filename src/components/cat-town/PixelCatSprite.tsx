import React from 'react';
import { CatBreed } from '../../types.ts';

interface PixelCatSpriteProps {
  avatarUrl?: string;
  breed?: CatBreed;
  color?: string;
  mood?: 'happy' | 'sleepy' | 'playful' | 'hungry' | 'love';
  action?: 'idle' | 'walk' | 'sleep' | 'eat' | 'play';
  size?: number;
  className?: string;
}

export const PixelCatSprite: React.FC<PixelCatSpriteProps> = ({
  avatarUrl,
  breed = 'Mèo Cam',
  color = '#F4A261',
  mood = 'happy',
  action = 'idle',
  size = 64,
  className = '',
}) => {
  if (avatarUrl) {
    return (
      <div
        className={`relative inline-block select-none ${className}`}
        style={{
          width: size,
          height: size,
          imageRendering: 'pixelated',
        }}
      >
        <img
          src={avatarUrl}
          alt={breed}
          className="w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    );
  }

  // Breed color overrides
  let mainColor = color;
  let secondaryColor = '#E76F51';
  let earColor = '#FFB3C6';
  let bellyColor = '#FFF9F4';

  if (breed === 'Mèo Mướp') {
    mainColor = '#A89F91';
    secondaryColor = '#6D685F';
  } else if (breed === 'Mèo Tam Thể') {
    mainColor = '#F4A261';
    secondaryColor = '#3D3A45';
    earColor = '#FF8FAB';
  } else if (breed === 'Mèo Trắng') {
    mainColor = '#FFFFFF';
    secondaryColor = '#E0E0E0';
    earColor = '#FFC2D1';
    bellyColor = '#F8F9FA';
  } else if (breed === 'Mèo Đen') {
    mainColor = '#2B2830';
    secondaryColor = '#1A181E';
    earColor = '#D6336C';
    bellyColor = '#3D3A45';
  } else if (breed === 'Mèo Xám') {
    mainColor = '#90A4AE';
    secondaryColor = '#607D8B';
    earColor = '#FFB3C6';
    bellyColor = '#CFD8DC';
  }

  return (
    <div
      className={`relative inline-block select-none ${className}`}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
      }}
    >
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{
          shapeRendering: 'crispEdges',
          imageRendering: 'pixelated',
        }}
      >
        {/* Shadow */}
        <ellipse cx="16" cy="29" rx="10" ry="2.5" fill="#795653" opacity="0.25" />

        {/* Tail */}
        <path
          d={
            action === 'sleep'
              ? 'M6 24 h4 v3 h-4 z'
              : 'M6 19 h2 v-4 h2 v-2 h2 v2 h-2 v4 h-4 z'
          }
          fill={secondaryColor}
        />

        {/* Cat Body */}
        <rect x="9" y="16" width="14" height="11" rx="0" fill={mainColor} />
        {/* Belly patch */}
        <rect x="11" y="19" width="10" height="7" fill={bellyColor} />

        {/* Paws */}
        <rect x="10" y="27" width="3" height="2" fill={bellyColor} />
        <rect x="19" y="27" width="3" height="2" fill={bellyColor} />

        {/* Head */}
        <rect x="8" y="7" width="16" height="11" fill={mainColor} />

        {/* Ears */}
        {/* Left ear */}
        <polygon points="8,7 8,2 13,7" fill={mainColor} />
        <polygon points="9,6 9,4 11,6" fill={earColor} />
        {/* Right ear */}
        <polygon points="24,7 24,2 19,7" fill={mainColor} />
        <polygon points="23,6 23,4 21,6" fill={earColor} />

        {/* Stripes if tabby */}
        {(breed === 'Mèo Mướp' || breed === 'Mèo Cam' || breed === 'Mèo Tam Thể') && (
          <>
            <rect x="15" y="7" width="2" height="3" fill={secondaryColor} />
            <rect x="12" y="8" width="1" height="2" fill={secondaryColor} />
            <rect x="19" y="8" width="1" height="2" fill={secondaryColor} />
            <rect x="8" y="11" width="2" height="1" fill={secondaryColor} />
            <rect x="22" y="11" width="2" height="1" fill={secondaryColor} />
          </>
        )}

        {/* Face Elements depending on mood / action */}
        {action === 'sleep' ? (
          <>
            {/* Closed sleeping eyes */}
            <path d="M11 12 h3 M18 12 h3" stroke="#4A3735" strokeWidth="1" strokeLinecap="square" />
            {/* Zzz floating */}
            <text x="21" y="6" fontSize="5" fill="#A9C5F2" fontFamily="monospace" fontWeight="bold">
              z
            </text>
          </>
        ) : mood === 'love' ? (
          <>
            {/* Heart eyes */}
            <rect x="11" y="11" width="3" height="3" fill="#D6336C" />
            <rect x="18" y="11" width="3" height="3" fill="#D6336C" />
          </>
        ) : (
          <>
            {/* Big cute pixel eyes */}
            <rect x="11" y="10" width="3" height="3" fill="#2B2830" />
            <rect x="12" y="10" width="1" height="1" fill="#FFFFFF" />
            <rect x="18" y="10" width="3" height="3" fill="#2B2830" />
            <rect x="19" y="10" width="1" height="1" fill="#FFFFFF" />
          </>
        )}

        {/* Nose & Mouth */}
        <rect x="15" y="13" width="2" height="1" fill="#FF8FAB" />
        <path d="M14 15 h1 v-1 h2 v1 h1" stroke="#795653" strokeWidth="0.8" fill="none" />

        {/* Cheeks */}
        <rect x="9" y="13" width="2" height="1" fill="#FFB3C6" opacity="0.8" />
        <rect x="21" y="13" width="2" height="1" fill="#FFB3C6" opacity="0.8" />

        {/* Whiskers */}
        <line x1="6" y1="12" x2="8" y2="12" stroke="#795653" strokeWidth="0.7" />
        <line x1="6" y1="14" x2="8" y2="14" stroke="#795653" strokeWidth="0.7" />
        <line x1="24" y1="12" x2="26" y2="12" stroke="#795653" strokeWidth="0.7" />
        <line x1="24" y1="14" x2="26" y2="14" stroke="#795653" strokeWidth="0.7" />

        {/* Collar with gold bell */}
        <rect x="10" y="17" width="12" height="1.5" fill="#D6336C" />
        <rect x="15" y="17.5" width="2" height="2" fill="#F7DDA0" />
      </svg>
    </div>
  );
};
