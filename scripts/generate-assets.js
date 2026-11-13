/**
 * Zero-dependency Pixel-Art PNG & Spritesheet Generator for PixmonMMO
 * Generates crisp 32x32 static PNGs for Monsters and Tiers 1-8 items,
 * 128x32 (4-frame) looping spritesheets for Tier 9 Eldritch items,
 * and 192x32 (6-frame) looping spritesheets for Tier 10 Transcendent items.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    rawData[rowStart] = 0; // filter none
    rgbaBuffer.copy(rawData, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, makeChunk('IHDR', ihdr), idat, iend]);
}

function hexToRgba(hex, alpha = 255) {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
    alpha
  ];
}

function setPixel(buf, width, height, x, y, rgba) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const idx = (y * width + x) * 4;
  buf[idx] = rgba[0];
  buf[idx + 1] = rgba[1];
  buf[idx + 2] = rgba[2];
  buf[idx + 3] = rgba[3];
}

function drawPixelRect(buf, width, height, x, y, w, h, rgba) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      setPixel(buf, width, height, px, py, rgba);
    }
  }
}

function drawMonsterSprite(filePath, bodyHex, eyeHex, horns = false) {
  const size = 32;
  const buf = Buffer.alloc(size * size * 4, 0);
  const body = hexToRgba(bodyHex);
  const dark = hexToRgba('#1a1a1a');
  const eye = hexToRgba(eyeHex);

  // Body silhouette
  drawPixelRect(buf, size, size, 8, 8, 16, 16, body);
  drawPixelRect(buf, size, size, 10, 6, 12, 2, body);
  drawPixelRect(buf, size, size, 10, 24, 4, 4, dark);
  drawPixelRect(buf, size, size, 18, 24, 4, 4, dark);

  // Eyes
  drawPixelRect(buf, size, size, 11, 13, 3, 3, eye);
  drawPixelRect(buf, size, size, 18, 13, 3, 3, eye);

  // Mouth
  drawPixelRect(buf, size, size, 13, 19, 6, 2, dark);

  if (horns) {
    const horn = hexToRgba('#ffd700');
    drawPixelRect(buf, size, size, 7, 4, 3, 4, horn);
    drawPixelRect(buf, size, size, 22, 4, 3, 4, horn);
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, encodePNG(size, size, buf));
}

function drawWeaponSpritesheet(filePath, primaryHex, frames = 1) {
  const frameSize = 32;
  const totalWidth = frameSize * frames;
  const buf = Buffer.alloc(totalWidth * frameSize * 4, 0);
  const blade = hexToRgba(primaryHex);
  const hilt = hexToRgba('#8b5a2b');
  const aura = hexToRgba('#ffffff', 180);

  for (let f = 0; f < frames; f++) {
    const offsetX = f * frameSize;
    const bobY = frames > 1 ? (f % 2 === 0 ? 0 : -2) : 0;

    // Diagonal pixel sword
    for (let i = 0; i < 14; i++) {
      drawPixelRect(buf, totalWidth, frameSize, offsetX + 10 + i, 20 - i + bobY, 3, 3, blade);
    }
    // Crossguard & hilt
    drawPixelRect(buf, totalWidth, frameSize, offsetX + 8, 18 + bobY, 6, 2, hilt);
    drawPixelRect(buf, totalWidth, frameSize, offsetX + 6, 22 + bobY, 4, 4, hilt);

    // Animated sparkles for Tier 9 (4 frames) & Tier 10 (6 frames)
    if (frames > 1) {
      const sparkX = offsetX + 8 + ((f * 5) % 16);
      const sparkY = 6 + ((f * 3) % 14);
      drawPixelRect(buf, totalWidth, frameSize, sparkX, sparkY, 2, 2, aura);
    }
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, encodePNG(totalWidth, frameSize, buf));
}

const publicAssets = path.join(__dirname, '..', 'frontend', 'public', 'assets');

// Generate Monsters
drawMonsterSprite(path.join(publicAssets, 'monsters', 'mon_goblin_scout.png'), '#4CAF50', '#FFEB3B', false);
drawMonsterSprite(path.join(publicAssets, 'monsters', 'mon_cave_spider.png'), '#5D4037', '#FF1744', false);
drawMonsterSprite(path.join(publicAssets, 'monsters', 'mon_void_wisp.png'), '#7C4DFF', '#00E5FF', false);
drawMonsterSprite(path.join(publicAssets, 'monsters', 'mon_dungeon_boss.png'), '#B71C1C', '#FFD700', true);

// Generate Tier 1-8 static PNGs + Tier 9 (4-frame) & Tier 10 (6-frame) spritesheets
const tierColors = [
  '#8C8C8C', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63',
  '#FF9800', '#FF5722', '#00E5FF', '#B388FF', '#FFD700'
];

tierColors.forEach((hex, idx) => {
  const tier = idx + 1;
  const frames = tier === 10 ? 6 : tier === 9 ? 4 : 1;
  drawWeaponSpritesheet(path.join(publicAssets, 'items', `weapon_tier_${tier}.png`), hex, frames);
});
