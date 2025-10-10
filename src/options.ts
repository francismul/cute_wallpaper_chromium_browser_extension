/**
 * Options Page Logic
 */

import { getAllValidImages, getLastFetchTime, clearAllImages, getHistoryCount, clearHistory } from './content/db.js';
import {
  DEFAULT_AUTO_REFRESH_INTERVAL,
  DEFAULT_CLOCK_ENABLED,
  DEFAULT_CLOCK_FORMAT_24H,
  DEFAULT_CLOCK_SHOW_SECONDS,
  DEFAULT_CLOCK_SHOW_DATE,
  DEFAULT_HISTORY_ENABLED,
  DEFAULT_HISTORY_MAX_SIZE
} from './config/constants.js';

interface Settings {
  apiKeys: {
    unsplash: string[];
    pexels: string[];
  };
  searchPreferences: {
    unsplashKeywords: string;
    pexelsKeywords: string;
  };
  autoRefresh: {
    enabled: boolean;
    interval: number;
  };
  clock: {
    enabled: boolean;
    format24: boolean;
    showSeconds: boolean;
    showDate: boolean;
  };
  history: {
    enabled: boolean;
    maxSize: number;
  };
  apiKeyStatus?: {
    [key: string]: {
      tested: boolean;
      valid: boolean;
      testedAt: number;
    };
  };
}

const DEFAULT_SETTINGS: Settings = {
  apiKeys: {
    unsplash: [],
    pexels: []
  },
  searchPreferences: {
    unsplashKeywords: '',
    pexelsKeywords: ''
  },
  autoRefresh: {
    enabled: false,
    interval: DEFAULT_AUTO_REFRESH_INTERVAL
  },
  clock: {
    enabled: DEFAULT_CLOCK_ENABLED,
    format24: DEFAULT_CLOCK_FORMAT_24H,
    showSeconds: DEFAULT_CLOCK_SHOW_SECONDS,
    showDate: DEFAULT_CLOCK_SHOW_DATE
  },
  history: {
    enabled: DEFAULT_HISTORY_ENABLED,
    maxSize: DEFAULT_HISTORY_MAX_SIZE
  }
};

// Load settings from chrome.storage
async function loadSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      resolve(result.settings || DEFAULT_SETTINGS);
    });
  });
}

// Save settings to chrome.storage
async function saveSettings(settings: Settings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings }, resolve);
  });
}

// Show message
function showMessage(text: string, type: 'success' | 'error' | 'info') {
  const messageEl = document.getElementById('message')!;
  messageEl.textContent = text;
  messageEl.className = `message ${type} show`;

  setTimeout(() => {
    messageEl.classList.remove('show');
  }, 3000);
}

// Smart relative time formatter with auto updates
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now; // note: positive if in future
  const absDiff = Math.abs(diff);

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const isFuture = diff > 0;
  const suffix = isFuture ? 'in ' : '';
  const postfix = isFuture ? '' : ' ago';

  if (seconds < 10) return isFuture ? 'In a few seconds' : 'Just now';
  if (seconds < 60) return `${suffix}${seconds} second${seconds !== 1 ? 's' : ''}${postfix}`;
  if (minutes < 60) return `${suffix}${minutes} minute${minutes !== 1 ? 's' : ''}${postfix}`;
  if (hours < 24) return `${suffix}${hours} hour${hours !== 1 ? 's' : ''}${postfix}`;
  if (days < 7) return `${suffix}${days} day${days !== 1 ? 's' : ''}${postfix}`;
  if (weeks < 4) return `${suffix}${weeks} week${weeks !== 1 ? 's' : ''}${postfix}`;
  if (months < 12) return `${suffix}${months} month${months !== 1 ? 's' : ''}${postfix}`;
  return `${suffix}${years} year${years !== 1 ? 's' : ''}${postfix}`;
}

/**
 * Auto-updates an element's innerText with relative time.
 * @param el HTML element to update
 * @param timestamp Time in ms
 * @param intervalMs How often to refresh (default 30 seconds)
 */
