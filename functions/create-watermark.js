const fs = require('fs');
const { createCanvas, registerFont } = require('canvas');

// Create a simple watermark
const width = 200;
const height = 60;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Set background (transparent)
ctx.clearRect(0, 0, width, height);

// Draw red background with slight transparency
ctx.fillStyle = 'rgba(220, 38, 38, 0.8)';
ctx.fillRect(0, 0, width, height);

// Add text
ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 16px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// Main text
ctx.fillText('VORTEX LIVE', width / 2, height / 2 - 8);

// URL text
ctx.font = '10px Arial';
ctx.fillText('vortexlive.online', width / 2, height / 2 + 12);

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('watermark.png', buffer);

console.log('✅ Watermark created: watermark.png');
console.log('📏 Size: 200x60px');
console.log('🎨 Colors: Red background, White text');