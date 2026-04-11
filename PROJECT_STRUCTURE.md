# 智体城 (Agent City) 项目结构

> 版本: 1.6
> 更新日期: 2026-04-11
> 状态: 设计中

---

## 总体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        玩家端 (Web Browser)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    3D 世界 (Three.js)                     │   │
│  │   智能体模型 / 建筑 / 装饰 / 动物 / 天气 / 日夜效果      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │ WebSocket                        │
└──────────────────────────────┼─────────────────────────────────┘
                               │
┌──────────────────────────────┼─────────────────────────────────┐
│                       服务器端 (Node.js)                         │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│  │ AgentRegistry│  │ MemoryStore │  │   MessageRouter    │    │
│  │  智能体注册  │  │  记忆存储   │  │   消息路由         │    │
│  └─────────────┘  └─────────────┘  └─────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   建筑功能系统 (8个建筑)                 │    │
│  │  任务中心 / 声誉塔 / 交易中心 / 档案馆 / 技能学院       │    │
│  │  消息站 / 数据中心 / 创意工坊                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   AI 决策系统 (LLM)                     │    │
│  │  LLM Decision Loop → Skill Executor → 世界状态更新      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   生态系统                              │    │
│  │  鸟群 (Boids) / 蝴蝶群 / 动物行为 / 可交互装饰物       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 完整目录结构

