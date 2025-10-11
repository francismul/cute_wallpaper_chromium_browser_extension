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

# Ask user for obfuscation level
echo "🔒 Build Configuration"
echo "======================"
echo ""
echo "Select obfuscation level:"
echo "  1) Regular (no obfuscation) - Recommended for development"
echo "  2) Light - Basic obfuscation for testing"
echo "  3) Medium - Balanced obfuscation"
echo "  4) Heavy - Strong obfuscation"
echo "  5) Fun - Maximum obfuscation with fun mode"
echo ""
read -p "Enter your choice (1-5, default: 1): " obfuscation_choice

# Set obfuscation level based on user choice
case "$obfuscation_choice" in
    2)
        export OBFUSCATION_LEVEL="light"
        echo "✅ Selected: Light obfuscation"
        ;;
    3)
        export OBFUSCATION_LEVEL="medium"
        echo "✅ Selected: Medium obfuscation"
        ;;
    4)
        export OBFUSCATION_LEVEL="heavy"
        echo "✅ Selected: Heavy obfuscation"
        ;;
    5)
        export OBFUSCATION_LEVEL="fun"
        echo "✅ Selected: Fun obfuscation (maximum + fun mode)"
        ;;
    *)
        export OBFUSCATION_LEVEL="regular"
        echo "✅ Selected: Regular build (no obfuscation)"
        ;;
esac

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
echo "   • Permanent cache mode for storing images forever"
echo "   • Optimized performance with smart caching"
echo ""
echo "🔒 Build Information:"
if [ "$OBFUSCATION_LEVEL" != "regular" ]; then
    echo "   • Obfuscation: $OBFUSCATION_LEVEL"
    echo "   • Code protection enabled for deployment"
else
    echo "   • Standard build (readable source code)"
    echo "   • Ideal for development and debugging"
fi
echo ""
echo "💡 Tip: To rebuild with different obfuscation:"
echo "   Set OBFUSCATION_LEVEL environment variable:"
echo "   • OBFUSCATION_LEVEL=regular npm run build"
echo "   • OBFUSCATION_LEVEL=light npm run build"
echo "   • OBFUSCATION_LEVEL=medium npm run build"
echo "   • OBFUSCATION_LEVEL=heavy npm run build"
echo "   • OBFUSCATION_LEVEL=fun npm run build"
echo ""
echo "📚 Documentation:"
echo "   • QUICKSTART.md - Quick setup guide"
echo "   • README.md - Full documentation"
echo "   • ARCHITECTURE.md - Technical details"
echo "   • CHANGELOG.md - Version history"
echo ""
echo "Happy browsing! 🚀"
