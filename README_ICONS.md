# App Icon & Splash Screen Setup Guide

## ✅ What's Been Added

### 1. Beautiful Animated Splash Screen
A stunning shopping-themed splash screen has been created with:
- **Animated Shopping Bag** (main icon) with smooth entrance and subtle rotation
- **Shopping Cart** sliding in from the left
- **Package** icon appearing from the right
- **Sparkle/Star effects** for visual appeal
- **Progress bar** animation
- **Smooth text fade-in** with "Online Store" branding
- **Professional animations** using React Native Reanimated

The splash screen automatically displays when the app is loading.

### 2. Icon Generation Tools
Two scripts have been created to help generate app icons:

#### `scripts/generate-app-icon.js`
- Information script that lists all required icon sizes
- No dependencies needed
- Shows you what icons need to be created

#### `scripts/generate-app-icon-with-sharp.js`
- Full icon generator (requires `sharp` package)
- Automatically generates all iOS and Android icon sizes
- Creates rounded icons for Android
- Saves icons in organized folders

## 🎨 Creating Your App Icon

### Step 1: Design Your Icon
1. Create a 1024x1024px PNG image
2. Use design tools like:
   - Figma (free, web-based)
   - Canva (easy to use)
   - Adobe Illustrator (professional)
   - GIMP (free, open-source)

### Step 2: Design Guidelines
- **Keep it simple**: Icons are small, so details should be minimal
- **High contrast**: Ensure visibility on light and dark backgrounds
- **No text**: Avoid text in the icon
- **Safe zone**: Keep important elements in the center 80%
- **Colors**: Use your brand colors (Orange #f97316, Blue #3b82f6, Green #10b981)

### Step 3: Generate All Sizes

#### Option A: Using the Generator Script
```bash
# 1. Install sharp
npm install --save-dev sharp

# 2. Place your 1024x1024 icon at:
# assets/icon-source.png

# 3. Run the generator
node scripts/generate-app-icon-with-sharp.js

# 4. Icons will be generated in:
# assets/generated-icons/ios/
# assets/generated-icons/android/
```

#### Option B: Using Online Tools
1. Go to [App Icon Generator](https://www.appicon.co/)
2. Upload your 1024x1024px icon
3. Download all sizes
4. Place them in the correct directories

### Step 4: Update app.json
After generating icons, update `app.json`:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

## 📱 Required Icon Sizes

### iOS (15 icons)
- 20x20, 40x40, 60x60 (Notifications)
- 29x29, 58x58, 87x87 (Settings)
- 40x40, 80x80, 120x120 (Spotlight)
- 76x76, 152x152 (iPad)
- 167x167 (iPad Pro)
- 1024x1024 (App Store)

### Android (11 icons)
- 48x48 (mdpi)
- 72x72 (hdpi)
- 96x96 (xhdpi)
- 144x144 (xxhdpi)
- 192x192 (xxxhdpi)
- 1024x1024 (Adaptive icon)

## 🎬 Splash Screen Features

The splash screen includes:
- ✅ Smooth entrance animations
- ✅ Shopping-themed icons (bag, cart, package)
- ✅ Sparkle effects
- ✅ Progress bar
- ✅ Brand text animation
- ✅ Professional timing and easing

## 🚀 Next Steps

1. **Design your icon**: Create a 1024x1024px PNG
2. **Generate sizes**: Use the script or online tool
3. **Update assets**: Replace existing icons in `assets/` folder
4. **Test**: Run the app to see your new splash screen and icons

## 📚 Resources

- [Apple Icon Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Material Design Icons](https://material.io/design/iconography/app-icons.html)
- [Expo Icon Guide](https://docs.expo.dev/guides/app-icons/)

## 💡 Tips

- Test your icon at small sizes (20x20) to ensure it's recognizable
- Use high contrast colors
- Keep the design simple and clean
- Test on actual devices
- Consider both light and dark mode backgrounds

---

**Note**: The splash screen is already implemented and will show automatically when the app loads. You just need to create and add your app icons!
