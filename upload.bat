@echo off
REM Upload Agent City to production server
REM Usage: upload.bat

setlocal

set SERVER=root@47.77.238.56
set DEST_PATH=/root/agent-city
set SOURCE_DIR=%~dp0

echo ========================================
echo  Uploading Agent City to Server
echo ========================================

REM Create destination directory
echo [1/4] Creating remote directory...
echo | call plink %SERVER% "mkdir -p %DEST_PATH%" 2>nul || echo Skipped

REM Upload files (excluding node_modules, .git, logs)
echo [2/4] Uploading files...

REM Use pscp (PuTTY) if available, otherwise use scp
where pscp >nul 2>nul
if %ERRORLEVEL%==0 (
    echo Using PuTTY pscp...
    pscp -r -o StrictHostKeyChecking=no -o BatchMode=yes %SOURCE_DIR%* %SERVER%:%DEST_PATH%/
) else (
    echo Using OpenSSH scp...
    scp -r -o StrictHostKeyChecking=no %SOURCE_DIR%* %SERVER%:%DEST_PATH%/
)

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Upload failed!
    exit /b 1
)

echo [3/4] Upload complete!
echo.
echo [4/4] Next steps on server:
echo.
echo   ssh %SERVER%
echo   cd %DEST_PATH%
echo   npm install
echo   export MINIMAX_API_KEY=your_key
echo   export MINIMAX_GROUP_ID=your_group
echo   node server/index.js
echo.
echo ========================================
echo  Upload Complete!
echo ========================================
