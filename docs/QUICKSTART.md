# Quick Start Guide

Get up and running with this extension in under 5 minutes!

## Step 1: Build the Extension

```bash
npm install
npm run build
```

## Step 2: Load Extension

### Chrome/Brave/Edge
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/` folder from this project

### Firefox
1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `dist/manifest.json`

## Step 3: Start Using!

**The extension works immediately with 20 beautiful fallback images!**

Open a new tab and you'll see a random wallpaper right away. No API keys required to start!

## Step 4: Add API Keys for Fresh Content (Optional)

Want fresh daily wallpapers? Add your free API keys:

### Get API Keys (Both Free!)

#### Unsplash (Free Tier - 50 req/hr)
1. Visit https://unsplash.com/developers
2. Click "Register as a Developer"
3. Create a new application (demo/personal use)
4. Copy your **Access Key**

#### Pexels (Free Tier - 200 req/hr)  
1. Visit https://www.pexels.com/api/
2. Click "Get Started"
3. Sign up for a free account
4. Go to your account page and copy your **API Key**

### Configure via Options Page

1. Right-click the extension icon → **Options**
   (Or click the ⚙️ button on new tab)
2. Add your API keys
3. Click "Test" to verify they work (optional but recommended)
4. Click "Save Settings"

**Images fetch immediately!** No need to wait for the 6-hour cycle.

## Step 5: Customize (Optional)

### Search Keywords
Add keywords to customize your wallpaper themes:
- **Unsplash**: `nature, mountains, ocean`
- **Pexels**: `landscape, sunset, forest`

### Auto-Refresh
Enable auto-rotating images on your new tab:
- Toggle on/off
- Set interval (5-300 seconds)

### Clock Display
Configure the built-in clock:
- Show/hide clock
- 12-hour or 24-hour format
- Show/hide seconds

## Troubleshooting

### No images appearing?
- Check browser console for errors (F12)
- Verify API keys are correct in options
- Check service worker console: `chrome://extensions/` → Details → Service worker

### Images not refreshing?
- Wait a moment - immediate fetch takes 2-4 seconds
- Check IndexedDB: DevTools → Application → IndexedDB → WallpaperDB
- Force refresh: Click the refresh button on new tab

### Want to test without API keys?
The fallback system provides 20 beautiful images - just install and use!

### API keys not saving?
- Make sure you clicked "Save Settings"
- Check chrome.storage in DevTools
- Try testing the keys first

## What Happens Next?

- ✅ Extension fetches 30-80 images (depending on which APIs you configured)
- ✅ Images cached in IndexedDB for offline use
- ✅ New random image every time you open a new tab
- ✅ Automatic refresh every 6 hours in background
- ✅ Click refresh button for instant new image
- ✅ Auto-rotation if you enabled it

## Development Mode

Want to modify the extension?

```bash
npm run watch
```

This watches for file changes and rebuilds automatically.

---

**That's it! Enjoy your beautiful wallpapers! 🎨**

*If you find any issues or have feature requests, feel free to open an issue on GitHub.*
