/**
 * Renders random cached Image on New Tab
 */

import {
  getRandomImage,
  getAllValidImages,
  addToHistory,
  getHistory,
  getHistoryImageById,
  type HistoryEntry
} from './db.js';
import { getRandomIndex } from '../utils/random.js';
import { shouldUseFallbackImages } from './fallback.js';

const wallpaperImg = document.getElementById('wallpaper') as HTMLImageElement;
const loadingDiv = document.getElementById('loading') as HTMLElement;
const creditDiv = document.getElementById('credit') as HTMLElement;
const authorSpan = document.getElementById('author') as HTMLElement;
const sourceSpan = document.getElementById('source') as HTMLElement;
const settingsBtn = document.getElementById('settingsBtn') as HTMLButtonElement;

// History navigation elements
const prevImageBtn = document.getElementById('prevImageBtn') as HTMLButtonElement;
const nextImageBtn = document.getElementById('nextImageBtn') as HTMLButtonElement;
const historyIndicator = document.getElementById('historyIndicator') as HTMLElement;
const historyPosition = document.getElementById('historyPosition') as HTMLElement;
const historyTotal = document.getElementById('historyTotal') as HTMLElement;

// Clock elements
const clockContainer = document.getElementById('clockContainer') as HTMLElement;
const timeDisplay = document.getElementById('timeDisplay') as HTMLElement;
const dateDisplay = document.getElementById('dateDisplay') as HTMLElement;

let clockInterval: number | null = null;

let currentImages: Awaited<ReturnType<typeof getAllValidImages>> = [];
let currentBlobUrl: string | null = null; // Track current blob URL for cleanup

// History navigation state
let historyList: HistoryEntry[] = [];
let currentHistoryIndex: number = -1; // -1 means viewing current/latest image
let historyEnabled: boolean = true;
let historyMaxSize: number = 15;

/**
 * Display an image with smooth transitions
 */
async function displayImage(
  imageData: NonNullable<Awaited<ReturnType<typeof getRandomImage>>>,
  skipHistory: boolean = false,
  animationDirection: 'next' | 'prev' | 'fade' = 'fade'
) {
  // Create object URL from blob
  const blobUrl = URL.createObjectURL(imageData.blob);

  // Preload the image to ensure it's ready before transitioning
  const preloadImg = new Image();

  await new Promise<void>((resolve, reject) => {
    preloadImg.onload = () => {
      // Image is fully loaded in memory, now transition smoothly

      // Phase 1: Fade out current image and hide credits
      wallpaperImg.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      wallpaperImg.style.opacity = '0';
      creditDiv.classList.remove('visible');

      // Phase 2: After fade out, swap image and prepare for entrance
      setTimeout(() => {
        // Revoke previous blob URL to free memory
        if (currentBlobUrl) {
          URL.revokeObjectURL(currentBlobUrl);
        }
        currentBlobUrl = blobUrl;

        // Update image source
        wallpaperImg.src = blobUrl;
        wallpaperImg.alt = `Photo by ${imageData.author}`;

        // Set initial state based on animation direction
        switch (animationDirection) {
          case 'next':
            wallpaperImg.style.transform = 'translateX(100px) scale(0.95)';
            break;
          case 'prev':
            wallpaperImg.style.transform = 'translateX(-100px) scale(0.95)';
            break;
          case 'fade':
          default:
            wallpaperImg.style.transform = 'scale(0.95)';
            break;
        }

        // Phase 3: Animate entrance
        requestAnimationFrame(() => {
          wallpaperImg.style.transition = 'opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
          wallpaperImg.style.opacity = '1';
          wallpaperImg.style.transform = 'translateX(0) scale(1)';

          // Update credit info
          const authorLink = document.createElement('a');
          authorLink.href = imageData.authorUrl;
          authorLink.target = '_blank';
          authorLink.textContent = imageData.author;

          const sourceLink = document.createElement('a');
          sourceLink.href = imageData.source === 'unsplash' ? 'https://unsplash.com' : 'https://pexels.com';
          sourceLink.target = '_blank';
          sourceLink.textContent = imageData.source === 'unsplash' ? 'Unsplash' : 'Pexels';

          authorSpan.innerHTML = '';
          authorSpan.appendChild(authorLink);
          sourceSpan.innerHTML = '';
          sourceSpan.appendChild(sourceLink);

          // Show credits with slight delay
          setTimeout(() => {
            creditDiv.classList.add('visible');
          }, 200);
        });
      }, 300); // Wait for fade out

      resolve();
    };

    preloadImg.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Failed to preload image'));
    };

    preloadImg.src = blobUrl;
  });

  // Add to history (only if not navigating history and history is enabled)
  if (!skipHistory && currentHistoryIndex === -1 && historyEnabled) {
    try {
      await addToHistory(imageData.id, imageData.source, historyMaxSize);
      await loadHistoryList();
      updateHistoryUI();
    } catch (error) {
      console.error('Failed to add to history:', error);
    }
  }
}

