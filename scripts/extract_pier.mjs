import sharp from 'sharp';
import path from 'path';

const srcImg = 'public/assets/aistudio/image_5a65cd74.png';
const outDir = 'public/assets/fishing';

async function extractAssets() {
  const img = sharp(srcImg);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Teal water color: [155, 212, 195]
  const isWater = (r, g, b) => {
    return Math.abs(r - 155) <= 12 && Math.abs(g - 212) <= 12 && Math.abs(b - 195) <= 12;
  };

  // 1. Extract Right Pier with water made transparent
  // x: 220 to 335, y: 15 to 295
  const pierCropW = 335 - 220;
  const pierCropH = 295 - 15;
  const pierRgba = Buffer.alloc(pierCropW * pierCropH * 4);

  for (let y = 0; y < pierCropH; y++) {
    for (let x = 0; x < pierCropW; x++) {
      const srcX = x + 220;
      const srcY = y + 15;
      const srcIdx = (srcY * width + srcX) * channels;
      const dstIdx = (y * pierCropW + x) * 4;

      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      pierRgba[dstIdx] = r;
      pierRgba[dstIdx + 1] = g;
      pierRgba[dstIdx + 2] = b;

      // If it's water, make transparent
      if (isWater(r, g, b)) {
        pierRgba[dstIdx + 3] = 0;
      } else {
        pierRgba[dstIdx + 3] = 255;
      }
    }
  }

  await sharp(pierRgba, { raw: { width: pierCropW, height: pierCropH, channels: 4 } })
    .trim({ threshold: 5 })
    .png()
    .toFile(path.join(outDir, 'pixel_wooden_pier.png'));

  // 2. Extract Top Grass Bank Strip (width 370, height 85)
  const bankH = 85;
  const bankRgba = Buffer.alloc(width * bankH * 4);
  for (let y = 0; y < bankH; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * channels;
      const dstIdx = (y * width + x) * 4;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      bankRgba[dstIdx] = r;
      bankRgba[dstIdx + 1] = g;
      bankRgba[dstIdx + 2] = b;

      if (isWater(r, g, b)) {
        bankRgba[dstIdx + 3] = 0;
      } else {
        bankRgba[dstIdx + 3] = 255;
      }
    }
  }

  await sharp(bankRgba, { raw: { width, height: bankH, channels: 4 } })
    .png()
    .toFile(path.join(outDir, 'pixel_grass_bank.png'));

  console.log('Extracted pixel_wooden_pier.png and pixel_grass_bank.png');
}

extractAssets().catch(console.error);
