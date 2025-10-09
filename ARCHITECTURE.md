# Architecture & Implementation Details

This document provides a technical deep-dive into how I built this extension.

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Browser Extension                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │  Background  │    │   New Tab    │    │   Options    │          │
│  │Service Worker│◄───┤     Page     │    │     Page     │          │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘          │
│         │                    │                    │                   │
│         └────────────────────┼────────────────────┘                  │
│                              │                                        │
│                              ▼                                        │
│              ┌────────────────────────────────────┐                  │
│              │     chrome.storage.local           │                  │
│              │  (Settings, API Keys, Test Status) │                  │
│              └────────────────────────────────────┘                  │
│                              │                                        │
│                              ▼                                        │
│              ┌────────────────────────────────────┐                  │
│              │      IndexedDB Storage             │                  │
│              │  ┌────────────┐  ┌──────────────┐ │                  │
│              │  │   Images   │  │   Metadata   │ │                  │
│              │  │  (up to 80)│  │  (lastFetch) │ │                  │
│              │  └────────────┘  └──────────────┘ │                  │
│              └────────────────────────────────────┘                  │
│                              ▲                                        │
│                              │                                        │
│         Fetch: Immediate on API add, then every 6h                   │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
                               ▼
              ┌─────────────────────┐     ┌─────────────────────┐
              │   Unsplash API      │     │    Pexels API       │
              │   (30 images)       │     │   (50 images)       │
              └─────────────────────┘     └─────────────────────┘
                               │
                               ▼
              ┌─────────────────────────────────────┐
              │     Fallback Images (20 total)      │
              │  (when no API keys configured)      │
              └─────────────────────────────────────┘
```

## Data Flow

### 1. Initial Load (Extension Install)
```
Extension Install
    ↓
Service Worker: onInstalled
    ↓
Initialize IndexedDB
    ↓
Set up 6-hour alarm
    ↓
Load 20 fallback images (no API keys yet)
    ↓
Store in IndexedDB with expiry
    ↓
Update lastFetch timestamp
    ↓
User sees fallback images immediately
```

### 2. User Adds API Keys (via Options Page)
```
User Opens Options Page
    ↓
Adds Unsplash/Pexels API keys
    ↓
Clicks "Save Settings"
    ↓
options.ts saves to chrome.storage.local
    ↓
Sends message to background worker
    ↓
background.ts: Immediate fetch triggered!
    ↓
Clean expired images
    ↓
Fetch 30 from Unsplash + 50 from Pexels
    ↓
Store 80 fresh images in IndexedDB
    ↓
Update lastFetch timestamp
    ↓
Wait for 6-hour cycle
```

### 3. New Tab Open
```
User Opens New Tab
    ↓
Load newTab.html
    ↓
Execute newTab.js
    ↓
Query IndexedDB for valid images
    ↓
Select random image (crypto.getRandomValues)
    ↓
Display image with author credits
    ↓
Start clock updates (if enabled)
    ↓
Setup auto-refresh timer (if configured)
```

### 4. Background Refresh (Every 6 Hours)
```
Chrome Alarm Triggers
    ↓
Service Worker Wakes
    ↓
Check lastFetch timestamp
    ↓
If > 6 hours:
    ↓
Clean expired images
    ↓
Check if API keys configured
    ↓
YES → Fetch from APIs (30-80 images)
NO  → Use fallback images (20 images)
    ↓
Store new images
    ↓
Update lastFetch
```

### 5. Service Worker Sleep/Wake
```
Service Worker Sleeps
    ↓
(hours later)
    ↓
New Tab Opened or Alarm Fires
    ↓
Service Worker Wakes
    ↓
Check lastFetch timestamp
    ↓
If > 6 hours → Trigger refresh
If < 6 hours → Use cached images
```

### 6. Settings Sync Flow
```
Options Page: User changes setting
    ↓
Save to chrome.storage.local
    ↓
chrome.storage.onChanged fires
    ↓
New Tab Page receives update
    ↓