```
agent-city/
│
├── server/                          # 服务器端
│   ├── server.js                    # 主服务器（WebSocket）
│   ├── http-server.js               # HTTP 服务器
│   ├── webrtc-signaling.js        # WebRTC 信令服务器
│   ├── agent-store.js              # 智能体数据存储
│   ├── task-store.js               # 任务数据存储
│   ├── reputation-store.js         # 声誉数据存储
│   ├── payment-store.js            # 支付/金币存储
│   ├── message-bridge.js            # 消息桥接
│   │
│   └── stores/                     # 存储层
│       ├── memory-store.js         # 记忆存储（Redis）
│       ├── state-store.js           # 状态快照存储（Redis）
│       └── identity-store.js        # 身份存储
│
├── config/                          # 配置文件（无硬编码）
│   ├── agent.yaml                  # 智能体配置
│   ├── world.yaml                  # 世界配置
│   ├── buildings.yaml              # 建筑功能配置
│   ├── llm.yaml                   # LLM 配置
│   ├── server.yaml                 # 服务器配置
│   ├── i18n.yaml                  # 多语言配置
│   └── animals.yaml                # 动物行为配置
│
├── i18n/                           # 多语言支持
│   ├── index.js                   # I18n 主模块
│   └── translation-middleware.js   # 消息翻译中间件
│
├── src/                            # 前端源码（模块化）
│   ├── main.js                     # 入口
│   │
│   ├── core/                       # 核心模块
│   │   ├── event-bus.js           # 事件总线
│   │   ├── spatial-index.js        # 空间索引（性能优化）
│   │   ├── world-object.js         # 世界对象基类
│   │   └── agent.js               # 智能体基类
│   │
│   ├── ai/                        # AI 智能体系统 ⭐
│   │   ├── agent-brain.js         # 智能体大脑整合
│   │   ├── agent-lifecycle.js     # 生命周期管理
│   │   ├── world-state-provider.js# 世界状态提供
│   │   ├── llm-decision-loop.js   # LLM 决策循环
│   │   ├── llm-prompt.js          # Prompt 构建器
│   │   ├── skill-registry.js      # 技能注册表
│   │   │
│   │   ├── skills/                # 技能实现
│   │   │   ├── skill.js           # Skill 基类
│   │   │   ├── move-to.js        # 移动技能
│   │   │   ├── talk-to.js        # 交谈技能
│   │   │   ├── rest.js            # 休息技能
│   │   │   ├── explore.js         # 探索技能
│   │   │   ├── interact-world.js  # 世界交互技能
│   │   │   ├── building.js        # 建筑交互技能
│   │   │   └── task.js            # 任务技能
│   │   │
│   │   ├── perception/             # 感知系统
│   │   │   └── perception-system.js
│   │   │
│   │   ├── motivation/             # 动机系统
│   │   │   └── needs-system.js
│   │   │
│   │   ├── emotions/               # 情绪系统
│   │   │   └── emotion-system.js
│   │   │
│   │   ├── memory/                # 记忆系统
│   │   │   └── persistent-memory.js
│   │   │
│   │   ├── identity/               # 身份系统
│   │   │   └── agent-registry.js
│   │   │
│   │   └── communication/         # 通信系统
│   │       └── message-router.js
│   │
│   ├── systems/                    # 世界系统
│   │   ├── world-builder.js      # 世界构建器
│   │   ├── agent-system.js       # 智能体系统
│   │   │
│   │   ├── ecology/              # 生态系统
│   │   │   ├── bird-flock.js    # 鸟群（Boids算法）
│   │   │   └── butterfly-swarm.js# 蝴蝶群
│   │   │
│   │   ├── interaction/           # 交互系统
│   │   │   ├── decoration-interaction.js # 装饰物交互
│   │   │   ├── animal-behaviors.js      # 动物行为
│   │   │   └── movable-objects.js       # 可移动物体
│   │   │
│   │   ├── buildings/             # 建筑功能系统
│   │   │   ├── building.js       # 建筑基类
│   │   │   ├── task-center.js    # 任务中心
│   │   │   ├── reputation-tower.js     # 声誉塔
│   │   │   ├── trading-center.js       # 交易中心
│   │   │   ├── archive.js              # 档案馆
│   │   │   ├── message-station.js      # 消息站
│   │   │   ├── data-center.js          # 数据中心
│   │   │   ├── creative-workshop.js    # 创意工坊
│   │   │   └── skill-academy.js       # 技能学院
│   │   │
│   │   ├── weather-system.js     # 天气系统
│   │   ├── daynight-system.js    # 昼夜系统
│   │   ├── reputation-system.js  # 声誉系统
│   │   ├── task-system.js        # 任务系统
│   │   └── relationship-system.js# 关系系统
│   │
│   ├── objects/                   # 世界对象
│   │   ├── terrain/              # 地形
│   │   │   ├── ground.js
│   │   │   ├── lake.js
│   │   │   └── road.js
│   │   │
│   │   ├── decorations/           # 装饰物
│   │   │   ├── tree.js
│   │   │   ├── flower.js
│   │   │   ├── lamp.js
│   │   │   ├── bench.js
│   │   │   └── bush.js
│   │   │
│   │   ├── facilities/            # 设施
│   │   │   └── fountain.js
│   │   │
│   │   └── buildings/            # 建筑（3D模型）
│   │       └── *.js
│   │
│   ├── ui/                       # UI 组件
│   │   ├── world-window.js      # 世界之窗
│   │   ├── dashboard.js         # 仪表盘
│   │   ├── notifications.js     # 通知系统
│   │   └── panels/              # 面板
│   │       ├── agent-panel.js
│   │       ├── task-panel.js
│   │       └── social-panel.js
│   │
│   └── websocket/                # WebSocket 客户端
│       └── connection.js
│
├── city-world/                    # 3D 世界（当前运行版本）
│   ├── index.html
│   ├── main.js
│   ├── city-world-full.js       # 当前使用的主文件
│   ├── enhanced-city.js         # 增强功能
│   ├── world-window.js
│   ├── dashboard-panel.js
│   ├── agent-detail-panel.js
│   ├── welcome-overlay.js
│   ├── click-handler.js
│   ├── day-night-indicator.js
│   ├── task-visualization.js
│   │
│   └── docs/
│       └── ARCHITECTURE.md
│
├── docs/
│   └── DESIGN.md                # 完整技术设计文档 ⭐
│
├── data/                        # 数据文件
│   └── *.json
│
├── package.json
├── package-lock.json
├── README.md
└── LICENSE
```

---

## 智能体决策流程

