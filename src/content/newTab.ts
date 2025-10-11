import {
  addToHistory,
  getAllValidImages,
  getHistory,
  getHistoryImageById,
  getLastFetchTime,
  wasImageViewedRecently,
  HistoryEntry,
  ImageData,
} from "./db";
import { getRandomIndex } from "../utils/random";
import { REFRESH_INTERVAL_HOURS } from "../config/constants";
import { getImagesWithFallback, getImageSourceStrategy } from "./fallback";

/**
 * DOM Elements - Cached for performance
 */
const wallpaperImg = document.getElementById("wallpaper") as HTMLImageElement;
const loadingDiv = document.getElementById("loading") as HTMLElement;
const creditDiv = document.getElementById("credit") as HTMLElement;
const authorSpan = document.getElementById("author") as HTMLElement;
const sourceSpan = document.getElementById("source") as HTMLElement;
const settingsBtn = document.getElementById("settingsBtn") as HTMLButtonElement;

/**
 * History navigation elements
 */
const prevImageBtn = document.getElementById(
  "prevImageBtn"
) as HTMLButtonElement;
const nextImageBtn = document.getElementById(
  "nextImageBtn"
) as HTMLButtonElement;
const historyIndicator = document.getElementById(
  "historyIndicator"
) as HTMLElement;
const historyPosition = document.getElementById(
  "historyPosition"
) as HTMLElement;
const historyTotal = document.getElementById("historyTotal") as HTMLElement;

/**
 * Clock elements
 */
const clockContainer = document.getElementById("clockContainer") as HTMLElement;
const timeDisplay = document.getElementById("timeDisplay") as HTMLElement;
const dateDisplay = document.getElementById("dateDisplay") as HTMLElement;

/**
 * Application state management interface
 * Centralizes all global state variables for better maintainability
 */
interface AppState {
  historyEnabled: boolean;
  historyMaxSize: number;
  currentHistoryIndex: number;
  currentImages: ImageData[];
  historyList: HistoryEntry[];
  clockInterval: number | null;
  autoRefreshTimer: number | null;
  currentBlobUrl: string | null;
}

const appState: AppState = {
  currentImages: [],
  currentBlobUrl: null,
  historyList: [],
  currentHistoryIndex: -1,
  historyEnabled: true,
  historyMaxSize: 15,
  clockInterval: null,
  autoRefreshTimer: null,
};

/**
 * Animation direction types for image transitions
 */
type AnimationDirection = "next" | "prev" | "fade";

/**
 * Displays an image with smooth transitions and animations
 * Handles blob URL management, credit information, and history tracking
 * @param imageData - The image data to display
 * @param skipHistory - Whether to skip adding this image to history
 * @param animationDirection - Direction of transition animation
 * @throws Error if image preloading fails
 */
async function displayImage(
  imageData: ImageData,
  skipHistory: boolean = false,
  animationDirection: AnimationDirection = "fade"
): Promise<void> {
  const blobUrl = URL.createObjectURL(imageData.blob);
  const preloadImg = new Image();

  await new Promise<void>((resolve, reject) => {
    preloadImg.onload = () => {
      wallpaperImg.style.transition =
        "opacity 0.3s ease-out, transform 0.3s ease-out";
      wallpaperImg.style.opacity = "0";
      creditDiv.classList.remove("visible");

      setTimeout(() => {
        // Clean up previous blob URL
        if (appState.currentBlobUrl) {
          URL.revokeObjectURL(appState.currentBlobUrl);
        }
        appState.currentBlobUrl = blobUrl;

        wallpaperImg.src = blobUrl;
        wallpaperImg.alt = `Photo by ${imageData.author}`;

        // Set initial transform based on animation direction
        switch (animationDirection) {
          case "next":
            wallpaperImg.style.transform = "translateX(100px) scale(0.95)";
            break;
          case "prev":
            wallpaperImg.style.transform = "translateX(-100px) scale(0.95)";
            break;
          case "fade":
          default:
            wallpaperImg.style.transform = "scale(0.95)";
            break;
        }

        requestAnimationFrame(() => {
          wallpaperImg.style.transition =
            "opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
          wallpaperImg.style.opacity = "1";
          wallpaperImg.style.transform = "translateX(0) scale(1)";

          // Update credit information with clickable links
          updateCreditInfo(imageData);

          setTimeout(() => {
            creditDiv.classList.add("visible");
          }, 200);
        });
      }, 300); // Wait for fade out

      resolve();
    };

    preloadImg.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("Failed to preload image"));
    };

    preloadImg.src = blobUrl;
  });

  // Add to history if not skipping and viewing current image
  if (
    !skipHistory &&
    appState.currentHistoryIndex === -1 &&
    appState.historyEnabled
  ) {
    try {
      await addToHistory(
        imageData.id,
        imageData.source,
        appState.historyMaxSize
      );
      await loadHistoryList();
      updateHistoryUI();
    } catch (error) {
      console.error("Failed to add to history:", error);
    }
  }
}

