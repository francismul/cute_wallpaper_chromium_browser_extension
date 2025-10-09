/**
 * IndexedDB Wrapper for Image Caching
 */

import { getRandomIndex } from '../utils/random.js';

const DB_NAME = 'WallpaperDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const METADATA_STORE = 'metadata';

export interface ImageData {
  id: string;
  url: string;
  source: 'unsplash' | 'pexels';
  downloadUrl: string;
  author: string;
  authorUrl: string;
  timestamp: number;
  expiresAt: number;
}

export interface Metadata {
  key: string;
  value: number;
}

/**
 * Initialize IndexedDB
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create images store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }

      // Create metadata store
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Store images in IndexedDB
 */
export async function storeImages(images: ImageData[]): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  for (const image of images) {
    store.put(image);
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

/**
 * Get a random image from cache (not expired)
 */
export async function getRandomImage(): Promise<ImageData | null> {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const now = Date.now();

  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => {
      const images = request.result as ImageData[];
      const validImages = images.filter(img => img.expiresAt > now);

      db.close();

      if (validImages.length === 0) {
        resolve(null);
      } else {
        // Use cryptographically secure random selection
        const randomIndex = getRandomIndex(validImages.length);
        resolve(validImages[randomIndex]!);
      }
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Get all valid (non-expired) images
 */
export async function getAllValidImages(): Promise<ImageData[]> {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const now = Date.now();

  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => {
      const images = request.result as ImageData[];
      const validImages = images.filter(img => img.expiresAt > now);
      db.close();
      resolve(validImages);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Clean expired images
 */
export async function cleanExpiredImages(): Promise<number> {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const now = Date.now();
  let deletedCount = 0;

  return new Promise((resolve, reject) => {
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

      if (cursor) {
        const image = cursor.value as ImageData;
        if (image.expiresAt <= now) {
          cursor.delete();
          deletedCount++;
        }
        cursor.continue();
      } else {
        db.close();
        resolve(deletedCount);
      }
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Set last fetch timestamp
 */
export async function setLastFetchTime(timestamp: number): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction([METADATA_STORE], 'readwrite');
  const store = transaction.objectStore(METADATA_STORE);

  store.put({ key: 'lastFetch', value: timestamp });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

/**
 * Get last fetch timestamp
 */
export async function getLastFetchTime(): Promise<number | null> {
  const db = await initDB();
  const transaction = db.transaction([METADATA_STORE], 'readonly');
  const store = transaction.objectStore(METADATA_STORE);

  return new Promise((resolve, reject) => {
    const request = store.get('lastFetch');

    request.onsuccess = () => {
      db.close();
      const result = request.result as Metadata | undefined;
      resolve(result?.value ?? null);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Clear all images from database
 */
export async function clearAllImages(): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.clear();

    request.onsuccess = () => {
      db.close();
      resolve();
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