function startRelativeTimeUpdater(
  el: HTMLElement,
  timestamp: number,
  intervalMs = 30_000
) {
  const update = () => {
    el.textContent = formatRelativeTime(timestamp);
  };
  update(); // initial
  const interval = setInterval(update, intervalMs);

  // stop updating when element is removed
  const observer = new MutationObserver(() => {
    if (!document.body.contains(el)) {
      clearInterval(interval);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Test API key
async function testApiKey(source: 'unsplash' | 'pexels', key: string): Promise<boolean> {
  try {
    if (source === 'unsplash') {
      const response = await fetch('https://api.unsplash.com/photos/random?count=1', {
        headers: { 'Authorization': `Client-ID ${key}` }
      });
      return response.ok;
    } else {
      const response = await fetch('https://api.pexels.com/v1/curated?per_page=1', {
        headers: { 'Authorization': key }
      });
      return response.ok;
    }
  } catch (error) {
    return false;
  }
}

// Render API keys list
function renderApiKeys(settings: Settings) {
  const container = document.getElementById('apiKeysList')!;
  container.innerHTML = '';

  // Update status indicators
  const unsplashStatusEl = document.getElementById('unsplashStatus')!;
  const pexelsStatusEl = document.getElementById('pexelsStatus')!;

  if (settings.apiKeys.unsplash.length > 0) {
    unsplashStatusEl.innerHTML = `📷 Unsplash: <span style="color: #28a745; font-weight: 600;">Active (${settings.apiKeys.unsplash.length} key${settings.apiKeys.unsplash.length > 1 ? 's' : ''})</span>`;
  } else {
    unsplashStatusEl.innerHTML = `📷 Unsplash: <span style="color: #dc3545; font-weight: 600;">Not Configured</span>`;
  }

  if (settings.apiKeys.pexels.length > 0) {
    pexelsStatusEl.innerHTML = `🖼️ Pexels: <span style="color: #28a745; font-weight: 600;">Active (${settings.apiKeys.pexels.length} key${settings.apiKeys.pexels.length > 1 ? 's' : ''})</span>`;
  } else {
    pexelsStatusEl.innerHTML = `🖼️ Pexels: <span style="color: #dc3545; font-weight: 600;">Not Configured</span>`;
  }

  const allKeys = [
    ...settings.apiKeys.unsplash.map(key => ({ source: 'unsplash' as const, key })),
    ...settings.apiKeys.pexels.map(key => ({ source: 'pexels' as const, key }))
  ];

  if (allKeys.length === 0) {
    container.innerHTML = '<p class="help-text">⚠️ No API keys configured. Extension will use default fallback images until you add at least one API key.</p>';
    return;
  }

  allKeys.forEach(({ source, key }) => {
    const item = document.createElement('div');
    item.className = 'api-key-item';

    const maskedKey = key.slice(0, 8) + '•'.repeat(Math.max(0, key.length - 12)) + key.slice(-4);

    // Get stored test status
    const keyHash = `${source}_${key}`;
    const status = settings.apiKeyStatus?.[keyHash];
    let statusText = 'Not Tested';
    let statusClass = 'unknown';

    if (status?.tested) {
      statusText = status.valid ? 'Valid' : 'Invalid';
      statusClass = status.valid ? 'valid' : 'invalid';
    }

    item.innerHTML = `
      <span class="source">${source.charAt(0).toUpperCase() + source.slice(1)}</span>
      <span class="key">${maskedKey}</span>
      <span class="status ${statusClass}">${statusText}</span>
      <button class="test-btn secondary" data-source="${source}" data-key="${key}">Test</button>
      <button class="delete-btn danger" data-source="${source}" data-key="${key}">Delete</button>
    `;

    container.appendChild(item);
  });

  // Add event listeners
  container.querySelectorAll('.test-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.target as HTMLButtonElement;
      const source = target.dataset.source as 'unsplash' | 'pexels';
      const key = target.dataset.key!;
      const statusEl = target.previousElementSibling!;

      statusEl.textContent = 'Testing...';
      statusEl.className = 'status unknown';

      const isValid = await testApiKey(source, key);

      statusEl.textContent = isValid ? 'Valid' : 'Invalid';
      statusEl.className = `status ${isValid ? 'valid' : 'invalid'}`;

      // Save test result to storage
      const currentSettings = await loadSettings();
      if (!currentSettings.apiKeyStatus) {
        currentSettings.apiKeyStatus = {};
      }
      const keyHash = `${source}_${key}`;
      currentSettings.apiKeyStatus[keyHash] = {
        tested: true,
        valid: isValid,
        testedAt: Date.now()
      };
      await saveSettings(currentSettings);
    });
  });

  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.target as HTMLButtonElement;
      const source = target.dataset.source as 'unsplash' | 'pexels';
      const key = target.dataset.key!;

      const currentSettings = await loadSettings();
      currentSettings.apiKeys[source] = currentSettings.apiKeys[source].filter(k => k !== key);

      // Remove test status for this key
      if (currentSettings.apiKeyStatus) {
        const keyHash = `${source}_${key}`;
        delete currentSettings.apiKeyStatus[keyHash];
      }

      await saveSettings(currentSettings);

      renderApiKeys(currentSettings);
      showMessage(`${source.charAt(0).toUpperCase() + source.slice(1)} API key deleted`, 'success');
    });
  });
}

