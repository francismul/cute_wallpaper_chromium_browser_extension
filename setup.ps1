# Random Wallpaper Extension - Setup Script for Windows PowerShell
# This script helps you set up the extension quickly

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎨 Random Wallpaper Extension Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if npm is installed
$npmPath = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmPath) {
    Write-Host "❌ Error: npm is not installed" -ForegroundColor Red
    Write-Host "Please install Node.js and npm first: https://nodejs.org/"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

$npmVersion = npm --version
Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "✅ Dependencies installed!" -ForegroundColor Green
Write-Host ""

# Ask user for obfuscation level
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔒 Build Configuration" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Select obfuscation level:" -ForegroundColor White
Write-Host "  1) Regular (no obfuscation) - Recommended for development" -ForegroundColor Gray
Write-Host "  2) Light - Basic obfuscation for testing" -ForegroundColor Gray
Write-Host "  3) Medium - Balanced obfuscation" -ForegroundColor Gray
Write-Host "  4) Heavy - Strong obfuscation" -ForegroundColor Gray
Write-Host "  5) Fun - Maximum obfuscation with fun mode" -ForegroundColor Gray
Write-Host ""
$obfuscationChoice = Read-Host "Enter your choice (1-5, default: 1)"

# Set obfuscation level based on user choice
switch ($obfuscationChoice) {
    "2" {
        $env:OBFUSCATION_LEVEL = "light"
        Write-Host "✅ Selected: Light obfuscation" -ForegroundColor Green
    }
    "3" {
        $env:OBFUSCATION_LEVEL = "medium"
        Write-Host "✅ Selected: Medium obfuscation" -ForegroundColor Green
    }
    "4" {
        $env:OBFUSCATION_LEVEL = "heavy"
        Write-Host "✅ Selected: Heavy obfuscation" -ForegroundColor Green
    }
    "5" {
        $env:OBFUSCATION_LEVEL = "fun"
        Write-Host "✅ Selected: Fun obfuscation (maximum + fun mode)" -ForegroundColor Green
    }
    default {
        $env:OBFUSCATION_LEVEL = "regular"
        Write-Host "✅ Selected: Regular build (no obfuscation)" -ForegroundColor Green
    }
}

Write-Host ""

# Build the extension
Write-Host "🔨 Building extension..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Final instructions
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Load the extension in your browser:" -ForegroundColor White
Write-Host ""
Write-Host "   Chrome/Brave/Edge:" -ForegroundColor Cyan
Write-Host "     → Navigate to chrome://extensions/"
Write-Host "     → Enable 'Developer mode' (top right toggle)"
Write-Host "     → Click 'Load unpacked'"
Write-Host "     → Select the 'dist' folder in this directory"
Write-Host ""
Write-Host "   Firefox:" -ForegroundColor Cyan
Write-Host "     → Navigate to about:debugging#/runtime/this-firefox"
Write-Host "     → Click 'Load Temporary Add-on'"
Write-Host "     → Select 'dist/manifest.json' file"
Write-Host ""
Write-Host "2. Open a new tab - you'll see 20 beautiful fallback images!" -ForegroundColor White
Write-Host ""
Write-Host "3. (Optional) Configure API keys for more variety:" -ForegroundColor White
Write-Host "   → Right-click extension icon → Options"
Write-Host "   → Add API keys from:"
Write-Host "     • Unsplash: https://unsplash.com/developers"
Write-Host "     • Pexels: https://www.pexels.com/api/"
Write-Host "   → Test keys and save"
Write-Host "   → Extension will fetch 30-80 fresh images immediately!"
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✨ Features:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   • Works immediately (no API keys required)"
Write-Host "   • 20 fallback images included"
Write-Host "   • Auto-refresh every 6 hours"
Write-Host "   • Digital clock display"
Write-Host "   • Configurable settings via Options page"
Write-Host "   • Permanent cache mode for storing images forever"
Write-Host "   • Optimized performance with smart caching"
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔒 Build Information:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
if ($env:OBFUSCATION_LEVEL -ne "regular") {
    Write-Host "   • Obfuscation: $($env:OBFUSCATION_LEVEL)" -ForegroundColor Cyan
    Write-Host "   • Code protection enabled for deployment" -ForegroundColor Green
} else {
    Write-Host "   • Standard build (readable source code)" -ForegroundColor Gray
    Write-Host "   • Ideal for development and debugging" -ForegroundColor Gray
}
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "💡 Rebuild Tips:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   To rebuild with different obfuscation:" -ForegroundColor White
Write-Host "   Set OBFUSCATION_LEVEL environment variable:"
Write-Host "     • `$env:OBFUSCATION_LEVEL='regular'; npm run build"
Write-Host "     • `$env:OBFUSCATION_LEVEL='light'; npm run build"
Write-Host "     • `$env:OBFUSCATION_LEVEL='medium'; npm run build"
Write-Host "     • `$env:OBFUSCATION_LEVEL='heavy'; npm run build"
Write-Host "     • `$env:OBFUSCATION_LEVEL='fun'; npm run build"
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   • QUICKSTART.md - Quick setup guide"
Write-Host "   • README.md - Full documentation"
Write-Host "   • ARCHITECTURE.md - Technical details"
Write-Host "   • CHANGELOG.md - Version history"
Write-Host ""
Write-Host "Happy browsing! 🚀" -ForegroundColor Magenta
Write-Host ""
Read-Host "Press Enter to exit"