/**
 * Show info message about fallback images
 */
async function showFallbackInfo() {
  const usingFallback = await shouldUseFallbackImages();

  if (usingFallback) {
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = `
      position: fixed;
      top: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(10px);
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 100;
      text-align: center;
      max-width: 500px;
    `;
    infoDiv.innerHTML = `
      ℹ️ Using default images. <a href="#" id="openSettingsLink" style="color: #4da6ff; text-decoration: underline;">Configure API keys</a> to get fresh wallpapers!
    `;
    document.body.appendChild(infoDiv);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      infoDiv.style.opacity = '0';
      infoDiv.style.transition = 'opacity 0.5s';
      setTimeout(() => infoDiv.remove(), 500);
    }, 5000);

    // Handle settings link
    document.getElementById('openSettingsLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }
}

/**
 * Show error message
 */
function showError(message: string) {
  loadingDiv.style.display = 'none';

  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  errorDiv.innerHTML = `
    <p>${message}</p>
    <p style="margin-top: 10px; font-size: 14px; opacity: 0.8;">
      <a href="#" id="openOptionsFromError" style="color: #4da6ff; text-decoration: underline;">Configure API keys</a> to get fresh wallpapers!
    </p>
  `;
  document.body.appendChild(errorDiv);

  // Handle settings link
  document.getElementById('openOptionsFromError')?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

// ========================================
// HISTORY NAVIGATION FUNCTIONS
// ========================================

/**
 * Load history list from IndexedDB
 */
async function loadHistoryList() {
  try {
    historyList = await getHistory(historyMaxSize);
  } catch (error) {
    console.error('Failed to load history:', error);
    historyList = [];
  }
}

/**
 * Update history navigation UI
 */
function updateHistoryUI() {
  if (!historyEnabled || historyList.length === 0) {
    prevImageBtn.classList.remove('visible');
    nextImageBtn.classList.remove('visible');
    historyIndicator.classList.remove('visible');
    return;
  }

  if (currentHistoryIndex === -1) {
    // Viewing current/latest image
    prevImageBtn.classList.toggle('visible', historyList.length > 0);
    nextImageBtn.classList.add('visible'); // Always show next for new random
    historyIndicator.classList.remove('visible');
  } else {
    // Viewing history
    prevImageBtn.classList.toggle('visible', currentHistoryIndex < historyList.length - 1);
    nextImageBtn.classList.add('visible'); // Always show next for new random
    historyIndicator.classList.add('visible');

    historyPosition.textContent = (currentHistoryIndex + 1).toString();
    historyTotal.textContent = historyList.length.toString();
  }
}

/**
 * Navigate to previous image in history
 */
async function navigateToPrevious() {
  if (currentHistoryIndex >= historyList.length - 1) return;

  currentHistoryIndex++;
  const historyEntry = historyList[currentHistoryIndex];

  if (!historyEntry) return;

  try {
    const imageData = await getHistoryImageById(historyEntry.imageId);

    if (imageData) {
      await displayImage(imageData, true, 'prev'); // Skip history, use prev animation
      updateHistoryUI();
    } else {
      // Image expired/deleted, skip it
      historyList.splice(currentHistoryIndex, 1);
      currentHistoryIndex--;
      if (currentHistoryIndex < historyList.length - 1) {
        await navigateToPrevious(); // Try next one
      }
    }
  } catch (error) {
    console.error('Failed to navigate to previous image:', error);
  }
}

/**
 * Navigate to next image or return to current
 * Now always gets a new random image!
 */
async function navigateToNext() {
  // Reset history position to current
  currentHistoryIndex = -1;

  // Get a new random image with 'next' animation
  await loadRandomImage();

  updateHistoryUI();
}

/**
 * Load history settings from chrome.storage
 */
async function loadHistorySettings() {
  try {
    const result = await chrome.storage.local.get(['settings']);
    const settings = result.settings || {};

    historyEnabled = settings.history?.enabled ?? true;
    historyMaxSize = settings.history?.maxSize ?? 15;

    await loadHistoryList();
    updateHistoryUI();
  } catch (error) {
    console.error('Failed to load history settings:', error);
  }
}

/**
 * Load and display a random image
 */
async function loadRandomImage() {
  try {
    // Reset history navigation (we're getting a new current image)
    currentHistoryIndex = -1;

    // No loading indicator needed - we're loading from local IndexedDB (instant!)
    creditDiv.classList.remove('visible');

    // Get all valid images if we don't have them yet
    if (currentImages.length === 0) {
      currentImages = await getAllValidImages();
    }

    if (currentImages.length === 0) {
      showError('No images available in cache. The extension will fetch images automatically.');
      return;
    }

    // Get a random image using crypto-based random
    const randomIndex = getRandomIndex(currentImages.length);
    const imageData = currentImages[randomIndex];

    if (!imageData) {
      showError('Failed to select a random image');
      return;
    }

    // Display image directly from blob (no preloading needed - it's already in memory!)
    await displayImage(imageData, false, 'fade');
    wallpaperImg.classList.add('loaded');

  } catch (error) {
    console.error('Error loading image:', error);
    showError('Error loading image from cache');
  }
}

/**
 * Settings button handler - opens options page
 */
settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

/**
 * History navigation: Previous image
 */
prevImageBtn.addEventListener('click', async () => {
  await navigateToPrevious();
});

/**
 * History navigation: Next image / Return to current
 */
nextImageBtn.addEventListener('click', async () => {
  await navigateToNext();
});

/**
 * Keyboard shortcuts for history navigation
 */
document.addEventListener('keydown', async (e) => {
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    await navigateToPrevious();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    await navigateToNext();
  }
});

