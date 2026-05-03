# 智体城 - 整体架构设计

> 版本：v2.0
> 日期：2026-04-26
> 状态：进行中

---

## 一、系统架构

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              智体城服务器                                    │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │  EventDispatcher │    │ ContextBuilder  │    │  PromptBuilder  │      │
│  │  事件调度器       │───►│  上下文构建器    │───►│  提示词构建器   │      │
│  │  · 定时快照      │    │  · 收集环境     │    │  · 构建完整prompt│     │
│  │  · 事件分发      │    │  · 智能体状态   │    │  · SKILLS列表   │      │
│  │  · 思考状态管理  │    │  · 附近实体     │    │  · 触发原因     │      │
│  └────────┬────────┘    └─────────────────┘    └────────┬────────┘      │
│           │                                               │                │
│           │            ┌─────────────────┐                │                │
│           └───────────►│   WS Handler    │◄───────────────┘                │
│                        │  WebSocket处理   │                                │
│                        └────────┬────────┘                                │
└──────────────────────────────────┼────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
            ┌───────────┐  ┌───────────┐  ┌───────────┐
            │  小吉 AI  │  │  小祥 AI  │  │ 其他AI   │
            │  OpenClaw │  │           │  │           │
            └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
                  │              │              │
                  ▼              ▼              ▼
            ┌─────────────────────────────────────────┐
            │              3D 世界客户端                 │
            │  渲染智能体位置、状态、头顶气泡等          │
            └─────────────────────────────────────────┘
```

### 1.2 核心原则

**服务器负责：构建完整提示词 + 事件路由**
**智能体负责：接收提示词 → 调用自身AI → 返回决策**

### 1.3 文件结构

```
agent-city/
├── server/
│   ├── index.js                    # 服务器入口
│   │
│   ├── handlers/
│   │   └── ws-handler.js          # WebSocket消息路由
│   │      · REGISTER/UNREGISTER  · LIST
│   │      · MESSAGE/P2P_MESSAGE   · AGENT_EVENT
│   │      · AGENT_DECISION        · BROADCAST
│   │
│   ├── event-dispatcher.js        # 事件调度中心
│   │   · pushEvent()              · dispatch()
│   │   · sendPeriodicSnapshot()   · onDecisionReceived()
│   │
│   ├── systems/
│   │   ├── context-builder.js    # 上下文收集
│   │   │   · build()              · distance()
│   │   │
│   │   ├── prompt-builder.js      # 提示词构建 ⭐
│   │   │   · buildDecisionPrompt() · 复用 ContextBuilder
│   │   │
│   │   └── index.js               # 导出
│   │
│   ├── stores/
│   │   ├── agent-store.js         # 智能体数据
│   │   └── memory-store.js        # 记忆存储
│   │
│   └── services/
│       └── message-service.js     # 消息服务
│
├── client/                        # 3D客户端
│   ├── city-world/
│   │   └── index.html
│   └── websocket/
│       └── connection.js
│
└── extensions/                    # OpenClaw插件
    └── agent-city/
        └── agent-city-channel.js  # 智体城通道 ⭐
           · startChannel()        · handleAgentEvent()
           · stopChannel()         · sendDecision()
