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

REM Ask user for obfuscation level
echo ========================================
echo 🔒 Build Configuration
echo ========================================
echo.
echo Select obfuscation level:
echo   1) Regular (no obfuscation) - Recommended for development
echo   2) Light - Basic obfuscation for testing
echo   3) Medium - Balanced obfuscation
echo   4) Heavy - Strong obfuscation
echo   5) Fun - Maximum obfuscation with fun mode
echo.
set /p obfuscation_choice="Enter your choice (1-5, default: 1): "

REM Set obfuscation level based on user choice
if "%obfuscation_choice%"=="2" (
    set OBFUSCATION_LEVEL=light
    echo ✅ Selected: Light obfuscation
) else if "%obfuscation_choice%"=="3" (
    set OBFUSCATION_LEVEL=medium
    echo ✅ Selected: Medium obfuscation
) else if "%obfuscation_choice%"=="4" (
    set OBFUSCATION_LEVEL=heavy
    echo ✅ Selected: Heavy obfuscation
) else if "%obfuscation_choice%"=="5" (
    set OBFUSCATION_LEVEL=fun
    echo ✅ Selected: Fun obfuscation (maximum + fun mode)
) else (
    set OBFUSCATION_LEVEL=regular
    echo ✅ Selected: Regular build (no obfuscation)
)

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
echo    • Permanent cache mode for storing images forever
echo    • Optimized performance with smart caching
echo.
echo ========================================
echo 🔒 Build Information:
echo ========================================
if not "%OBFUSCATION_LEVEL%"=="regular" (
    echo    • Obfuscation: %OBFUSCATION_LEVEL%
    echo    • Code protection enabled for deployment
) else (
    echo    • Standard build (readable source code)
    echo    • Ideal for development and debugging
)
echo.
echo ========================================
echo 💡 Rebuild Tips:
echo ========================================
echo    To rebuild with different obfuscation:
echo    Set OBFUSCATION_LEVEL environment variable:
echo      • set OBFUSCATION_LEVEL=regular ^&^& npm run build
echo      • set OBFUSCATION_LEVEL=light ^&^& npm run build
echo      • set OBFUSCATION_LEVEL=medium ^&^& npm run build
echo      • set OBFUSCATION_LEVEL=heavy ^&^& npm run build
echo      • set OBFUSCATION_LEVEL=fun ^&^& npm run build
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
