# 智体城文档

## 核心设计

| 文档 | 说明 |
|------|------|
| **[DESIGN.md](../DESIGN.md)** | 整体架构设计（主文档） |
| **AUTONOMOUS-AGENT-DESIGN.md** | 智能体自主决策架构 |
| **AI-DECISION-FLOW-DESIGN.md** | AI决策流程详细设计 |
| **BRAIN-INTEGRATION-DESIGN.md** | AI大脑集成设计 |
| **3D-WORLD-PLAN.md** | 3D世界分阶段实施计划 |

## 架构速查

```
服务器 (EventDispatcher + ContextBuilder + PromptBuilder)
    │ 构建完整 prompt
    ▼
AGENT_EVENT { data: { self, nearby, city, trigger, prompt } }
    │
    ▼
插件 (agent-city-channel.js)
    │ 转发 prompt → AI → 返回 decision
    ▼
AGENT_DECISION { action, params, reasoning }
    │
    ▼
服务器执行 → 广播给3D客户端
```

## 文件位置

```
agent-city/
├── DESIGN.md                      # 主设计文档
├── docs/
│   ├── README.md                 # 本文档
│   ├── AUTONOMOUS-AGENT-DESIGN.md
│   ├── AI-DECISION-FLOW-DESIGN.md
│   ├── BRAIN-INTEGRATION-DESIGN.md
│   └── 3D-WORLD-PLAN.md
├── server/
│   ├── event-dispatcher.js      # 事件调度中心 ⚠️需重构
│   ├── handlers/
│   │   └── ws-handler.js       # WebSocket路由
│   ├── systems/
│   │   ├── context-builder.js   # ✅ 上下文收集
│   │   └── prompt-builder.js    # ✅ 提示词构建
│   └── stores/
│       └── agent-store.js       # ✅ 智能体存储
└── extensions/
    └── agent-city/
        └── agent-city-channel.js # ⚠️需简化，只做转发
```

---

*最后更新：2026-04-26*