// Load cache statistics
async function loadCacheStats() {
  try {
    const images = await getAllValidImages();
    const lastFetch = await getLastFetchTime();
    const now = Date.now();

    const totalItems = images.length;
    const validItems = images.filter(img => img.expiresAt > now).length;
    const expiredItems = totalItems - validItems;
    const unsplashCount = images.filter(img => img.source === 'unsplash').length;
    const pexelsCount = images.filter(img => img.source === 'pexels').length;

    document.getElementById('totalItems')!.textContent = totalItems.toString();
    document.getElementById('validItems')!.textContent = validItems.toString();
    document.getElementById('expiredItems')!.textContent = expiredItems.toString();
    document.getElementById('unsplashCount')!.textContent = unsplashCount.toString();
    document.getElementById('pexelsCount')!.textContent = pexelsCount.toString();

    // Use auto-updating relative time for last fetch
    const lastFetchEl = document.getElementById('lastFetchTime')!;
    if (lastFetch) {
      startRelativeTimeUpdater(lastFetchEl, lastFetch);
    } else {
      lastFetchEl.textContent = 'Never';
    }
  } catch (error) {
    console.error('Error loading cache stats:', error);
  }
}

// Load history statistics
async function loadHistoryStats() {
  try {
    const count = await getHistoryCount();
    document.getElementById('historyCount')!.textContent = count.toString();
  } catch (error) {
    console.error('Error loading history stats:', error);
  }
}

