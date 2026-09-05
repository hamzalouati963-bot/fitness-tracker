const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createPNG(width, height, r, g, b, a) {
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  const ihdrType = Buffer.from('IHDR');
  const ihdrCrc = crc32(Buffer.concat([ihdrType, ihdrData]));
  const ihdr = Buffer.alloc(4 + 4 + 13 + 4);
  ihdr.writeUInt32BE(13, 0);
  ihdrType.copy(ihdr, 4);
  ihdrData.copy(ihdr, 8);
  ihdr.writeUInt32BE(ihdrCrc, 21);

  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y++) {
    rawData[y * rowBytes] = 0;
    for (let x = 0; x < width; x++) {
      const px = y * rowBytes + 1 + x * 4;
      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
      rawData[px + 3] = a;
    }
  }
  const compressed = zlib.deflateSync(rawData);
  const idatType = Buffer.from('IDAT');
  const idatCrc = crc32(Buffer.concat([idatType, compressed]));
  const idat = Buffer.alloc(4 + 4 + compressed.length + 4);
  idat.writeUInt32BE(compressed.length, 0);
  idatType.copy(idat, 4);
  compressed.copy(idat, 8);
  idat.writeUInt32BE(idatCrc, 8 + compressed.length);

  const iendType = Buffer.from('IEND');
  const iendCrc = crc32(iendType);
  const iend = Buffer.alloc(12);
  iend.writeUInt32BE(0, 0);
  iendType.copy(iend, 4);
  iend.writeUInt32BE(iendCrc, 8);

  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  return Buffer.concat([signature, ihdr, idat, iend]);
}

const assetsDir = path.join(__dirname, '..', 'assets');

const files = [
  { name: 'icon.png', width: 1024, height: 1024 },
  { name: 'adaptive-icon.png', width: 1024, height: 1024 },
  { name: 'splash.png', width: 1284, height: 2778 },
];

files.forEach(({ name, width, height }) => {
  const filePath = path.join(assetsDir, name);
  if (!fs.existsSync(filePath)) {
    const png = createPNG(width, height, 255, 255, 255, 255);
    fs.writeFileSync(filePath, png);
    console.log(`Created placeholder: ${name} (${width}x${height}, ${png.length} bytes)`);
  } else {
    console.log(`Already exists: ${name}`);
  }
});

console.log('\nNote: Replace these placeholder icons with actual 1024x1024 PNG files.');
console.log('  - icon.png: App icon (1024x1024)');
console.log('  - adaptive-icon.png: Android adaptive icon foreground (1024x1024)');
console.log('  - splash.png: Splash screen image (1284x2778 or similar)');
