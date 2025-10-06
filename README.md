# 🌸 Cute Wallpapers - Advanced Browser Extension

A high-performance browser extension that transforms your new tab page into a delightful experience with cute wallpapers from Pexels and Unsplash, featuring advanced caching for instant loading and offline support.

## ✨ Features

### 🎨 **Beautiful Content**
- **Dual API Support**: High-quality images and videos from Pexels (70%) and Unsplash (30%)
- **Video Backgrounds**: Stunning video wallpapers from Pexels with smooth playback
- **Smart Content Mix**: 30% videos, 70% images for optimal variety
- **Inspirational Quotes**: Motivational quotes to brighten your day

### ⚡ **Performance & Caching**
- **Lightning Fast**: Instant loading with advanced IndexedDB caching
- **Offline Support**: Works without internet connection using cached content
- **Smart Background Fetching**: Automatically maintains fresh content pool
- **Cache Management**: Intelligent cleanup and storage optimization

### 🎛️ **Customization**
- **Search Functionality**: Find specific types of wallpapers
- **Auto-refresh**: Automatically change wallpapers at set intervals
- **Cache Controls**: Configure cache duration, size, and fetch intervals
- **Privacy-focused**: API keys stored locally and securely

### 📱 **User Experience**
- **Responsive Design**: Perfect on all screen sizes
- **Enhanced Text Visibility**: Smart shadows and overlays for readability
- **Seamless Integration**: Clean, beautiful new tab replacement
- **Real-time Statistics**: Monitor cache performance and content stats

## 🚀 Installation

### Method 1: Load Unpacked Extension (Development)

1. Clone or download this repository
2. Open Brave browser
3. Navigate to `brave://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the extension folder
6. The extension will be installed and ready to use!

### Method 2: Chrome Web Store (Future)
*This extension will be available on the Chrome Web Store soon.*

## 🔧 Setup & Configuration

### 1. Get API Keys (Free)

#### **Pexels API (Recommended - Higher Limits)**
1. Visit [Pexels API](https://www.pexels.com/api/)
2. Create a free account
3. Get your API key (200 requests/hour, 5000/month)

#### **Unsplash API (Backup)**
1. Visit [Unsplash Developers](https://unsplash.com/developers)
2. Create a developer account
3. Create a new application
4. Copy your Access Key (50 requests/hour)

### 2. Configure Extension
1. After installation, right-click the extension icon → "Options"
2. Enter your API keys:
   - **Pexels API Key**: Primary source (70% of content)
   - **Unsplash API Key**: Backup source (30% of content)
3. Test both APIs using the "Test" buttons
4. Save your settings
5. Enjoy instant beautiful wallpapers!

### 3. Cache Configuration (Optional)
- **Enable Caching**: For instant loading and offline support
- **Cache Duration**: How long to keep content (default: 15 minutes)
- **Fetch Interval**: How often to get new content (default: 30 minutes)
- **Cache Size**: Maximum items to store (default: 100 items)

## � Usage

### Basic Usage
- Open a new tab to see a beautiful wallpaper and quote
- Press `R` to refresh and get a new wallpaper
- Press `/` to focus on the search box
- Press `Escape` to close the search box

### Features
- **Refresh Button**: Click the refresh icon to get a new wallpaper
- **Search**: Type keywords to find specific types of wallpapers
- **Settings**: Click the gear icon to open settings
- **Image Credit**: See photographer information at the bottom

### Keyboard Shortcuts
- `R` - Refresh wallpaper
- `/` - Focus search box
- `Escape` - Close search box
- `Ctrl+S` - Save settings (in options page)

## 📁 File Structure

```
cute-wallpapers-extension/
├── manifest.json          # Extension configuration
├── newtab.html            # New tab page layout
├── newtab.js              # Main functionality & cache integration
├── styles.css             # Styling, animations & video support
├── options.html           # Settings page with cache controls
├── options.js             # Settings & cache management
├── popup.html             # Extension popup
├── popup.js               # Popup functionality
├── background.js          # Service worker
├── cache-manager.js       # IndexedDB cache engine
├── content-fetcher.js     # Background content fetching
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── docs/                  # Documentation
    ├── CACHING_SYSTEM.md
    ├── PEXELS_INTEGRATION.md
    └── SETUP_INSTRUCTIONS.md