Apply changes immediately
(e.g., clock format, auto-refresh interval)
```

## IndexedDB Schema

### Object Store: `images`
```typescript
{
  id: string;           // "unsplash_abc123", "pexels_456789", or "fallback_1"
  url: string;          // Full resolution image URL
  source: 'unsplash' | 'pexels';
  downloadUrl: string;  // Link to original photo page
  author: string;       // Photographer name
  authorUrl: string;    // Photographer profile URL
  timestamp: number;    // When fetched (milliseconds)
  expiresAt: number;    // When expires (timestamp + 24h)
}
```

### Object Store: `metadata`
```typescript
{
  key: 'lastFetch';
  value: number;        // Timestamp of last API fetch
}
```

## chrome.storage.local Schema

I use `chrome.storage.local` for settings synchronization:

```typescript
{
  settings: {
    apiKeys: {
      unsplash: string[];  // Array of Unsplash API keys
      pexels: string[];    // Array of Pexels API keys
    };
    searchPreferences: {
      unsplashKeywords: string;  // Comma-separated keywords
      pexelsKeywords: string;    // Comma-separated keywords
    };
    autoRefresh: {
      enabled: boolean;
      interval: number;  // Seconds (5-300)
    };
    clock: {
      show: boolean;
      format24: boolean;
      showSeconds: boolean;
    };
  };
  apiKeyStatus: {
    [key: string]: {  // API key as key
      status: 'working' | 'failed';
      lastTested: number;  // Timestamp
      error?: string;      // Error message if failed
    };
  };
}
```

## API Integration

### Unsplash API
- **Endpoint**: `GET /photos/random`
- **Params**: `count=30, orientation=landscape, query={keywords}`
- **Max Images**: 30 per request (I use all 30!)
- **Rate Limit**: 50 requests/hour (free tier)
- **Headers**: `Authorization: Client-ID {ACCESS_KEY}`
- **Keywords**: Optional search terms from user settings

### Pexels API
- **Endpoints**: 
  - `GET /v1/curated` (no keywords)
  - `GET /v1/search` (with keywords)
- **Params**: `per_page=50, orientation=landscape, query={keywords}`
- **Max Images**: 80 per request (I use 50 for balance)
- **Rate Limit**: 200 requests/hour (free tier)
- **Headers**: `Authorization: {API_KEY}`
- **Keywords**: Optional search terms from user settings

### Fetch Strategy
- Fetch from both APIs in parallel
- **Total**: Up to 80 images (30 Unsplash + 50 Pexels)
- **Single API**: Works with just one source (30-50 images)
- **Multiple Keys**: Randomly rotates between user's keys
- **Immediate fetch**: When user adds/updates API keys
- **Scheduled fetch**: Every 6 hours via Chrome Alarms
- **Fallback**: 20 default images when no API keys configured
- Stay well within rate limits

## Time Management

### Constants
- `REFRESH_INTERVAL_HOURS = 6`
- `EXPIRY_HOURS = 24`
- `UNSPLASH_IMAGES_COUNT = 30` (API maximum)
- `PEXELS_IMAGES_COUNT = 50` (optimized)

### Refresh Logic
```typescript
shouldRefresh = (currentTime - lastFetch) >= 6 hours
```

### Expiry Logic
```typescript
isExpired = currentTime >= expiresAt
```

### Cleanup
- Expired images removed during refresh
- Keeps database size manageable
- Fresh content rotation

## Service Worker Lifecycle

### Events Handled

1. **onInstalled**
   - Fired: Extension install or update
   - Action: Initialize DB, set alarm, load fallback images

2. **onStartup**
   - Fired: Browser starts
   - Action: Check if refresh needed

3. **onAlarm**
   - Fired: Every 6 hours
   - Action: Refresh images (API or fallback based on settings)

4. **onMessage**
   - Fired: Messages from options page or new tab
   - Actions: 
     - `triggerImmediateFetch`: When user saves API keys
     - `forceRefresh`: Manual refresh request
     - `checkRefreshStatus`: Status query

### Alarm API
```typescript
chrome.alarms.create('refreshImages', {
  periodInMinutes: 360  // 6 hours
});
```

### Message Handling
```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'triggerImmediateFetch') {
    // User just added API keys - fetch immediately!
    refreshImages().then(() => {
      sendResponse({ success: true });
    });
    return true;  // Keep message channel open
  }
});
```

## Random Selection

Uses Web Crypto API for true randomness:

```typescript
const buffer = new Uint32Array(1);
crypto.getRandomValues(buffer);
const index = buffer[0] % imageCount;
```

**Why Crypto Random?**
- More unpredictable than Math.random()
- Better distribution
- Cryptographically secure
- Prevents patterns in image selection

## Performance Considerations

### Caching Strategy
- ✅ All images from IndexedDB (fast)
- ✅ No network requests on new tab (instant)
- ✅ Background fetching (non-blocking)
- ✅ Lazy image loading with fade-in

### Storage Optimization
- Store URLs, not blobs (minimal space)
- Clean expired images automatically
- Typical DB size: ~16KB for 80 images
- Settings size: ~2-5KB in chrome.storage.local

### Network Optimization
- Parallel API requests (Unsplash + Pexels simultaneously)
- Immediate fetch when user adds keys (no waiting!)
- Infrequent scheduled fetches (6h interval)
- Handles API failures gracefully
- Random key rotation for load distribution

## Error Handling

### API Failures
- Log error to console
- Return empty array
- Fall back to cached images if available
- Use fallback images if cache is empty
- Don't crash extension
- Persist test failure status in chrome.storage

### IndexedDB Errors
- Graceful degradation
- Console warnings
- Retry on next cycle
- Never block UI

### Missing Images
- Show fallback images immediately
- Display helpful notification with link to settings
- Extension continues working perfectly
- No broken states

### Network Issues
- Offline detection
- Use cached images indefinitely if offline
- Resume fetching when online
- No user intervention needed

## Security

### API Keys
- Stored in chrome.storage.local (encrypted by browser)
- Never transmitted except to official APIs
- User provides their own keys
- Not in version control (.gitignore)
- Masked in UI for privacy
- Test status persisted separately

### Content Security Policy
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### Permissions
- `storage`: IndexedDB and chrome.storage access
- `alarms`: Periodic refresh scheduling
- `host_permissions`: Unsplash and Pexels APIs only

### Privacy
- No tracking or analytics
- No data sent to third parties
- API keys stay local
- All processing client-side

## Build Process

```
TypeScript Source
    ↓
