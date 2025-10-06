// Background script for Cute Wallpapers extension
// Handles extension lifecycle, context menus, and service worker functionality

// Extension installation and update handling
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Cute Wallpapers extension installed/updated');
    
    switch (details.reason) {
        case 'install':
            handleFirstInstall();
            break;
        case 'update':
            handleUpdate(details.previousVersion);
            break;
        case 'chrome_update':
        case 'shared_module_update':
            // Handle browser or shared module updates if needed
            break;
    }
});

// Handle first installation
async function handleFirstInstall() {
    try {
        // Set default settings
        const defaultSettings = {
            unsplashApiKey: '',
            searchTerms: 'cute, adorable, kawaii, nature, animals, flowers, sweet, lovely, beautiful',
            autoRefresh: {
                enabled: false,
                interval: 30
            },
            firstRun: true
        };

        await chrome.storage.sync.set(defaultSettings);
        
        // Open options page on first install
        chrome.tabs.create({
            url: chrome.runtime.getURL('options.html')
        });
        
        console.log('First install setup completed');
    } catch (error) {
        console.error('Error during first install:', error);
    }
}

// Handle extension updates
async function handleUpdate(previousVersion) {
    try {
        console.log(`Updated from version ${previousVersion}`);
        
        // Perform any necessary migration or cleanup
        await migrateSettings(previousVersion);
        
        // Show update notification if needed
        if (shouldShowUpdateNotification(previousVersion)) {
            showUpdateNotification();
        }
    } catch (error) {
        console.error('Error during update:', error);
    }
}

// Migrate settings from previous versions
async function migrateSettings(previousVersion) {
    try {
        const settings = await chrome.storage.sync.get();
        let needsUpdate = false;

        // Example migration for version 1.0.0 to 1.1.0
        if (compareVersions(previousVersion, '1.1.0') < 0) {
            // Add new settings or update existing ones
            if (!settings.autoRefresh) {
                settings.autoRefresh = {
                    enabled: false,
                    interval: 30
                };
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            await chrome.storage.sync.set(settings);
            console.log('Settings migrated successfully');
        }
    } catch (error) {
        console.error('Error migrating settings:', error);
    }
}

// Context menu setup
chrome.runtime.onStartup.addListener(setupContextMenus);
chrome.runtime.onInstalled.addListener(setupContextMenus);

function setupContextMenus() {
    if (!chrome.contextMenus) {
        console.log('Context menus API not available');
        return;
    }
    
    try {
        // Remove existing context menus
        chrome.contextMenus.removeAll(() => {
            if (chrome.runtime.lastError) {
                console.log('Context menus cleared or not available');
                return;
            }
            
            // Create new context menus
            chrome.contextMenus.create({
                id: 'refresh-wallpaper',
                title: 'Refresh Wallpaper',
                contexts: ['page'],
                documentUrlPatterns: [chrome.runtime.getURL('newtab.html')]
            });

            chrome.contextMenus.create({
                id: 'open-settings',
                title: 'Extension Settings',
                contexts: ['action']
            });

            chrome.contextMenus.create({
                id: 'separator-1',
                type: 'separator',
                contexts: ['action']
            });

            chrome.contextMenus.create({
                id: 'about',
                title: 'About Cute Wallpapers',
                contexts: ['action']
            });
        });
    } catch (error) {
        console.error('Error setting up context menus:', error);
    }
}

// Context menu click handler
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        switch (info.menuItemId) {
            case 'refresh-wallpaper':
                refreshWallpaper(tab);
                break;
            case 'open-settings':
                chrome.runtime.openOptionsPage();
                break;
            case 'about':
                showAboutPage();
                break;
        }
    });
}

// Refresh wallpaper on current new tab
function refreshWallpaper(tab) {
    if (tab && tab.url && tab.url.includes(chrome.runtime.getURL('newtab.html'))) {
        chrome.tabs.sendMessage(tab.id, { action: 'refresh' }).catch(() => {
            // If sending message fails, reload the tab
            chrome.tabs.reload(tab.id);
        });
    }
}

// Show about page
function showAboutPage() {
    chrome.tabs.create({
        url: 'https://github.com/your-username/cute-wallpapers-extension' // Update with actual URL
    });
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'openOptions':
            chrome.runtime.openOptionsPage();
            sendResponse({ success: true });
            break;
        
        case 'downloadImage':
            handleImageDownload(request.data, sendResponse);
            return true; // Keep message channel open for async response
            
        case 'trackUsage':
            trackUsage(request.data);
            sendResponse({ success: true });
            break;
            
        default:
            sendResponse({ error: 'Unknown action' });
    }
});