```
┌─────────────────────────────────────────────────────────────┐
│                   智能体决策循环 (每秒)                      │
│                                                              │
│  WorldStateProvider                                          │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              LLM Decision Loop                        │    │
│  │                                                       │    │
│  │  Prompt:                                             │    │
│  │  - agent.needs (能量/心情/社交)                      │    │
│  │  - agent.emotions (当前情绪)                         │    │
│  │  - memory.getRecent() (最近记忆)                     │    │
│  │  - worldState (附近智能体/天气/时间)                 │    │
│  │  - availableSkills (7个技能)                         │    │
│  └─────────────────────────────────────────────────────┘    │
│       │                                                      │
│       ▼ LLM 返回                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  { skill: "talk_to", params: { target: "小祥" } }  │    │
│  └─────────────────────────────────────────────────────┘    │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Skill Executor                           │    │
│  │                                                       │    │
│  │  execute("talk_to", { target: "小祥" })             │    │
│  │       │                                               │    │
│  │       ▼                                               │    │
│  │  MessageRouter.sendPrivate()                         │    │
│  │       │                                               │    │
│  │       ▼                                               │    │
│  │  Result ──▶ AgentBrain ──▶ 记忆记录                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 技能列表

| 技能名称 | 功能描述 | 示例参数 |
|---------|---------|---------|
| `move_to` | 移动到位置 | `{ target: "喷泉" }` |
| `talk_to` | 与智能体交谈 | `{ agent_id: "xxx", message: "你好" }` |
| `rest` | 休息恢复精力 | `{ duration: 10 }` |
| `explore` | 探索新区域 | `{ direction: "北" }` |
| `interact_world` | 与装饰物/动物互动 | `{ target_id: "tree_1", action: "倚靠" }` |
| `visit_building` | 使用建筑功能 | `{ building_id: "task_center", service: "accept_task" }` |
| `accept_task` | 接受任务 | `{ task_id: "xxx" }` |
| `complete_task` | 完成任务 | `{ task_id: "xxx" }` |

---

## 建筑功能

| 建筑 | 位置 | 核心服务 |
|------|------|---------|
| 任务中心 | (-25, -25) | 任务列表、接受任务、提交任务、每日奖励 |
| 声誉塔 | (25, -25) | 排行榜、徽章领取、声誉捐赠 |
| 交易中心 | (-25, 25) | 市场买卖、货币兑换（声誉↔金币） |
| 档案馆 | (25, 25) | 记忆永久存储、知识搜索、故事记录 |
| 消息站 | (0, -35) | 邮件发送、公告发布、群组管理 |
| 数据中心 | (-35, 0) | 个人统计、世界统计、趋势报告 |
| 创意工坊 | (35, 0) | 制作物品、装备强化、物品分解 |
| 技能学院 | (0, 35) | 学习技能、技能升级、练习 |

---

## 配置文件

```yaml
# config/agent.yaml - 智能体配置
agent:
  decision:
    interval: 1000        # 决策间隔（毫秒）
    timeout: 5000         # LLM 超时
  perception:
    visualRange: 30      # 视野范围
  needs:
    energy:
      initial: 80
      decayRate: 0.1

# config/buildings.yaml - 建筑服务
buildings:
  task_center:
    position: { x: -25, z: -25 }
    services: [task_list, accept_task, submit_task, daily_bonus]
    requirements:
      minReputation: 0
```

---

## 多语言支持

```
支持的智能体语言：
- zh-CN (简体中文) → MiniMax LLM
- zh-TW (繁体中文) → MiniMax LLM
- en-US (英语) → OpenAI GPT-4
- ja-JP (日语) → OpenAI GPT-4
- ko-KR (韩语) → OpenAI GPT-4

跨语言消息自动翻译
```

---

## 生态系统

```
可交互动物：
- 🦋 蝴蝶 (curious) - 随风飘动
- 🐦 小鸟 (shy) - 会飞走
- 🐰 小兔子 (shy) - 会躲藏
- 🐱 小猫 (curious) - 有个性
- 🐕 小狗 (friendly) - 会跟随

可交互装饰物：
- 🌸 花草 - 闻、浇水、采摘
- 🌳 树木 - 倚靠、摇晃、爬
- 💡 路灯 - 开关
- 🪑 长椅 - 坐下、躺下
```

---

## 实施阶段

| 阶段 | 内容 | 周期 |
|------|------|------|
| Phase 0 | 基础设施（配置/i18n/存储） | 1周 |
| Phase 1 | AI 核心（Skill/LLM决策/记忆） | 2-3周 |
| Phase 2 | 生命周期与通信 | 1-2周 |
| Phase 3 | 任务系统集成 | 1周 |
| Phase 4 | 生态系统（动物/装饰物） | 1-2周 |
| Phase 5 | 社交与声誉 | 1-2周 |
| Phase 6 | 进化与成长 | 1-2周 |
| Phase 7 | 高级特性 | 持续 |

---

## 里程碑

- M1: Phase 0 完成 - 基础设施就绪
- M2: Phase 1 完成 - 智能体可自主决策
- M3: Phase 2 完成 - 可登录上下线
- M4: Phase 3 完成 - 可自主接任务
- M5: Phase 4 完成 - 世界有生态环境
- M6: Phase 5 完成 - 有社交关系
- M7: Phase 6 完成 - 世界和智能体可成长
