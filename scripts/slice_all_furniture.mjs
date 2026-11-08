import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

function clampBox(box, imgWidth = 1280, imgHeight = 853) {
  let left = Math.max(0, Math.min(box.left, imgWidth - 1));
  let top = Math.max(0, Math.min(box.top, imgHeight - 1));
  let width = Math.max(1, Math.min(box.width, imgWidth - left));
  let height = Math.max(1, Math.min(box.height, imgHeight - top));
  return { left, top, width, height };
}

async function safeCropAndSave(inputPath, box, outPath) {
  const clamped = clampBox(box);
  const croppedBuf = await sharp(inputPath)
    .extract(clamped)
    .toBuffer();

  try {
    // Attempt trim to remove extra transparent margin
    await sharp(croppedBuf)
      .trim()
      .png()
      .toFile(outPath);
  } catch (err) {
    // If trim fails, save cropped directly
    await sharp(croppedBuf)
      .png()
      .toFile(outPath);
  }
}

async function main() {
  console.log('--- Starting Furniture Slicing ---');

  // 1. BEDS: 16 items
  const bedsDir = path.resolve('public/assets/furniture/beds');
  fs.mkdirSync(bedsDir, { recursive: true });

  const b1Rows = [ { top: 70, height: 360 }, { top: 460, height: 350 } ];
  const b1Cols = [
    { left: 10, width: 310 },
    { left: 325, width: 305 },
    { left: 635, width: 310 },
    { left: 955, width: 320 },
  ];

  let bedIdx = 1;
  for (const r of b1Rows) {
    for (const c of b1Cols) {
      const outPath = path.join(bedsDir, `bed_${String(bedIdx).padStart(2, '0')}.png`);
      await safeCropAndSave('public/assets/furniture_raw/beds_1.png', { left: c.left, top: r.top, width: c.width, height: r.height }, outPath);
      bedIdx++;
    }
  }

  const b2Rows = [ { top: 50, height: 340 }, { top: 420, height: 370 } ];
  const b2Cols = [
    { left: 10, width: 315 },
    { left: 325, width: 315 },
    { left: 640, width: 315 },
    { left: 955, width: 320 },
  ];

  for (const r of b2Rows) {
    for (const c of b2Cols) {
      const outPath = path.join(bedsDir, `bed_${String(bedIdx).padStart(2, '0')}.png`);
      await safeCropAndSave('public/assets/furniture_raw/beds_2.png', { left: c.left, top: r.top, width: c.width, height: r.height }, outPath);
      bedIdx++;
    }
  }
  console.log(`✓ Sliced 16 beds into ${bedsDir}`);

  // 2. WALLPAPERS: 15 items (3 rows x 5 cols)
  const wallDir = path.resolve('public/assets/furniture/wallpapers');
  fs.mkdirSync(wallDir, { recursive: true });

  const wallRows = [
    { top: 30, height: 242 },
    { top: 300, height: 245 },
    { top: 575, height: 245 },
  ];
  const wallCols = [
    { left: 25, width: 238 },
    { left: 278, width: 232 },
    { left: 525, width: 230 },
    { left: 770, width: 230 },
    { left: 1015, width: 240 },
  ];

  let wallIdx = 1;
  for (const r of wallRows) {
    for (const c of wallCols) {
      const outPath = path.join(wallDir, `wall_${String(wallIdx).padStart(2, '0')}.png`);
      await safeCropAndSave('public/assets/furniture_raw/wallpapers.png', { left: c.left, top: r.top, width: c.width, height: r.height }, outPath);
      wallIdx++;
    }
  }
  console.log(`✓ Sliced 15 wallpapers into ${wallDir}`);

  // 3. FLOORS: 15 items (3 rows x 5 cols)
  const floorDir = path.resolve('public/assets/furniture/floors');
  fs.mkdirSync(floorDir, { recursive: true });

  const floorRows = [
    { top: 45, height: 235 },
    { top: 302, height: 238 },
    { top: 570, height: 235 },
  ];
  const floorCols = [
    { left: 35, width: 232 },
    { left: 282, width: 230 },
    { left: 528, width: 228 },
    { left: 771, width: 230 },
    { left: 1016, width: 234 },
  ];

  let floorIdx = 1;
  for (const r of floorRows) {
    for (const c of floorCols) {
      const outPath = path.join(floorDir, `floor_${String(floorIdx).padStart(2, '0')}.png`);
      await safeCropAndSave('public/assets/furniture_raw/floors.png', { left: c.left, top: r.top, width: c.width, height: r.height }, outPath);
      floorIdx++;
    }
  }
  console.log(`✓ Sliced 15 floors into ${floorDir}`);

  // 4. SOFAS: 6 comfy sofas from decor_1.png row 1
  const sofaDir = path.resolve('public/assets/furniture/sofas');
  fs.mkdirSync(sofaDir, { recursive: true });

  const sofaBoxes = [
    { left: 20, top: 20, width: 215, height: 120 },
    { left: 243, top: 20, width: 200, height: 120 },
    { left: 455, top: 20, width: 188, height: 120 },
    { left: 655, top: 20, width: 200, height: 120 },
    { left: 865, top: 20, width: 195, height: 120 },
    { left: 1070, top: 20, width: 190, height: 120 },
  ];

  let sofaIdx = 1;
  for (const b of sofaBoxes) {
    const outPath = path.join(sofaDir, `sofa_${String(sofaIdx).padStart(2, '0')}.png`);
    await safeCropAndSave('public/assets/furniture_raw/decor_1.png', b, outPath);
    sofaIdx++;
  }
  console.log(`✓ Sliced 6 sofas into ${sofaDir}`);

  // 5. DECORATIONS: Cut from decor_1 and decor_2
  const decorDir = path.resolve('public/assets/furniture/decor');
  fs.mkdirSync(decorDir, { recursive: true });

  const decorBoxesD1 = [
    // Wardrobes & Bookshelves
    { left: 10, top: 308, width: 128, height: 140 },
    { left: 140, top: 308, width: 128, height: 140 },
    { left: 270, top: 308, width: 128, height: 140 },
    { left: 400, top: 308, width: 124, height: 140 },
    { left: 525, top: 308, width: 126, height: 140 },
    { left: 655, top: 308, width: 126, height: 140 },
    // Windows & Wall Mirrors
    { left: 22, top: 145, width: 98, height: 150 },
    { left: 144, top: 145, width: 94, height: 150 },
    { left: 263, top: 145, width: 126, height: 150 },
    { left: 724, top: 145, width: 105, height: 155 },
    // Tables
    { left: 9, top: 452, width: 133, height: 82 },
    { left: 146, top: 452, width: 123, height: 80 },
    { left: 278, top: 452, width: 125, height: 76 },
    { left: 412, top: 452, width: 262, height: 80 },
    // Plants & Lamps
    { left: 132, top: 538, width: 110, height: 118 },
    { left: 795, top: 548, width: 105, height: 108 },
    { left: 1148, top: 540, width: 120, height: 210 },
    // Cushions & Pet items
    { left: 23, top: 745, width: 68, height: 88 },
    { left: 102, top: 745, width: 68, height: 88 },
    { left: 180, top: 745, width: 68, height: 88 },
    { left: 340, top: 745, width: 75, height: 90 },
    { left: 518, top: 745, width: 90, height: 98 },
  ];

  const decorBoxesD2 = [
    // Fireplaces & Bathtub & Piano
    { left: 22, top: 322, width: 118, height: 160 },
    { left: 147, top: 322, width: 126, height: 160 },
    { left: 280, top: 322, width: 124, height: 160 },
    { left: 411, top: 322, width: 114, height: 160 },
    { left: 531, top: 322, width: 116, height: 160 },
    { left: 901, top: 324, width: 112, height: 160 },
    // TV & Entertainment
    { left: 8, top: 592, width: 90, height: 110 },
    { left: 108, top: 592, width: 85, height: 105 },
    { left: 651, top: 608, width: 90, height: 88 },
    { left: 834, top: 608, width: 95, height: 92 },
    { left: 938, top: 592, width: 122, height: 145 },
  ];

  let decorIdx = 1;
  for (const b of decorBoxesD1) {
    const outPath = path.join(decorDir, `decor_${String(decorIdx).padStart(2, '0')}.png`);
    await safeCropAndSave('public/assets/furniture_raw/decor_1.png', b, outPath);
    decorIdx++;
  }

  for (const b of decorBoxesD2) {
    const outPath = path.join(decorDir, `decor_${String(decorIdx).padStart(2, '0')}.png`);
    await safeCropAndSave('public/assets/furniture_raw/decor_2.png', b, outPath);
    decorIdx++;
  }

  console.log(`✓ Sliced ${decorIdx - 1} decorations into ${decorDir}`);
  console.log('--- All furniture slicing finished successfully! ---');
}

main().catch(err => {
  console.error('Fatal error during slicing:', err);
  process.exit(1);
});
