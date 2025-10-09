@echo off
REM Random Wallpaper Extension - Setup Script for Windows
REM This script helps you set up the extension quickly

echo.
echo ========================================
echo 🎨 Random Wallpaper Extension Setup
echo ========================================
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: npm is not installed
    echo Please install Node.js and npm first: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Get npm version
for /f "delims=" %%i in ('npm --version') do set npm_version=%%i
echo ✅ npm found: %npm_version%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed!
echo.

REM Build the extension
echo 🔨 Building extension...
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo ✅ Build successful!
echo.

REM Final instructions
echo ========================================
echo 🎉 Setup Complete!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Load the extension in your browser:
echo.
echo    Chrome/Brave/Edge:
echo      → Navigate to chrome://extensions/
echo      → Enable 'Developer mode' (top right toggle)
echo      → Click 'Load unpacked'
echo      → Select the 'dist' folder in this directory
echo.
echo    Firefox:
echo      → Navigate to about:debugging#/runtime/this-firefox
echo      → Click 'Load Temporary Add-on'
echo      → Select 'dist/manifest.json' file
echo.
echo 2. Open a new tab - you'll see 20 beautiful fallback images!
echo.
echo 3. (Optional) Configure API keys for more variety:
echo    → Right-click extension icon → Options
echo    → Add API keys from:
echo      • Unsplash: https://unsplash.com/developers
echo      • Pexels: https://www.pexels.com/api/
echo    → Test keys and save
echo    → Extension will fetch 30-80 fresh images immediately!
echo.
echo ========================================
echo ✨ Features:
echo ========================================
echo    • Works immediately (no API keys required)
echo    • 20 fallback images included
echo    • Auto-refresh every 6 hours
echo    • Digital clock display
echo    • Configurable settings via Options page
echo.
echo ========================================
echo 📚 Documentation:
echo ========================================
echo    • QUICKSTART.md - Quick setup guide
echo    • README.md - Full documentation
echo    • ARCHITECTURE.md - Technical details
echo    • CHANGELOG.md - Version history
echo.
echo Happy browsing! 🚀
echo.
pause
