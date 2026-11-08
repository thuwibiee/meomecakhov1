import React from 'react';
import { getFurnitureAssetUrl } from './furnitureCatalog.ts';

interface PixelFurnitureSpriteProps {
  itemId: string;
  size?: number;
  className?: string;
  imageUrl?: string;
}

export const PixelFurnitureSprite: React.FC<PixelFurnitureSpriteProps> = ({
  itemId,
  size = 48,
  className = '',
  imageUrl,
}) => {
  const assetUrl = imageUrl || getFurnitureAssetUrl(itemId);

  // If we have an asset png
  if (assetUrl) {
    return (
      <div
        className={`relative inline-flex items-center justify-center select-none overflow-hidden ${className}`}
        style={{
          width: size,
          height: size,
          imageRendering: 'pixelated',
        }}
      >
        <img
          src={assetUrl}
          alt={itemId}
          className="w-full h-full object-contain pixelated pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
          loading="lazy"
        />
      </div>
    );
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
      <span className="text-2xl">🪑</span>
    </div>
  );
};
