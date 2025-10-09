#!/bin/bash

# Random Wallpaper Extension - Setup Script
# This script helps you set up the extension quickly

echo "🎨 Random Wallpaper Extension Setup"
echo "===================================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    echo "Please install Node.js and npm first: https://nodejs.org/"
    exit 1
fi

echo "✅ npm found: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Dependencies installed!"
echo ""

# Build the extension
echo "🔨 Building extension..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""

# Final instructions
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo ""
echo "1. Load the extension in your browser:"
echo "   Chrome/Brave/Edge:"
echo "     → Navigate to chrome://extensions/"
echo "     → Enable 'Developer mode' (top right)"
echo "     → Click 'Load unpacked'"
echo "     → Select the 'dist' folder"
echo ""
echo "   Firefox:"
echo "     → Navigate to about:debugging#/runtime/this-firefox"
echo "     → Click 'Load Temporary Add-on'"
echo "     → Select 'dist/manifest.json'"
echo ""
echo "2. Open a new tab - you'll see 20 beautiful fallback images!"
echo ""
echo "3. (Optional) Configure API keys for more variety:"
echo "   → Right-click extension icon → Options"
echo "   → Add API keys from:"
echo "     • Unsplash: https://unsplash.com/developers"
echo "     • Pexels: https://www.pexels.com/api/"
echo "   → Test keys and save"
echo "   → Extension will fetch 30-80 fresh images immediately!"
echo ""
echo "✨ Features:"
echo "   • Works immediately (no API keys required)"
echo "   • 20 fallback images included"
echo "   • Auto-refresh every 6 hours"
echo "   • Digital clock display"
echo "   • Configurable settings via Options page"
echo ""
echo "📚 Documentation:"
echo "   • QUICKSTART.md - Quick setup guide"
echo "   • README.md - Full documentation"
echo "   • ARCHITECTURE.md - Technical details"
echo "   • CHANGELOG.md - Version history"
echo ""
echo "Happy browsing! 🚀"
