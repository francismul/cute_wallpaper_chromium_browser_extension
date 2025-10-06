// Configuration and API settings
// Import cache management classes using ES6 modules
import { CacheManager } from './cache-manager.js';
import { ContentFetcher } from './content-fetcher.js';

const CONFIG = {
    UNSPLASH_API_URL: 'https://api.unsplash.com/photos/random',
    PEXELS_PHOTOS_API: 'https://api.pexels.com/v1/search',
    PEXELS_VIDEOS_API: 'https://api.pexels.com/videos/search',
    QUOTES_API_URL: 'https://type.fit/api/quotes',
    DEFAULT_SEARCH_TERMS: ['cute', 'adorable', 'kawaii', 'sweet', 'lovely', 'beautiful', 'nature', 'animals', 'flowers'],
    CACHE_DURATION: 30 * 60 * 1000, // 30 minutes
    // Pexels gets 70% chance, Unsplash gets 30%
    PEXELS_WEIGHT: 0.7,
    // Video chance within Pexels content (30% videos, 70% images)
    VIDEO_CHANCE: 0.3,
    FALLBACK_QUOTES: [
        { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { content: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
        { content: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { content: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
        { content: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
        { content: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { content: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
        { content: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
        { content: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
        { content: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
        { content: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", author: "Albert Einstein" },
        { content: "Be who you are and say what you feel, because those who mind don't matter and those who matter don't mind.", author: "Bernard M. Baruch" },
        { content: "A room without books is like a body without a soul.", author: "Marcus Tullius Cicero" },
        { content: "You only live once, but if you do it right, once is enough.", author: "Mae West" },
        { content: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
        { content: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost" },
        { content: "If you tell the truth, you don't have to remember anything.", author: "Mark Twain" },
        { content: "A friend is someone who knows all about you and still loves you.", author: "Elbert Hubbard" },
        { content: "To live is the rarest thing in the world. Most people just exist.", author: "Oscar Wilde" },
        { content: "Always forgive your enemies; nothing annoys them so much.", author: "Oscar Wilde" }
    ]
};

// Clock functionality
let clockInterval = null;

function updateClock() {
    try {
        const now = new Date();
        
        // Format time with seconds (HH:MM:SS)
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // Format date (Day, Month Date, Year)
        const dateString = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Update DOM elements if they exist
        if (elements.timeDisplay) {
            elements.timeDisplay.textContent = timeString;
        }
        if (elements.dateDisplay) {
            elements.dateDisplay.textContent = dateString;
        }
    } catch (error) {
        console.error('Error updating clock:', error);
    }
}

function initializeClock() {
    // Update immediately
    updateClock();
    
    // Update every second
    clockInterval = setInterval(updateClock, 1000);
    
    console.log('Clock initialized and running');
}

function stopClock() {
    if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
        console.log('Clock stopped');
    }
}

// DOM elements
const elements = {
    loading: document.getElementById('loading'),
    content: document.getElementById('content'),
    error: document.getElementById('error'),
    container: document.querySelector('.container'),
    quote: document.getElementById('quote'),
    author: document.getElementById('author'),
    imageCredit: document.getElementById('imageCredit'),
    refreshBtn: document.getElementById('refreshBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    // searchInput: document.getElementById('searchInput'),
    retryBtn: document.getElementById('retryBtn'),
    errorMessage: document.getElementById('errorMessage'),
    timeDisplay: document.getElementById('timeDisplay'),
    dateDisplay: document.getElementById('dateDisplay')
};

// State management
let currentContentData = null;
let unsplashApiKey = null;
let pexelsApiKey = null;

// Cache system
let cacheManager = null;
let contentFetcher = null;
let cacheEnabled = true;

// Initialize extension
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadSettings();
        await initializeCacheSystem();
        await loadContent();
        setupEventListeners();
        initializeClock(); // Initialize real-time clock
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize extension');
    }
});

// Initialize cache system
async function initializeCacheSystem() {
    try {
        console.log('Initializing cache system...');
        
        // Create cache manager
        cacheManager = new CacheManager();
        await cacheManager.init();
        
        // Create content fetcher
        contentFetcher = new ContentFetcher(cacheManager);
        
        // Start background fetching if API keys are available
        if (unsplashApiKey || pexelsApiKey) {
            // Make API keys available globally for content fetcher
            window.unsplashApiKey = unsplashApiKey;
            window.pexelsApiKey = pexelsApiKey;
            window.CONFIG = CONFIG;
            
            await contentFetcher.start();
            console.log('Cache system initialized and background fetching started');
        } else {
            console.log('Cache system initialized but no API keys available');
        }
        
        // Log cache status
        const stats = await cacheManager.getCacheStats();
        console.log('Initial cache stats:', stats);
        
    } catch (error) {
        console.error('Failed to initialize cache system:', error);
        cacheEnabled = false;
    }
}

// Load user settings from storage
async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get(['unsplashApiKey', 'pexelsApiKey', 'searchTerms', 'autoRefresh', 'contentPreference']);
        unsplashApiKey = result.unsplashApiKey;
        pexelsApiKey = result.pexelsApiKey;
        
        console.log('Settings loaded:');
        console.log('- Unsplash API Key:', unsplashApiKey ? 'Found' : 'Not found');
        console.log('- Pexels API Key:', pexelsApiKey ? 'Found' : 'Not found');
        
        if (!unsplashApiKey && !pexelsApiKey) {
            console.warn('No API keys found. Extension will use demo mode.');
            console.log('Please configure your API keys in the extension options.');
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Load wallpaper and quote
async function loadContent(searchTerm = null) {
    showLoading();
    
    try {
        // Load content and quote in parallel
        const [contentResult, quoteResult] = await Promise.allSettled([
            loadContentWithCache(searchTerm),
            loadQuote()
        ]);

        if (contentResult.status === 'fulfilled') {
            await setBackgroundContent(contentResult.value);
        } else {
            console.error('Failed to load content:', contentResult.reason);
            await setFallbackBackground();
        }

        if (quoteResult.status === 'fulfilled') {
            setQuote(quoteResult.value);
        } else {
            console.error('Failed to load quote:', quoteResult.reason);
            setFallbackQuote();
        }

        showContent();
    } catch (error) {
        console.error('Error loading content:', error);
        showError('Failed to load content');
    }
}

// Load content with cache prioritization
async function loadContentWithCache(searchTerm = null) {
    // Try to get content from cache first
    if (cacheEnabled && cacheManager) {
        try {
            console.log('Attempting to load content from cache...');
            const cachedContent = await cacheManager.getRandomContent(searchTerm);
            
            if (cachedContent) {
                console.log('Content loaded from cache:', cachedContent.id);
                console.log('Cache hit - no API call needed!');
                return cachedContent;
            } else {
                console.log('No suitable cached content found');
            }
        } catch (error) {
            console.error('Cache retrieval failed:', error);
        }
    }
    
    // Fall back to API if cache miss or disabled
    console.log('Loading content from API (cache miss or disabled)');
    try {
        const apiContent = await loadContentFromAPI(searchTerm);
        
        // Cache the API result if cache is enabled
        if (cacheEnabled && cacheManager && apiContent) {
            try {
                await cacheManager.storeContent(apiContent, searchTerm || 'random');
                console.log('API content cached for future use');
            } catch (cacheError) {
                console.error('Failed to cache API content:', cacheError);
            }
        }
        
        return apiContent;
    } catch (apiError) {
        console.error('API loading failed:', apiError);
        
        // Last resort: try any cached content even if expired
        if (cacheEnabled && cacheManager) {
            try {
                console.log('Attempting to load any cached content as last resort...');
                const anyContent = await cacheManager.getRandomContent();
                if (anyContent) {
                    console.log('Using potentially expired cached content as fallback');
                    return anyContent;
                }
            } catch (error) {
                console.error('Emergency cache retrieval failed:', error);
            }
        }
        
        throw apiError;
    }
}

// Load wallpaper from Unsplash
async function loadWallpaper(searchTerm = null) {
    if (!unsplashApiKey) {
        console.log('No Unsplash API key found, using demo mode');
        // Use demo/fallback images when no API key is available
        return getFallbackImage();
    }

    try {
        const term = searchTerm || getRandomSearchTerm();
        const url = `${CONFIG.UNSPLASH_API_URL}?query=${encodeURIComponent(term)}&orientation=landscape`;
        
        console.log('Fetching from Unsplash:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Client-ID ${unsplashApiKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        
        // Check if we got a valid response with required properties
        if (!data || !data.urls || !data.urls.full) {
            console.warn('Invalid Unsplash API response:', data);
            throw new Error('Invalid API response format');
        }
        
        console.log('Successfully loaded wallpaper from Unsplash');
        
        return {
            url: data.urls.full,
            regularUrl: data.urls.regular,
            photographer: data.user?.name || 'Unknown',
            photographerUrl: data.user?.links?.html || '#',
            description: data.description || data.alt_description || 'Beautiful image',
            downloadUrl: data.links?.download_location
        };
    } catch (error) {
        console.error('Error fetching from Unsplash:', error);
        console.log('Falling back to demo images');
        return getFallbackImage();
    }
}

// Load content from APIs with weighted selection
async function loadContentFromAPI(searchTerm = null) {
    // Determine which API to use based on availability and weights
    const usePexels = pexelsApiKey && Math.random() < CONFIG.PEXELS_WEIGHT;
    
    if (usePexels) {
        console.log('Using Pexels API (70% weight)');
        try {
            const content = await loadFromPexels(searchTerm);
            content.source = 'pexels';
            return content;
        } catch (error) {
            console.error('Pexels API failed, falling back to Unsplash:', error);
            // Fall back to Unsplash
        }
    }
    
    // Use Unsplash (either by choice or as fallback)
    console.log('Using Unsplash API');
    try {
        const content = await loadWallpaper(searchTerm);
        content.source = 'unsplash';
        content.type = 'image'; // Unsplash only provides images
        return content;
    } catch (error) {
        console.error('Unsplash API also failed:', error);
        throw error;
    }
}

// Get random search term
function getRandomSearchTerm() {
    return CONFIG.DEFAULT_SEARCH_TERMS[Math.floor(Math.random() * CONFIG.DEFAULT_SEARCH_TERMS.length)];
}

// Get fallback image when API is not available
function getFallbackImage() {
    const fallbackImages = [
        {
            url: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
            photographer: 'Eric Han',
            photographerUrl: 'https://unsplash.com/@madeyes',
            description: 'Cute cat portrait'
        },
        {
            url: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
            photographer: 'Kari Shea',
            photographerUrl: 'https://unsplash.com/@karishea',
            description: 'Beautiful flower field'
        },
        {
            url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
            photographer: 'Kalen Emsley',
            photographerUrl: 'https://unsplash.com/@kalenemsley',
            description: 'Serene mountain landscape'
        }
    ];
    
    return fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
}

// Load content from Pexels API
async function loadFromPexels() {
    if (!pexelsApiKey) {
        console.log('No Pexels API key available, using fallback');
        return getFallbackImage();
    }

    try {
        const searchTerm = getRandomSearchTerm();
        
        // Decide between video and image based on VIDEO_CHANCE
        const useVideo = Math.random() < CONFIG.VIDEO_CHANCE;
        
        if (useVideo) {
            return await loadPexelsVideo(searchTerm);
        } else {
            return await loadPexelsImage(searchTerm);
        }
    } catch (error) {
        console.error('Error loading from Pexels:', error);
        return getFallbackImage();
    }
}

// Load image from Pexels
async function loadPexelsImage(searchTerm) {
    try {
        const url = `${CONFIG.PEXELS_PHOTOS_API}?query=${encodeURIComponent(searchTerm)}&per_page=80&orientation=landscape`;
        console.log('Fetching from Pexels Photos API:', url);
        console.log('Using API key:', pexelsApiKey ? 'Present' : 'Missing');
        
        const response = await fetch(url, {
            headers: {
                'Authorization': pexelsApiKey
            }
        });

        console.log('Pexels API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Pexels API error response:', errorText);
            throw new Error(`Pexels API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.photos || data.photos.length === 0) {
            throw new Error('No photos found from Pexels');
        }

        const photo = data.photos[Math.floor(Math.random() * data.photos.length)];
        
        console.log('Successfully loaded image from Pexels');
        
        return {
            url: photo.src.original,
            regularUrl: photo.src.large2x,
            photographer: photo.photographer,
            photographerUrl: photo.photographer_url,
            description: photo.alt || 'Beautiful image from Pexels',
            type: 'image'
        };
    } catch (error) {
        console.error('Error fetching image from Pexels:', error);
        throw error;
    }
}

// Load video from Pexels
async function loadPexelsVideo(searchTerm) {
    try {
        const response = await fetch(`${CONFIG.PEXELS_VIDEOS_API}?query=${encodeURIComponent(searchTerm)}&per_page=80&orientation=landscape`, {
            headers: {
                'Authorization': pexelsApiKey
            }
        });

        if (!response.ok) {
            throw new Error(`Pexels Videos API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.videos || data.videos.length === 0) {
            throw new Error('No videos found from Pexels');
        }

        const video = data.videos[Math.floor(Math.random() * data.videos.length)];
        
        // Find the best quality video file
        const videoFile = video.video_files.find(file => 
            file.quality === 'hd' || file.quality === 'sd'
        ) || video.video_files[0];
        
        console.log('Successfully loaded video from Pexels');
        
        return {
            url: videoFile.link,
            photographer: video.user.name,
            photographerUrl: video.user.url,
            description: 'Beautiful video from Pexels',
            type: 'video',
            width: video.width,
            height: video.height
        };
    } catch (error) {
        console.error('Error fetching video from Pexels:', error);
        throw error;
    }
}

// Load inspirational quote
async function loadQuote() {
    // For now, let's use local quotes for reliability
    // You can enable API quotes later when you find a reliable API
    console.log('Using local quotes for maximum reliability');
    return getFallbackQuote();
    
    /* 
    // Uncomment this section if you want to try the type.fit API
    try {
        const response = await fetch(CONFIG.QUOTES_API_URL, {
            signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
            throw new Error(`Quotes API error: ${response.status}`);
        }

        const quotes = await response.json();
        if (quotes && Array.isArray(quotes) && quotes.length > 0) {
            const validQuotes = quotes.filter(quote => 
                quote.text && 
                quote.text.length >= 30 && 
                quote.text.length <= 200 &&
                quote.author &&
                quote.author !== 'null' &&
                quote.author.trim() !== ''
            );
            
            if (validQuotes.length > 0) {
                const randomQuote = validQuotes[Math.floor(Math.random() * validQuotes.length)];
                return {
                    content: randomQuote.text.trim(),
                    author: randomQuote.author.replace(', type.fit', '').trim()
                };
            }
        }
        throw new Error('No valid quotes found in response');
    } catch (error) {
        console.log('Quotes API failed, using local quotes:', error.message);
        return getFallbackQuote();
    }
    */
}

// Get fallback quote when API fails
function getFallbackQuote() {
    return CONFIG.FALLBACK_QUOTES[Math.floor(Math.random() * CONFIG.FALLBACK_QUOTES.length)];
}

// Set background content (image or video)
async function setBackgroundContent(contentData) {
    currentContentData = contentData;
    
    if (contentData.type === 'video') {
        return setBackgroundVideo(contentData);
    } else {
        return setBackgroundImage(contentData);
    }
}

// Set background video
async function setBackgroundVideo(videoData) {
    return new Promise((resolve, reject) => {
        // Remove any existing video
        const existingVideo = document.querySelector('.background-video');
        if (existingVideo) {
            existingVideo.remove();
        }
        
        // Create video element
        const video = document.createElement('video');
        video.className = 'background-video';
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        
        // Style the video
        video.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            object-fit: cover;
            z-index: -1;
        `;
        
        video.onloadeddata = () => {
            console.log('Video loaded successfully');
            updateContentCredit(videoData);
            resolve();
        };
        
        video.onerror = () => {
            console.error('Failed to load video:', videoData.url);
            video.remove();
            // Fallback to image
            setFallbackBackground();
            resolve();
        };
        
        video.src = videoData.url;
        document.body.insertBefore(video, document.body.firstChild);
        
        // Clear any background image
        elements.container.style.backgroundImage = 'none';
    });
}
    
// Set background image
async function setBackgroundImage(imageData) {
    return new Promise((resolve, reject) => {
        // Remove any existing video
        const existingVideo = document.querySelector('.background-video');
        if (existingVideo) {
            existingVideo.remove();
        }
        
        const img = new Image();
        img.onload = () => {
            elements.container.style.backgroundImage = `url('${imageData.url}')`;
            updateContentCredit(imageData);
            resolve();
        };
        img.onerror = () => {
            console.error('Failed to load image:', imageData.url);
            setFallbackBackground();
            resolve(); // Don't reject, just use fallback
        };
        img.src = imageData.url;
    });
}

// Set fallback background
async function setFallbackBackground() {
    elements.container.style.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    elements.imageCredit.innerHTML = 'Default gradient background';
}

// Update content credit for both images and videos
function updateContentCredit(contentData) {
    if (contentData.source === 'pexels') {
        elements.imageCredit.innerHTML = `
            ${contentData.type === 'video' ? 'Video' : 'Photo'} by <a href="${contentData.photographerUrl}" target="_blank" rel="noopener">${contentData.photographer}</a> on 
            <a href="https://pexels.com" target="_blank" rel="noopener">Pexels</a>
        `;
    } else if (contentData.photographer && contentData.photographerUrl) {
        elements.imageCredit.innerHTML = `
            Photo by <a href="${contentData.photographerUrl}?utm_source=cute-wallpapers&utm_medium=referral" target="_blank" rel="noopener">${contentData.photographer}</a> on 
            <a href="https://unsplash.com?utm_source=cute-wallpapers&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a>
        `;
    } else {
        elements.imageCredit.innerHTML = `${contentData.type === 'video' ? 'Video' : 'Photo'} from ${contentData.source || 'API'}`;
    }
}

// Set quote content
function setQuote(quoteData) {
    elements.quote.textContent = quoteData.content;
    elements.author.textContent = quoteData.author;
}

// Set fallback quote
function setFallbackQuote() {
    const fallbackQuote = getFallbackQuote();
    setQuote(fallbackQuote);
    console.log('Using local fallback quote:', fallbackQuote.author);
}

// Setup event listeners
function setupEventListeners() {
    // Refresh button
    elements.refreshBtn.addEventListener('click', () => {
        loadContent();
    });

    // Settings button
    elements.settingsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // Search functionality
    // elements.searchBtn.addEventListener('click', handleSearch);
    // elements.searchInput.addEventListener('keypress', (e) => {
    //     if (e.key === 'Enter') {
    //         handleSearch();
    //     }
    // });

    // Retry button
    elements.retryBtn.addEventListener('click', () => {
        loadContent();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'r':
            case 'R':
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    loadContent();
                }
                break;
            case '/':
                e.preventDefault();
                // elements.searchInput.focus();
                break;
            case 'Escape':
                // elements.searchInput.blur();
                break;
        }
    });
}

// Handle search
// function handleSearch() {
//     const searchTerm = elements.searchInput.value.trim();
//     if (searchTerm) {
//         loadContent(searchTerm);
//         elements.searchInput.value = '';
//         elements.searchInput.blur();
//     }
// }

// Show loading state
function showLoading() {
    elements.loading.classList.remove('hidden');
    elements.content.classList.add('hidden');
    elements.error.classList.add('hidden');
}

// Show main content
function showContent() {
    elements.loading.classList.add('hidden');
    elements.content.classList.remove('hidden');
    elements.error.classList.add('hidden');
}

// Show error state
function showError(message) {
    elements.loading.classList.add('hidden');
    elements.content.classList.add('hidden');
    elements.error.classList.remove('hidden');
    elements.errorMessage.textContent = message;
}

// Preload next image (optional optimization)
async function preloadNextImage() {
    try {
        const nextImage = await loadWallpaper();
        const img = new Image();
        img.src = nextImage.url;
    } catch (error) {
        // Silently fail - this is just an optimization
    }
}

// Auto-refresh functionality (can be enabled in settings)
let autoRefreshInterval;

function startAutoRefresh(minutes = 30) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(() => {
        loadContent();
    }, minutes * 60 * 1000);
}

function stopAutoRefresh() {
    clearInterval(autoRefreshInterval);
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        let apiKeysChanged = false;
        
        if (changes.unsplashApiKey) {
            unsplashApiKey = changes.unsplashApiKey.newValue;
            window.unsplashApiKey = unsplashApiKey;
            apiKeysChanged = true;
        }
        if (changes.pexelsApiKey) {
            pexelsApiKey = changes.pexelsApiKey.newValue;
            window.pexelsApiKey = pexelsApiKey;
            apiKeysChanged = true;
        }
        
        // Restart content fetcher if API keys changed
        if (apiKeysChanged && contentFetcher) {
            console.log('API keys changed, restarting content fetcher...');
            contentFetcher.stop();
            if (unsplashApiKey || pexelsApiKey) {
                contentFetcher.start();
            }
        }
        
        if (changes.autoRefresh) {
            const autoRefresh = changes.autoRefresh.newValue;
            if (autoRefresh && autoRefresh.enabled) {
                startAutoRefresh(autoRefresh.interval);
            } else {
                stopAutoRefresh();
            }
        }
    }
});

// Track download for Unsplash API (required by their terms)
async function trackDownload(downloadUrl) {
    if (downloadUrl && unsplashApiKey) {
        try {
            await fetch(downloadUrl, {
                headers: {
                    'Authorization': `Client-ID ${unsplashApiKey}`
                }
            });
        } catch (error) {
            console.warn('Failed to track download:', error);
        }
    }
}