/**
 * Updates the credit information display with clickable author and source links
 * @param imageData - The image data containing author and source information
 */
/**
 * Updates the credit information displayed for the current image
 * Shows photographer and source information with proper attribution links
 * @param imageData - The image data containing credit and source information
 */
function updateCreditInfo(imageData: ImageData): void {
  const authorLink = document.createElement("a");
  authorLink.href = imageData.authorUrl;
  authorLink.target = "_blank";
  authorLink.textContent = imageData.author;

  const sourceLink = document.createElement("a");
  sourceLink.href = getSourceUrl(imageData.source);
  sourceLink.target = "_blank";
  sourceLink.textContent = getSourceDisplayName(imageData.source);

  authorSpan.innerHTML = "";
  authorSpan.appendChild(authorLink);
  sourceSpan.innerHTML = "";
  sourceSpan.appendChild(sourceLink);
}

/**
 * Gets the URL for a given image source
 * @param source - The image source
 * @returns The URL for the source
 */
/**
 * Generates the appropriate source URL for different image sources
 * Handles Unsplash UTM parameters and Pexels photographer pages
 * @param source - The image source type ('unsplash', 'pexels', or 'fallback')
 * @returns The formatted URL for the image source
 */
function getSourceUrl(source: ImageData["source"]): string {
  switch (source) {
    case "unsplash":
      return "https://unsplash.com";
    case "pexels":
      return "https://pexels.com";
    default:
      return "#";
  }
}

/**
 * Gets the display name for a given image source
 * @param source - The image source
 * @returns The display name for the source
 */
/**
 * Gets the display name for different image sources
 * Provides user-friendly names for attribution display
 * @param source - The image source type
 * @returns The human-readable source name
 */
function getSourceDisplayName(source: ImageData["source"]): string {
  switch (source) {
    case "unsplash":
      return "Unsplash";
    case "pexels":
      return "Pexels";
    default:
      return "Other";
  }
}

/**
 * Shows informational banner when using fallback images
 * Displays API configuration prompt with auto-hide functionality
 */
/**
 * Displays fallback information when no images are available
 * Shows guidance to users on how to resolve image availability issues
 * Includes database statistics and troubleshooting information
 */
async function showFallbackInfo(): Promise<void> {
  try {
    const strategy = await getImageSourceStrategy();

    if (
      strategy.strategy === "fallback" ||
      strategy.strategy === "placeholder"
    ) {
      const infoDiv = document.createElement("div");
      infoDiv.style.cssText = `
        position: fixed;
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(12px);
        color: white;
        padding: 16px 28px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 500;
        z-index: 100;
        text-align: center;
        max-width: 500px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
      `;

      const icon = strategy.strategy === "placeholder" ? "📱" : "ℹ️";
      infoDiv.innerHTML = `
        ${icon} ${strategy.reason}. 
        <a href="#" id="openSettingsLink" 
           style="color: #4da6ff; text-decoration: underline; font-weight: 600;">
          Configure API keys
        </a> to get fresh wallpapers!
      `;

      document.body.appendChild(infoDiv);

      // Auto-hide after 6 seconds with fade animation
      setTimeout(() => {
        infoDiv.style.transition = "opacity 0.8s ease-out";
        infoDiv.style.opacity = "0";
        setTimeout(() => infoDiv.remove(), 800);
      }, 6000);

      // Handle settings link click
      document
        .getElementById("openSettingsLink")
        ?.addEventListener("click", (e) => {
          e.preventDefault();
          chrome.runtime.openOptionsPage();
        });
    }
  } catch (error) {
    console.error("Failed to show fallback info:", error);
  }
}