// Handle image download (for saving wallpapers)
async function handleImageDownload(data, sendResponse) {
    try {
        if (!chrome.downloads) {
            sendResponse({ error: 'Downloads API not available' });
            return;
        }
        
        const { url, filename } = data;
        
        await chrome.downloads.download({
            url: url,
            filename: `cute-wallpapers/${filename}`,
            saveAs: true
        });
        
        sendResponse({ success: true });
    } catch (error) {
        console.error('Error downloading image:', error);
        sendResponse({ error: error.message });
    }
}

// Track usage statistics (privacy-friendly)
async function trackUsage(data) {
    try {
        // Only track basic usage statistics, no personal data
        const stats = await chrome.storage.local.get(['usageStats']) || { usageStats: {} };
        
        if (!stats.usageStats) {
            stats.usageStats = {};
        }
        
        const today = new Date().toDateString();
        if (!stats.usageStats[today]) {
            stats.usageStats[today] = {
                newTabs: 0,
                wallpaperChanges: 0,
                searches: 0
            };
        }
        
        if (data.type && stats.usageStats[today][data.type] !== undefined) {
            stats.usageStats[today][data.type]++;
        }
        
        // Keep only last 30 days of stats
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        Object.keys(stats.usageStats).forEach(date => {
            if (new Date(date) < thirtyDaysAgo) {
                delete stats.usageStats[date];
            }
        });
        
        await chrome.storage.local.set({ usageStats: stats.usageStats });
    } catch (error) {
        console.error('Error tracking usage:', error);
    }
}

// Periodic cleanup and maintenance
chrome.alarms.create('dailyMaintenance', { 
    delayInMinutes: 1, 
    periodInMinutes: 24 * 60 // Daily
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'dailyMaintenance') {
        performDailyMaintenance();
    }
});

// Daily maintenance tasks
async function performDailyMaintenance() {
    try {
        // Clear old cached data
        await clearOldCache();
        
        // Clean up temporary files
        await cleanupTempFiles();
        
        console.log('Daily maintenance completed');
    } catch (error) {
        console.error('Error during daily maintenance:', error);
    }
}

// Clear old cached data
async function clearOldCache() {
    try {
        const data = await chrome.storage.local.get();
        const now = Date.now();
        const cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        Object.keys(data).forEach(key => {
            if (key.startsWith('cache_') && data[key].timestamp) {
                if (now - data[key].timestamp > cacheExpiry) {
                    chrome.storage.local.remove(key);
                }
            }
        });
    } catch (error) {
        console.error('Error clearing old cache:', error);
    }
}

// Cleanup temporary files
async function cleanupTempFiles() {
    // Implement cleanup logic for any temporary files
    // This is a placeholder for future functionality
}

// Utility functions
function compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
        const v1part = v1parts[i] || 0;
        const v2part = v2parts[i] || 0;
        
        if (v1part < v2part) return -1;
        if (v1part > v2part) return 1;
    }
    
    return 0;
}

function shouldShowUpdateNotification(previousVersion) {
    // Show notification for major updates
    const currentVersion = chrome.runtime.getManifest().version;
    const [prevMajor] = previousVersion.split('.');
    const [currMajor] = currentVersion.split('.');
    
    return parseInt(currMajor) > parseInt(prevMajor);
}

function showUpdateNotification() {
    // Create a notification about the update
    if (chrome.notifications) {
        try {
            chrome.notifications.create('update-notification', {
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Cute Wallpapers Updated!',
                message: 'New features and improvements are now available. Click to see what\'s new.'
            });
            
            if (chrome.notifications.onClicked) {
                chrome.notifications.onClicked.addListener((notificationId) => {
                    if (notificationId === 'update-notification') {
                        chrome.tabs.create({
                            url: chrome.runtime.getURL('options.html')
                        });
                        chrome.notifications.clear(notificationId);
                    }
                });
            }
        } catch (error) {
            console.log('Notifications not available:', error);
        }
    }
}

// Error handling and logging
self.addEventListener('error', (event) => {
    console.error('Background script error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection in background script:', event.reason);
});

console.log('Cute Wallpapers background script loaded');