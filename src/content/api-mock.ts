/**
 * Testing Without API Keys
 * 
 * For development/testing, you can use mock data instead of real APIs.
 * Replace the fetchAllImages function in api.ts with this mock version.
 * 
 * NOTE: This downloads actual blobs from Unsplash/Pexels URLs.
 * For fully offline testing, use the fallback system instead!
 */

import { ImageData } from './db.js';

const MOCK_IMAGE_URLS: Omit<ImageData, 'timestamp' | 'expiresAt' | 'blob'>[] = [
  {
    id: 'mock_1',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/mountain-scenery',
    author: 'Demo User 1',
    authorUrl: 'https://unsplash.com/@demo1'
  },
  {
    id: 'mock_2',
    url: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
    source: 'pexels',
    downloadUrl: 'https://pexels.com/photo/417074',
    author: 'Demo User 2',
    authorUrl: 'https://pexels.com/@demo2'
  },
  {
    id: 'mock_3',
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/nature',
    author: 'Demo User 3',
    authorUrl: 'https://unsplash.com/@demo3'
  },
  {
    id: 'mock_4',
    url: 'https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg',
    source: 'pexels',
    downloadUrl: 'https://pexels.com/photo/1287460',
    author: 'Demo User 4',
    authorUrl: 'https://pexels.com/@demo4'
  },
  {
    id: 'mock_5',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/forest',
    author: 'Demo User 5',
    authorUrl: 'https://unsplash.com/@demo5'
  }
];

export async function fetchAllImagesMock(): Promise<ImageData[]> {
  console.log('⚠️ Using mock images for testing - downloading blobs from real URLs...');
  
  const now = Date.now();
  const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours
  
  // Download blobs for each mock image
  const imagesPromises = MOCK_IMAGE_URLS.map(async (imgData) => {
    try {
      const response = await fetch(imgData.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      
      if (!blob.type.startsWith('image/')) {
        throw new Error(`Not an image: ${blob.type}`);
      }
      
      return {
        ...imgData,
        blob,
        timestamp: now,
        expiresAt
      };
    } catch (error) {
      console.error(`Failed to download mock image ${imgData.id}:`, error);
      // Return a placeholder blob (1x1 transparent PNG)
      const placeholderBlob = new Blob(
        [atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')],
        { type: 'image/png' }
      );
      return {
        ...imgData,
        blob: placeholderBlob,
        timestamp: now,
        expiresAt
      };
    }
  });
  
  return Promise.all(imagesPromises);
}

// To use: 
// 1. Import this in background.ts: import { fetchAllImagesMock } from './content/api-mock.js';
// 2. Replace fetchAllImages() with fetchAllImagesMock()
// 3. Rebuild and test without API keys!