```

## 🏗️ Technical Architecture

### **Cache System**
- **IndexedDB Storage**: Efficient browser-native storage
- **Smart Expiration**: 15-minute default with configurable duration
- **LRU Eviction**: Removes least recently used items when full
- **Background Fetching**: Maintains 20+ items ready for instant use

### **API Integration** 
- **Dual Source**: Pexels (70% weight) + Unsplash (30% weight)
- **Rate Limiting**: Built-in delays and error handling
- **Content Balance**: 30% videos, 70% images from Pexels
- **Graceful Fallbacks**: Cache → API → Demo content

### **Performance**
- **Cache-First Loading**: 0ms load time for cached content
- **Background Processing**: Fetches content every 30 minutes
- **Offline Support**: Works without internet connection
- **90%+ Cache Hit Rate**: After initial warming period
├── background.js          # Background script
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon128.png
│   └── generate_icons.py  # Icon generator script
└── README.md              # This file
```

## 🛠️ Development

### Prerequisites
- Brave or Chrome browser
- Text editor (VS Code recommended)
- Python 3.x (for icon generation)

### Local Development
1. Clone the repository
2. Make your changes
3. Load the extension in developer mode
4. Test your changes
5. Reload the extension after modifications

### Building Icons
```bash
cd icons/
python3 generate_icons.py
```

### API Integration
The extension uses:
- **Unsplash API**: For high-quality wallpapers
- **Quotable API**: For inspirational quotes

## 🔐 Privacy & Security

- **Local Storage**: All settings are stored locally in your browser
- **API Keys**: Your Unsplash API key is stored securely and never shared
- **No Tracking**: We don't collect or transmit any personal data
- **HTTPS Only**: All API requests use secure HTTPS connections

## 🎨 Customization

### Search Terms
You can customize the types of wallpapers by modifying search terms in settings:
- `cute, adorable, kawaii` - For cute imagery
- `nature, landscape, forest` - For nature scenes
- `animals, pets, cats, dogs` - For animal photos
- `flowers, botanical, garden` - For floral images

### Auto-Refresh
Configure automatic wallpaper changes:
- Every 15 minutes
- Every 30 minutes (default)
- Every hour
- Every 2 hours
- Every 6 hours

## 🐛 Troubleshooting

### Common Issues

**"No wallpaper loading"**
- Check your internet connection
- Verify your Unsplash API key in settings
- Try refreshing the page

**"API key not working"**
- Make sure you copied the "Access Key" (not the "Secret Key")
- Check that your Unsplash application is active
- Verify the key format (should be 43 characters)

**"Extension not loading"**
- Ensure developer mode is enabled
- Try reloading the extension
- Check the browser console for errors

**"Search not working"**
- Make sure you have a valid API key
- Try different search terms
- Check your internet connection

### Debug Mode
Open browser developer tools (F12) and check the console for error messages.

## 📝 API Limits

### Unsplash API (Free Tier)
- 50 requests per hour
- 5,000 requests per month
- Perfect for personal use

### Quotable API
- No authentication required
- No rate limits for reasonable usage

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Ideas for Contributions
- Additional quote sources
- More search categories
- Improved UI/UX
- Performance optimizations
- New customization options

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Unsplash](https://unsplash.com) - For providing beautiful, free-to-use photos
- [Quotable](https://quotable.io) - For inspirational quotes API
- All the amazing photographers who share their work on Unsplash

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Open an issue on GitHub
3. Make sure to include:
   - Browser version
   - Extension version
   - Error messages (if any)
   - Steps to reproduce the issue

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Unsplash integration
- Quote display
- Search functionality
- Auto-refresh options
- Responsive design
- Settings page

---
