import sharp from 'sharp';
import fs from 'fs';

async function checkBackgrounds() {
  for (let i = 1; i <= 11; i++) {
    const id = `fish_${String(i).padStart(2, '0')}`;
    const file = `public/assets/fishing/${id}_raw.jpg`;
    const image = sharp(file);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    // Sample 4 corners
    const getPixel = (x, y) => {
      const idx = (y * info.width + x) * info.channels;
      return [data[idx], data[idx + 1], data[idx + 2]];
    };

    const tl = getPixel(2, 2);
    const tr = getPixel(info.width - 3, 2);
    const bl = getPixel(2, info.height - 3);
    const br = getPixel(info.width - 3, info.height - 3);

    console.log(`${id} (${info.width}x${info.height}): corners: TL=${JSON.stringify(tl)} TR=${JSON.stringify(tr)} BL=${JSON.stringify(bl)} BR=${JSON.stringify(br)}`);
  }
}

checkBackgrounds();
