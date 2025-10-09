/**
 * Renders random cached Image on New Tab
 */

import { getRandomImage, getAllValidImages } from './db.js';
import { getRandomIndex } from '../utils/random.js';
import { shouldUseFallbackImages } from './fallback.js';

const wallpaperImg = document.getElementById('wallpaper') as HTMLImageElement;
const loadingDiv = document.getElementById('loading') as HTMLElement;
const creditDiv = document.getElementById('credit') as HTMLElement;
const authorSpan = document.getElementById('author') as HTMLElement;
const sourceSpan = document.getElementById('source') as HTMLElement;
const refreshBtn = document.getElementById('refreshBtn') as HTMLButtonElement;
const settingsBtn = document.getElementById('settingsBtn') as HTMLButtonElement;

// Clock elements
const clockContainer = document.getElementById('clockContainer') as HTMLElement;
const timeDisplay = document.getElementById('timeDisplay') as HTMLElement;
const dateDisplay = document.getElementById('dateDisplay') as HTMLElement;

let clockInterval: number | null = null;

let currentImages: Awaited<ReturnType<typeof getAllValidImages>> = [];

/**
 * Display an image
 */
function displayImage(imageData: NonNullable<Awaited<ReturnType<typeof getRandomImage>>>) {
  wallpaperImg.src = imageData.url;
  wallpaperImg.alt = `Photo by ${imageData.author}`;
  
  // Update credit
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
  
  creditDiv.classList.add('visible');
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

/**
 * Load and display a random image
 */
async function loadRandomImage() {
  try {
    loadingDiv.style.display = 'block';
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
    
    // Preload image
    const img = new Image();
    img.onload = () => {
      displayImage(imageData);
      loadingDiv.style.display = 'none';
      wallpaperImg.classList.add('loaded');
    };
    
    img.onerror = () => {
      loadingDiv.style.display = 'none';
      showError('Failed to load image');
    };
    
    img.src = imageData.url;
    
  } catch (error) {
    console.error('Error loading image:', error);
    showError('Error loading image from cache');
  }
}

/**
 * Refresh button handler - gets new random image from cache
 */
refreshBtn.addEventListener('click', () => {
  wallpaperImg.classList.remove('loaded');
  loadRandomImage();
});

/**
 * Settings button handler - opens options page
 */
settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
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
  }
});

// Reload images list periodically to get fresh cache
setInterval(async () => {
  currentImages = await getAllValidImages();
}, 5 * 60 * 1000); // Refresh list every 5 minutes

