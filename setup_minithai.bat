@echo off
:: ============================================
:: miniThai Setup - First Time Installation
:: ============================================
:: This script performs initial setup including:
:: - Node.js and npm verification
:: - Dependency installation
:: - Environment configuration
:: - Project structure validation

setlocal enabledelayedexpansion
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Set color variables
set "COLOR_RED=<NUL set /p=!ESC![91m"
set "COLOR_GREEN=<NUL set /p=!ESC![92m"
set "COLOR_YELLOW=<NUL set /p=!ESC![93m"
set "COLOR_RESET=<NUL set /p=!ESC![0m"
set "ESC=<NUL set /p=!ESC!["

:: Enable color support if available
<nul >&1 (echo 2>nul) && (
    <nul >&1 (echo 2>nul) && (
        echo [1/7] Enabling ANSI color support...
        reg add HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 0x1 /f >nul 2>&1
    )
)

echo.
echo ========================================
echo  %COLOR_GREEN%miniThai - Setup & Installation%COLOR_RESET%
echo ========================================
echo.

:: Check if running as administrator
echo [1/7] Checking privileges...
net session >nul 2>&1
if %errorlevel% == 0 (
    echo %COLOR_YELLOW%Running with administrator privileges%COLOR_RESET%
    set "IS_ADMIN=1"
) else (
    echo Running with standard user privileges
    set "IS_ADMIN=0"
)

:: Check if Node.js is installed
echo.
echo [2/7] Checking Node.js installation...
where node >nul 2>&1
if errorlevel 1 (
    echo %COLOR_RED%ERROR: Node.js is not installed or not in PATH%COLOR_RESET%
    echo Please install Node.js LTS from: https://nodejs.org/
    echo Recommended version: 18.x LTS or later
    pause
    exit /b 1
)

echo Node.js version: %COLOR_GREEN%!node -v!%COLOR_RESET%

:: Check if npm is installed
echo.
echo [3/7] Checking npm installation...
where npm >nul 2>&1
if errorlevel 1 (
    echo %COLOR_RED%ERROR: npm is not installed%COLOR_RESET%
    pause
    exit /b 1
)

echo npm version: %COLOR_GREEN%!npm -v!%COLOR_RESET%

:: Check Node.js version
for /f "tokens=1 delims=." %%a in ('node -v') do set "NODE_MAJOR=%%a"
set "NODE_MAJOR=!NODE_MAJOR:~1!"

if !NODE_MAJOR! LSS 16 (
    echo %COLOR_RED%WARNING: Node.js version !node -v! is not supported%COLOR_RESET%
    echo Recommended: Node.js 16.x or later
    echo.
    set /p "CONTINUE=Continue anyway? (y/N) "
    if /i not "!CONTINUE!"=="y" (
        exit /b 1
    )
)

:: Clean previous installation
echo.
echo [4/7] Preparing installation...
if exist node_modules (
    echo Removing existing node_modules...
    rmdir /s /q node_modules 2>nul
)

:: Install dependencies
echo.
echo [5/7] Installing dependencies...
call npm install --no-fund --no-audit
if errorlevel 1 (
    echo %COLOR_RED%ERROR: Failed to install dependencies%COLOR_RESET%
    echo Please check your internet connection and try again
    pause
    exit /b 1
)

echo %COLOR_GREEN%Dependencies installed successfully%COLOR_RESET%

:: Configure environment
echo.
echo [6/7] Configuring environment...
if not exist .env (
    if exist .env.example (
        echo Creating .env from .env.example...
        copy /y .env.example .env >nul
        if errorlevel 1 (
            echo %COLOR_RED%ERROR: Failed to create .env file%COLOR_RESET%
        ) else (
            echo %COLOR_GREEN%Environment file created%COLOR_RESET%
        )
    ) else (
        echo %COLOR_YELLOW%WARNING: .env.example not found. Creating basic .env...%COLOR_RESET%
        (
            echo # MiniThai Environment Configuration
            echo NODE_ENV=development
            echo PORT=3000
            echo MONGODB_URI=mongodb://localhost:27017/minithai
            echo SESSION_SECRET=your-secret-key-here
            echo CORS_ORIGIN=http://localhost:3000
        ) > .env
        if errorlevel 1 (
            echo %COLOR_RED%ERROR: Failed to create .env file%COLOR_RESET%
        ) else (
            echo %COLOR_GREEN%Basic environment file created%COLOR_RESET%
        )
    )
) else (
    echo %COLOR_YELLOW%.env already exists, skipping creation%COLOR_RESET%
)

:: Verify project structure
echo.
echo [7/7] Verifying project structure...
set "MISSING_FILES=0"

if not exist package.json (
    echo %COLOR_RED%ERROR: package.json not found%COLOR_RESET%
    set /a MISSING_FILES+=1
)

if not exist server/index.js (
    echo %COLOR_RED%ERROR: server/index.js not found%COLOR_RESET%
    set /a MISSING_FILES+=1
)

if not exist public (
    echo %COLOR_RED%ERROR: public directory not found%COLOR_RESET%
    set /a MISSING_FILES+=1
)

if !MISSING_FILES! gtr 0 (
    echo.
    echo %COLOR_RED%ERROR: Project structure verification failed with !MISSING_FILES! error(s)%COLOR_RESET%
    pause
    exit /b 1
)

echo %COLOR_GREEN%Project structure verified%COLOR_RESET%

:: Installation complete
echo.
echo ========================================
echo  %COLOR_GREEN%Setup Complete!%COLOR_RESET%
echo ========================================
echo.
echo %COLOR_GREEN%miniThai has been successfully set up!%COLOR_RESET%
echo.
echo Next steps:
echo 1. Edit the .env file to configure your environment
if "%IS_ADMIN%"=="1" (
    echo 2. Run %COLOR_YELLOW%startup_minithai.bat%COLOR_RESET% (recommended for daily use)
) else (
    echo 2. Run %COLOR_YELLOW%npm start%COLOR_RESET% to start the server
)
echo 3. Open %COLOR_YELLOW%http://localhost:3000%COLOR_RESET% in your browser
echo.
echo For development, use: %COLOR_YELLOW%npm run dev%COLOR_RESET%
echo.

:: Start the server if running as admin
if "%IS_ADMIN%"=="1" (
    echo Starting the server...
    call startup_minithai.bat
) else (
    echo %COLOR_YELLOW%Note: Run as administrator to enable automatic startup%COLOR_RESET%
    pause
)

endlocal
