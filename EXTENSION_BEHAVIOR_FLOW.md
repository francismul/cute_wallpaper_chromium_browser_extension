# 🔄 Extension Behavior Flow

## Quick Answers

### ❓ What happens if users never configure API keys?
**Answer**: They see 20 beautiful fallback images indefinitely - no expiry, no deletion!

### ❓ Do expired items get deleted?
**Answer**: Yes! The extension cleans them every 6 hours before fetching new images.

### ❓ Are images fetched every 6 hours?
**Answer**: Yes! Chrome Alarms API triggers refresh every 6 hours automatically.

### ❓ What happens when users add API keys?
**Answer**: The extension fetches images **immediately** (no waiting for 6-hour cycle) and updates the cache right away!

---

## 📋 Detailed Flow Scenarios

### Scenario 1: User Never Configures API Keys ❌🔑

```
Day 0 - Extension Installed
    ↓
background.ts: onInstalled event
    ↓
Check: shouldUseFallbackImages()
    → chrome.storage.local.get('settings')
    → No API keys found ❌
    ↓
getFallbackImages() called
    → Returns 20 hardcoded images
    → Each image gets:
        - timestamp: Date.now()
        - expiresAt: Date.now() + (24 hours)
    ↓
storeImages() → IndexedDB
    ↓
User sees: Random fallback image ✅

---

6 Hours Later - Alarm Triggers
    ↓
background.ts: refreshImages()
    ↓
cleanExpiredImages() runs first
    → Finds images where expiresAt <= now
    → Deletes them from IndexedDB
    → Returns deletedCount
    ↓
Check: shouldUseFallbackImages()
    → Still no API keys ❌
    ↓
getFallbackImages() called AGAIN
    → Same 20 images
    → NEW timestamps/expiresAt ✅
    ↓
storeImages() → Replaces old data
    ↓
Cycle repeats every 6 hours indefinitely

---

Day 30 - Still No API Keys
    ↓
Same 20 fallback images
Fresh timestamps every 6 hours
No errors, no issues
User gets consistent experience ✅
```

**Key Points**:
- ✅ Fallback images **never run out**
- ✅ They get **refreshed every 6 hours** (new expiry dates)
- ✅ User **always has images** to display
- ✅ No error messages or broken states

---

### Scenario 2: Expired Items Lifecycle 🗑️

```
T=0 Hours - Images Fetched
    ↓
80 images stored in IndexedDB:
    - timestamp: 1728572400000 (Oct 10, 2025 12:00 PM)
    - expiresAt: 1728658800000 (Oct 11, 2025 12:00 PM)
    
---

T=6 Hours - First Alarm (Images still valid)
    ↓
background.ts: refreshImages()
    ↓
cleanExpiredImages() runs
    → now = 1728594000000 (Oct 10, 6:00 PM)
    → Checks: expiresAt (Oct 11 12:00 PM) > now (Oct 10 6:00 PM)
    → Result: No images deleted (all still valid) ✅
    ↓
Fetches 80 NEW images
    → New expiresAt: Oct 11, 6:00 PM
    ↓
Stores new images (replaces old ones with same IDs)

---

T=24 Hours - Fourth Alarm (Original images would be expired)
    ↓
cleanExpiredImages() runs
    → Original images (if still present) have expiresAt < now
    → Gets deleted ❌
    ↓
BUT: They were already replaced at T=6h, T=12h, T=18h
So: No impact on user experience ✅

---

What if APIs FAIL at T=6h?
    ↓
fetchAllImages() returns []
    ↓
background.ts checks:
    if (images.length === 0) {
        const cachedImages = await getAllValidImages();
        if (cachedImages.length > 0) {
            return; // Keep existing cache! ✅
        }
    }
    ↓
Result: Old images stay until APIs recover
```

**Key Points**:
- ✅ Images expire after **24 hours**
- ✅ Cleanup happens **every 6 hours** before fetch
- ✅ Expired images are **permanently deleted** from IndexedDB
- ✅ If APIs fail, **old images are kept** (even if expired)
- ✅ User **never sees empty cache** (fallback system kicks in)

---

### Scenario 3: User Adds API Keys (Immediate Fetch) 🚀⚡

```
User opens Options Page
    ↓
Adds Unsplash API key: usk_abc123
    ↓
Clicks "Save" button
    ↓
options.ts: Saves key to chrome.storage.local
    ↓
Sends message to background worker:
    chrome.runtime.sendMessage({ 
        action: 'refreshImages' 
    })
    ↓
background.ts receives message
    ↓
Checks: Has it been >10 seconds since last fetch?
    if (timeSinceLastFetch < 10000) {
        console.log('Too soon, skipping');
        return; // Prevent spam
    }
    ↓
refreshImages() called IMMEDIATELY ✅
    ↓
Fetches 30 Unsplash images
    ↓
Stores in IndexedDB
    ↓
Updates lastFetchTime
    ↓
User opens new tab → sees fresh API images! 🎉

---

Later: User adds Pexels key too
    ↓
Clicks "Save"
    ↓
Immediate fetch triggered again
    ↓
Now fetches 30 Unsplash + 50 Pexels = 80 images ✅
```

**Key Points**:
- ✅ **No waiting** for 6-hour cycle when adding keys
- ✅ **10-second cooldown** prevents spam/rate limits
- ✅ Works for **adding, updating, or deleting** keys
- ✅ User sees results **immediately** after saving
- ✅ Background message passing ensures reliability

