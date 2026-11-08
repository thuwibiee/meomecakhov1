import React from 'react';
import { CatTownFishRarity } from '../../types.ts';
import { FISH_DATABASE } from './fishDatabase.ts';

interface PixelFishSpriteProps {
  fishId?: string;
  rarity?: CatTownFishRarity;
  size?: number;
  className?: string;
}

export const PixelFishSprite: React.FC<PixelFishSpriteProps> = ({
  fishId = 'fish_bong_bong',
  rarity = 'common',
  size = 48,
  className = '',
}) => {
  // If fishId matches an item in FISH_DATABASE, render the authentic transparent pixel art image
  const dbFish = FISH_DATABASE.find((f) => f.id === fishId);
  if (dbFish) {
    return (
      <img
        src={dbFish.imageSrc}
        alt={dbFish.name}
        className={`object-contain select-none ${className}`}
        style={{
          width: size,
          height: size,
          imageRendering: 'pixelated',
        }}
      />
    );
  }

  // Determine colors based on fishId
  let bodyColor = '#FF8FAB';
  let finColor = '#FFB3C6';
  let eyeColor = '#2B2830';
  let specialDecoration = null;

  if (fishId === 'fish_bong_bong') {
    bodyColor = '#FFB3C6';
    finColor = '#FFE5EC';
  } else if (fishId === 'fish_meo_con') {
    bodyColor = '#A9C5F2';
    finColor = '#CBE3FB';
    specialDecoration = 'cat_ears';
  } else if (fishId === 'fish_cau_vong') {
    bodyColor = '#F7DDA0';
    finColor = '#FFB3C6';
    specialDecoration = 'rainbow_stripes';
  } else if (fishId === 'fish_anh_trang') {
    bodyColor = '#CDB4DB';
    finColor = '#E0AAFF';
    specialDecoration = 'crescent';
  } else if (fishId === 'fish_hoa_dao') {
    bodyColor = '#FF8FAB';
    finColor = '#FFC2D1';
    specialDecoration = 'petal';
  } else if (fishId === 'fish_kim_ngan') {
    bodyColor = '#FFD166';
    finColor = '#FFE29A';
    specialDecoration = 'gold_sparkle';
  } else if (fishId === 'fish_than_long') {
    bodyColor = '#06D6A0';
    finColor = '#118AB2';
    specialDecoration = 'dragon_horns';
  } else if (fishId === 'fish_meo_hoang_gia') {
    bodyColor = '#7209B7';
    finColor = '#F72585';
    specialDecoration = 'crown';
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
        {/* Tail Fin */}
        <polygon points="2,12 8,16 2,20" fill={finColor} />
        <rect x="2" y="15" width="4" height="2" fill={bodyColor} />

        {/* Fish Main Body */}
        <ellipse cx="16" cy="16" rx="9" ry="7" fill={bodyColor} />

        {/* Belly lighter shade */}
        <path d="M10 18 Q16 23 22 18" stroke="#FFF9F4" strokeWidth="2" fill="none" opacity="0.6" />

        {/* Top & Bottom Fins */}
        <polygon points="14,9 18,5 20,9" fill={finColor} />
        <polygon points="14,23 18,27 20,23" fill={finColor} />

        {/* Side Fin */}
        <polygon points="12,16 16,15 15,18" fill={finColor} />

        {/* Eye */}
        <rect x="20" y="13" width="3" height="3" fill="#FFFFFF" />
        <rect x="21" y="14" width="2" height="2" fill={eyeColor} />
        <rect x="22" y="14" width="1" height="1" fill="#FFFFFF" />

        {/* Mouth */}
        <rect x="24" y="17" width="2" height="1" fill="#795653" />

        {/* Special Decorations */}
        {specialDecoration === 'cat_ears' && (
          <>
            <polygon points="15,9 16,6 18,9" fill="#FF8FAB" />
            <polygon points="19,9 20,6 22,9" fill="#FF8FAB" />
          </>
        )}

        {specialDecoration === 'crown' && (
          <>
            <polygon points="16,9 18,4 20,7 22,4 24,9" fill="#FFD166" />
            <rect x="20" y="5" width="1" height="1" fill="#D6336C" />
          </>
        )}

        {specialDecoration === 'dragon_horns' && (
          <>
            <line x1="18" y1="9" x2="16" y2="4" stroke="#FFD166" strokeWidth="1.5" />
            <line x1="21" y1="9" x2="23" y2="4" stroke="#FFD166" strokeWidth="1.5" />
          </>
        )}

        {specialDecoration === 'rainbow_stripes' && (
          <>
            <rect x="13" y="11" width="1.5" height="10" fill="#FF8FAB" />
            <rect x="16" y="10" width="1.5" height="12" fill="#06D6A0" />
            <rect x="19" y="12" width="1.5" height="8" fill="#A9C5F2" />
          </>
        )}

        {specialDecoration === 'crescent' && (
          <path d="M14 12 A3 3 0 0 0 14 18 A4 4 0 0 1 14 12" fill="#F7DDA0" />
        )}

        {specialDecoration === 'petal' && (
          <circle cx="15" cy="15" r="2" fill="#FFE5EC" />
        )}

        {specialDecoration === 'gold_sparkle' && (
          <>
            <rect x="13" y="13" width="2" height="2" fill="#FFFFFF" />
            <rect x="16" y="17" width="2" height="2" fill="#FFFFFF" />
          </>
        )}

        {/* Bubbles on common/rare */}
        <circle cx="27" cy="12" r="1" fill="#A9C5F2" opacity="0.7" />
        <circle cx="29" cy="9" r="1.5" fill="#A9C5F2" opacity="0.6" />
      </svg>
    </div>
  );
};
