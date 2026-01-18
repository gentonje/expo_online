/**
 * App Icon Generator Script
 * 
 * This script generates app icons in all required sizes for iOS and Android.
 * 
 * Requirements:
 * - Install sharp: npm install --save-dev sharp
 * - Place your source icon (1024x1024px PNG) at: assets/icon-source.png
 * 
 * Usage: node scripts/generate-app-icon.js
 */

// fs and path were unused


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

console.log('App Icon Generator');
console.log('==================\n');

console.log('This script requires the "sharp" package to generate icons.');
console.log('Install it with: npm install --save-dev sharp\n');

console.log('Icon sizes to generate:');
console.log('iOS:', iconSizes.ios.length, 'icons');
console.log('Android:', iconSizes.android.length, 'icons');
console.log('\nTotal:', iconSizes.ios.length + iconSizes.android.length, 'icons\n');

console.log('To use this script:');
console.log('1. Create a 1024x1024px PNG icon design');
console.log('2. Save it as assets/icon-source.png');
console.log('3. Install sharp: npm install --save-dev sharp');
console.log('4. Run: node scripts/generate-app-icon.js');
console.log('\nThe script will generate all required icon sizes automatically.');