/**
 * Displays error message with configuration link
 * @param message - Error message to display
 */
/**
 * Displays an error message to the user
 * Shows error with fade-in animation and auto-hide functionality
 * @param message - The error message to display to the user
 */
function showError(message: string): void {
  loadingDiv.style.display = "none";

  const errorDiv = document.createElement("div");
  errorDiv.className = "error";
  errorDiv.innerHTML = `
    <p>${message}</p>
    <p style="margin-top: 10px; font-size: 14px; opacity: 0.8;">
      <a href="#" id="openOptionsFromError" 
         style="color: #4da6ff; text-decoration: underline;">
        Configure API keys
      </a> to get fresh wallpapers!
    </p>
  `;
  document.body.appendChild(errorDiv);

  document
    .getElementById("openOptionsFromError")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
}

/**
 * Loads the viewing history list from database
 * Updates the appState with current history entries
 */
/**
 * Loads the viewing history from the database
 * Populates appState.historyList with recently viewed images
 * Limited by appState.historyMaxSize setting
 */
async function loadHistoryList(): Promise<void> {
  try {
    appState.historyList = await getHistory(appState.historyMaxSize);
  } catch (error) {
    console.error("Failed to load history:", error);
    appState.historyList = [];
  }
}

/**
 * Updates the history navigation UI based on current state
 * Shows/hides navigation buttons and updates position indicators
 */
/**
 * Updates the navigation button states based on current history position
 * Enables/disables previous/next buttons and updates visual indicators
 * Handles edge cases when at beginning or end of history
 */
function updateHistoryUI(): void {
  if (!appState.historyEnabled || appState.historyList.length === 0) {
    prevImageBtn.classList.remove("visible");
    nextImageBtn.classList.remove("visible");
    historyIndicator.classList.remove("visible");
    return;
  }

  if (appState.currentHistoryIndex === -1) {
    // Viewing current/latest image
    prevImageBtn.classList.toggle("visible", appState.historyList.length > 0);
    nextImageBtn.classList.add("visible"); // Always show next for new random
    historyIndicator.classList.remove("visible");
  } else {
    // Viewing historical image
    prevImageBtn.classList.toggle(
      "visible",
      appState.currentHistoryIndex < appState.historyList.length - 1
    );
    nextImageBtn.classList.add("visible"); // Always show next for new random
    historyIndicator.classList.add("visible");

    historyPosition.textContent = (appState.currentHistoryIndex + 1).toString();
    historyTotal.textContent = appState.historyList.length.toString();
  }
}

/**
 * Navigates to the previous image in history
 * Handles expired/deleted images gracefully by skipping them
 */
async function navigateToPrevious(): Promise<void> {
  if (appState.currentHistoryIndex >= appState.historyList.length - 1) return;

  appState.currentHistoryIndex++;
  const historyEntry = appState.historyList[appState.currentHistoryIndex];

  if (!historyEntry) return;

  try {
    const imageData = await getHistoryImageById(historyEntry.imageId);

    if (imageData) {
      await displayImage(imageData, true, "prev");
      updateHistoryUI();
    } else {
      // Image expired/deleted, remove from history and try next one
      appState.historyList.splice(appState.currentHistoryIndex, 1);
      appState.currentHistoryIndex--;
      if (appState.currentHistoryIndex < appState.historyList.length - 1) {
        await navigateToPrevious(); // Recursively try next one
      }
    }
  } catch (error) {
    console.error("Failed to navigate to previous image:", error);
  }
}

