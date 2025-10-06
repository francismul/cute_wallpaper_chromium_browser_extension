// Background Content Fetcher for Cute Wallpapers Extension
export class ContentFetcher {
    constructor(cacheManager) {
        this.cache = cacheManager;
        this.isRunning = false;
        this.fetchInterval = null;
        this.cleanupInterval = null;
        
        // Configuration
        this.FETCH_INTERVAL = 30 * 60 * 1000; // 30 minutes
        this.CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
        this.BATCH_SIZE = 20;
        this.PEXELS_WEIGHT = 0.7; // 70% Pexels, 30% Unsplash
        this.VIDEO_CHANCE = 0.3; // 30% videos when using Pexels
        
        // Search terms for fetching diverse content
        this.SEARCH_TERMS = [
            'cute', 'adorable', 'kawaii', 'sweet', 'lovely', 'beautiful', 
            'nature', 'animals', 'flowers', 'landscape', 'pets', 'kittens',
            'puppies', 'colorful', 'peaceful', 'serene', 'magical', 'dreamy'
        ];
    }

    // Start background fetching and cleanup
    async start() {
        if (this.isRunning) {
            console.log('Content fetcher already running');
            return;
        }

        this.isRunning = true;
        console.log('Starting background content fetcher...');

        try {
            // Initial fetch if cache needs refresh
            if (await this.cache.needsRefresh()) {
                console.log('Cache needs refresh, starting initial fetch...');
                await this.fetchBatch();
            }

            // Set up periodic fetching
            this.fetchInterval = setInterval(async () => {
                try {
                    console.log('Periodic fetch triggered');
                    await this.fetchBatch();
                } catch (error) {
                    console.error('Periodic fetch failed:', error);
                }
            }, this.FETCH_INTERVAL);

            // Set up periodic cleanup
            this.cleanupInterval = setInterval(async () => {
                try {
                    console.log('Periodic cleanup triggered');
                    await this.performMaintenance();
                } catch (error) {
                    console.error('Periodic cleanup failed:', error);
                }
            }, this.CLEANUP_INTERVAL);

            console.log('Background content fetcher started successfully');
        } catch (error) {
            console.error('Failed to start content fetcher:', error);
            this.isRunning = false;
        }
    }

