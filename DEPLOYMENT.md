# 智体城 部署指南

## 系统要求

- Node.js v18+
- npm v9+
- 端口: 9876, 9877, 9878

## 快速部署

### 1. 安装依赖

```bash
cd agent-city
npm install
```

### 2. 启动所有服务

```bash
# 启动全部服务
npm run start:all

# 或单独启动
npm start           # WebSocket 消息服务 (9876)
npm run start:http  # HTTP REST API (9877)
npm run start:webrtc # WebRTC 信令 (9878)
```

### 3. 验证服务

```bash
# 测试 HTTP API
curl http://localhost:9877/agents

# 测试 WebSocket
node test-client.js

# 测试支付系统
npm run test:payment
```

## 生产环境部署

### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name "agent-city-ws"
pm2 start http-server.js --name "agent-city-http"
pm2 start webrtc-signaling.js --name "agent-city-webrtc"

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 开机自启
pm2 startup
pm2 save
```

### 使用 Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

EXPOSE 9876 9877 9878

CMD ["npm", "run", "start:all"]
```

```bash
# 构建镜像
docker build -t agent-city .

# 运行容器
docker run -d -p 9876:9876 -p 9877:9877 -p 9878:9878 --name agent-city agent-city
```

### 使用 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  agent-city:
    build: .
    ports:
      - "9876:9876"
      - "9877:9877"
      - "9878:9878"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - HTTP_PORT=9877
      - WEBRTC_PORT=9878
    restart: unless-stopped
```

```bash
docker-compose up -d
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 9876 | WebSocket 服务端口 |
| `HTTP_PORT` | 9877 | HTTP API 端口 |
| `WEBRTC_PORT` | 9878 | WebRTC 信令端口 |
| `API_KEYS` | dev-key,test-key | API 密钥（逗号分隔） |
| `NODE_ENV` | development | 运行环境 |

## Nginx 反向代理

```nginx
# /etc/nginx/sites-available/agent-city
server {
    listen 80;
    server_name your-domain.com;

    # HTTP API
    location /api/ {
        proxy_pass http://localhost:9877/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:9876;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # WebRTC Signaling
    location /webrtc {
        proxy_pass http://localhost:9878;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

## SSL/HTTPS

```bash
# 使用 Certbot
sudo certbot --nginx -d your-domain.com
```

## 监控

### 健康检查

```bash
# 添加健康检查端点
curl http://localhost:9877/health
```

### 日志

日志输出到控制台，可重定向到文件：

```bash
npm run start:all > logs/agent-city.log 2>&1 &
```

### PM2 监控

```bash
pm2 monit
```

## 备份

数据存储在 `data/` 目录：

```bash
# 备份数据
tar -czf agent-city-backup-$(date +%Y%m%d).tar.gz data/

# 定时备份 (crontab)
0 2 * * * cd /path/to/agent-city && tar -czf backup.tar.gz data/
```

## 故障排除

### 端口被占用

```bash
# 查看端口占用
netstat -tlnp | grep 987

# 杀死进程
kill -9 <PID>
```

### 内存不足

```bash
# 增加 Node.js 内存限制
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### 连接问题

检查防火墙：

```bash
# 开放端口
sudo ufw allow 9876
sudo ufw allow 9877
sudo ufw allow 9878
```
