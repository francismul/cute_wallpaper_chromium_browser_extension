/**
 * Shared Configuration Constants
 * All configurable values and magic numbers in one place
 */

// Image Fetching
export const UNSPLASH_IMAGES_COUNT = 30; // Unsplash API maximum
export const PEXELS_IMAGES_COUNT = 50; // Optimized from Pexels max of 80
export const IMAGE_EXPIRY_HOURS = 24;

// Refresh Intervals
export const REFRESH_INTERVAL_HOURS = 6;
export const REFRESH_INTERVAL_MS = REFRESH_INTERVAL_HOURS * 60 * 60 * 1000;
export const IMMEDIATE_FETCH_COOLDOWN_MS = 10000; // 10 seconds

// Auto-refresh (new tab page)
export const DEFAULT_AUTO_REFRESH_INTERVAL = 30; // seconds
export const MIN_AUTO_REFRESH_INTERVAL = 5; // seconds
export const MAX_AUTO_REFRESH_INTERVAL = 300; // seconds

// Chrome Alarms
export const ALARM_NAME = 'refreshImages';

// Clock Settings
export const DEFAULT_CLOCK_ENABLED = true;
export const DEFAULT_CLOCK_FORMAT_24H = false;
export const DEFAULT_CLOCK_SHOW_SECONDS = true;
export const DEFAULT_CLOCK_SHOW_DATE = true;

// Fallback Images
export const FALLBACK_IMAGE_COUNT = 20;
