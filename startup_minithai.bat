@echo off
REM ============================================
REM miniThai Startup - Daily Operations
REM ============================================
REM This script starts the miniThai application
REM Run this daily instead of running setup again

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ========================================
echo  miniThai - Starting Server
echo ========================================
echo.

REM Verify setup has been completed
echo Checking prerequisites...
if not exist node_modules (
  echo ERROR: Dependencies not installed
  echo Please run setup_minithai.bat first
  pause
  exit /b 1
)

if not exist .env (
  echo ERROR: Environment file not found
  echo Please run setup_minithai.bat first
  pause
  exit /b 1
)

REM Read PORT from .env file
echo Reading configuration...
set PORT=3000
for /f "tokens=1,2 delims==" %%A in ('type .env ^| findstr /R "^PORT="') do (
  set PORT=%%B
)

REM Verify server file exists
if not exist server/index.js (
  echo ERROR: Server file not found at server/index.js
  pause
  exit /b 1
)

REM Start the application
echo.
echo Starting miniThai server on port %PORT%...
echo.
echo Server URL: http://localhost:%PORT%
echo.
echo Press Ctrl+C to stop the server
echo.

REM Open browser (with a slight delay for server startup)
timeout /t 2 /nobreak >nul
start "" http://localhost:%PORT%

REM Start development server
npm run dev

endlocal
