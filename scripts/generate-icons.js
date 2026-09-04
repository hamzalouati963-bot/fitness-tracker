// Generate placeholder icon files for Android build
// Run: node scripts/generate-icons.js
const fs = require('fs');
const path = require('path');

// Minimal 1x1 white PNG (67 bytes)
const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAABJREFUeJztzDEBAAAIwzDAv+dhAhdOAAAAAQAv/wAMAAAAElFTkSuQmCC',
  'base64'
);

const assetsDir = path.join(__dirname, '..', 'assets');

// Create simple colored square PNGs using a canvas-like approach
// For now, use minimal PNG as placeholder - user should replace with actual icons
const files = ['icon.png', 'adaptive-icon.png', 'splash.png'];

files.forEach(file => {
  const filePath = path.join(assetsDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, MINIMAL_PNG);
    console.log(`Created placeholder: ${file}`);
  } else {
    console.log(`Already exists: ${file}`);
  }
});

console.log('\nNote: Replace these placeholder icons with actual 1024x1024 PNG files.');
console.log('  - icon.png: App icon (1024x1024)');
console.log('  - adaptive-icon.png: Android adaptive icon foreground (1024x1024)');
console.log('  - splash.png: Splash screen image (1284x2778 or similar)');
