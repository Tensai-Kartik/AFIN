const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const APP_DIR = path.join(process.cwd(), 'src', 'app');

async function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const dirEntries = [];
  const imageBuffers = [];

  for (const item of pngBuffers) {
    const { width, height, buffer } = item;
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(offset, 12);

    dirEntries.push(entry);
    imageBuffers.push(buffer);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageBuffers]);
}

async function generateAll() {
  console.log('Generating favicon assets for all device types...');
  
  // Base cropped image (600x600 centered on logo) with RGBA channels
  const baseCrop = sharp(path.join(PUBLIC_DIR, 'logo.png'))
    .extract({ left: 404, top: 84, width: 600, height: 600 })
    .ensureAlpha();
  
  const baseBuffer = await baseCrop.png().toBuffer();

  // 1. Standard PNG sizes
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'favicon-96x96.png', size: 96 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'apple-touch-icon-180x180.png', size: 180 },
    { name: 'apple-touch-icon-152x152.png', size: 152 },
    { name: 'apple-touch-icon-120x120.png', size: 120 },
    { name: 'apple-touch-icon-precomposed.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-512x512.png', size: 512 },
    { name: 'icon.png', size: 512 },
    { name: 'mstile-70x70.png', size: 70 },
    { name: 'mstile-144x144.png', size: 144 },
    { name: 'mstile-150x150.png', size: 150 },
    { name: 'mstile-310x310.png', size: 310 },
  ];

  for (const s of sizes) {
    await sharp(baseBuffer)
      .ensureAlpha()
      .resize(s.size, s.size)
      .png()
      .toFile(path.join(PUBLIC_DIR, s.name));
    console.log('Generated:', s.name);
  }

  // 2. Next.js app directory icons
  if (!fs.existsSync(APP_DIR)) {
    fs.mkdirSync(APP_DIR, { recursive: true });
  }
  await sharp(baseBuffer).ensureAlpha().resize(180, 180).png().toFile(path.join(APP_DIR, 'apple-icon.png'));
  await sharp(baseBuffer).ensureAlpha().resize(512, 512).png().toFile(path.join(APP_DIR, 'icon.png'));

  // 3. Maskable Android icons (with safe zone padding for adaptive icons)
  for (const maskableSize of [192, 512]) {
    const innerSize = Math.round(maskableSize * 0.72);
    const offset = Math.round((maskableSize - innerSize) / 2);
    const innerBuffer = await sharp(baseBuffer).ensureAlpha().resize(innerSize, innerSize).png().toBuffer();
    
    const fileName = `android-chrome-maskable-${maskableSize}x${maskableSize}.png`;
    await sharp({
      create: {
        width: maskableSize,
        height: maskableSize,
        channels: 4,
        background: { r: 43, g: 53, b: 63, alpha: 1 }
      }
    })
    .composite([{ input: innerBuffer, top: offset, left: offset }])
    .png()
    .toFile(path.join(PUBLIC_DIR, fileName));
    console.log('Generated:', fileName);
  }

  // 4. Multi-resolution favicon.ico (ensuring RGBA PNG buffers)
  const b16 = await sharp(baseBuffer).ensureAlpha().resize(16, 16).png().toBuffer();
  const b32 = await sharp(baseBuffer).ensureAlpha().resize(32, 32).png().toBuffer();
  const b48 = await sharp(baseBuffer).ensureAlpha().resize(48, 48).png().toBuffer();
  const icoBuffer = await createIco([
    { width: 16, height: 16, buffer: b16 },
    { width: 32, height: 32, buffer: b32 },
    { width: 48, height: 48, buffer: b48 },
  ]);

  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(APP_DIR, 'favicon.ico'), icoBuffer);
  console.log('Generated favicon.ico in public/ and src/app/');

  // 5. SVG icons
  const png512 = fs.readFileSync(path.join(PUBLIC_DIR, 'icon-512x512.png'));
  const base64Png = png512.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="100" fill="#2b353f"/>
  <image href="data:image/png;base64,${base64Png}" width="512" height="512"/>
</svg>`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'icon.svg'), svgContent);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'safari-pinned-tab.svg'), svgContent);
  console.log('Generated SVG favicons');
}

generateAll().catch(err => {
  console.error(err);
  process.exit(1);
});
