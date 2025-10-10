/**
 * IndexedDB Wrapper for Image Caching
 */

import { getRandomIndex } from '../utils/random.js';

const DB_NAME = 'WallpaperDB';
const DB_VERSION = 2; // Incremented for history store
const STORE_NAME = 'images';
const METADATA_STORE = 'metadata';
const HISTORY_STORE = 'history';

export interface ImageData {
  id: string;
  url: string; // Original URL from API (for reference)
  blob: Blob; // Actual image data for offline support
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

export interface HistoryEntry {
  id?: number; // Auto-incremented primary key
  imageId: string; // Reference to ImageData.id
  viewedAt: number; // Timestamp when image was displayed
  source: 'unsplash' | 'pexels'; // Denormalized for quick filtering
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
      const oldVersion = event.oldVersion;

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

      // Create history store (v2+)
      if (oldVersion < 2 && !db.objectStoreNames.contains(HISTORY_STORE)) {
        const historyStore = db.createObjectStore(HISTORY_STORE, {
          keyPath: 'id',
          autoIncrement: true
        });
        // Index for chronological queries (most recent first)
        historyStore.createIndex('viewedAt', 'viewedAt', { unique: false });
        // Index for filtering by source
        historyStore.createIndex('source', 'source', { unique: false });
        // Compound index for source + time queries
        historyStore.createIndex('sourceViewedAt', ['source', 'viewedAt'], { unique: false });
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

// ========================================
// HISTORY MANAGEMENT FUNCTIONS
// ========================================

/**
 * Add an image to view history
 * Maintains a FIFO queue based on maxSize setting
 */
export async function addToHistory(
  imageId: string,
  source: 'unsplash' | 'pexels',
  maxSize: number = 15
): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction([HISTORY_STORE], 'readwrite');
  const store = transaction.objectStore(HISTORY_STORE);

  // Add new history entry
  const entry: Omit<HistoryEntry, 'id'> = {
    imageId,
    viewedAt: Date.now(),
    source
  };

  store.add(entry);

  // Get total count and remove oldest if exceeding maxSize
  const countRequest = store.count();

  return new Promise((resolve, reject) => {
    countRequest.onsuccess = () => {
      const count = countRequest.result;

      if (count > maxSize) {
        // Remove oldest entries (FIFO)
        const index = store.index('viewedAt');
        const cursorRequest = index.openCursor(); // Ascending order (oldest first)
        let removed = 0;
        const toRemove = count - maxSize;

        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

          if (cursor && removed < toRemove) {
            cursor.delete();
            removed++;
            cursor.continue();
          } else {
            // Done removing old entries
            transaction.oncomplete = () => {
              db.close();
              resolve();
            };
          }
        };

        cursorRequest.onerror = () => {
          db.close();
          reject(cursorRequest.error);
        };
      } else {
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
      }
    };

    countRequest.onerror = () => {
      db.close();
      reject(countRequest.error);
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

/**
 * Get image history (most recent first)
 * @param limit Maximum number of history entries to retrieve
 * @param sourceFilter Optional filter by source ('unsplash' | 'pexels')
 */
export async function getHistory(
  limit: number = 15,
  sourceFilter?: 'unsplash' | 'pexels'
): Promise<HistoryEntry[]> {
  const db = await initDB();
  const transaction = db.transaction([HISTORY_STORE], 'readonly');
  const store = transaction.objectStore(HISTORY_STORE);

  return new Promise((resolve, reject) => {
    const history: HistoryEntry[] = [];

    // Use appropriate index
    const index = sourceFilter
      ? store.index('sourceViewedAt')
      : store.index('viewedAt');

    // Open cursor in descending order (most recent first)
    const range = sourceFilter
      ? IDBKeyRange.bound([sourceFilter, 0], [sourceFilter, Date.now()])
      : undefined;

    const cursorRequest = index.openCursor(range, 'prev');

    cursorRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

      if (cursor && history.length < limit) {
        history.push(cursor.value as HistoryEntry);
        cursor.continue();
      } else {
        db.close();
        resolve(history);
      }
    };

    cursorRequest.onerror = () => {
      db.close();
      reject(cursorRequest.error);
    };
  });
}

/**
 * Get a specific image from history along with its full data
 * @param imageId The image ID to retrieve
 */
export async function getHistoryImageById(imageId: string): Promise<ImageData | null> {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(imageId);

    request.onsuccess = () => {
      db.close();
      resolve(request.result || null);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Get total history count
 */
export async function getHistoryCount(): Promise<number> {
  const db = await initDB();
  const transaction = db.transaction([HISTORY_STORE], 'readonly');
  const store = transaction.objectStore(HISTORY_STORE);

  return new Promise((resolve, reject) => {
    const request = store.count();

    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Clear all history entries
 */
export async function clearHistory(): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction([HISTORY_STORE], 'readwrite');
  const store = transaction.objectStore(HISTORY_STORE);

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

/**
 * Remove history entries older than specified timestamp
 */
export async function removeOldHistory(olderThan: number): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction([HISTORY_STORE], 'readwrite');
  const store = transaction.objectStore(HISTORY_STORE);
  const index = store.index('viewedAt');

  return new Promise((resolve, reject) => {
    const range = IDBKeyRange.upperBound(olderThan);
    const cursorRequest = index.openCursor(range);

    cursorRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        db.close();
        resolve();
      }
    };

    cursorRequest.onerror = () => {
      db.close();
      reject(cursorRequest.error);
    };
  });
}
