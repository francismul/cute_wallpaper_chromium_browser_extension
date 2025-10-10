/**
 * Pexels/Unsplash API Logic with Settings Support
 */

import { ImageData } from './db.js';
import { getRandomIndex } from '../utils/random.js';
import {
  UNSPLASH_IMAGES_COUNT,
  PEXELS_IMAGES_COUNT,
  IMAGE_EXPIRY_HOURS
} from '../config/constants.js';

/**
 * Download image as blob from URL with timeout
 */
async function downloadImageBlob(url: string, timeoutMs: number = 30000): Promise<Blob> {
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const blob = await response.blob();

    // Ensure it's an image type
    if (!blob.type.startsWith('image/')) {
      throw new Error(`Invalid image type: ${blob.type}`);
    }

    return blob;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === 'AbortError') {
      throw new Error('Image download timeout');
    }
    throw error;
  }
}

interface Settings {
  apiKeys: {
    unsplash: string[];
    pexels: string[];
  };
  searchPreferences: {
    unsplashKeywords: string;
    pexelsKeywords: string;
  };
}

/**
 * Get settings from storage
 */
async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result: any) => {
      resolve(result.settings || {
        apiKeys: { unsplash: [], pexels: [] },
        searchPreferences: { unsplashKeywords: '', pexelsKeywords: '' }
      });
    });
  });
}

/**
 * Get random API key for a source using cryptographic randomness
 */
function getRandomKey(keys: string[]): string | null {
  if (keys.length === 0) return null;
  const randomIndex = getRandomIndex(keys.length);
  return keys[randomIndex] || null;
}

/**
 * Fetch images from Unsplash
 */
async function fetchUnsplashImages(apiKey: string, keywords?: string): Promise<ImageData[]> {
  try {
    // Check if online before attempting
    if (!navigator.onLine) {
      console.warn('No network connection, skipping Unsplash fetch');
      return [];
    }

    // Unsplash max is 30 images per request
    let url = `https://api.unsplash.com/photos/random?count=${UNSPLASH_IMAGES_COUNT}&orientation=landscape`;

    if (keywords) {
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);
      if (keywordList.length > 0) {
        const randomIndex = getRandomIndex(keywordList.length);
        const randomKeyword = keywordList[randomIndex];
        url += `&query=${encodeURIComponent(randomKeyword!)}`;
      }
    }

    const response = await fetch(url, {
      headers: { 'Authorization': `Client-ID ${apiKey}` },
      signal: AbortSignal.timeout(15000) // 15 second timeout for API call
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    const now = Date.now();
    const expiresAt = now + (IMAGE_EXPIRY_HOURS * 60 * 60 * 1000);

    // Download images as blobs for offline support
    const imagePromises = data.map(async (photo: any) => {
      try {
        const blob = await downloadImageBlob(photo.urls.regular);
        return {
          id: `unsplash_${photo.id}`,
          url: photo.urls.regular,
          blob,
          source: 'unsplash' as const,
          downloadUrl: photo.links.download,
          author: photo.user.name,
          authorUrl: photo.user.links.html,
          timestamp: now,
          expiresAt
        };
      } catch (error) {
        console.error(`Failed to download Unsplash image ${photo.id}:`, error);
        return null;
      }
    });

    const images = await Promise.all(imagePromises);
    return images.filter((img): img is ImageData => img !== null);
  } catch (error) {
    console.error('Failed to fetch from Unsplash:', error);
    return [];
  }
}

/**
 * Fetch images from Pexels
 */
async function fetchPexelsImages(apiKey: string, keywords?: string): Promise<ImageData[]> {
  try {
    // Check if online before attempting
    if (!navigator.onLine) {
      console.warn('No network connection, skipping Pexels fetch');
      return [];
    }

    let url: string;

    if (keywords) {
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);
      if (keywordList.length > 0) {
        const randomIndex = getRandomIndex(keywordList.length);
        const randomKeyword = keywordList[randomIndex];
        url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(randomKeyword!)}&per_page=${PEXELS_IMAGES_COUNT}&orientation=landscape`;
      } else {
        const randomPage = getRandomIndex(10) + 1; // Random page 1-10
        url = `https://api.pexels.com/v1/curated?per_page=${PEXELS_IMAGES_COUNT}&page=${randomPage}`;
      }
    } else {
      const randomPage = getRandomIndex(10) + 1; // Random page 1-10
      url = `https://api.pexels.com/v1/curated?per_page=${PEXELS_IMAGES_COUNT}&page=${randomPage}`;
    }

    const response = await fetch(url, {
      headers: { 'Authorization': apiKey },
      signal: AbortSignal.timeout(15000) // 15 second timeout for API call
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();
    const now = Date.now();
    const expiresAt = now + (IMAGE_EXPIRY_HOURS * 60 * 60 * 1000);

    // Download images as blobs for offline support
    const imagePromises = data.photos.map(async (photo: any) => {
      try {
        const blob = await downloadImageBlob(photo.src.large2x);
        return {
          id: `pexels_${photo.id}`,
          url: photo.src.large2x,
          blob,
          source: 'pexels' as const,
          downloadUrl: photo.url,
          author: photo.photographer,
          authorUrl: photo.photographer_url,
          timestamp: now,
          expiresAt
        };
      } catch (error) {
        console.error(`Failed to download Pexels image ${photo.id}:`, error);
        return null;
      }
    });

    const images = await Promise.all(imagePromises);
    return images.filter((img): img is ImageData => img !== null);
  } catch (error) {
    console.error('Failed to fetch from Pexels:', error);
    return [];
  }
}

/**
 * Fetch images from both sources using settings
 */
export async function fetchAllImages(): Promise<ImageData[]> {
  console.log('Fetching images from APIs...');

  const settings = await getSettings();
  const unsplashKey = getRandomKey(settings.apiKeys.unsplash);
  const pexelsKey = getRandomKey(settings.apiKeys.pexels);

  const promises: Promise<ImageData[]>[] = [];

  if (unsplashKey) {
    promises.push(fetchUnsplashImages(unsplashKey, settings.searchPreferences.unsplashKeywords));
  } else {
    console.warn('No Unsplash API key configured');
  }

  if (pexelsKey) {
    promises.push(fetchPexelsImages(pexelsKey, settings.searchPreferences.pexelsKeywords));
  } else {
    console.warn('No Pexels API key configured');
  }

  const results = await Promise.all(promises);
  const allImages = results.flat();

  console.log(`Fetched ${allImages.length} images total`);
  return allImages;
}

/**
 * Check if API keys are configured
 */
export async function areApiKeysConfigured(): Promise<boolean> {
  const settings = await getSettings();
  return settings.apiKeys.unsplash.length > 0 || settings.apiKeys.pexels.length > 0;
}

