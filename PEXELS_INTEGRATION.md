# Pexels API Integration

## What was added:

### 1. Dual API Support
- Added Pexels API alongside existing Unsplash API
- Pexels gets 70% weight (higher priority) due to better rate limits
- Unsplash gets 30% weight as backup

### 2. Video Support
- Added video background functionality using Pexels Videos API
- 30% chance to load video content when using Pexels
- 70% chance to load image content when using Pexels
- Smooth video backgrounds with autoplay, loop, and muted settings

### 3. Enhanced Options Page
- Added Pexels API key configuration field
- Updated validation for both API key formats
- Added test buttons for both APIs
- Improved instructions with both services

### 4. API Configuration
- **Pexels Photos API**: `https://api.pexels.com/v1/search`
- **Pexels Videos API**: `https://api.pexels.com/videos/search`
- **Rate Limits**: 200 requests/hour, 5000/month for Pexels vs 50/hour for Unsplash

### 5. New Functions Added

#### newtab.js:
- `loadContentFromAPI()` - Chooses API based on weight
- `loadFromPexels()` - Main Pexels content loader
- `loadPexelsImage()` - Fetches photos from Pexels
- `loadPexelsVideo()` - Fetches videos from Pexels  
- `setBackgroundContent()` - Handles both images and videos
- `setBackgroundVideo()` - Sets up video backgrounds

#### options.js:
- `isValidPexelsApiKey()` - Validates Pexels API key format
- `testPexelsApiKey()` - Tests Pexels API connectivity
- Updated `validateApiKeys()` - Validates both API keys
- Updated storage handling for both keys

### 6. CSS Enhancements
- Video background styling with proper positioning
- Video controls (hidden, show on hover)
- Smooth transitions between content types
- Responsive design maintained

### 7. Error Handling
- Graceful fallback from video to image
- Fallback from Pexels to Unsplash if API fails
- Fallback to demo content if both APIs fail

## API Key Setup:

### Pexels API Key:
1. Go to https://www.pexels.com/api/
2. Create a free account
3. Get your API key
4. Add it to the extension options

### Unsplash API Key (backup):
1. Go to https://unsplash.com/developers
2. Create a developer account
3. Create a new application
4. Copy the Access Key
5. Add it to the extension options

## How it works:

1. Extension checks for Pexels API key first (70% weight)
2. If Pexels available: randomly chooses between images (70%) and videos (30%)
3. If no Pexels key or fails: falls back to Unsplash (30% weight)
4. If both fail: shows demo/fallback content
5. Videos autoplay with loop and muted for better UX
6. All content includes proper attribution links

The extension now provides a much richer experience with video backgrounds while maintaining all existing functionality and backward compatibility.