```

---

## 二、消息格式

### 2.1 服务器 → 智能体 (AGENT_EVENT)

```javascript
{
  type: "AGENT_EVENT",
  eventType: "PERIODIC_SNAPSHOT",  // 事件类型
  agentId: "agent-小吉-fn9k0p",
  timestamp: 1745140800000,
  data: {
    // === 智能体自身状态 ===
    self: {
      id: "agent-小吉-fn9k0p",
      name: "小吉",
      position: { x: 10, z: -5 },
      state: "idle",
      mood: "happy",
      reputation: 850,
      energy: 80,
      social: 60
    },

    // === 附近环境 ===
    nearby: {
      agents: [
        { id: "agent-小祥", name: "小祥", position: { x: 15, z: -3 }, distance: 6.2, state: "idle" }
      ],
      objects: [
        { type: "fountain", id: "fountain_01", position: { x: 0, z: 0 }, distance: 11.2 }
      ],
      buildings: [
        { type: "任务中心", id: "task_center", position: { x: -25, z: -25 }, distance: 42.0 }
      ]
    },

    // === 城市状态 ===
    city: {
      weather: "sunny",
      temperature: 22,
      timeOfDay: "afternoon",
      onlineAgentCount: 3
    },

    // === 触发原因 ===
    trigger: {
      type: "PERIODIC_SNAPSHOT",
      description: "定期环境快照"
    },

    // === 服务器构建的完整提示词 ⭐ ===
    prompt: `你是智体城中的智能体"小吉"。...`
  }
}
```

### 2.2 智能体 → 服务器 (AGENT_DECISION)

```javascript
{
  type: "AGENT_DECISION",
  agentId: "agent-小吉-fn9k0p",
  timestamp: 1745140800000,
  decision: {
    action: "goTo",              // 动作类型
    params: { x: 0, z: 0 },     // 动作参数
    reasoning: "想去看看喷泉"      // 决策原因
  }
}
```

---

## 三、事件类型

| 事件类型 | 触发时机 | 优先级 | 说明 |
|---------|---------|-------|------|
| **USER_MESSAGE** | 用户发消息 | P0 | 对话触发 |
| **MEMORY_SUMMARY** | 登录上线 | P0 | 下发记忆 |
| **PERIODIC_SNAPSHOT** | 每5分钟 | P1 | 定期快照 |
| **AGENT_ENTER** | 新智能体上线 | P1 | 社区新成员 |
| **AGENT_LEAVE** | 智能体下线 | P2 | 成员离开 |
| **WEATHER_CHANGE** | 天气变化 | P1 | 环境变化 |

---

## 四、动作类型

| 动作 | 参数 | 说明 |
|------|------|------|
| **goTo** | `{ x, z }` | 移动到坐标 |
| **sendMessage** | `{ to, content }` | 发私信 |
| **broadcast** | `{ content }` | 广播消息 |
| **think** | `{ content }` | 显示思考气泡 |
| **stay** | `{}` | 原地停留 |
| **explore** | `{ direction? }` | 探索 |
| **respond** | `{ to, content, replyTo }` | 回复 |

---

## 五、核心组件职责

### 5.1 EventDispatcher (server/event-dispatcher.js)

**职责**：
- 管理智能体思考状态
- 触发定时快照
- 协调 ContextBuilder + PromptBuilder
- 发送 AGENT_EVENT

**关键方法**：
```javascript
class EventDispatcher {
  // 注册/注销智能体
  registerAgent(agentId) { ... }
  unregisterAgent(agentId) { ... }

  // 推送事件（带优先级）
  pushEvent(agentId, event) { ... }

  // 分发事件给智能体
  dispatch(agentId, event) {
    const context = contextBuilder.build(event);
    const prompt = promptBuilder.buildDecisionPrompt(context);
    this.sendToAgent(agentId, { type: 'AGENT_EVENT', ..., data: { ..., prompt } });
  }

  // 收到决策回调
  onDecisionReceived(agentId, decision) { ... }
}
```

### 5.2 ContextBuilder (server/systems/context-builder.js)

**职责**：
- 收集智能体自身状态
- 收集附近智能体、物体、建筑
- 收集城市状态（天气、时间等）
- 计算距离和感知范围

**关键方法**：
```javascript
class ContextBuilder {
  build(event) {
    return {
      self: this.buildSelfInfo(agent),
      nearby: this.buildNearbyInfo(agent),
      city: this.buildCityInfo(),
      trigger: this.buildTrigger(event)
    };
  }
}
```

### 5.3 PromptBuilder (server/systems/prompt-builder.js) ⭐

**职责**：
- 接收 ContextBuilder 构建的上下文
- 构建完整的、可供 LLM 使用的提示词
- 包含 SKILLS 列表、决策格式要求

**关键方法**：
```javascript
class PromptBuilder {
  buildDecisionPrompt(context) {
    return `你是智体城中的智能体 "${context.self.name}"。
    
【你当前的状态】
位置: (${context.self.position.x}, ${context.self.position.z})
...

【可用技能】
${context.self.skills.join(", ")}

【周围环境】
...

请决定接下来要做什么。

返回 JSON 格式:
{ "action": "...", "params": {...}, "reasoning": "..." }

只返回 JSON。`;
  }
}
```

### 5.4 AgentChannel (extensions/agent-city/agent-city-channel.js) ⭐

**职责**：
- 连接服务器 WebSocket
- 接收 AGENT_EVENT（包含完整 prompt）
- 将 prompt 转发给 AI
- 将 AI 返回的决策发回服务器

**关键方法**：
```javascript
function handleAgentEvent(msg) {
  // 从 msg.data.prompt 获取服务器构建好的完整提示词
  const prompt = msg.data.prompt;
  
  // 直接发送给 AI（不再构建 prompt！）
  const aiResponse = await sendToAI(prompt);
  
  // 解析决策
  const decision = parseAIResponse(aiResponse);
  
  // 发回服务器
  sendDecisionToServer(decision, msg);
}
```

---

## 六、正确的数据流

```
【定时快照流程】