esbuild (bundle + transpile)
    ↓
Vanilla JavaScript (ES2020)
    ↓
dist/ folder
    ↓
Load in browser
```

### Build Outputs
- `background.js` - Service worker
- `newTab.js` - New tab page logic
- `options.js` - Settings page logic
- `manifest.json` - Extension config
- `newTab.html` - New tab UI
- `options.html` - Settings UI  
- `*.map` - Source maps for debugging

## Testing

### Manual Testing
1. Load extension in browser
2. Check service worker console for logs
3. Open new tab - verify fallback images show
4. Open options page (right-click extension icon)
5. Add API keys and test them
6. Save settings - images should fetch immediately
7. Verify fresh images appear on new tab
8. Click refresh button
9. Check IndexedDB in DevTools
10. Test auto-refresh timer
11. Test clock display

### Debug Commands
```javascript
// Trigger immediate fetch
chrome.runtime.sendMessage({ 
  action: 'triggerImmediateFetch' 
}, console.log);

// Force refresh
chrome.runtime.sendMessage({ 
  action: 'forceRefresh' 
}, console.log);
```

### DevTools Inspection
- Application → IndexedDB → WallpaperDB
- Application → Storage → chrome.storage.local
- Application → Service Workers
- Console → View all logs
- Network → Verify API calls (only during fetch)

## Feature Highlights

### Options Page
- **API Key Management**: Add, test, delete multiple keys per source
- **Search Preferences**: Customize image themes with keywords
- **Auto-Refresh**: Configure new tab auto-rotation (5-300s)
- **Clock Settings**: 12/24hr format, show/hide seconds
- **Cache Statistics**: Real-time stats with source breakdown
- **Persistent Status**: API test results survive page reloads
- **Relative Time**: Shows "5 minutes ago" instead of "Just now"

### Fallback System
- **20 Default Images**: Beautiful high-quality wallpapers
- **Instant Start**: Works immediately without API keys
- **Smart Detection**: Auto-activates when no keys configured
- **User Guidance**: Notification with link to settings
- **Seamless UX**: No broken states or errors

### Immediate Fetch Feature
When user adds API keys:
1. Options page sends message to background worker
2. Background immediately fetches images
3. Updates last fetch time
4. User sees fresh images right away
5. Regular 6-hour cycle continues normally

### Clock Display
- **Live Updates**: Every second (or minute based on settings)
- **Format Toggle**: 12hr with AM/PM or 24hr military time
- **Seconds Display**: Optional seconds with live updates
- **Date Display**: Full date with day of week
- **Beautiful Design**: Matches overall aesthetic

---

**This extension demonstrates modern browser extension development with TypeScript, efficient caching strategies, and excellent user experience design.**
