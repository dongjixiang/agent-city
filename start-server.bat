@echo off
REM Agent City Server Startup Script
REM Usage: start-server.bat [env]
REM   env: development, production (default: development)

setlocal

set ENV=%~1
if "%ENV%"=="" set ENV=development

set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"

echo ===============================
echo  Agent City Server
echo  Environment: %ENV%
echo ===============================

REM 设置 Node.js 环境
set NODE_ENV=%ENV%

REM 检查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found. Please install Node.js first.
    exit /b 1
)

REM 显示 Node 版本
echo Node version: 
node --version
echo.

REM 检查依赖
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
)

REM 根据环境启动
if "%ENV%"=="production" (
    echo [INFO] Starting in production mode...
    REM 使用 pm2 或直接运行
    if exist "pm2" (
        pm2 start server/index.js --name agent-city
    ) else (
        start "Agent City Server" cmd /c "node server/index.js"
    )
) else (
    echo [INFO] Starting in development mode...
    start "Agent City Dev Server" cmd /c "node server/index.js"
)

echo.
echo [OK] Server starting...
echo.
echo Quick commands:
echo   ws://localhost:9876    - WebSocket
echo   http://localhost:9877  - HTTP API
echo.
echo Press Ctrl+C to stop, or close this window.
echo.

REM 保持窗口
pause >nul
