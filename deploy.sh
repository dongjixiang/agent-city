#!/bin/bash
# Agent City Deployment Script
# Deploy to production server 47.77.238.56

set -e

REMOTE_HOST="root@47.77.238.56"
REMOTE_PATH="/root/agent-city"
LOCAL_PATH="/c/Users/swede/.openclaw/workspace-arch/agent-city"

echo "=============================="
echo " Agent City Deploy Script"
echo "=============================="
echo

# 检查 rsync
if ! command -v rsync &> /dev/null; then
    echo "[ERROR] rsync not found. Please install rsync."
    exit 1
fi

# 检查 SSH key
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "[ERROR] SSH key not found at ~/.ssh/id_rsa"
    exit 1
fi

echo "[1/5] Creating remote directory..."
ssh $REMOTE_HOST "mkdir -p $REMOTE_PATH"
echo

echo "[2/5] Syncing files to remote server..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '*.log' \
    --exclude 'tmp/' \
    --exclude 'data/*.json' \
    $LOCAL_PATH/ $REMOTE_HOST:$REMOTE_PATH/
echo

echo "[3/5] Installing dependencies on remote..."
ssh $REMOTE_HOST "cd $REMOTE_PATH && npm install --production"
echo

echo "[4/5] Checking server status..."
ssh $REMOTE_HOST "cd $REMOTE_PATH && pkill -f 'node server' 2>/dev/null || true; sleep 1"
echo

echo "[5/5] Starting server..."
ssh $REMOTE_HOST "cd $REMOTE_PATH && chmod +x start-server.sh && ./start-server.sh production &"
echo

echo "=============================="
echo " Deployment Complete!"
echo "=============================="
echo
echo "Server should be running at:"
echo "  ws://47.77.238.56:9876  - WebSocket"
echo "  http://47.77.238.56:9877 - HTTP API"
echo
echo "Check logs: ssh $REMOTE_HOST 'tail -f /tmp/agent-city.log'"
