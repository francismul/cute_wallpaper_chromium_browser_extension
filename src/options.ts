/**
 * Options Page Logic
 */

import { getAllValidImages, getLastFetchTime, clearAllImages } from './content/db.js';

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
    interval: 30
  },
  clock: {
    enabled: true,
    format24: false,
    showSeconds: true,
    showDate: true
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

// Format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  return `${years} year${years !== 1 ? 's' : ''} ago`;
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
    
    if (lastFetch) {
      document.getElementById('lastFetchTime')!.textContent = formatRelativeTime(lastFetch);
    } else {
      document.getElementById('lastFetchTime')!.textContent = 'Never';
    }
  } catch (error) {
    console.error('Error loading cache stats:', error);
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

  // Load cache stats
  loadCacheStats();

  // Event listeners
  document.getElementById('autoRefreshInterval')!.addEventListener('input', (e) => {
    const value = (e.target as HTMLInputElement).value;
    document.getElementById('intervalDisplay')!.textContent = `${value}s`;
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

  document.getElementById('refreshStatsBtn')!.addEventListener('click', loadCacheStats);

  document.getElementById('clearCacheBtn')!.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear the entire cache? This will delete all stored images.')) {
      await clearAllImages();
      await loadCacheStats();
      showMessage('Cache cleared successfully', 'success');
    }
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
