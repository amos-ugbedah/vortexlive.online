import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const createSimpleLogo = () => {
    const watermarkDir = path.join(__dirname, '../watermarks');
    if (!fs.existsSync(watermarkDir)) {
        fs.mkdirSync(watermarkDir, { recursive: true });
    }

    const svgContent = `<svg width="400" height="120" viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#991b1b;stop-opacity:1" />
            </linearGradient>
        </defs>
        <path d="M0 10 L380 10 L400 110 L20 110 Z" fill="url(#grad)" />
        <text x="200" y="65" text-anchor="middle" fill="white" style="font-family:Arial Black, sans-serif;font-size:50px;font-weight:900;font-style:italic;">VORTEX</text>
        <text x="200" y="95" text-anchor="middle" fill="white" style="font-family:Arial, sans-serif;font-size:20px;letter-spacing:8px;">LIVE</text>
    </svg>`;
    
    try {
        fs.writeFileSync(path.join(watermarkDir, 'logo.svg'), svgContent);
        console.log(`✅ Branding updated in: ${watermarkDir}`);
        return true;
    } catch (error) {
        console.error('❌ Logo generation failed:', error);
    }
};

export { createSimpleLogo };