@echo off
setlocal enabledelayedexpansion
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Enable ANSI colors support
reg add HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 0x1 /f >nul 2>&1

:: Create escape character using PowerShell
for /f %%A in ('powershell -Command "[char]27"') do set "ESC=%%A"

:: Define ANSI color codes
set "GREEN=!ESC![92m"
set "YELLOW=!ESC![93m"
set "RED=!ESC![91m"
set "RESET=!ESC![0m"

echo.
echo ========================================
echo %GREEN%miniThai Setup Wizard%RESET%
echo ========================================
echo.

:: Check if running as administrator
echo %GREEN%[OK]%RESET% Checking privileges...
net session >nul 2>&1
if %errorlevel% == 0 (
    echo   Administrator privileges detected
    set "IS_ADMIN=1"
) else (
    echo   Standard user privileges
    set "IS_ADMIN=0"
)

:: Check if Node.js is installed
echo.
echo %GREEN%[OK]%RESET% Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo %RED%[FAIL]%RESET% Node.js not found
    echo   Please install Node.js from: https://nodejs.org/ ^(version 16+^)
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('node -v') do set "NODE_VERSION=%%a"
echo   Found: %NODE_VERSION%

:: Check if npm is installed
echo.
echo %GREEN%[OK]%RESET% Checking npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo %RED%[FAIL]%RESET% npm not found
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('npm -v') do set "NPM_VERSION=%%a"
echo   Found: npm %NPM_VERSION%

:: Prepare and install dependencies
echo.
echo %GREEN%[OK]%RESET% Preparing installation...

set "NEEDS_REINSTALL=0"

:: Check if node_modules exists with package-lock.json
if exist node_modules (
    if exist package-lock.json (
        echo   Existing dependencies found
        echo   Verifying consistency with package-lock.json...
        call npm ci --no-fund --no-audit >nul 2>&1
        if errorlevel 1 (
            echo   Dependencies out of sync, reinstalling...
            set "NEEDS_REINSTALL=1"
        ) else (
            echo   Dependencies are up-to-date
        )
    ) else (
        echo   Dependencies found but package-lock.json missing
        set "NEEDS_REINSTALL=1"
    )
) else (
    echo   No existing dependencies found
    set "NEEDS_REINSTALL=1"
)

if !NEEDS_REINSTALL! equ 1 (
    echo.
    echo %GREEN%[OK]%RESET% Installing dependencies...
    if exist node_modules (
        echo   Removing old installation...
        rmdir /s /q node_modules >nul 2>&1
    )
    if exist package-lock.json (
        del /q package-lock.json >nul 2>&1
    )
    call npm install --no-fund --no-audit
    if errorlevel 1 (
        echo.
        echo %RED%[FAIL]%RESET% Installation failed
        echo   Check your internet connection and try again
        echo.
        pause
        exit /b 1
    )
    echo   %GREEN%Dependencies installed successfully%RESET%
) else (
    echo   %GREEN%Dependencies already up-to-date%RESET%
)

:: Configure environment
echo.
echo %GREEN%[OK]%RESET% Configuring environment...
if not exist .env (
    if exist .env.example (
        echo   Creating .env file...
        copy /y .env.example .env >nul
        if errorlevel 1 (
            echo %YELLOW%   Warning: Could not copy .env.example%RESET%
        ) else (
            echo   %GREEN%.env created successfully%RESET%
        )
    ) else (
        echo   Creating basic .env file...
        (
            echo # MiniThai Configuration
            echo NODE_ENV=development
            echo PORT=3000
            echo MONGODB_URI=mongodb://localhost:27017/minithai
            echo SESSION_SECRET=your-secret-key-here
        ) > .env
        if errorlevel 1 (
            echo %YELLOW%   Warning: Could not create .env%RESET%
        ) else (
            echo   %GREEN%.env created successfully%RESET%
        )
    )
) else (
    echo   .env already exists
)

:: Verify project structure
echo.
echo %GREEN%[OK]%RESET% Verifying project...
set "MISSING_FILES=0"

if not exist package.json (
    echo %RED%   [FAIL]%RESET% package.json not found
    set /a MISSING_FILES+=1
)

if not exist server\index.js (
    echo %RED%   [FAIL]%RESET% server/index.js not found
    set /a MISSING_FILES+=1
)

if not exist public (
    echo %RED%   [FAIL]%RESET% public directory not found
    set /a MISSING_FILES+=1
)

if !MISSING_FILES! gtr 0 (
    echo.
    echo %RED%[FAIL]%RESET% Project verification failed
    echo.
    pause
    exit /b 1
)

echo   All checks passed!

:: Setup complete
echo.
echo ========================================
echo %GREEN%Setup Complete!%RESET%
echo ========================================
echo.
echo %GREEN%miniThai is ready to use.%RESET%
echo.
echo Next steps:
echo   1. Edit .env to configure your environment
if "%IS_ADMIN%"=="1" (
    echo   2. Run: startup_minithai.bat
) else (
    echo   2. Run: npm start
)
echo   3. Open: http://localhost:3000
echo.
echo For development: npm run dev
echo.
if "%IS_ADMIN%"=="1" (
    timeout /t 3 /nobreak
    call startup_minithai.bat
) else (
    echo %YELLOW%Press any key to close this window...%RESET%
    pause >nul
)

endlocal
