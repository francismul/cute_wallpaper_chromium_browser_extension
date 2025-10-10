/**
 * Fallback Images
 * High-quality placeholder images from Unsplash (free to use)
 */

import { ImageData } from './db.js';

// Note: Fallback images will be downloaded as blobs when needed
// URLs are kept for initial download
const FALLBACK_IMAGES: Omit<ImageData, 'timestamp' | 'expiresAt' | 'blob'>[] = [
  {
    id: 'fallback_1',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/mountain-landscape',
    author: 'Damiano Baschiera',
    authorUrl: 'https://unsplash.com/@damiano_baschiera'
  },
  {
    id: 'fallback_2',
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/nature-landscape',
    author: 'David Marcu',
    authorUrl: 'https://unsplash.com/@davidmarcu'
  },
  {
    id: 'fallback_3',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/forest-path',
    author: 'Casey Horner',
    authorUrl: 'https://unsplash.com/@mischievous_penguins'
  },
  {
    id: 'fallback_4',
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/ocean-waves',
    author: 'Sean Oulashin',
    authorUrl: 'https://unsplash.com/@oulashin'
  },
  {
    id: 'fallback_5',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/northern-lights',
    author: 'v2osk',
    authorUrl: 'https://unsplash.com/@v2osk'
  },
  {
    id: 'fallback_6',
    url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/mountain-sunset',
    author: 'Luke Stackpoole',
    authorUrl: 'https://unsplash.com/@withluke'
  },
  {
    id: 'fallback_7',
    url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/lake-mountains',
    author: 'Qingbao Meng',
    authorUrl: 'https://unsplash.com/@ideasboom'
  },
  {
    id: 'fallback_8',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/tropical-beach',
    author: 'Sean Oulashin',
    authorUrl: 'https://unsplash.com/@oulashin'
  },
  {
    id: 'fallback_9',
    url: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/sand-dunes',
    author: 'Sergey Pesterev',
    authorUrl: 'https://unsplash.com/@sickle'
  },
  {
    id: 'fallback_10',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/starry-night',
    author: 'Vincentiu Solomon',
    authorUrl: 'https://unsplash.com/@vincentiu'
  },
  {
    id: 'fallback_11',
    url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/forest-green',
    author: 'Casey Horner',
    authorUrl: 'https://unsplash.com/@mischievous_penguins'
  },
  {
    id: 'fallback_12',
    url: 'https://images.unsplash.com/photo-1465146633011-14f8e0781093?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/flower-field',
    author: 'Tim Mossholder',
    authorUrl: 'https://unsplash.com/@timmossholder'
  },
  {
    id: 'fallback_13',
    url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/cloudy-sky',
    author: 'Но Но',
    authorUrl: 'https://unsplash.com/@nonocraft'
  },
  {
    id: 'fallback_14',
    url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/canyon-landscape',
    author: 'Harli Marten',
    authorUrl: 'https://unsplash.com/@harlimarten'
  },
  {
    id: 'fallback_15',
    url: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/mountain-lake',
    author: 'Luca Bravo',
    authorUrl: 'https://unsplash.com/@lucabravo'
  },
  {
    id: 'fallback_16',
    url: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/coastline',
    author: 'Bailey Zindel',
    authorUrl: 'https://unsplash.com/@baileyzindel'
  },
  {
    id: 'fallback_17',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/alpine-meadow',
    author: 'Damiano Baschiera',
    authorUrl: 'https://unsplash.com/@damiano_baschiera'
  },
  {
    id: 'fallback_18',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/galaxy',
    author: 'Benjamin Voros',
    authorUrl: 'https://unsplash.com/@vorosbenisop'
  },
  {
    id: 'fallback_19',
    url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/rocky-coast',
    author: 'Alex Perez',
    authorUrl: 'https://unsplash.com/@alexperez'
  },
  {
    id: 'fallback_20',
    url: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=1920&q=80',
    source: 'unsplash',
    downloadUrl: 'https://unsplash.com/photos/desert-landscape',
    author: 'Sergey Pesterev',
    authorUrl: 'https://unsplash.com/@sickle'
  }
];

/**
 * Get fallback images (downloads as blobs for offline support)
 * Tries to download from Unsplash, falls back to embedded placeholder if offline
 */
export async function getFallbackImages(): Promise<ImageData[]> {
  const now = Date.now();
  const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours

  // Check if online
  const isOnline = navigator.onLine;

  if (!isOnline) {
    console.warn('Offline: Using embedded placeholder image for fallback');
    // Create a simple gradient placeholder blob when offline
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;

    // Create a nice gradient
    const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1920, 1080);

    // Add text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '48px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Offline Mode', 960, 500);
    ctx.font = '24px -apple-system, sans-serif';
    ctx.fillText('Connect to internet to download wallpapers', 960, 550);

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });

    return [{
      id: 'offline_placeholder',
      url: '',
      blob,
      source: 'unsplash',
      downloadUrl: '',
      author: 'System',
      authorUrl: '',
      timestamp: now,
      expiresAt
    }];
  }

  // Download all fallback images as blobs
  const imagePromises = FALLBACK_IMAGES.map(async (fallbackImage) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(fallbackImage.url, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch fallback image: ${response.status}`);
      }
      const blob = await response.blob();

      return {
        ...fallbackImage,
        blob,
        timestamp: now,
        expiresAt
      };
    } catch (error) {
      console.error(`Failed to download fallback image ${fallbackImage.id}:`, error);
      return null;
    }
  });

  const images = await Promise.all(imagePromises);
  const validImages = images.filter((img): img is ImageData => img !== null);

  // If all fallback downloads failed, use placeholder
  if (validImages.length === 0) {
    console.warn('All fallback downloads failed, using offline placeholder');
    return getFallbackImages(); // Recursion will trigger offline mode
  }

  return validImages;
}

/**
 * Check if we need to load fallback images
 * (when cache is empty and no API keys configured)
 */
export async function shouldUseFallbackImages(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result: any) => {
      const settings = result.settings || { apiKeys: { unsplash: [], pexels: [] } };
      const hasApiKeys = settings.apiKeys.unsplash.length > 0 || settings.apiKeys.pexels.length > 0;
      resolve(!hasApiKeys);
    });
  });
}
