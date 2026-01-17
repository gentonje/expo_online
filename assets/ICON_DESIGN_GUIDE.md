# App Icon Design Guide

## Overview
This guide helps you create a beautiful app icon for the Online Store app in all required sizes.

## Design Specifications

### Base Icon
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Color Space**: RGB
- **Background**: Transparent or solid color

### Design Elements
The app icon should represent shopping/e-commerce. Suggested elements:
- Shopping bag icon
- Shopping cart
- Package/box
- Modern, clean design
- Brand colors: Orange (#f97316), Blue (#3b82f6), Green (#10b981)

### Design Tips
1. **Keep it simple**: Icons are small, so details should be minimal
2. **High contrast**: Ensure the icon is visible on both light and dark backgrounds
3. **No text**: Avoid text in the icon (except maybe a single letter)
4. **Safe zone**: Keep important elements within the center 80% of the icon
5. **Rounded corners**: iOS and Android will apply rounded corners automatically

## Icon Sizes Required

### iOS
- 20x20, 40x40, 60x60 (Notification icons)
- 29x29, 58x58, 87x87 (Settings icons)
- 40x40, 80x80, 120x120 (Spotlight icons)
- 76x76, 152x152 (iPad)
- 167x167 (iPad Pro)
- 1024x1024 (App Store)

### Android
- 48x48 (mdpi)
- 72x72 (hdpi)
- 96x96 (xhdpi)
- 144x144 (xxhdpi)
- 192x192 (xxxhdpi)
- 1024x1024 (Adaptive icon foreground)

## Quick Start

### Option 1: Use the Generator Script
1. Create your 1024x1024px icon design
2. Save it as `assets/icon-source.png`
3. Install sharp: `npm install --save-dev sharp`
4. Run: `node scripts/generate-app-icon-with-sharp.js`
5. Copy generated icons to appropriate platform folders

### Option 2: Manual Creation
1. Design your icon at 1024x1024px
2. Use a tool like:
   - [App Icon Generator](https://www.appicon.co/)
   - [Icon Kitchen](https://icon.kitchen/)
   - [MakeAppIcon](https://makeappicon.com/)
3. Upload your 1024x1024px icon
4. Download all sizes
5. Place them in the correct directories

## File Structure

```
assets/
├── icon.png (1024x1024 - main icon)
├── icon-source.png (1024x1024 - source for generation)
├── adaptive-icon.png (1024x1024 - Android adaptive icon)
├── splash-icon.png (splash screen icon)
└── favicon.png (web favicon)
```

## Design Tools
- **Figma**: Free, web-based design tool
- **Adobe Illustrator**: Professional vector graphics
- **Sketch**: Mac-only design tool
- **Canva**: Easy-to-use online design tool
- **GIMP**: Free image editor

## Color Palette
- Primary Orange: #f97316
- Primary Blue: #3b82f6
- Primary Green: #10b981
- Background: #ffffff or #f8fafc
- Text: #1f2937

## Example Design Concept
1. **Main element**: Shopping bag icon in orange (#f97316)
2. **Accent**: Small shopping cart or package icon
3. **Background**: Clean white or light gray gradient
4. **Style**: Modern, flat design with subtle shadows

## Testing Your Icon
1. Test on actual devices (iOS and Android)
2. Check visibility on both light and dark backgrounds
3. Ensure it looks good at small sizes (20x20)
4. Verify it's recognizable and represents your brand

## Resources
- [Apple Human Interface Guidelines - Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Material Design - App Icons](https://material.io/design/iconography/app-icons.html)
- [Expo Icon Guidelines](https://docs.expo.dev/guides/app-icons/)
