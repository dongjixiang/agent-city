#!/bin/bash
# Agent City Server Startup Script
# Usage: ./start-server.sh [env]
#   env: development, production (default: development)

ENV=${1:-development}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "=============================="
echo " Agent City Server"
echo " Environment: $ENV"
echo "=============================="

# 设置 Node.js 环境
export NODE_ENV=$ENV

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found. Please install Node.js first."
    exit 1
fi

echo "Node version: $(node --version)"
echo

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing dependencies..."
    npm install
fi

# 清理旧进程
echo "[INFO] Cleaning up old processes..."
pkill -f "node server/index.js" 2>/dev/null || true
sleep 1

# 根据环境启动
if [ "$ENV" == "production" ]; then
    echo "[INFO] Starting in production mode..."
    
    # 使用 pm2 或 nohup
    if command -v pm2 &> /dev/null; then
        pm2 start server/index.js --name agent-city
        pm2 save
    else
        nohup node server/index.js > /tmp/agent-city.log 2>&1 &
        echo $! > /tmp/agent-city.pid
        echo "[INFO] Server PID: $(cat /tmp/agent-city.pid)"
    fi
else
    echo "[INFO] Starting in development mode..."
    node server/index.js
fi

echo
echo "[OK] Server starting..."
echo
echo "Endpoints:"
echo "  ws://localhost:9876    - WebSocket"
echo "  http://localhost:9877  - HTTP API"
echo "  http://localhost:9878  - WebRTC Signaling"
echo
