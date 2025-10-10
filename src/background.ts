/**
 * Background Service Worker
 * Handles periodic image fetching and caching
 */

import { fetchAllImages, areApiKeysConfigured } from './content/api.js';
import { 
  storeImages, 
  getLastFetchTime, 
  setLastFetchTime, 
  cleanExpiredImages,
  initDB,
  getAllValidImages
} from './content/db.js';
import { getFallbackImages, shouldUseFallbackImages } from './content/fallback.js';
import { 
  REFRESH_INTERVAL_HOURS, 
  REFRESH_INTERVAL_MS, 
  ALARM_NAME,
  IMMEDIATE_FETCH_COOLDOWN_MS
} from './config/constants.js';

let lastManualFetch = 0; // Track last manual fetch to prevent spam

/**
 * Check if it's time to refresh images
 */
async function shouldRefreshImages(): Promise<boolean> {
  const lastFetch = await getLastFetchTime();
  
  if (lastFetch === null) {
    // Never fetched before
    return true;
  }

  const timeSinceLastFetch = Date.now() - lastFetch;
  return timeSinceLastFetch >= REFRESH_INTERVAL_MS;
}

/**
 * Fetch and cache new images
 */
async function refreshImages(): Promise<void> {
  console.log('Starting image refresh...');
  console.log('⬇️ Downloading images as blobs for offline support...');
  
  try {
    // Clean up expired images first
    const deletedCount = await cleanExpiredImages();
    console.log(`Cleaned ${deletedCount} expired images`);

    // Check if we should use fallback images
    const useFallback = await shouldUseFallbackImages();
    
    let images;
    
    if (useFallback) {
      console.log('No API keys configured, downloading fallback images...');
      images = await getFallbackImages();
    } else {
      // Fetch from configured APIs
      images = await fetchAllImages();
      console.log(`📥 Downloaded ${images.length} images as blobs`);
      
      // If no images were fetched (API errors, rate limits, etc.)
      // Check if we have any cached images
      if (images.length === 0) {
        console.warn('Failed to fetch from APIs, checking cache...');
        const cachedImages = await getAllValidImages();
        
        if (cachedImages.length === 0) {
          console.log('No cached images, falling back to default images');
          images = await getFallbackImages();
        } else {
          console.log(`Using ${cachedImages.length} existing cached images`);
          return; // Keep existing cache
        }
      }
    }
    
    if (images.length > 0) {
      // Store in IndexedDB
      await storeImages(images);
      
      // Update last fetch time
      await setLastFetchTime(Date.now());
      
      console.log(`Successfully cached ${images.length} images`);
    } else {
      console.warn('No images available to cache');
    }
  } catch (error) {
    console.error('Error refreshing images:', error);
    
    // On error, try to use fallback if cache is empty
    const cachedImages = await getAllValidImages();
    if (cachedImages.length === 0) {
      console.log('Error occurred and cache is empty, loading fallback images');
      const fallbackImages = await getFallbackImages();
      await storeImages(fallbackImages);
      await setLastFetchTime(Date.now());
    }
  }
}

/**
 * Set up periodic alarm for image refresh
 */
function setupRefreshAlarm(): void {
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: REFRESH_INTERVAL_HOURS * 60
  });
  console.log(`Alarm set to refresh every ${REFRESH_INTERVAL_HOURS} hours`);
}

/**
 * Handle alarm events
 */
chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('Alarm triggered: refreshing images');
    refreshImages();
  }
});

/**
 * Initialize on extension install or update
 */
chrome.runtime.onInstalled.addListener(async (details: chrome.runtime.InstalledDetails) => {
  console.log('Extension installed/updated:', details.reason);
  
  // Initialize database
  await initDB();
  
  // Set up alarm
  setupRefreshAlarm();
  
  // Do initial fetch if needed
  if (await shouldRefreshImages()) {
    console.log('Performing initial image fetch');
    await refreshImages();
  }
});

/**
 * Check on startup (service worker wake)
 */
chrome.runtime.onStartup.addListener(async () => {
  console.log('Service worker started');
  
  // Initialize database
  await initDB();
  
  // Ensure alarm is set
  const alarm = await chrome.alarms.get(ALARM_NAME);
  if (!alarm) {
    console.log('Alarm not found, recreating...');
    setupRefreshAlarm();
  }
  
  // Check if we need to refresh
  if (await shouldRefreshImages()) {
    console.log('Time to refresh images (last fetch was over 6 hours ago)');
    await refreshImages();
  } else {
    const lastFetch = await getLastFetchTime();
    if (lastFetch) {
      const hoursAgo = Math.floor((Date.now() - lastFetch) / (1000 * 60 * 60));
      console.log(`Images are fresh (last fetched ${hoursAgo} hours ago)`);
    }
  }
});

/**
 * Handle messages from content scripts
 */
chrome.runtime.onMessage.addListener((
  message: { action: string },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) => {
  if (message.action === 'forceRefresh') {
    console.log('Force refresh requested');
    refreshImages().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('Force refresh failed:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
  
  if (message.action === 'checkRefreshStatus') {
    getLastFetchTime().then((lastFetch) => {
      sendResponse({ 
        lastFetch,
        hoursAgo: lastFetch ? Math.floor((Date.now() - lastFetch) / (1000 * 60 * 60)) : null
      });
    });
    return true;
  }

  if (message.action === 'settingsUpdated') {
    console.log('Settings updated, will apply on next refresh');
    sendResponse({ success: true });
    return false;
  }

  if (message.action === 'apiKeysUpdated') {
    console.log('API keys updated, checking cooldown...');
    
    const now = Date.now();
    const timeSinceLastManualFetch = now - lastManualFetch;
    
    // Prevent spam: 10-second cooldown
    if (timeSinceLastManualFetch < IMMEDIATE_FETCH_COOLDOWN_MS) {
      console.log(`Cooldown active. Please wait ${Math.ceil((IMMEDIATE_FETCH_COOLDOWN_MS - timeSinceLastManualFetch) / 1000)}s`);
      sendResponse({ 
        success: false, 
        error: 'Please wait a few seconds before fetching again' 
      });
      return false;
    }
    
    lastManualFetch = now;
    console.log('Fetching images immediately...');
    
    refreshImages().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('Immediate fetch failed:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
  
  return false; // No async response needed
});

console.log('Background service worker loaded');
