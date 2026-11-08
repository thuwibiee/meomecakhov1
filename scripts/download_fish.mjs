import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const FISH_URLS = [
  { id: 'fish_01', url: 'https://i.postimg.cc/Xqvg4X2s/129743f98b3ca3fd08c080c1b6d88629.jpg', note: 'CÁ CỰC KÌ HIẾM (LEGENDARY)' },
  { id: 'fish_02', url: 'https://i.postimg.cc/MTwSPJsS/341f212debbe423bfda3c9b966c0022e.jpg', note: 'CÁ HIẾM (RARE)' },
  { id: 'fish_03', url: 'https://i.postimg.cc/MKQ9Tf6L/429870984ae9803a69187dd219b34171.jpg', note: 'Fish 03' },
  { id: 'fish_04', url: 'https://i.postimg.cc/L8hLXr3j/735b7d698176eb7125285d859e9fdf56.jpg', note: 'Fish 04' },
  { id: 'fish_05', url: 'https://i.postimg.cc/D0B4fgWr/7dd1ba50549bc23f330c86064f729953.jpg', note: 'Fish 05' },
  { id: 'fish_06', url: 'https://i.postimg.cc/PxMPK4Q4/f3f233d36ac79a83216564e4e550ca7e.jpg', note: 'Fish 06' },
  { id: 'fish_07', url: 'https://i.postimg.cc/fTVR0Z1N/4d95a31254a184e5f49f0c678c596aa4.jpg', note: 'NGỌC TRAI CỰC KÌ HIẾM (200 XU CÁ)' },
  { id: 'fish_08', url: 'https://i.postimg.cc/s27cjk3J/f483c698a431a2c8d630cdf502357f92.jpg', note: 'Fish 08' },
  { id: 'fish_09', url: 'https://i.postimg.cc/CL4zjY4W/b590d9a8c40a6edf099d4e346786ae81.jpg', note: 'Fish 09' },
  { id: 'fish_10', url: 'https://i.postimg.cc/qq70df9m/3f3a8d20e0df29f1d6b2ae22473902b9.jpg', note: 'Fish 10' },
  { id: 'fish_11', url: 'https://i.postimg.cc/76Wtbp5h/e7398093f4e2960fde89640ab9c016ad.jpg', note: 'Fish 11' },
];

const outDir = path.resolve(process.cwd(), 'public/assets/fishing');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  for (const item of FISH_URLS) {
    console.log(`Downloading ${item.id} from ${item.url}...`);
    try {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const tempPath = path.join(outDir, `${item.id}_raw.jpg`);
      fs.writeFileSync(tempPath, buffer);

      const metadata = await sharp(buffer).metadata();
      console.log(`${item.id}: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);
    } catch (e) {
      console.error(`Error with ${item.id}:`, e);
    }
  }
}

run();
