import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve(process.cwd(), 'public/assets/fishing');

const fishList = [
  { id: 'fish_01', rawFile: 'fish_01_raw.jpg', outFile: 'fish_01.png', tolerance: 30 },
  { id: 'fish_02', rawFile: 'fish_02_raw.jpg', outFile: 'fish_02.png', tolerance: 30 },
  { id: 'fish_03', rawFile: 'fish_03_raw.jpg', outFile: 'fish_03.png', tolerance: 35 }, // cyan background
  { id: 'fish_04', rawFile: 'fish_04_raw.jpg', outFile: 'fish_04.png', tolerance: 30 },
  { id: 'fish_05', rawFile: 'fish_05_raw.jpg', outFile: 'fish_05.png', tolerance: 30 },
  { id: 'fish_06', rawFile: 'fish_06_raw.jpg', outFile: 'fish_06.png', tolerance: 30 },
  { id: 'fish_07', rawFile: 'fish_07_raw.jpg', outFile: 'fish_07.png', tolerance: 45 }, // pearl shell with light bg
  { id: 'fish_08', rawFile: 'fish_08_raw.jpg', outFile: 'fish_08.png', tolerance: 30 },
  { id: 'fish_09', rawFile: 'fish_09_raw.jpg', outFile: 'fish_09.png', tolerance: 30 },
  { id: 'fish_10', rawFile: 'fish_10_raw.jpg', outFile: 'fish_10.png', tolerance: 35 },
  { id: 'fish_11', rawFile: 'fish_11_raw.jpg', outFile: 'fish_11.png', tolerance: 30 },
];

async function cleanSprite(def) {
  const filePath = path.join(outDir, def.rawFile);
  const outPath = path.join(outDir, def.outFile);

  const img = sharp(filePath);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Create RGBA buffer
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = data[i * channels];
    rgba[i * 4 + 1] = data[i * channels + 1];
    rgba[i * 4 + 2] = data[i * channels + 2];
    rgba[i * 4 + 3] = 255;
  }

  // Get background reference color from top-left (and top-right / bottom-left)
  const bgR = data[0];
  const bgG = data[1];
  const bgB = data[2];

  const visited = new Uint8Array(width * height);
  const queue = [];

  function colorDist(r, g, b, refR, refG, refB) {
    const dr = r - refR;
    const dg = g - refG;
    const db = b - refB;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  function isBackground(x, y) {
    const idx = (y * width + x) * 4;
    const r = rgba[idx];
    const g = rgba[idx + 1];
    const b = rgba[idx + 2];

    // Check distance to corner bg color
    const dCorner = colorDist(r, g, b, bgR, bgG, bgB);
    if (dCorner <= def.tolerance) return true;

    // For mostly white backgrounds (like fish_01, 02, 04, 05, 06, 08, 09, 10, 11)
    if (bgR > 230 && bgG > 230 && bgB > 230) {
      if (r > 242 && g > 242 && b > 242) return true;
    }

    // For fish_07 pearl which has subtle light grey gradients at corners
    if (def.id === 'fish_07') {
      if (dCorner <= 55) return true;
      if (r > 210 && g > 210 && b > 210 && Math.abs(r - g) < 12 && Math.abs(g - b) < 12) return true;
    }

    // For fish_03 cyan background
    if (def.id === 'fish_03') {
      // cyan color is around 110, 210, 220
      if (colorDist(r, g, b, 112, 210, 220) <= 45) return true;
    }

    return false;
  }

  // Seed boundary pixels
  for (let x = 0; x < width; x++) {
    if (isBackground(x, 0)) { queue.push((0 * width) + x); visited[(0 * width) + x] = 1; }
    if (isBackground(x, height - 1)) { queue.push(((height - 1) * width) + x); visited[((height - 1) * width) + x] = 1; }
  }
  for (let y = 0; y < height; y++) {
    if (isBackground(0, y)) { queue.push((y * width) + 0); visited[(y * width) + 0] = 1; }
    if (isBackground(width - 1, y)) { queue.push((y * width) + (width - 1)); visited[(y * width) + (width - 1)] = 1; }
  }

  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const cx = cur % width;
    const cy = Math.floor(cur / width);

    // Make transparent
    rgba[cur * 4 + 3] = 0;

    // Check 4 neighbors
    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nidx = ny * width + nx;
        if (!visited[nidx] && isBackground(nx, ny)) {
          visited[nidx] = 1;
          queue.push(nidx);
        }
      }
    }
  }

  // Trim to bounding box of remaining content
  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 5 })
    .png()
    .toFile(outPath);

  const finalMeta = await sharp(outPath).metadata();
  console.log(`Cleaned ${def.id} -> ${def.outFile}: ${finalMeta.width}x${finalMeta.height} px`);
}

async function main() {
  for (const def of fishList) {
    await cleanSprite(def);
  }
  console.log('All fish sprites cleaned and saved with transparent backgrounds!');
}

main().catch(console.error);