---

### Scenario 4: 6-Hour Refresh Cycle ⏰

```
How it works:
    ↓
chrome.alarms.create('refreshImages', {
    periodInMinutes: 360  // 6 hours × 60 minutes
})
    ↓
Every 6 hours, Chrome triggers alarm
    ↓
background.ts: chrome.alarms.onAlarm.addListener()
    ↓
refreshImages() called
```

**Timeline Example**:

| Time | Event | Action |
|------|-------|--------|
| **12:00 PM** | Extension installed | Fetches 80 images |
| **6:00 PM** | Alarm #1 | Fetches 80 new images |
| **12:00 AM** | Alarm #2 | Fetches 80 new images |
| **6:00 AM** | Alarm #3 | Fetches 80 new images |
| **12:00 PM** | Alarm #4 | Fetches 80 new images |

**What gets fetched each time**:
- 30 images from Unsplash (if API key configured)
- 50 images from Pexels (if API key configured)
- 20 fallback images (if NO API keys)

**Important**:
- ✅ Alarms **persist** even when service worker sleeps
- ✅ Alarms **survive** browser restarts
- ✅ Alarms **continue** after extension updates
- ✅ Uses **system-level** scheduling (very reliable)

---

## 🔍 Code Flow Deep Dive

### 1. Initial Install
```typescript
chrome.runtime.onInstalled.addListener(async (details) => {
  // Step 1: Initialize database
  await initDB();
  
  // Step 2: Set up 6-hour alarm
  chrome.alarms.create('refreshImages', {
    periodInMinutes: 360
  });
  
  // Step 3: Check if we need initial fetch
  const lastFetch = await getLastFetchTime();
  if (lastFetch === null) {
    // Never fetched before - do it now!
    await refreshImages();
  }
});
```

### 2. Every 6 Hours
```typescript
async function refreshImages() {
  // Step 1: Clean expired images
  const deletedCount = await cleanExpiredImages();
  console.log(`Deleted ${deletedCount} expired images`);
  
  // Step 2: Check if we should use fallback
  const useFallback = await shouldUseFallbackImages();
  
  let images;
  
  if (useFallback) {
    // No API keys → Use 20 fallback images
    images = getFallbackImages();
  } else {
    // Has API keys → Fetch from APIs
    images = await fetchAllImages();
    
    // Safety: If APIs fail, check cache
    if (images.length === 0) {
      const cachedImages = await getAllValidImages();
      if (cachedImages.length > 0) {
        return; // Keep old cache
      } else {
        images = getFallbackImages(); // Emergency fallback
      }
    }
  }
  
  // Step 3: Store images
  await storeImages(images);
  
  // Step 4: Update last fetch time
  await setLastFetchTime(Date.now());
}
```

### 3. Cleanup Process
```typescript
async function cleanExpiredImages(): Promise<number> {
  const now = Date.now();
  let deletedCount = 0;
  
  // Iterate through all images in IndexedDB
  store.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const image = cursor.value;
      
      // Delete if expired
      if (image.expiresAt <= now) {
        cursor.delete();
        deletedCount++;
      }
      
      cursor.continue();
    }
  };
  
  return deletedCount;
}
```

---

## 🛡️ Safety Mechanisms

### 1. Empty Cache Protection
```
If APIs fail AND cache is empty:
    ↓
Load fallback images
    ↓
User always sees something ✅
```

### 2. Single API Support
```
User only has Unsplash key:
    ↓
Fetches 30 Unsplash images
Skips Pexels
    ↓
User gets 30 images every 6 hours ✅
```

### 3. Expired Image Handling
```
User opens new tab:
    ↓
getAllValidImages() called
    ↓
Filters: img.expiresAt > Date.now()
    ↓
Only returns non-expired images ✅
```

### 4. Service Worker Sleep
```
Service worker goes to sleep:
    ↓
Alarm still active in Chrome
    ↓
6 hours later: Chrome wakes service worker
    ↓
refreshImages() runs normally ✅
```

---

## 📊 Summary Table

| Question | Answer |
|----------|--------|
| **Do fallback images expire?** | Yes (24h), but they refresh every 6h with new timestamps |
| **Are expired images deleted?** | Yes, every 6h before fetching new ones |
| **What if users never add API keys?** | 20 fallback images cycle indefinitely |
| **What happens when users add API keys?** | Immediate fetch (no 6-hour wait!) |
| **Fetch frequency?** | Every 6 hours (360 minutes) automatically |
| **What if APIs fail?** | Keeps old cache or uses fallback |
| **What if cache is totally empty?** | Loads 20 fallback images |
| **Do alarms persist?** | Yes, across restarts and updates |
| **Max images in cache?** | 80 (30 Unsplash + 50 Pexels) |
| **Spam protection?** | 10-second cooldown between manual fetches |

---

## 🎯 Bottom Line

1. **No API Keys**: Users get 20 fallback images refreshed every 6 hours (indefinitely)
2. **Add API Keys**: Immediate fetch of fresh images (no waiting!)
3. **Expired Images**: Deleted every 6 hours before new fetch
4. **6-Hour Cycle**: Runs automatically via Chrome Alarms (very reliable)
5. **Safety**: Multiple fallback layers ensure users ALWAYS have images

**Result**: Rock-solid, fail-safe system that works perfectly whether users configure APIs or not! 🚀