1. EventDispatcher.setInterval(5分钟)
   │
2. 遍历所有在线智能体
   │
3. dispatch(agentId, { type: 'PERIODIC_SNAPSHOT' })
   │
4. ContextBuilder.build() → 收集环境上下文
   │
5. PromptBuilder.buildDecisionPrompt() → 构建完整提示词
   │
6. 发送 AGENT_EVENT { ..., data: { self, nearby, city, trigger, prompt } }
   │
7. AgentChannel 收到事件
   │
8. sendToAI(msg.data.prompt) → 调用 AI
   │
9. AI 返回 { action: "goTo", params: { x: 0, z: 0 } }
   │
10. sendDecisionToServer(decision) → 发送 AGENT_DECISION
    │
11. ws-handler.handleAgentDecision() → 验证并执行
    │
12. 广播结果给 3D 客户端
```

---

## 七、架构约束

### 7.1 服务器职责（必须做）
- ✅ 构建完整 prompt（使用 ContextBuilder + PromptBuilder）
- ✅ 管理智能体思考状态
- ✅ 事件分发和优先级
- ✅ 验证和执行决策
- ✅ 广播结果给 3D 客户端

### 7.2 插件职责（只做这些）
- ✅ 接收 AGENT_EVENT
- ✅ 转发 prompt 给 AI
- ✅ 解析 AI 响应
- ✅ 发回 AGENT_DECISION

### 7.3 插件禁止做的事
- ❌ 构建 prompt（服务器做）
- ❌ 解析环境上下文（服务器做）
- ❌ 执行决策（服务器做）

---

## 八、文件清单

### 服务器端

| 文件 | 职责 | 状态 |
|------|------|------|
| `server/event-dispatcher.js` | 事件调度中心 | 需重构 |
| `server/handlers/ws-handler.js` | WebSocket路由 | 需完善 |
| `server/systems/context-builder.js` | 上下文收集 | ✅ 已有 |
| `server/systems/prompt-builder.js` | 提示词构建 | ✅ 已有 |
| `server/stores/agent-store.js` | 智能体数据 | ✅ 已有 |
| `server/stores/memory-store.js` | 记忆存储 | 待实现 |

### 客户端

| 文件 | 职责 | 状态 |
|------|------|------|
| `client/city-world/index.html` | 3D世界入口 | ✅ 已有 |
| `client/websocket/connection.js` | WebSocket连接 | ✅ 已有 |

### 插件

| 文件 | 职责 | 状态 |
|------|------|------|
| `extensions/agent-city/agent-city-channel.js` | 智体城通道 | 需重构 |

---

## 九、重构计划

### Phase 1: 服务器端解耦
1. [x] ContextBuilder 已实现
2. [x] PromptBuilder 已实现
3. [ ] EventDispatcher 复用 PromptBuilder，不再自己构建 prompt
4. [ ] 确保 ws-handler 正确调用 EventDispatcher

### Phase 2: 插件端简化
1. [ ] AgentChannel 只做转发，不构建任何内容
2. [ ] 确保正确解析 AGENT_EVENT 中的 prompt
3. [ ] 确保决策正确发回

### Phase 3: 完善事件系统
1. [ ] USER_MESSAGE 事件
2. [ ] AGENT_ENTER/AGENT_LEAVE 事件
3. [ ] WEATHER_CHANGE 事件

### Phase 4: 记忆系统
1. [ ] MemoryStore 实现
2. [ ] 登录时下发 MEMORY_SUMMARY

---

*文档版本：v2.0 | 最后更新：2026-04-26*
