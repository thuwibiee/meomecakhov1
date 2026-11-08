import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const images = [
  { name: 'beds_1', url: 'https://i.postimg.cc/J0wZ8RzY/3e3e549b-5f8a-4b24-990e-b77996ae4cd8.png' },
  { name: 'beds_2', url: 'https://i.postimg.cc/x828gR5z/48aab25b-d373-44df-aa21-17eb2684a333.png' },
  { name: 'wallpapers', url: 'https://i.postimg.cc/0NS93SbZ/258ba8f8-0cfe-4db9-83b7-3b69ddd185c1.png' },
  { name: 'floors', url: 'https://i.postimg.cc/YSzsh2V7/cda8cdd3-1242-4d09-a6ce-a912b3ee1f46.png' },
  { name: 'decor_1', url: 'https://i.postimg.cc/FKzTsbjK/4b204203-2b41-451b-b7a0-e4789c6b6890.png' },
  { name: 'decor_2', url: 'https://i.postimg.cc/Hnw2P6gn/fd1ea924-9a52-4bb0-a202-1e0223ef932c.png' },
];

const downloadDir = path.resolve('public/assets/furniture_raw');
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

async function run() {
  for (const img of images) {
    const filePath = path.join(downloadDir, `${img.name}.png`);
    console.log(`Downloading ${img.name} from ${img.url}...`);
    try {
      const res = await fetch(img.url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
      const meta = await sharp(buffer).metadata();
      console.log(`Saved ${img.name}: ${meta.width}x${meta.height}, format: ${meta.format}, channels: ${meta.channels}`);
    } catch (err) {
      console.error(`Failed to download ${img.name}:`, err);
    }
  }
}

run();
