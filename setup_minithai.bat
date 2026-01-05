@echo off
REM ============================================
REM miniThai Setup - First Time Installation
REM ============================================
REM This script should be run once during initial
REM deployment or when reinstalling dependencies

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ========================================
echo  miniThai - Setup & Installation
echo ========================================
echo.

REM Check if Node.js is installed
echo [1/5] Checking Node.js installation...
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH
  echo Please install Node.js from https://nodejs.org/
  pause
  exit /b 1
)
echo Node.js found: & node --version

REM Check if npm is installed
echo.
echo [2/5] Checking npm installation...
where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm is not installed
  pause
  exit /b 1
)
echo npm found: & npm --version

REM Install dependencies
echo.
echo [3/5] Installing dependencies...
if exist node_modules (
  echo node_modules already exists. Cleaning...
  rmdir /s /q node_modules >nul 2>nul
)
call npm install
if errorlevel 1 (
  echo ERROR: npm install failed
  pause
  exit /b 1
)
echo Dependencies installed successfully

REM Create .env file from template
echo.
echo [4/5] Configuring environment...
if not exist .env (
  if exist .env.example (
    echo Creating .env from .env.example...
    copy .env.example .env >nul
    echo Environment file created
  ) else (
    echo WARNING: .env.example not found. Creating basic .env...
    (
      echo PORT=3000
      echo NODE_ENV=development
    ) > .env
  )
) else (
  echo .env already exists, skipping
)

REM Verify essential files
echo.
echo [5/5] Verifying project structure...
if not exist package.json (
  echo ERROR: package.json not found
  pause
  exit /b 1
)
if not exist server/index.js (
  echo ERROR: server/index.js not found
  pause
  exit /b 1
)
if not exist public (
  echo ERROR: public directory not found
  pause
  exit /b 1
)
echo Project structure verified

REM Installation complete
echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: startup_minithai.bat (for daily operations)
echo 2. OR run: npm run dev (for development)
echo.
pause
endlocal