// Initialize the page
async function init() {
  const settings = await loadSettings();

  // Render API keys
  renderApiKeys(settings);

  // Load search preferences
  (document.getElementById('unsplashKeywords') as HTMLTextAreaElement).value =
    settings.searchPreferences.unsplashKeywords;
  (document.getElementById('pexelsKeywords') as HTMLTextAreaElement).value =
    settings.searchPreferences.pexelsKeywords;

  // Load auto refresh settings
  (document.getElementById('autoRefreshEnabled') as HTMLInputElement).checked =
    settings.autoRefresh.enabled;
  (document.getElementById('autoRefreshInterval') as HTMLInputElement).value =
    settings.autoRefresh.interval.toString();
  document.getElementById('intervalDisplay')!.textContent =
    `${settings.autoRefresh.interval}s`;

  // Load clock settings
  (document.getElementById('clockEnabled') as HTMLInputElement).checked =
    settings.clock.enabled;
  (document.getElementById('clock24Hour') as HTMLInputElement).checked =
    settings.clock.format24;
  (document.getElementById('clockShowSeconds') as HTMLInputElement).checked =
    settings.clock.showSeconds;
  (document.getElementById('clockShowDate') as HTMLInputElement).checked =
    settings.clock.showDate;

  // Load history settings
  (document.getElementById('historyEnabled') as HTMLInputElement).checked =
    settings.history?.enabled ?? true;
  (document.getElementById('historyMaxSize') as HTMLInputElement).value =
    (settings.history?.maxSize ?? 15).toString();
  document.getElementById('historySizeDisplay')!.textContent =
    (settings.history?.maxSize ?? 15).toString();

  // Load cache stats
  loadCacheStats();

  // Load history count
  loadHistoryStats();

  // Event listeners
  document.getElementById('autoRefreshInterval')!.addEventListener('input', (e) => {
    const value = (e.target as HTMLInputElement).value;
    document.getElementById('intervalDisplay')!.textContent = `${value}s`;
  });

  document.getElementById('historyMaxSize')!.addEventListener('input', (e) => {
    const value = (e.target as HTMLInputElement).value;
    document.getElementById('historySizeDisplay')!.textContent = value;
  });

  document.getElementById('addApiKeyBtn')!.addEventListener('click', async () => {
    const source = (document.getElementById('apiSource') as HTMLSelectElement).value as 'unsplash' | 'pexels';
    const key = (document.getElementById('apiKeyInput') as HTMLInputElement).value.trim();

    if (!key) {
      showMessage('Please enter an API key', 'error');
      return;
    }

    const currentSettings = await loadSettings();

    if (currentSettings.apiKeys[source].includes(key)) {
      showMessage('This API key is already added', 'error');
      return;
    }

    // Check if this is the first API key being added
    const wasEmpty = currentSettings.apiKeys.unsplash.length === 0 &&
      currentSettings.apiKeys.pexels.length === 0;

    currentSettings.apiKeys[source].push(key);
    await saveSettings(currentSettings);

    (document.getElementById('apiKeyInput') as HTMLInputElement).value = '';
    renderApiKeys(currentSettings);
    showMessage(`${source.charAt(0).toUpperCase() + source.slice(1)} API key added`, 'success');

    // If this was the first API key, trigger immediate fetch
    if (wasEmpty) {
      showMessage('Fetching images with your new API key...', 'info');
      chrome.runtime.sendMessage({ action: 'apiKeysUpdated' }, (response) => {
        if (response?.success) {
          showMessage('Images fetched successfully! Open a new tab to see them.', 'success');
          // Refresh stats to show new images
          setTimeout(loadCacheStats, 1000);
        } else {
          showMessage('Failed to fetch images. Please check your API key.', 'error');
        }
      });
    }
  });

  document.getElementById('testApiKeyBtn')!.addEventListener('click', async () => {
    const source = (document.getElementById('apiSource') as HTMLSelectElement).value as 'unsplash' | 'pexels';
    const key = (document.getElementById('apiKeyInput') as HTMLInputElement).value.trim();

    if (!key) {
      showMessage('Please enter an API key to test', 'error');
      return;
    }

    showMessage('Testing API key...', 'info');
    const isValid = await testApiKey(source, key);

    if (isValid) {
      showMessage('✓ API key is valid!', 'success');
    } else {
      showMessage('✗ API key is invalid or has exceeded rate limits', 'error');
    }
  });

  document.getElementById('saveSettingsBtn')!.addEventListener('click', async () => {
    const currentSettings = await loadSettings();

    currentSettings.searchPreferences = {
      unsplashKeywords: (document.getElementById('unsplashKeywords') as HTMLTextAreaElement).value.trim(),
      pexelsKeywords: (document.getElementById('pexelsKeywords') as HTMLTextAreaElement).value.trim()
    };

    currentSettings.autoRefresh = {
      enabled: (document.getElementById('autoRefreshEnabled') as HTMLInputElement).checked,
      interval: parseInt((document.getElementById('autoRefreshInterval') as HTMLInputElement).value)
    };

    currentSettings.clock = {
      enabled: (document.getElementById('clockEnabled') as HTMLInputElement).checked,
      format24: (document.getElementById('clock24Hour') as HTMLInputElement).checked,
      showSeconds: (document.getElementById('clockShowSeconds') as HTMLInputElement).checked,
      showDate: (document.getElementById('clockShowDate') as HTMLInputElement).checked
    };

    currentSettings.history = {
      enabled: (document.getElementById('historyEnabled') as HTMLInputElement).checked,
      maxSize: parseInt((document.getElementById('historyMaxSize') as HTMLInputElement).value)
    };

    await saveSettings(currentSettings);
    showMessage('Settings saved successfully!', 'success');

    // Notify background script to reload settings
    chrome.runtime.sendMessage({ action: 'settingsUpdated' });
  });

  document.getElementById('resetSettingsBtn')!.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      await saveSettings(DEFAULT_SETTINGS);
      showMessage('Settings reset to defaults', 'success');
      setTimeout(() => location.reload(), 1000);
    }
  });

  document.getElementById('refreshStatsBtn')!.addEventListener('click', () => {
    loadCacheStats();
    loadHistoryStats();
  });

  document.getElementById('clearCacheBtn')!.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear the entire cache? This will delete all stored images.')) {
      await clearAllImages();
      await loadCacheStats();
      showMessage('Cache cleared successfully', 'success');
    }
  });

  document.getElementById('clearHistoryBtn')!.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear image history? This will delete all navigation history.')) {
      await clearHistory();
      await loadHistoryStats();
      showMessage('History cleared successfully', 'success');
    }
  });
}

/**
 * Check if background refresh is needed and trigger it
 * This ensures missed alarms don't leave cache stale
 */
async function checkAndTriggerRefresh() {
  try {
    const { REFRESH_INTERVAL_MS } = await import('./config/constants.js');
    const lastFetch = await getLastFetchTime();
    const now = Date.now();

    if (lastFetch && (now - lastFetch) >= REFRESH_INTERVAL_MS) {
      console.log('⏰ Refresh overdue, notifying background worker...');
      chrome.runtime.sendMessage({ action: 'checkRefreshNeeded' });
    }
  } catch (error) {
    console.error('Failed to check refresh status:', error);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  init();
  checkAndTriggerRefresh(); // Check for stale cache on page load
});
