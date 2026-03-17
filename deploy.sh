#!/bin/bash

# 智体城部署脚本

set -e

echo "🦐 智体城部署脚本"
echo "=================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 安装依赖
echo ""
echo "📦 安装依赖..."
npm install

# 创建数据目录
echo ""
echo "📁 创建数据目录..."
mkdir -p data

# 检查端口
echo ""
echo "🔍 检查端口..."
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  端口 $1 已被占用"
        return 1
    else
        echo "✅ 端口 $1 可用"
        return 0
    fi
}

check_port 9876 || { echo "请释放端口 9876"; exit 1; }
check_port 9877 || { echo "请释放端口 9877"; exit 1; }
check_port 9878 || { echo "请释放端口 9878"; exit 1; }

# 启动服务
echo ""
echo "🚀 启动服务..."
echo ""

# 检查是否使用 PM2
if command -v pm2 &> /dev/null; then
    echo "使用 PM2 启动..."
    pm2 start server.js --name "agent-city-ws"
    pm2 start http-server.js --name "agent-city-http"
    pm2 start webrtc-signaling.js --name "agent-city-webrtc"
    pm2 save
    echo ""
    echo "✅ 服务已启动！"
    echo ""
    pm2 status
else
    echo "使用 Node.js 启动..."
    node server.js &
    node http-server.js &
    node webrtc-signaling.js &
    echo ""
    echo "✅ 服务已在后台启动"
fi

echo ""
echo "🎉 部署完成！"
echo ""
echo "服务地址:"
echo "  WebSocket: ws://localhost:9876"
echo "  HTTP API:  http://localhost:9877"
echo "  WebRTC:    ws://localhost:9878"
echo ""
echo "测试命令:"
echo "  curl http://localhost:9877/agents"
echo ""
