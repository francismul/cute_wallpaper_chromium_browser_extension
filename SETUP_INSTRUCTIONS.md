# Extension Setup Instructions

## Configure API Keys

Since you have the API keys in your .env file, you need to configure them in the extension:

### Pexels API Key Setup:
1. **Load the extension in Chrome/Brave:**
   - Open Chrome/Brave
   - Go to `chrome://extensions/` or `brave://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select this folder: `/media/the-3000/THE3000/Projects/brave_web_extension_for_cute_wallpaper`

2. **Configure API Keys:**
   - Right-click the extension icon → "Options"
   - OR go to `chrome://extensions/` → Find your extension → Click "Details" → "Extension options"
   
3. **Enter Your API Keys:**
   - **Pexels API Key**: `YOUR_PEXELS_API_KEY`
   - **Unsplash API Key**: `YOUR_UNSPLASH_API_KEY`
   
4. **Test the Keys:**
   - Click "Test Pexels API" button
   - Click "Test Unsplash API" button
   - Both should show "API key is valid and working!"

5. **Save Settings:**
   - Click "Save Settings"
   - Open a new tab to test

### Troubleshooting:

If you still get the "Failed to fetch" error:

1. **Check Manifest Permissions:**
   - Make sure `manifest.json` has the correct host permissions
   - Should include: `"https://api.pexels.com/*"` and `"https://api.unsplash.com/*"`

2. **Check Console:**
   - Open new tab
   - Press F12 → Console
   - Look for any permission or CORS errors

3. **Reset Extension:**
   - Go to `chrome://extensions/`
   - Remove the extension
   - Reload it from the folder
   - Reconfigure API keys

### Expected Behavior:
- 70% of the time: Content from Pexels (images + videos)
- 30% of the time: Content from Unsplash (images only)
- If APIs fail: Fallback to demo content
- Always shows inspirational quotes

### API Verification:
The Pexels API has been tested and confirmed working:
- ✅ Rate limit: 24,998/25,000 remaining
- ✅ Returns 5 photos for "cute" search
- ✅ All required fields present (src.original, photographer, etc.)

If the extension still doesn't work after configuration, the issue is likely with Chrome extension permissions or the storage API.