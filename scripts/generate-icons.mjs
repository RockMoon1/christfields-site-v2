/**
 * Rasterizes the square BIMI mark (public/bimi-logo.svg) into the PNG app
 * icons the PWA + iOS home screen use. Run with: node scripts/generate-icons.mjs
 *
 * The SVG already has a solid dark background, so the PNGs are opaque, square,
 * and safe as maskable icons. Re-run this if the BIMI mark changes.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'public', 'bimi-logo.svg');
const outDir = path.join(root, 'public', 'icons');

await mkdir(outDir, { recursive: true });

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-icon-180.png', size: 180 },
];

for (const { file, size } of targets) {
  // density renders the SVG large first, then we downscale for crisp edges.
  await sharp(src, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, file));
  console.log('wrote', `public/icons/${file}`, `(${size}x${size})`);
}
console.log('done');
