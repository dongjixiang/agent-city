# 智体城 AI 自主移动 — 问题诊断与设计文档

## 一、当前架构分析

### 1.1 服务器上存在两套独立的 WebSocket 系统

```
┌─────────────────────────────────────────────────────────────────┐
│                    服务器 (47.77.238.56)                        │
│                                                                 │
│  ┌──────────────────────┐     ┌──────────────────────┐         │
│  │    ws-handler.js     │     │  message-bridge.js   │         │
│  │                      │     │                      │         │
│  │  - 处理3D客户端连接   │     │  - 处理OpenClaw插件  │         │
│  │  - broadcast()方法   │     │  - broadcast()方法   │         │
│  │  - 端口9876          │     │  - 共享aiEngine      │         │
│  └──────────┬───────────┘     └──────────┬───────────┘         │
│             │                              │                    │
│             │   ┌──────────────────────┐  │                    │
│             └──►│    AIEngine          │◄─┘                    │
│                 │  - decisionLoop()    │                       │
│                 │  - 每1秒运行一次      │                       │
│                 │  - callLLM()         │                       │
│                 │  - skillRegistry     │                       │
│                 └──────────┬───────────┘                       │
│                            │                                    │
│                 ┌──────────▼───────────┐                       │
│                 │   skillRegistry      │                       │
│                 │   - MoveToSkill     │                       │
│                 │   - TalkToSkill     │                       │
│                 │   - ...             │                       │
│                 └──────────┬───────────┘                       │
│                            │                                    │
│         (MoveToSkill.execute只更新数据库，不广播给3D客户端)     │
└─────────────────────────────────────────────────────────────────┘
         │                                        │
         ▼                                        ▼
   3D客户端(9999)                       OpenClaw Agent插件
   - 监听ws-handler                     - 连接message-bridge
   - 渲染AGENT_MOVED                     - 接收/发送消息
```

**关键问题：**
- `message-bridge` 和 `ws-handler` **不互通**
- OpenClaw Agent 发消息 → message-bridge 处理
- 3D 客户端 → ws-handler 接收
- **两个系统的客户端收不到彼此的消息**

### 1.2 MoveToSkill 不广播位置变化

```javascript
// server/ai/skills/move-to.js
async execute(agent, params, context) {
    const { x, z } = params;
    
    await agentStore.updateState(agent.agentId, 'moving');
    await agentStore.updatePosition(agent.agentId, { x, z });  // 只更新数据库
    await agentStore.updateState(agent.agentId, 'idle');      // 不广播！
    
    return { success: true, position: { x, z } };
}
```

**3D 客户端永远不会收到 `AGENT_MOVED` 广播，因为根本没有发出。**

### 1.3 服务器 AIEngine 每秒运行，但决策可能因为各种条件被跳过

从日志看到 `AIEngine] Started with interval: 1000ms`（1秒），但没有看到任何决策日志。

---

## 二、用户描述的架构（目标）

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           目标架构                                      │
└─────────────────────────────────────────────────────────────────────────┘

1. 智体城服务器
   └── 收集环境信息（附近智能体、物体、天气、智体城能力列表）
   
2. 通过 WebSocket/MessageBridge 发送给 OpenClaw Agent
   └── agent-city-channel.js 接收
   
3. OpenClaw Agent 插件
   └── 把环境信息发给 Agent 自身的 LLM（如 MiniMax）
   └── Agent 思考并决策
   
4. 决策发回给智体城
   └── message-bridge 接收
   
5. 智体城执行决策
   └── 控制智能体的行为（移动、说话、休息等）
   └── 广播结果给 3D 客户端
```

---

## 三、问题定位总结

| 问题 | 位置 | 后果 |
|------|------|------|
| **MoveToSkill 不广播** | `server/ai/skills/move-to.js` | AI 移动后 3D 客户端不知道 |
| **message-bridge 和 ws-handler 不互通** | `server/` | 两个系统的消息隔离 |
| **OpenClaw Agent 没有主动获取环境信息** | `agent-city-channel.js` | 只能被动响应消息，不能主动决策 |
| **AIEngine 的 LLM 在服务器端，不在 Agent 端** | `server/ai/ai-engine.js` | 与用户描述的架构不符 |

---

## 四、修复方案

### 4.1 立即修复：让 MoveToSkill 广播位置变化

**文件：** `server/ai/skill-registry.js` 或在 `ai-engine.js` 处理 skill 结果后广播

**方案 A（最小改动）：** 在 `ai-engine._makeDecisionInternal()` 执行完 skill 后，广播 `AGENT_MOVED`

```javascript
// 在 ai-engine.js 的 _makeDecisionInternal 中，skill 执行完后：

// 执行技能
const result = await skillRegistry.execute(skillName, agent, params, decisionContext);

// 广播位置变化（新增）
if (skillName === 'move_to' && result.position) {
    // 需要广播给 ws-handler 的所有客户端
    broadcastToAllClients({
        type: 'AGENT_MOVED',
        agentId: agent.agentId,
        position: result.position
    });
}
```

但 `ai-engine.js` 目前没有 `broadcast` 方法，需要从 `ws-handler` 传入。

**方案 B（改动较大但更干净）：** 在 skill 执行后触发事件，由中央协调器广播。

### 4.2 中期修复：打通 message-bridge 和 ws-handler

让 message-bridge 在收到 Agent 的决策消息时，通知 ws-handler 广播给 3D 客户端。

### 4.3 长期：实现用户描述的架构

让 OpenClaw Agent 主动向智体城请求环境信息，而不是被动等消息。

---

## 五、待确认

1. **当前 OpenClaw Agent（Agent City 插件）的连接方式** — 它连接的是 `ws://47.77.238.56:9876` 吗？
2. **小吉（OpenClaw Agent）是在智体城里注册过的 AI Agent 吗？** 还是只是连接着但没注册？
3. **是否需要保留服务器端 AI Engine 自动决策**？还是所有 AI 决策都由 OpenClaw Agent 负责？