/**
 * Navigates to the next image (loads a new random image)
 * Resets history index to current/latest position
 */
async function navigateToNext(): Promise<void> {
  appState.currentHistoryIndex = -1;
  await loadRandomImage();
  updateHistoryUI();
}

/**
 * Loads and applies history settings from Chrome storage
 * Updates appState with current history configuration
 */
async function loadHistorySettings(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(["settings"]);
    const settings = result.settings || {};

    appState.historyEnabled = settings.history?.enabled ?? true;
    appState.historyMaxSize = settings.history?.maxSize ?? 15;

    await loadHistoryList();
    updateHistoryUI();
  } catch (error) {
    console.error("Failed to load history settings:", error);
  }
}

/**
 * Loads a random image using the enhanced fallback system
 * Utilizes the new getImagesWithFallback for intelligent image selection
 * Includes smart duplicate detection and better error handling
 */
async function loadRandomImage(): Promise<void> {
  try {
    appState.currentHistoryIndex = -1;
    creditDiv.classList.remove("visible");

    // Use the enhanced fallback system for intelligent image selection
    // Note: allowApiCalls defaults to false for user interactions (no network lag)
    const images = await getImagesWithFallback();

    if (images.length === 0) {
      showError("No images available. Please check your configuration.");
      return;
    }

    // Smart image selection with recent view detection
    let selectedImage: ImageData | null = null;
    let attempts = 0;
    const maxAttempts = Math.min(10, images.length);

    while (!selectedImage && attempts < maxAttempts) {
      const randomIndex = getRandomIndex(images.length);
      const candidateImage = images[randomIndex];

      if (!candidateImage) {
        attempts++;
        continue;
      }

      // Check if image was viewed recently (avoid repetition)
      const recentlyViewed = await wasImageViewedRecently(candidateImage.id, 2); // 2 hours

      if (!recentlyViewed || images.length === 1) {
        selectedImage = candidateImage;
      } else {
        attempts++;
      }
    }

    // Fallback to any image if all recent checks failed
    if (!selectedImage) {
      const randomIndex = getRandomIndex(images.length);
      selectedImage = images[randomIndex] ?? images[0] ?? null;
    }

    if (!selectedImage) {
      showError("Failed to select an image");
      return;
    }

    await displayImage(selectedImage, false, "fade");
    wallpaperImg.classList.add("loaded");

    // Update cached images periodically
    if (appState.currentImages.length === 0) {
      appState.currentImages = await getAllValidImages();
    }
  } catch (error) {
    console.error("Error loading image:", error);
    showError("Error loading image. Please try again.");
  }
}

settingsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

prevImageBtn.addEventListener("click", async () => {
  await navigateToPrevious();
});

nextImageBtn.addEventListener("click", async () => {
  await navigateToNext();
});

document.addEventListener("keydown", async (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    await navigateToPrevious();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    await navigateToNext();
  }
});

/**
 * Updates the clock display with current time
 * Handles both 12-hour and 24-hour formats with optional seconds
 * @param format24 - Whether to use 24-hour format (true) or 12-hour format (false)
 * @param showSeconds - Whether to display seconds in the time
 */
function updateClock(format24: boolean, showSeconds: boolean) {
  const now = new Date();

  let hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  let timeString: string;

  if (format24) {
    const h = hours.toString().padStart(2, "0");
    const m = minutes.toString().padStart(2, "0");
    const s = seconds.toString().padStart(2, "0");
    timeString = showSeconds ? `${h}:${m}:${s}` : `${h}:${m}`;
  } else {
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert to 12-hour format
    const h = hours.toString();
    const m = minutes.toString().padStart(2, "0");
    const s = seconds.toString().padStart(2, "0");
    timeString = showSeconds
      ? `${h}:${m}:${s} ${period}`
      : `${h}:${m} ${period}`;
  }

  timeDisplay.textContent = timeString;
}

