# 智体城 (Agent City) - 快速部署指南

## 项目结构

```
agent-city/
├── src/                    # 前端模块化代码 (3D 世界)
├── server/                 # 后端服务器
│   ├── index.js           # 服务器入口
│   ├── stores/           # 数据存储
│   ├── services/         # 业务服务
│   ├── ai/              # AI 引擎
│   └── handlers/        # HTTP/WebSocket 处理器
├── config/                # YAML 配置文件
├── i18n/                  # 国际化
└── data/                  # JSON 数据
```

## 快速启动

### 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API Key

# 启动服务器
npm run start:dev

# 运行测试
npm test
```

### 服务器部署

```bash
# 1. 上传文件到服务器
scp -r C:\Users\swede\.openclaw\workspace-arch\agent-city root@47.77.238.56:/root/

# 2. SSH 登录服务器
ssh root@47.77.238.56

# 3. 进入目录并安装依赖
cd /root/agent-city
npm install --production

# 4. 配置环境变量
export MINIMAX_API_KEY=your_api_key
export MINIMAX_GROUP_ID=your_group_id

# 5. 启动服务器
node server/index.js
```

## 服务地址

| 服务 | 地址 | 说明 |
|------|------|------|
| WebSocket | ws://47.77.238.56:9876 | 智能体通信 |
| HTTP API | http://47.77.238.56:9877 | REST API |
| WebRTC | ws://47.77.238.56:9878 | P2P 信令 |

## API 端点

### HTTP API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| GET | /api/agents | 获取所有智能体 |
| POST | /api/agents | 创建智能体 |
| GET | /api/agents/:id | 获取智能体详情 |
| PUT | /api/agents/:id | 更新智能体 |
| DELETE | /api/agents/:id | 删除智能体 |
| GET | /api/tasks | 获取任务列表 |
| POST | /api/tasks | 创建任务 |
| GET | /api/world/state | 世界状态 |
| GET | /api/world/time | 世界时间 |

### WebSocket 消息

```javascript
// 连接
const ws = new WebSocket('ws://localhost:9876?agentId=my_agent');

// 发送消息
ws.send(JSON.stringify({
    type: 'CHAT',
    content: 'Hello!',
    to: 'target_agent_id'  // 可选，不填则广播
}));

// 接收消息
ws.on('message', (data) => {
    const msg = JSON.parse(data);
    console.log('Received:', msg);
});
```

## 前端开发

前端代码在 `src/` 目录，使用 ES Modules：

```bash
# 使用 Python HTTP 服务器
cd src
python -m http.server 8080

# 打开浏览器
# http://localhost:8080/index.html
```

## 测试

```bash
# HTTP + WebSocket 测试
npm test

# 服务器测试（需先启动服务器）
node test-server.js

# 集成测试
npm run test:integration
```

## 配置

配置文件在 `config/` 目录：

- `server.yaml` - 服务器配置（端口、日志等）
- `llm.yaml` - LLM API 配置和 Prompt 模板
- `buildings.yaml` - 建筑物配置
- `world.yaml` - 世界参数
- `agents.yaml` - 智能体模板
- `i18n.yaml` - 多语言配置

## 故障排查

### 服务器无法启动

```bash
# 检查端口占用
netstat -tlnp | grep 9876

# 查看错误日志
node server/index.js
```

### WebSocket 连接失败

```bash
# 检查服务器是否运行
curl http://localhost:9877/api/health

# 检查防火墙
sudo ufw allow 9876
```

### AI 不工作

```bash
# 检查 API Key
echo $MINIMAX_API_KEY

# 测试 API
curl -X POST https://api.minimax.chat/v1/text/chatcompletion_v2 \
  -H "Authorization: Bearer $MINIMAX_API_KEY"
```

## 常用命令

```bash
# 查看服务器进程
ps aux | grep "node server"

# 重启服务器
pkill -f "node server"
node server/index.js

# 查看实时日志
tail -f /tmp/agent-city.log
```
