# Permanent Cache Feature - User Guide

## What is Permanent Cache Mode? 🔒

Permanent Cache Mode prevents the extension from automatically deleting your cached wallpaper images. When enabled, your favorite images will be stored forever until you manually choose to refresh the cache.

## How to Enable Permanent Cache Mode

### Step 1: Open Extension Options
1. Right-click on the extension icon in your browser toolbar
2. Select "Options" from the context menu
3. Or navigate to `chrome://extensions/` and click "Options" for Random Wallpaper Extension

### Step 2: Find Cache Settings
1. Scroll down to the **"Cache Settings"** section
2. Look for the **"Permanent Cache Mode"** checkbox

### Step 3: Enable the Feature
1. ✅ Check the **"Permanent Cache Mode"** checkbox
2. Read the description to understand what this means
3. Click **"Save Settings"** at the bottom of the page

### Step 4: Confirmation
- You'll see a success message: "Settings saved successfully!"
- Your cache will now be stored permanently

## What Happens When Enabled?

### ✅ **Images Preserved Forever**
- Cached wallpaper images never expire
- Your favorite images remain available indefinitely
- No automatic deletion during background refresh

### 📈 **Cache Grows Over Time**
- New images are added during refresh cycles
- Old images are never removed automatically
- Cache size increases gradually

### 🔄 **Background Refresh Still Works**
- Extension still downloads new images every 6 hours
- Fresh images are added to your existing collection
- You get both old favorites and new discoveries

## Manual Cache Management

### Force Refresh Cache Button
When you want to completely refresh your cache:

1. Go to **Options → Cache Settings**
2. Click **"Force Refresh Cache"** button
3. Wait for "Refreshing..." to complete
4. Success message: "Cache refreshed successfully!"

**What this does:**
- Downloads fresh images from your configured APIs
- Replaces the entire cache with new images
- Works regardless of Permanent Cache Mode setting
- Useful when you want a completely fresh start

### When to Use Force Refresh
- ✨ **Want new images**: Tired of current collection
- 🔧 **Changed API keys**: Added new keys and want immediate refresh
- 🧹 **Clean slate**: Want to start fresh with new images
- 📊 **Testing**: Verifying your API keys work correctly

## Cache Statistics

Monitor your cache in the **Cache Statistics** section:

### What You'll See
- **Total Items**: All images in your cache
- **Valid Items**: Currently usable images
- **Expired Items**: Would be deleted in normal mode (but preserved in permanent mode)
- **Unsplash/Pexels Counts**: Images from each source
- **Last Fetch Time**: When cache was last updated

### Understanding the Numbers
```
Permanent Mode OFF:  Expired items are automatically deleted
Permanent Mode ON:   Expired items are kept (永 permanent symbol)
```

## Storage Considerations

### Disk Space Usage
- **Permanent Mode**: Cache grows over time, uses more storage
- **Normal Mode**: Cache size stays relatively stable
- **Typical Size**: 10-50MB for 100-500 images

### Managing Storage
If you're concerned about storage space:
1. **Monitor cache statistics** regularly
2. **Use Force Refresh** periodically to reset cache
3. **Disable Permanent Mode** temporarily for automatic cleanup
4. **Clear entire cache** if needed (Options → Clear Cache button)

## Troubleshooting

### Force Refresh Not Working?
1. **Check API Keys**: Ensure you have valid Unsplash/Pexels API keys
2. **Network Connection**: Verify you're connected to the internet
3. **Try Again**: Wait a moment and click the button again
4. **Check Cache Stats**: Use "Refresh Stats" to see current state

### Images Not Updating?
1. **Check Permanent Mode**: If enabled, old images are preserved
2. **Force Refresh**: Use manual refresh to get new images
3. **Background Refresh**: Wait for automatic 6-hour refresh cycle
4. **API Limits**: Check if you've hit rate limits

### Settings Not Saving?
1. **Click Save Settings**: Don't forget to save after making changes
2. **Reload Options Page**: Refresh the page and try again
3. **Check Browser**: Ensure browser has necessary permissions

## Best Practices

### 🎯 **For Image Collectors**
- ✅ Enable Permanent Cache Mode
- 🔄 Use Force Refresh monthly for fresh additions
- 📊 Monitor cache statistics regularly

### ⚡ **For Automatic Management**
- ❌ Keep Permanent Cache Mode disabled
- 🤖 Let extension manage cache automatically
- 🔄 Use Force Refresh only when needed

### 🔧 **For Power Users**
- 🔄 Enable/disable Permanent Mode based on needs
- 📊 Track cache statistics for optimization
- 🎛️ Use Force Refresh for testing and configuration

## FAQ

### Q: Will Permanent Mode slow down my browser?
**A:** No, images are stored efficiently in IndexedDB and only loaded when displayed.

### Q: Can I enable/disable Permanent Mode anytime?
**A:** Yes, you can toggle it anytime. Changes take effect on the next background refresh.

### Q: What happens to expired images when I enable Permanent Mode?
**A:** They're preserved and remain usable, extending your image collection.

### Q: How often should I use Force Refresh?
**A:** Only when you want new images immediately or need to test your configuration.

### Q: Does Force Refresh work without API keys?
**A:** It will use fallback images if no API keys are configured.

---

**Enjoy your personalized wallpaper collection! 🎨✨**