/**
 * Updates the date display with current date
 * Formats date in a user-friendly format (e.g., "Monday, January 15, 2024")
 */
function updateDate() {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  dateDisplay.textContent = now.toLocaleDateString("en-US", options);
}

/**
 * Sets up the clock based on user preferences from Chrome storage
 * Manages clock interval lifecycle and display format options
 * Handles both 12/24 hour formats, seconds display, and date display
 */
async function setupClock(): Promise<void> {
  if (appState.clockInterval) {
    clearInterval(appState.clockInterval);
    appState.clockInterval = null;
  }

  const result = await chrome.storage.local.get(["settings"]);
  const settings = result.settings || {
    clock: {
      enabled: true,
      format24: false,
      showSeconds: true,
      showDate: true,
    },
  };

  if (settings.clock.enabled) {
    clockContainer.classList.remove("hidden");

    if (settings.clock.showDate) {
      dateDisplay.style.display = "block";
      updateDate();
    } else {
      dateDisplay.style.display = "none";
    }

    updateClock(settings.clock.format24, settings.clock.showSeconds);

    const interval = settings.clock.showSeconds ? 1000 : 60000;
    appState.clockInterval = window.setInterval(() => {
      updateClock(settings.clock.format24, settings.clock.showSeconds);
      if (settings.clock.showDate) {
        updateDate();
      }
    }, interval);

    console.log(
      `Clock enabled: ${
        settings.clock.format24 ? "24h" : "12h"
      } format, seconds: ${settings.clock.showSeconds}`
    );
  } else {
    clockContainer.classList.add("hidden");
    console.log("Clock disabled");
  }
}

setupClock();

loadHistorySettings();

loadRandomImage();

showFallbackInfo();

/**
 * Sets up automatic image refresh based on user preferences
 * Manages auto-refresh timer lifecycle and interval settings
 * Allows users to automatically cycle through images at specified intervals
 */
async function setupAutoRefresh(): Promise<void> {
  if (appState.autoRefreshTimer) {
    clearInterval(appState.autoRefreshTimer);
    appState.autoRefreshTimer = null;
  }

  const result = await chrome.storage.local.get(["settings"]);
  const settings = result.settings || {
    autoRefresh: { enabled: false, interval: 30 },
  };

  if (settings.autoRefresh.enabled) {
    const intervalMs = settings.autoRefresh.interval * 1000;
    appState.autoRefreshTimer = window.setInterval(() => {
      wallpaperImg.classList.remove("loaded");
      loadRandomImage();
    }, intervalMs);

    console.log(`Auto-refresh enabled: ${settings.autoRefresh.interval}s`);
  }
}

setupAutoRefresh();

chrome.storage.onChanged.addListener((changes: any, areaName: any) => {
  if (areaName === "local" && changes.settings) {
    setupAutoRefresh();
    setupClock();
    loadHistorySettings();
  }
});

/**
 * Clean up blob URL on page unload to prevent memory leaks
 */
window.addEventListener("beforeunload", () => {
  if (appState.currentBlobUrl) {
    URL.revokeObjectURL(appState.currentBlobUrl);
  }
});

/**
 * Refresh cached images periodically (every 5 minutes)
 * Ensures the local cache stays updated with valid images
 */
setInterval(async () => {
  appState.currentImages = await getAllValidImages();
}, 5 * 60 * 1000);

/**
 * Checks if images need to be refreshed and triggers refresh if necessary
 * Monitors last fetch time and ensures images stay current
 * Helps maintain a fresh cache of images for optimal user experience
 */
async function checkAndTriggerRefresh(): Promise<void> {
  try {
    const lastFetch = await getLastFetchTime();

    const now = Date.now();

    if (!lastFetch || now - lastFetch >= REFRESH_INTERVAL_HOURS) {
      console.log("⏰ Refresh overdue, notifying background worker...");
      chrome.runtime.sendMessage({ action: "checkRefreshNeeded" });
    }
  } catch (error) {
    console.error("Failed to check refresh status:", error);
  }
}

checkAndTriggerRefresh();
