// Settings page functionality for Cute Wallpapers Extension\n// Import cache management classes using ES6 modules\nimport { CacheManager } from './cache-manager.js';\nimport { ContentFetcher } from './content-fetcher.js';\n\n// Default settings
const DEFAULT_SETTINGS = {
    unsplashApiKey: '',
    pexelsApiKey: '',
    searchTerms: 'cute,adorable,kawaii,sweet,lovely',
    autoRefresh: {
        enabled: false,
        interval: 30
    },
    cache: {
        enabled: true,
        duration: 15, // minutes
        fetchInterval: 30, // minutes
        maxSize: 100
    }
};

// DOM elements
const elements = {
    // API Key elements
    apiKey: null,
    pexelsApiKey: null,
    
    // Settings elements
    searchTerms: null,
    autoRefreshEnabled: null,
    refreshInterval: null,
    refreshIntervalGroup: null,
    
    // Cache elements
    cacheEnabled: null,
    cacheDuration: null,
    fetchInterval: null,
    maxCacheSize: null,
    cacheStats: null,
    
    // Button elements
    saveBtn: null,
    resetBtn: null,
    refreshCacheStats: null,
    clearCache: null,
    preloadCache: null,
    
    // Status elements
    statusMessage: null,
    demoMode: null
};

// Cache system
let cacheManager = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await initializeElements();
    await initializeCacheManager();
    await loadSettings();
    setupEventListeners();
    await refreshCacheStats();
});

// Initialize DOM elements
async function initializeElements() {
    // API Key elements
    elements.apiKey = document.getElementById('apiKey');
    elements.pexelsApiKey = document.getElementById('pexelsApiKey');
    
    // Settings elements
    elements.searchTerms = document.getElementById('searchTerms');
    elements.autoRefreshEnabled = document.getElementById('autoRefreshEnabled');
    elements.refreshInterval = document.getElementById('refreshInterval');
    elements.refreshIntervalGroup = document.getElementById('refreshIntervalGroup');
    
    // Cache elements
    elements.cacheEnabled = document.getElementById('cacheEnabled');
    elements.cacheDuration = document.getElementById('cacheDuration');
    elements.fetchInterval = document.getElementById('fetchInterval');
    elements.maxCacheSize = document.getElementById('maxCacheSize');
    elements.cacheStats = document.getElementById('cacheStats');
    
    // Button elements
    elements.saveBtn = document.getElementById('saveBtn');
    elements.resetBtn = document.getElementById('resetBtn');
    elements.refreshCacheStats = document.getElementById('refreshCacheStats');
    elements.clearCache = document.getElementById('clearCache');
    elements.preloadCache = document.getElementById('preloadCache');
    
    // Status elements
    elements.statusMessage = document.getElementById('statusMessage');
    elements.demoMode = document.getElementById('demoMode');
}

// Initialize cache manager
async function initializeCacheManager() {
    try {
        cacheManager = new CacheManager();
        await cacheManager.init();
        console.log('Cache manager initialized in options');
    } catch (error) {
        console.error('Failed to initialize cache manager:', error);
    }
}
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    setupEventListeners();
    updateDemoModeDisplay();
});

// Load settings from storage
async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
        
        // Populate form fields
        elements.apiKey.value = result.unsplashApiKey || '';
        elements.pexelsApiKey.value = result.pexelsApiKey || '';
        elements.searchTerms.value = result.searchTerms || DEFAULT_SETTINGS.searchTerms;
        elements.autoRefreshEnabled.checked = result.autoRefresh?.enabled || false;
        elements.refreshInterval.value = result.autoRefresh?.interval || 30;
        
        // Update UI based on auto-refresh setting
        updateAutoRefreshVisibility();
        
    } catch (error) {
        console.error('Error loading settings:', error);
        showStatus('Error loading settings', 'error');
    }
}

// Save settings to storage
async function saveSettings() {
    try {
        const settings = {
            unsplashApiKey: elements.apiKey.value.trim(),
            pexelsApiKey: elements.pexelsApiKey.value.trim(),
            searchTerms: elements.searchTerms.value.trim() || DEFAULT_SETTINGS.searchTerms,
            autoRefresh: {
                enabled: elements.autoRefreshEnabled.checked,
                interval: parseInt(elements.refreshInterval.value)
            }
        };

        // Validate API key formats (basic check)
        if (settings.unsplashApiKey && !isValidUnsplashApiKey(settings.unsplashApiKey)) {
            showStatus('Invalid Unsplash API key format. Please check your Access Key.', 'error');
            return;
        }
        
        if (settings.pexelsApiKey && !isValidPexelsApiKey(settings.pexelsApiKey)) {
            showStatus('Invalid Pexels API key format. Please check your API Key.', 'error');
            return;
        }

        await chrome.storage.sync.set(settings);
        
        showStatus('Settings saved successfully!', 'success');
        updateDemoModeDisplay();
        
        // Test API keys if provided
        if (settings.pexelsApiKey) {
            await testPexelsApiKey(settings.pexelsApiKey);
        } else if (settings.unsplashApiKey) {
            await testUnsplashApiKey(settings.unsplashApiKey);
        }
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showStatus('Error saving settings. Please try again.', 'error');
    }
}

