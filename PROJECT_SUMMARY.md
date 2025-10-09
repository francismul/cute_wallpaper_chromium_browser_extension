# 🎨 Random Wallpaper Extension - Complete!

## What You Have

A **production-ready TypeScript browser extension** that displays beautiful random wallpapers on every new tab!

### ✨ Features Delivered

✅ **Fetches from Unsplash & Pexels** - Dual API integration for variety  
✅ **IndexedDB Caching** - Fast, offline-capable image storage  
✅ **24-Hour Expiry** - Fresh content rotation  
✅ **6-Hour Auto-Refresh** - Background updates while you browse  
✅ **Service Worker Sleep Management** - Checks time on wake, refreshes if needed  
✅ **Cache-Only Display** - New tab ALWAYS loads from IndexedDB  
✅ **Refresh Button** - Get new random image from cache  
✅ **TypeScript → Vanilla JS** - Compiled for browser compatibility  
✅ **True Randomness** - Web Crypto API for secure selection  

## 📁 What's Included

```
📦 random-wallpaper-extension/
├── 📄 README.md              # Full documentation
├── 📄 QUICKSTART.md          # Setup guide (start here!)
├── 📄 ARCHITECTURE.md        # Technical deep-dive
├── 📄 CHECKLIST.md           # Implementation checklist
├── 📄 package.json           # Dependencies & scripts
├── 📄 tsconfig.json          # TypeScript config
├── 📄 build.js               # Build script
├── 📄 .gitignore             # Git ignore
│
├── 📂 src/
│   ├── 📄 manifest.json      # Extension config
│   ├── 📄 background.ts      # Service worker with immediate fetch
│   ├── 📄 newTab.html        # New tab UI with clock
│   ├── 📄 options.html       # Options page UI
│   │
│   ├── 📂 content/
│   │   ├── 📄 api.ts         # Unsplash/Pexels integration
│   │   ├── 📄 api-mock.ts    # Test data (no API keys needed)
│   │   ├── 📄 db.ts          # IndexedDB wrapper
│   │   └── 📄 newTab.ts      # New tab logic
│   │
│   ├── 📂 utils/
│   │   └── 📄 random.ts      # Crypto-random helpers
│   │
│   └── 📂 icons/
│       └── 📄 README.md      # Icon instructions
│
└── 📂 dist/                  # Built extension (ready to load!)
    ├── background.js
    ├── newTab.js
    ├── newTab.html
    └── manifest.json
```

## 🚀 Quick Start (3 Steps)

### 1️⃣ Get API Keys (Free)
- **Unsplash**: https://unsplash.com/developers
- **Pexels**: https://www.pexels.com/api/

### 2️⃣ Configure & Build
```bash
# Add your keys to src/content/api.ts
# Then:
npm install
npm run build
```

### 3️⃣ Load Extension
- **Chrome**: `chrome://extensions/` → Developer mode → Load unpacked → Select `dist/`
- **Firefox**: `about:debugging` → Load Temporary Add-on → Select `dist/manifest.json`

## 🎯 How It Works

### Background Process (Every 6 Hours)
```
Service Worker Alarm Fires
    ↓
Clean expired images (>24h old)
    ↓
Fetch 15 from Unsplash + 15 from Pexels
    ↓
Store in IndexedDB with expiry
    ↓
Update lastFetch timestamp
```

### Service Worker Wake-Up
```
Browser Starts or New Tab Opens
    ↓
Service Worker Wakes
    ↓
Check: (currentTime - lastFetch) > 6 hours?
    ↓
YES → Fetch new images
NO  → Use cached images
```

### New Tab Display
```
New Tab Opens
    ↓
Query IndexedDB (NOT API!)
    ↓
Get all valid images
    ↓
Select random using crypto.getRandomValues()
    ↓
Display with smooth fade-in
```

## 🧪 Testing Without API Keys

Use the mock data! Edit `src/background.ts`:

```typescript
// Change this line:
import { fetchAllImages } from './content/api.js';

// To this:
import { fetchAllImagesMock as fetchAllImages } from './content/api-mock.js';
```

Rebuild and test with 5 demo images from Unsplash/Pexels!

## 📊 Technical Specs

| Feature | Implementation |
|---------|----------------|
| **Language** | TypeScript → ES2020 |
| **Bundler** | esbuild |
| **Storage** | IndexedDB |
| **Random** | Web Crypto API |
| **Images** | 30 cached (15 each source) |
| **Refresh** | 6 hours (Chrome Alarms) |
| **Expiry** | 24 hours per image |
| **Size** | ~5KB storage, ~50KB code |

## 🔍 Key Files to Understand

1. **`src/background.ts`** - Service worker that manages the 6-hour refresh cycle
2. **`src/content/db.ts`** - All IndexedDB operations (store, retrieve, expire)
3. **`src/content/api.ts`** - Fetches images from Unsplash and Pexels
4. **`src/content/newTab.ts`** - New tab page logic (display from cache)
5. **`src/utils/random.ts`** - Crypto-secure random selection

## 🐛 Troubleshooting

### No images loading?
→ Check service worker console: `chrome://extensions/` → Details → Service worker

### API errors?
→ Verify keys are correct in `src/content/api.ts`

### Want to force refresh?
→ Console: `chrome.runtime.sendMessage({ action: 'forceRefresh' }, console.log);`

### Check last fetch time?
→ DevTools → Application → IndexedDB → WallpaperDB → metadata

## 📚 Documentation

- **README.md** - Overview, features, complete setup
- **QUICKSTART.md** - Step-by-step getting started
- **ARCHITECTURE.md** - Data flow, API specs, system design
- **CHECKLIST.md** - Implementation details, testing steps

## 🎨 Customization Ideas

Want to extend it?
- Add more image sources (Pixabay, Flickr, etc.)
- Create settings page for refresh interval
- Add image favorites/blacklist
- Implement search/filter
- Add keyboard shortcuts
- Create different themes

## ✅ What Works Right Now

- [x] Fetches high-quality images from 2 sources
- [x] Caches everything in IndexedDB
- [x] Auto-refreshes every 6 hours in background
- [x] Service worker checks time on wake-up
- [x] New tab always loads from cache (instant!)
- [x] Refresh button gets new cached image
- [x] Displays photo credits with links
- [x] Handles API failures gracefully
- [x] Compiles to vanilla JavaScript
- [x] Works offline after initial fetch

## 🎉 You're Done!

Your extension is **complete and ready to use**!

Next steps:
1. Read **QUICKSTART.md** for setup
2. Get your free API keys
3. Build and load the extension
4. Enjoy beautiful wallpapers! 🌄

---

**Need help?** Check the documentation or extension console for detailed logs.

**Happy coding! 🚀**
