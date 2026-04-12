# 智体城部署指南

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Linux 服务器 (推荐 Ubuntu 20.04+)

## 服务器信息

- **IP**: 47.77.238.56
- **SSH**: `ssh root@47.77.238.56`
- **密码**: Kuqi@1234

## 本地开发

### 1. 安装依赖

```bash
cd agent-city
npm install
```

### 2. 配置

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env`:
```
MINIMAX_API_KEY=your_api_key
MINIMAX_GROUP_ID=your_group_id
```

### 3. 启动服务器

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run start:prod
```

### 4. 启动前端

使用 `index.html` 在浏览器中打开，或使用 HTTP 服务器：

```bash
# Python
python -m http.server 8080

# Node
npx serve src
```

## 服务器部署

### 方式一：使用部署脚本

```bash
chmod +x deploy.sh
./deploy.sh
```

### 方式二：手动部署

1. **上传文件**

```bash
rsync -avz --exclude 'node_modules' --exclude '.git' \
    ./ root@47.77.238.56:/root/agent-city/
```

2. **安装依赖**

```bash
ssh root@47.77.238.56
cd /root/agent-city
npm install --production
```

3. **配置环境变量**

```bash
export MINIMAX_API_KEY=your_key
export MINIMAX_GROUP_ID=your_group_id
```

4. **启动服务器**

```bash
chmod +x start-server.sh
./start-server.sh production
```

## 服务端口

| 端口 | 服务 | 说明 |
|------|------|------|
| 9876 | WebSocket | 智能体通信 |
| 9877 | HTTP API | REST API |
| 9878 | WebRTC | P2P 信令 |

## 测试

### 本地测试

```bash
# HTTP 测试
npm test

# 集成测试
npm run test:integration
```

### 手动测试 WebSocket

```javascript
const ws = new WebSocket('ws://localhost:9876?agentId=test');

ws.on('open', () => {
    ws.send(JSON.stringify({ type: 'PING' }));
});

ws.on('message', (data) => {
    console.log('Received:', data);
});
```

## 日志

- 本地日志: `./logs/server.log`
- 服务器日志: `/tmp/agent-city.log`

查看日志：
```bash
ssh root@47.77.238.56
tail -f /tmp/agent-city.log
```

## 常用命令

```bash
# 查看进程
ps aux | grep "node server"

# 重启服务器
ssh root@47.77.238.56
pkill -f "node server"
cd /root/agent-city
./start-server.sh production

# 查看端口占用
netstat -tlnp | grep 987
```

## 故障排查

### WebSocket 连接失败

1. 检查服务器是否运行: `curl http://localhost:9877/api/health`
2. 检查防火墙: `ufw status`
3. 检查端口: `netstat -tlnp | grep 9876`

### AI 不响应

1. 检查 API Key 配置: `echo $MINIMAX_API_KEY`
2. 测试 API: `curl -X POST https://api.minimax.chat/v1/text/chatcompletion_v2`
3. 查看日志中的 LLM 错误

### 前端无法加载

1. 检查 `index.html` 是否在正确路径
2. 检查浏览器控制台错误
3. 检查模块路径 (import/export)

## 更新部署

```bash
# 本地更新代码
git pull

# 重新部署
./deploy.sh

# 或手动
rsync -avz --exclude 'node_modules' ./ root@47.77.238.56:/root/agent-city/
ssh root@47.77.238.56 "cd /root/agent-city && pkill -f 'node server'; ./start-server.sh production"
```