/**
 * Update clock display
 */
function updateClock(format24: boolean, showSeconds: boolean) {
  const now = new Date();

  let hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  let timeString: string;

  if (format24) {
    // 24-hour format
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    const s = seconds.toString().padStart(2, '0');
    timeString = showSeconds ? `${h}:${m}:${s}` : `${h}:${m}`;
  } else {
    // 12-hour format with AM/PM
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12-hour format
    const h = hours.toString();
    const m = minutes.toString().padStart(2, '0');
    const s = seconds.toString().padStart(2, '0');
    timeString = showSeconds ? `${h}:${m}:${s} ${period}` : `${h}:${m} ${period}`;
  }

  timeDisplay.textContent = timeString;
}

/**
 * Update date display
 */
function updateDate() {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  dateDisplay.textContent = now.toLocaleDateString('en-US', options);
}

/**
 * Setup clock based on settings
 */
async function setupClock() {
  // Clear existing interval
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }

  // Get settings
  const result = await chrome.storage.local.get(['settings']);
  const settings = result.settings || {
    clock: {
      enabled: true,
      format24: false,
      showSeconds: true,
      showDate: true
    }
  };

  if (settings.clock.enabled) {
    clockContainer.classList.remove('hidden');

    // Update date
    if (settings.clock.showDate) {
      dateDisplay.style.display = 'block';
      updateDate();
    } else {
      dateDisplay.style.display = 'none';
    }

    // Update time immediately
    updateClock(settings.clock.format24, settings.clock.showSeconds);

    // Set interval based on whether seconds are shown
    const interval = settings.clock.showSeconds ? 1000 : 60000;
    clockInterval = window.setInterval(() => {
      updateClock(settings.clock.format24, settings.clock.showSeconds);
      if (settings.clock.showDate) {
        updateDate(); // Update date in case day changed
      }
    }, interval);

    console.log(`Clock enabled: ${settings.clock.format24 ? '24h' : '12h'} format, seconds: ${settings.clock.showSeconds}`);
  } else {
    clockContainer.classList.add('hidden');
  }
}

// Setup clock on load
setupClock();

// Load history settings and list
loadHistorySettings();

// Load initial image on page load
loadRandomImage();

// Show fallback info if using default images
showFallbackInfo();

// Auto-refresh functionality
let autoRefreshTimer: number | null = null;

async function setupAutoRefresh() {
  // Clear existing timer
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }

  // Get settings
  const result = await chrome.storage.local.get(['settings']);
  const settings = result.settings || { autoRefresh: { enabled: false, interval: 30 } };

  if (settings.autoRefresh.enabled) {
    const intervalMs = settings.autoRefresh.interval * 1000;
    autoRefreshTimer = window.setInterval(() => {
      wallpaperImg.classList.remove('loaded');
      loadRandomImage();
    }, intervalMs);

    console.log(`Auto-refresh enabled: ${settings.autoRefresh.interval}s`);
  }
}

// Setup auto-refresh on load
setupAutoRefresh();

// Listen for settings changes
chrome.storage.onChanged.addListener((changes: any, areaName: any) => {
  if (areaName === 'local' && changes.settings) {
    setupAutoRefresh();
    setupClock();
    loadHistorySettings(); // Reload history settings
  }
});

// Clean up blob URLs when page unloads
window.addEventListener('beforeunload', () => {
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
  }
});

// Reload images list periodically to get fresh cache
setInterval(async () => {
  currentImages = await getAllValidImages();
}, 5 * 60 * 1000); // Refresh list every 5 minutes

/**
 * Check if background refresh is needed and trigger it
 * This ensures missed alarms don't leave cache stale
 */
async function checkAndTriggerRefresh() {
  try {
    const { REFRESH_INTERVAL_MS } = await import('../config/constants.js');
    const lastFetch = await import('./db.js').then(m => m.getLastFetchTime());
    const now = Date.now();

    if (!lastFetch || (now - lastFetch) >= REFRESH_INTERVAL_MS) {
      console.log('⏰ Refresh overdue, notifying background worker...');
      chrome.runtime.sendMessage({ action: 'checkRefreshNeeded' });
    }
  } catch (error) {
    console.error('Failed to check refresh status:', error);
  }
}

// Check for stale cache on page load
checkAndTriggerRefresh();
