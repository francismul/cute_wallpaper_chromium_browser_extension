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

# Check if API keys are configured
if grep -q "YOUR_UNSPLASH_ACCESS_KEY" src/content/api.ts && grep -q "YOUR_PEXELS_API_KEY" src/content/api.ts; then
    echo "⚠️  API keys not configured yet!"
    echo ""
    echo "To configure:"
    echo "1. Get Unsplash API key: https://unsplash.com/developers"
    echo "2. Get Pexels API key: https://www.pexels.com/api/"
    echo "3. Edit src/content/api.ts and add your keys"
    echo ""
    echo "Or use mock data for testing:"
    echo "- See src/content/api-mock.ts for instructions"
    echo ""
else
    echo "✅ API keys appear to be configured!"
    echo ""
fi

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
echo "1. Load the extension in your browser:"
echo "   Chrome: chrome://extensions/ → Load unpacked → Select 'dist' folder"
echo "   Firefox: about:debugging → Load Temporary Add-on → Select 'dist/manifest.json'"
echo ""
echo "2. Open a new tab to see your wallpaper!"
echo ""
echo "📚 Documentation:"
echo "- QUICKSTART.md - Quick setup guide"
echo "- README.md - Full documentation"
echo "- ARCHITECTURE.md - Technical details"
echo ""
echo "Happy browsing! 🚀"
