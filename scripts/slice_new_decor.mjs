import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Find bounding boxes of connected components
async function findComponents(imagePath, minArea = 400) {
  const { data, info } = await sharp(imagePath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Grid for visited
  const visited = new Uint8Array(width * height);
  const boxes = [];

  function getAlpha(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    return data[(y * width + x) * channels + 3];
  }

  // Group pixels into 4x4 blocks to smooth out minor pixel gaps
  const bw = Math.floor(width / 4);
  const bh = Math.floor(height / 4);
  const blockSolid = new Uint8Array(bw * bh);

  for (let by = 0; by < bh; by++) {
    for (let bx = 0; bx < bw; bx++) {
      let solid = 0;
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 4; dx++) {
          if (getAlpha(bx * 4 + dx, by * 4 + dy) > 25) {
            solid = 1;
            break;
          }
        }
        if (solid) break;
      }
      blockSolid[by * bw + bx] = solid;
    }
  }

  // BFS on blocks
  const blockVisited = new Uint8Array(bw * bh);
  for (let by = 0; by < bh; by++) {
    for (let bx = 0; bx < bw; bx++) {
      if (blockSolid[by * bw + bx] && !blockVisited[by * bw + bx]) {
        let minX = bx, maxX = bx, minY = by, maxY = by;
        const queue = [[bx, by]];
        blockVisited[by * bw + bx] = 1;

        while (queue.length > 0) {
          const [cx, cy] = queue.pop();
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          // Check 8 neighbors with a distance of 1-2 blocks to bridge small gaps
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const nx = cx + dx;
              const ny = cy + dy;
              if (nx >= 0 && nx < bw && ny >= 0 && ny < bh) {
                const idx = ny * bw + nx;
                if (blockSolid[idx] && !blockVisited[idx]) {
                  blockVisited[idx] = 1;
                  queue.push([nx, ny]);
                }
              }
            }
          }
        }

        const pixelBox = {
          left: Math.max(0, minX * 4 - 4),
          top: Math.max(0, minY * 4 - 4),
          width: Math.min(width - minX * 4, (maxX - minX + 1) * 4 + 8),
          height: Math.min(height - minY * 4, (maxY - minY + 1) * 4 + 8),
        };

        if (pixelBox.width * pixelBox.height >= minArea) {
          boxes.push(pixelBox);
        }
      }
    }
  }

  // Sort top-to-bottom, then left-to-right
  boxes.sort((a, b) => {
    const rowA = Math.floor(a.top / 80);
    const rowB = Math.floor(b.top / 80);
    if (rowA !== rowB) return rowA - rowB;
    return a.left - b.left;
  });

  return boxes;
}

async function sliceAndSave() {
  const decorDir = path.resolve('public/assets/furniture/decor');
  fs.mkdirSync(decorDir, { recursive: true });

  console.log('--- Processing decor_new_1.png ---');
  const boxes1 = await findComponents('public/assets/furniture_raw/decor_new_1.png');
  console.log(`Detected ${boxes1.length} items in decor_new_1`);

  let currentDecorIdx = 34; // decor_01 to decor_33 already exist
  const newItemsInfo = [];

  for (let i = 0; i < boxes1.length; i++) {
    const box = boxes1[i];
    const outName = `decor_${String(currentDecorIdx).padStart(2, '0')}.png`;
    const outPath = path.join(decorDir, outName);

    try {
      const cropped = await sharp('public/assets/furniture_raw/decor_new_1.png')
        .extract(box)
        .toBuffer();

      await sharp(cropped)
        .trim()
        .png()
        .toFile(outPath);

      newItemsInfo.push({
        id: `decor_${String(currentDecorIdx).padStart(2, '0')}`,
        src: `/assets/furniture/decor/${outName}`,
        width: box.width,
        height: box.height,
        sheet: 1,
      });
      currentDecorIdx++;
    } catch (err) {
      console.error(`Failed to crop item ${i} from decor_new_1:`, err.message);
    }
  }

  console.log('--- Processing decor_new_2.png ---');
  const boxes2 = await findComponents('public/assets/furniture_raw/decor_new_2.png');
  console.log(`Detected ${boxes2.length} items in decor_new_2`);

  for (let i = 0; i < boxes2.length; i++) {
    const box = boxes2[i];
    const outName = `decor_${String(currentDecorIdx).padStart(2, '0')}.png`;
    const outPath = path.join(decorDir, outName);

    try {
      const cropped = await sharp('public/assets/furniture_raw/decor_new_2.png')
        .extract(box)
        .toBuffer();

      await sharp(cropped)
        .trim()
        .png()
        .toFile(outPath);

      newItemsInfo.push({
        id: `decor_${String(currentDecorIdx).padStart(2, '0')}`,
        src: `/assets/furniture/decor/${outName}`,
        width: box.width,
        height: box.height,
        sheet: 2,
      });
      currentDecorIdx++;
    } catch (err) {
      console.error(`Failed to crop item ${i} from decor_new_2:`, err.message);
    }
  }

  console.log(`Total new decor sliced: ${newItemsInfo.length}. Highest decor index: ${currentDecorIdx - 1}`);
  fs.writeFileSync('scripts/new_decor_meta.json', JSON.stringify(newItemsInfo, null, 2));
}

sliceAndSave().catch(console.error);