    // Stop background processes
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        
        if (this.fetchInterval) {
            clearInterval(this.fetchInterval);
            this.fetchInterval = null;
        }
        
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        console.log('Background content fetcher stopped');
    }

    // Fetch a batch of content from APIs
    async fetchBatch() {
        console.log(`Fetching batch of ${this.BATCH_SIZE} items...`);
        
        const pexelsCount = Math.floor(this.BATCH_SIZE * this.PEXELS_WEIGHT);
        const unsplashCount = this.BATCH_SIZE - pexelsCount;
        
        console.log(`Planned: ${pexelsCount} from Pexels, ${unsplashCount} from Unsplash`);

        const fetchPromises = [];

        // Fetch from Pexels
        for (let i = 0; i < pexelsCount; i++) {
            const searchTerm = this.getRandomSearchTerm();
            const useVideo = Math.random() < this.VIDEO_CHANCE;
            
            if (useVideo) {
                fetchPromises.push(this.fetchAndCachePexelsVideo(searchTerm));
            } else {
                fetchPromises.push(this.fetchAndCachePexelsImage(searchTerm));
            }
        }

        // Fetch from Unsplash
        for (let i = 0; i < unsplashCount; i++) {
            const searchTerm = this.getRandomSearchTerm();
            fetchPromises.push(this.fetchAndCacheUnsplashImage(searchTerm));
        }

        // Execute all fetches with some delay to avoid rate limiting
        const results = await this.executeWithDelay(fetchPromises, 200);
        
        const successful = results.filter(r => r.success).length;
        const failed = results.length - successful;
        
        console.log(`Batch fetch completed: ${successful} successful, ${failed} failed`);
        
        return { successful, failed, total: results.length };
    }

    // Execute promises with delay to avoid rate limiting
    async executeWithDelay(promises, delayMs) {
        const results = [];
        
        for (let i = 0; i < promises.length; i++) {
            try {
                const result = await promises[i];
                results.push({ success: true, result });
            } catch (error) {
                console.error(`Fetch ${i + 1} failed:`, error);
                results.push({ success: false, error });
            }
            
            // Add delay between requests (except for the last one)
            if (i < promises.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        
        return results;
    }

    // Fetch and cache Pexels image
    async fetchAndCachePexelsImage(searchTerm) {
        if (!window.pexelsApiKey) {
            throw new Error('Pexels API key not available');
        }

        const url = `${self.CONFIG?.PEXELS_PHOTOS_API || 'https://api.pexels.com/v1/search'}?query=${encodeURIComponent(searchTerm)}&per_page=80&orientation=landscape`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': window.pexelsApiKey }
        });

        if (!response.ok) {
            throw new Error(`Pexels Photos API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.photos || data.photos.length === 0) {
            throw new Error('No photos found from Pexels');
        }

        const photo = data.photos[Math.floor(Math.random() * data.photos.length)];
        
        const contentData = {
            type: 'image',
            url: photo.src.original,
            regularUrl: photo.src.large2x,
            photographer: photo.photographer,
            photographerUrl: photo.photographer_url,
            description: photo.alt || 'Beautiful image from Pexels',
            source: 'pexels'
        };

        await this.cache.storeContent(contentData, searchTerm);
        return contentData;
    }

    // Fetch and cache Pexels video
    async fetchAndCachePexelsVideo(searchTerm) {
        if (!window.pexelsApiKey) {
            throw new Error('Pexels API key not available');
        }

        const url = `${self.CONFIG?.PEXELS_VIDEOS_API || 'https://api.pexels.com/videos/search'}?query=${encodeURIComponent(searchTerm)}&per_page=80&orientation=landscape`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': window.pexelsApiKey }
        });

        if (!response.ok) {
            throw new Error(`Pexels Videos API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.videos || data.videos.length === 0) {
            throw new Error('No videos found from Pexels');
        }

        const video = data.videos[Math.floor(Math.random() * data.videos.length)];
        
        const videoFile = video.video_files.find(file => 
            file.quality === 'hd' || file.quality === 'sd'
        ) || video.video_files[0];

        const contentData = {
            type: 'video',
            url: videoFile.link,
            poster: video.image,
            photographer: video.user.name,
            photographerUrl: video.user.url,
            description: 'Beautiful video from Pexels',
            source: 'pexels',
            duration: video.duration
        };

        await this.cache.storeContent(contentData, searchTerm);
        return contentData;
    }

    // Fetch and cache Unsplash image
    async fetchAndCacheUnsplashImage(searchTerm) {
        if (!window.unsplashApiKey) {
            throw new Error('Unsplash API key not available');
        }

        const url = `${self.CONFIG?.UNSPLASH_API_URL || 'https://api.unsplash.com/photos/random'}?query=${encodeURIComponent(searchTerm)}&orientation=landscape`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Client-ID ${window.unsplashApiKey}` }
        });

        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.urls || !data.urls.full) {
            throw new Error('Invalid Unsplash API response');
        }

        const contentData = {
            type: 'image',
            url: data.urls.full,
            regularUrl: data.urls.regular,
            photographer: data.user?.name || 'Unknown',
            photographerUrl: data.user?.links?.html || '#',
            description: data.description || data.alt_description || 'Beautiful image',
            downloadUrl: data.links?.download_location,
            source: 'unsplash'
        };

        await this.cache.storeContent(contentData, searchTerm);
        return contentData;
    }

    // Get random search term
    getRandomSearchTerm() {
        return this.SEARCH_TERMS[Math.floor(Math.random() * this.SEARCH_TERMS.length)];
    }

    // Perform cache maintenance
    async performMaintenance() {
        console.log('Performing cache maintenance...');
        
        try {
            // Get current stats
            const statsBefore = await this.cache.getCacheStats();
            console.log('Cache stats before maintenance:', statsBefore);
            
            // Clean up expired content
            const cleanupResult = await this.cache.cleanupExpired();
            console.log('Cleanup result:', cleanupResult);
            
            // Enforce cache size limits
            const sizeLimitResult = await this.cache.enforceCacheSize();
            console.log('Size enforcement result:', sizeLimitResult);
            
            // Get updated stats
            const statsAfter = await this.cache.getCacheStats();
            console.log('Cache stats after maintenance:', statsAfter);
            
            // Trigger additional fetch if cache is running low
            if (statsAfter.valid < 10) {
                console.log('Cache running low, triggering additional fetch...');
                await this.fetchBatch();
            }
            
        } catch (error) {
            console.error('Cache maintenance failed:', error);
        }
    }

    // Get fetcher status
    getStatus() {
        return {
            isRunning: this.isRunning,
            hasApiKeys: !!(window.unsplashApiKey || window.pexelsApiKey),
            fetchInterval: this.FETCH_INTERVAL,
            cleanupInterval: this.CLEANUP_INTERVAL,
            batchSize: this.BATCH_SIZE
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentFetcher;
}