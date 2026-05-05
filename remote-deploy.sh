#!/bin/bash
# Remote Deployment Script - Run this AFTER uploading files to server
# Usage: ./remote-deploy.sh

set -e

SERVER="root@47.77.238.56"
DEST="/root/agent-city"
API_KEY=${1:-""}
GROUP_ID=${2:-""}

echo "========================================"
echo "  Agent City - Remote Deployment"
echo "========================================"

# Check if SSH is available
if ! command -v ssh &> /dev/null; then
    echo "[ERROR] SSH not found. Please install OpenSSH."
    exit 1
fi

echo "[1/5] Checking server connection..."
if ! ssh -o ConnectTimeout=5 $SERVER "echo 'Connected'" 2>/dev/null; then
    echo "[ERROR] Cannot connect to server. Check your SSH configuration."
    exit 1
fi
echo "Server connection OK"

echo "[2/5] Checking directory..."
ssh $SERVER "ls -la $DEST" 2>/dev/null | head -5

echo "[3/5] Installing dependencies..."
ssh $SERVER "cd $DEST && npm install --production" 2>&1 | tail -10

echo "[4/5] Stopping old server..."
ssh $SERVER "pkill -f 'node server' 2>/dev/null || true; sleep 1"

echo "[5/5] Setting up environment..."
if [ -n "$API_KEY" ]; then
    ssh $SERVER "cd $DEST && echo 'MINIMAX_API_KEY=$API_KEY' > .env"
    ssh $SERVER "cd $DEST && echo 'MINIMAX_GROUP_ID=$GROUP_ID' >> .env"
    echo "Environment configured"
fi

echo ""
echo "========================================"
echo "  Starting Server..."
echo "========================================"

# Start server in background
ssh $SERVER "cd $DEST && node server/index.js > /tmp/agent-city.log 2>&1 &"

sleep 2

# Check if server started
if ssh $SERVER "pgrep -f 'node server' > /dev/null"; then
    echo "[OK] Server started!"
    echo ""
    echo "Endpoints:"
    echo "  WebSocket: ws://47.77.238.56:9876"
    echo "  HTTP API:  http://47.77.238.56:9877"
    echo "  WebRTC:    ws://47.77.238.56:9878"
    echo ""
    echo "Logs: ssh $SERVER 'tail -f /tmp/agent-city.log'"
else
    echo "[ERROR] Server failed to start!"
    echo "Check logs: ssh $SERVER 'cat /tmp/agent-city.log'"
fi