// Reset settings to defaults
async function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
        try {
            await chrome.storage.sync.clear();
            
            // Reset form fields
            elements.apiKey.value = '';
            elements.pexelsApiKey.value = '';
            elements.searchTerms.value = DEFAULT_SETTINGS.searchTerms;
            elements.autoRefreshEnabled.checked = false;
            elements.refreshInterval.value = 30;
            
            updateAutoRefreshVisibility();
            updateDemoModeDisplay();
            
            showStatus('Settings reset to defaults', 'success');
            
        } catch (error) {
            console.error('Error resetting settings:', error);
            showStatus('Error resetting settings', 'error');
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    elements.saveBtn.addEventListener('click', saveSettings);
    elements.resetBtn.addEventListener('click', resetSettings);
    
    elements.autoRefreshEnabled.addEventListener('change', updateAutoRefreshVisibility);
    
    // Auto-save on API key change
    elements.apiKey.addEventListener('input', debounce(updateDemoModeDisplay, 500));
    elements.pexelsApiKey.addEventListener('input', debounce(updateDemoModeDisplay, 500));
    
    // Form validation
    elements.apiKey.addEventListener('blur', validateApiKeys);
    elements.pexelsApiKey.addEventListener('blur', validateApiKeys);
    
    // Test buttons for API keys
    if (elements.testUnsplashButton) {
        elements.testUnsplashButton.addEventListener('click', function() {
            const apiKey = elements.apiKey.value.trim();
            if (apiKey) {
                testUnsplashApiKey(apiKey);
            } else {
                showStatus('Please enter an Unsplash API key first.', 'error');
            }
        });
    }
    
    if (elements.testPexelsButton) {
        elements.testPexelsButton.addEventListener('click', function() {
            const apiKey = elements.pexelsApiKey.value.trim();
            if (apiKey) {
                testPexelsApiKey(apiKey);
            } else {
                showStatus('Please enter a Pexels API key first.', 'error');
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveSettings();
        }
    });
}

// Update auto-refresh visibility
function updateAutoRefreshVisibility() {
    const isEnabled = elements.autoRefreshEnabled.checked;
    elements.refreshIntervalGroup.style.display = isEnabled ? 'block' : 'none';
}

// Update demo mode display
function updateDemoModeDisplay() {
    const hasApiKey = elements.apiKey.value.trim().length > 0 || elements.pexelsApiKey.value.trim().length > 0;
    elements.demoMode.style.display = hasApiKey ? 'none' : 'block';
}

// Validate Unsplash API key format
function isValidUnsplashApiKey(apiKey) {
    // Basic validation for Unsplash API key format
    // Unsplash keys are typically 43 characters long and contain alphanumeric characters and hyphens
    return /^[A-Za-z0-9_-]{20,50}$/.test(apiKey);
}

// Validate Pexels API key format
function isValidPexelsApiKey(apiKey) {
    // Pexels API keys are typically longer strings with mixed characters
    return /^[A-Za-z0-9]{20,}$/.test(apiKey);
}

// Validate API key on blur
function validateApiKeys() {
    const unsplashKey = elements.apiKey.value.trim();
    const pexelsKey = elements.pexelsApiKey.value.trim();
    
    if (unsplashKey && !isValidUnsplashApiKey(unsplashKey)) {
        showStatus('Invalid Unsplash API key format. Please check your Access Key.', 'error');
    }
    
    if (pexelsKey && !isValidPexelsApiKey(pexelsKey)) {
        showStatus('Invalid Pexels API key format. Please check your API Key.', 'error');
    }
}

// Test Unsplash API key by making a request
async function testUnsplashApiKey(apiKey) {
    try {
        const response = await fetch('https://api.unsplash.com/photos/random?count=1', {
            headers: {
                'Authorization': `Client-ID ${apiKey}`
            }
        });

        if (response.ok) {
            showStatus('Unsplash API key is valid and working!', 'success');
        } else if (response.status === 401) {
            showStatus('Unsplash API key is invalid. Please check your Access Key.', 'error');
        } else {
            showStatus('Unsplash API key validation failed. Please try again later.', 'error');
        }
    } catch (error) {
        console.error('Error testing Unsplash API key:', error);
    }
}

// Test Pexels API key by making a request
async function testPexelsApiKey(apiKey) {
    try {
        const response = await fetch('https://api.pexels.com/v1/search?query=nature&per_page=1', {
            headers: {
                'Authorization': apiKey
            }
        });

        if (response.ok) {
            showStatus('Pexels API key is valid and working!', 'success');
        } else if (response.status === 401) {
            showStatus('Pexels API key is invalid. Please check your API Key.', 'error');
        } else {
            showStatus('Pexels API key validation failed. Please try again later.', 'error');
        }
    } catch (error) {
        console.error('Error testing Pexels API key:', error);
    }
}

// Show status message
function showStatus(message, type) {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status-message status-${type}`;
    elements.statusMessage.style.display = 'block';
    
    // Hide status message after 5 seconds
    setTimeout(() => {
        elements.statusMessage.style.display = 'none';
    }, 5000);
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export settings for backup (future feature)
function exportSettings() {
    chrome.storage.sync.get(null, (settings) => {
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'cute-wallpapers-settings.json';
        link.click();
    });
}

// Import settings from backup (future feature)
function importSettings(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const settings = JSON.parse(e.target.result);
            await chrome.storage.sync.set(settings);
            await loadSettings();
            showStatus('Settings imported successfully!', 'success');
        } catch (error) {
            showStatus('Error importing settings. Invalid file format.', 'error');
        }
    };
    reader.readAsText(file);
}

// Handle extension updates
if (chrome.runtime && chrome.runtime.onInstalled) {
    chrome.runtime.onInstalled.addListener((details) => {
        if (details.reason === 'install') {
            // First time installation
            showStatus('Welcome! Configure your Unsplash API key to get started.', 'success');
        } else if (details.reason === 'update') {
            // Extension updated
            showStatus('Extension updated! Review your settings below.', 'success');
        }
    });
}
// Cache Management Functions
async function refreshCacheStats() {
    if (!cacheManager) {
        console.warn('Cache manager not available');
        return;
    }
    
    try {
        const stats = await cacheManager.getCacheStats();
        
        // Update stat displays
        document.getElementById('statTotal').textContent = stats.total;
        document.getElementById('statValid').textContent = stats.valid;
        document.getElementById('statExpired').textContent = stats.expired;
        document.getElementById('statPexels').textContent = stats.bySource?.pexels || 0;
        document.getElementById('statUnsplash').textContent = stats.bySource?.unsplash || 0;
        document.getElementById('statVideos').textContent = stats.byType?.video || 0;
        
        // Show cache stats section
        elements.cacheStats.style.display = 'block';
        
        console.log('Cache stats refreshed:', stats);
    } catch (error) {
        console.error('Failed to refresh cache stats:', error);
        showStatus('Failed to load cache statistics', 'error');
    }
}

async function clearCache() {
    if (!cacheManager) {
        showStatus('Cache manager not available', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to clear all cached content?')) {
        return;
    }
    
    try {
        await cacheManager.clearAll();
        await refreshCacheStats();
        showStatus('Cache cleared successfully!', 'success');
    } catch (error) {
        console.error('Failed to clear cache:', error);
        showStatus('Failed to clear cache', 'error');
    }
}

async function preloadCache() {
    if (!cacheManager) {
        showStatus('Cache manager not available', 'error');
        return;
    }
    
    const unsplashKey = elements.apiKey.value.trim();
    const pexelsKey = elements.pexelsApiKey.value.trim();
    
    if (!unsplashKey && !pexelsKey) {
        showStatus('Please configure at least one API key before preloading cache', 'error');
        return;
    }
    
    try {
        showStatus('Preloading cache... This may take a moment.', 'info');
        
        const fetcher = new ContentFetcher(cacheManager);
        
        window.unsplashApiKey = unsplashKey;
        window.pexelsApiKey = pexelsKey;
        window.CONFIG = {
            PEXELS_PHOTOS_API: 'https://api.pexels.com/v1/search',
            PEXELS_VIDEOS_API: 'https://api.pexels.com/videos/search',
            UNSPLASH_API_URL: 'https://api.unsplash.com/photos/random'
        };
        
        const result = await fetcher.fetchBatch();
        
        await refreshCacheStats();
        showStatus(`Cache preloaded successfully! ${result.successful} items added.`, 'success');
        
    } catch (error) {
        console.error('Failed to preload cache:', error);
        showStatus('Failed to preload cache', 'error');
    }
}

// Update setupEventListeners to include cache controls
const originalSetupEventListeners = setupEventListeners;
setupEventListeners = function() {
    originalSetupEventListeners.call(this);
    
    // Cache management event listeners
    if (elements.refreshCacheStats) {
        elements.refreshCacheStats.addEventListener('click', refreshCacheStats);
    }
    
    if (elements.clearCache) {
        elements.clearCache.addEventListener('click', clearCache);
    }
    
    if (elements.preloadCache) {
        elements.preloadCache.addEventListener('click', preloadCache);
    }
    
    if (elements.cacheEnabled) {
        elements.cacheEnabled.addEventListener('change', () => {
            const isEnabled = elements.cacheEnabled.checked;
            elements.cacheDuration.disabled = !isEnabled;
            elements.fetchInterval.disabled = !isEnabled;
            elements.maxCacheSize.disabled = !isEnabled;
        });
    }
};
