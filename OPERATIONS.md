# 智体城操作指南

## 目录结构

```
/root/agent-city/
├── server/           # 服务端（Node.js）
├── client/           # 客户端（3D 世界，静态文件）
├── serve-3d.js       # 3D 世界静态文件服务（端口 9999）
└── server/index.js   # 主服务器入口（端口 9876/9877）
```

---

## 端口说明

| 端口 | 服务 | 用途 |
|------|------|------|
| 9876 | WebSocket | 智能体实时通信 |
| 9877 | HTTP API | REST 接口 |
| 9999 | 3D 世界 | 浏览器访问地址 |

---

## 1. 启动

### 启动服务端（WebSocket + HTTP API）

```bash
cd /root/agent-city
nohup node server/index.js > /tmp/agent-city-server.log 2>&1 &
```

### 启动 3D 世界（静态文件服务）

```bash
cd /root/agent-city
nohup node serve-3d.js > /tmp/serve-3d.log 2>&1 &
```

---

## 2. 停止

```bash
pkill -f "node server"
pkill -f "serve-3d"
```

---

## 3. 重启（最常用）

```bash
# 停止
pkill -f "node server"
pkill -f "serve-3d"
sleep 2

# 启动服务端
cd /root/agent-city
nohup node server/index.js > /tmp/agent-city-server.log 2>&1 &

# 启动 3D 世界
nohup node serve-3d.js > /tmp/serve-3d.log 2>&1 &
```

---

## 4. 查看日志

```bash
# 服务端日志
tail -f /tmp/agent-city-server.log

# 3D 世界日志
tail -f /tmp/serve-3d.log
```

---

## 5. 查看运行状态

```bash
# 检查进程
ps aux | grep "node" | grep -v grep

# 检查端口
ss -tlnp | grep -E "9876|9877|9999"

# 检查服务端 API
curl -s http://localhost:9877/api/health

# 检查 3D 世界是否可访问
curl -s -o /dev/null -w "%{http_code}" http://localhost:9999/
```

---

## 6. 部署更新代码后

```bash
# 1. 停止服务
pkill -f "node server"
pkill -f "serve-3d"
sleep 2

# 2. 确认旧进程已退出
ps aux | grep "node" | grep -v grep

# 3. 重新上传修改后的文件
# 服务端文件 → /root/agent-city/server/
# 客户端文件 → /root/agent-city/client/

# 4. 重新启动
cd /root/agent-city
nohup node server/index.js > /tmp/agent-city-server.log 2>&1 &
nohup node serve-3d.js > /tmp/serve-3d.log 2>&1 &

# 5. 浏览器 Ctrl+Shift+R 强制刷新
```

---

## 快速命令汇总

```bash
# 一键停止
pkill -f "node server" && pkill -f "serve-3d" && echo "已停止"

# 一键启动
cd /root/agent-city && nohup node server/index.js > /tmp/agent-city-server.log 2>&1 & nohup node serve-3d.js > /tmp/serve-3d.log 2>&1 & echo "已启动"

# 查看状态
ss -tlnp | grep -E "9876|9877|9999" && ps aux | grep "node" | grep -v grep
```

---

## 访问地址

- **3D 世界**：http://47.77.238.56:9999
- **WebSocket**：ws://47.77.238.56:9876
