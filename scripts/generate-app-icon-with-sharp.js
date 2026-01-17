/**
 * App Icon Generator Script (with Sharp)
 * 
 * This script generates app icons in all required sizes for iOS and Android.
 * 
 * Requirements:
 * - Install sharp: npm install --save-dev sharp
 * - Place your source icon (1024x1024px PNG) at: assets/icon-source.png
 * 
 * Usage: node scripts/generate-app-icon-with-sharp.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes for different platforms
const iconSizes = {
    ios: [
        { name: 'icon-20.png', size: 20 },
        { name: 'icon-20@2x.png', size: 40 },
        { name: 'icon-20@3x.png', size: 60 },
        { name: 'icon-29.png', size: 29 },
        { name: 'icon-29@2x.png', size: 58 },
        { name: 'icon-29@3x.png', size: 87 },
        { name: 'icon-40.png', size: 40 },
        { name: 'icon-40@2x.png', size: 80 },
        { name: 'icon-40@3x.png', size: 120 },
        { name: 'icon-60@2x.png', size: 120 },
        { name: 'icon-60@3x.png', size: 180 },
        { name: 'icon-76.png', size: 76 },
        { name: 'icon-76@2x.png', size: 152 },
        { name: 'icon-83.5@2x.png', size: 167 },
        { name: 'icon-1024.png', size: 1024 },
    ],
    android: [
        { name: 'mipmap-mdpi/ic_launcher.png', size: 48 },
        { name: 'mipmap-mdpi/ic_launcher_round.png', size: 48 },
        { name: 'mipmap-hdpi/ic_launcher.png', size: 72 },
        { name: 'mipmap-hdpi/ic_launcher_round.png', size: 72 },
        { name: 'mipmap-xhdpi/ic_launcher.png', size: 96 },
        { name: 'mipmap-xhdpi/ic_launcher_round.png', size: 96 },
        { name: 'mipmap-xxhdpi/ic_launcher.png', size: 144 },
        { name: 'mipmap-xxhdpi/ic_launcher_round.png', size: 144 },
        { name: 'mipmap-xxxhdpi/ic_launcher.png', size: 192 },
        { name: 'mipmap-xxxhdpi/ic_launcher_round.png', size: 192 },
        { name: 'adaptive-icon-foreground.png', size: 1024 },
    ],
};

async function generateIcons() {
    const sourceIcon = path.join(__dirname, '../assets/icon-source.png');
    const outputDir = path.join(__dirname, '../assets/generated-icons');

    // Check if source icon exists
    if (!fs.existsSync(sourceIcon)) {
        console.error('Error: Source icon not found at', sourceIcon);
        console.log('\nPlease create a 1024x1024px PNG icon and save it as: assets/icon-source.png');
        process.exit(1);
    }

    // Create output directories
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const iosDir = path.join(outputDir, 'ios');
    const androidDir = path.join(outputDir, 'android');

    if (!fs.existsSync(iosDir)) {
        fs.mkdirSync(iosDir, { recursive: true });
    }
    if (!fs.existsSync(androidDir)) {
        fs.mkdirSync(androidDir, { recursive: true });
    }

    // Create Android mipmap directories
    ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'].forEach(density => {
        const dir = path.join(androidDir, `mipmap-${density}`);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    console.log('Generating app icons...\n');

    // Generate iOS icons
    console.log('Generating iOS icons...');
    for (const icon of iconSizes.ios) {
        const outputPath = path.join(iosDir, icon.name);
        await sharp(sourceIcon)
            .resize(icon.size, icon.size, {
                fit: 'cover',
                background: { r: 255, g: 255, b: 255, alpha: 0 }
            })
            .png()
            .toFile(outputPath);
        console.log(`  ✓ ${icon.name} (${icon.size}x${icon.size})`);
    }

    // Generate Android icons
    console.log('\nGenerating Android icons...');
    for (const icon of iconSizes.android) {
        const outputPath = path.join(androidDir, icon.name);
        
        // For round icons, create a circular mask
        if (icon.name.includes('round')) {
            const roundedCorners = Buffer.from(
                `<svg><rect x="0" y="0" width="${icon.size}" height="${icon.size}" rx="${icon.size / 2}" ry="${icon.size / 2}"/></svg>`
            );
            
            await sharp(sourceIcon)
                .resize(icon.size, icon.size)
                .composite([{
                    input: roundedCorners,
                    blend: 'dest-in'
                }])
                .png()
                .toFile(outputPath);
        } else {
            await sharp(sourceIcon)
                .resize(icon.size, icon.size, {
                    fit: 'cover',
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                })
                .png()
                .toFile(outputPath);
        }
        console.log(`  ✓ ${icon.name} (${icon.size}x${icon.size})`);
    }

    console.log('\n✅ All icons generated successfully!');
    console.log(`\nIcons saved to:`);
    console.log(`  iOS: ${iosDir}`);
    console.log(`  Android: ${androidDir}`);
    console.log('\nNext steps:');
    console.log('1. Copy iOS icons to ios/YourApp/Images.xcassets/AppIcon.appiconset/');
    console.log('2. Copy Android icons to android/app/src/main/res/');
    console.log('3. Update app.json with the correct icon paths');
}

generateIcons().catch(error => {
    console.error('Error generating icons:', error);
    process.exit(1);
});
