// IndexedDB Cache Manager for Cute Wallpapers Extension
export class CacheManager {
    constructor() {
        this.dbName = 'CuteWallpapersCache';
        this.dbVersion = 1;
        this.storeName = 'content';
        this.db = null;
        
        // Cache configuration
        this.CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
        this.FETCH_INTERVAL = 30 * 60 * 1000; // 30 minutes
        this.BATCH_SIZE = 20; // Number of items to fetch per batch
        this.MAX_CACHE_SIZE = 100; // Maximum items in cache
        
        this.isInitialized = false;
        this.initPromise = null;
    }

    // Initialize the database
    async init() {
        if (this.isInitialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                console.log('CacheManager initialized successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    
                    // Create indexes for efficient querying
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('source', 'source', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('searchTerm', 'searchTerm', { unique: false });
                    
                    console.log('Cache database structure created');
                }
            };
        });

        return this.initPromise;
    }

    // Generate unique ID for cache entries
    generateId(source, type, searchTerm, timestamp) {
        return `${source}_${type}_${searchTerm}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Store content in cache
    async storeContent(contentData, searchTerm) {
        await this.init();
        
        const now = Date.now();
        const cacheEntry = {
            id: this.generateId(contentData.source, contentData.type, searchTerm, now),
            ...contentData,
            searchTerm,
            timestamp: now,
            expiresAt: now + this.CACHE_DURATION,
            accessed: now,
            accessCount: 0
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(cacheEntry);

            request.onsuccess = () => {
                console.log('Content cached successfully:', cacheEntry.id);
                resolve(cacheEntry);
            };

            request.onerror = () => {
                console.error('Failed to cache content:', request.error);
                reject(request.error);
            };
        });
    }

    // Get random content from cache
    async getRandomContent(searchTerm = null) {
        await this.init();
        
        const now = Date.now();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const allItems = request.result;
                
                // Filter valid (non-expired) items
                let validItems = allItems.filter(item => item.expiresAt > now);
                
                // Filter by search term if provided
                if (searchTerm) {
                    const filteredByTerm = validItems.filter(item => 
                        item.searchTerm === searchTerm || 
                        item.searchTerm === 'random' ||
                        searchTerm === 'random'
                    );
                    if (filteredByTerm.length > 0) {
                        validItems = filteredByTerm;
                    }
                }

                if (validItems.length === 0) {
                    resolve(null);
                    return;
                }

                // Get random item
                const randomItem = validItems[Math.floor(Math.random() * validItems.length)];
                
                // Update access statistics
                this.updateAccessStats(randomItem.id);
                
                resolve(randomItem);
            };

            request.onerror = () => {
                console.error('Failed to retrieve cached content:', request.error);
                reject(request.error);
            };
        });
    }

    // Update access statistics for cache entry
    async updateAccessStats(id) {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
            const item = getRequest.result;
            if (item) {
                item.accessed = Date.now();
                item.accessCount = (item.accessCount || 0) + 1;
                store.put(item);
            }
        };
    }

    // Check if cache has any content available (for offline scenarios)
    async hasContent() {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.count();

            request.onsuccess = () => {
                resolve(request.result > 0);
            };

            request.onerror = () => {
                console.error('Failed to check cache content:', request.error);
                resolve(false); // Return false on error to be safe
            };
        });
    }

    // Get cache statistics
    async getCacheStats() {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const items = request.result;
                const now = Date.now();
                
                const stats = {
                    total: items.length,
                    valid: items.filter(item => item.expiresAt > now).length,
                    expired: items.filter(item => item.expiresAt <= now).length,
                    bySource: {},
                    byType: {},
                    oldestTimestamp: null,
                    newestTimestamp: null
                };

                items.forEach(item => {
                    // Count by source
                    stats.bySource[item.source] = (stats.bySource[item.source] || 0) + 1;
                    
                    // Count by type
                    stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
                    
                    // Track timestamps
                    if (!stats.oldestTimestamp || item.timestamp < stats.oldestTimestamp) {
                        stats.oldestTimestamp = item.timestamp;
                    }
                    if (!stats.newestTimestamp || item.timestamp > stats.newestTimestamp) {
                        stats.newestTimestamp = item.timestamp;
                    }
                });

                resolve(stats);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Clean up expired content (but only if we have replacements)
    async cleanupExpired() {
        await this.init();
        
        const now = Date.now();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const items = request.result;
                const expired = items.filter(item => item.expiresAt <= now);
                const valid = items.filter(item => item.expiresAt > now);
                
                // Only delete expired items if we have enough valid replacements
                const MIN_VALID_ITEMS = 5;
                if (valid.length < MIN_VALID_ITEMS) {
                    console.log(`Skipping cleanup: only ${valid.length} valid items remaining`);
                    resolve({ deleted: 0, reason: 'insufficient_replacements' });
                    return;
                }

                let deletedCount = 0;
                const deletePromises = expired.map(item => {
                    return new Promise((deleteResolve) => {
                        const deleteRequest = store.delete(item.id);
                        deleteRequest.onsuccess = () => {
                            deletedCount++;
                            deleteResolve();
                        };
                        deleteRequest.onerror = () => {
                            console.error('Failed to delete expired item:', item.id);
                            deleteResolve();
                        };
                    });
                });

                Promise.all(deletePromises).then(() => {
                    console.log(`Cache cleanup completed: ${deletedCount} expired items deleted`);
                    resolve({ deleted: deletedCount, reason: 'expired' });
                });
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Ensure cache size doesn't exceed limits
    async enforceCacheSize() {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const items = request.result;
                
                if (items.length <= this.MAX_CACHE_SIZE) {
                    resolve({ deleted: 0, reason: 'within_limits' });
                    return;
                }

                // Sort by access count and last accessed time (LRU)
                items.sort((a, b) => {
                    if (a.accessCount !== b.accessCount) {
                        return a.accessCount - b.accessCount; // Less accessed first
                    }
                    return a.accessed - b.accessed; // Older first
                });

                const itemsToDelete = items.slice(0, items.length - this.MAX_CACHE_SIZE);
                let deletedCount = 0;

                const deletePromises = itemsToDelete.map(item => {
                    return new Promise((deleteResolve) => {
                        const deleteRequest = store.delete(item.id);
                        deleteRequest.onsuccess = () => {
                            deletedCount++;
                            deleteResolve();
                        };
                        deleteRequest.onerror = () => {
                            console.error('Failed to delete item for size enforcement:', item.id);
                            deleteResolve();
                        };
                    });
                });

                Promise.all(deletePromises).then(() => {
                    console.log(`Cache size enforced: ${deletedCount} least used items deleted`);
                    resolve({ deleted: deletedCount, reason: 'size_limit' });
                });
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Clear all cache
    async clearAll() {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('Cache cleared successfully');
                resolve();
            };

            request.onerror = () => {
                console.error('Failed to clear cache:', request.error);
                reject(request.error);
            };
        });
    }

    // Check if cache needs refresh
    async needsRefresh() {
        const stats = await this.getCacheStats();
        const now = Date.now();
        
        // Need refresh if:
        // 1. No content at all
        // 2. Less than 5 valid items
        // 3. Newest content is older than fetch interval
        return stats.total === 0 || 
               stats.valid < 5 || 
               (stats.newestTimestamp && (now - stats.newestTimestamp) > this.FETCH_INTERVAL);
    }

    // Alias for getCacheStats for API consistency
    async getStatistics() {
        return this.getCacheStats();
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheManager;
}