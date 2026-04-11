# 智体城 3D 世界 - 分阶段实施计划

> 基于 `DESIGN.md` 完整设计
> 版本: 2.0
> 创建时间：2026-04-11

---

## 一、设计依据 (DESIGN.md)

### 1.1 系统架构 (Section 2)

```
┌─────────────────────────────────────────────────────────────┐
│                         Web Client                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │  3D World  │  │World Window│  │  Dashboard/     │   │
│  │ (Three.js) │  │ 智能体对话   │  │  Panels         │   │
│  │            │  │            │  │  信息面板        │   │
│  └─────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 类层次结构 (Section 3.1)

```
WorldObject (抽象基类)
├── TerrainObject     # 地形
├── DecorationObject  # 装饰物
│   ├── Flower       # 花
│   ├── Tree         # 树
│   ├── Lamp         # 路灯
│   └── Bench        # 长椅
├── FacilityObject    # 设施
└── BuildingObject   # 建筑（8大建筑）

Agent (智能体)
├── AIAgent          # AI 智能体
└── ObserverAgent   # 观察者

System (系统)
├── WorldStateSystem  # 状态同步
├── EventSystem      # 事件
├── InventorySystem   # 背包
├── TaskSystem       # 任务
├── MessageSystem     # 消息
├── SocialSystem      # 社交
├── WeatherSystem     # 天气
└── DayNightSystem   # 昼夜
```

### 1.3 UI 设计 (Section 8)

#### World Window (世界之窗)
```javascript
class WorldWindow {
    addMessage(agentName, content, emotion) {
        // content: 要显示的文本
        // emotion: happy/sad/angry/neutral
        // 消息在智能体头顶显示
    }
    
    showThoughtBubble(agentName, thought) {
        // 显示思考气泡
    }
}
```

#### Dashboard (仪表盘)
```javascript
class Dashboard {
    showAgent(agent) {
        // 显示: 名字、等级、技能、声誉、金币、状态
    }
    
    showWorldState(worldState) {
        // 显示: 天气、时间、在线人数
    }
}
```

### 1.4 可交互世界 (Section 7.12)

#### 装饰物交互
| 装饰物 | 交互动作 | 效果 |
|--------|----------|------|
| 花 | 闻/浇水/采摘 | 心情+1/+5/获得物品 |
| 树 | 靠近/倚靠/摇晃 | 休息/恢复/获得水果 |
| 路灯 | 开关 | 切换状态 |
| 长椅 | 坐下/躺下 | 休息/完全恢复 |

#### 动物
- 鸟 - 飞、停、吃食
- 鱼 - 游、吃食
- 蝴蝶 - 飞、停

---

## 二、现状分析

### 现有文件
```
city-world/
├── city-world-full.js   (5751行) ⚠️ 单体文件
├── enhanced-city.js     (4755行) ⚠️ 单体文件
├── index.html
└── src/               (刚创建的核心模块)
    ├── core/
    ├── world/
    └── ...
```

### 问题
1. **city-world-full.js** - 5751行单体文件，包含所有功能
2. **enhanced-city.js** - 4755行扩展功能
3. **模块化刚开始** - 只有 core/ 和 world/ 的部分文件

---

## 三、目标架构

### 3.1 目录结构

```
city-world/
├── index.html                      # 入口
├── main.js                        # 主入口
│
├── src/
│   ├── core/                      # 核心 ⭐
│   │   ├── scene-manager.js       # 场景管理
│   │   ├── camera-manager.js      # 相机控制
│   │   ├── renderer-manager.js    # 渲染器
│   │   ├── clock-manager.js       # 时钟
│   │   ├── lighting-manager.js    # 灯光
│   │   └── event-bus.js         # 事件总线
│   │
│   ├── world/                    # 世界 ⭐
│   │   ├── world-state.js        # 世界状态 (DESIGN 5.2)
│   │   ├── terrain-manager.js    # 地形
│   │   ├── buildings-manager.js  # 建筑 (8大)
│   │   ├── decorations-manager.js # 装饰物
│   │   └── landmarks.js         # 地标
│   │
│   ├── agents/                   # 智能体 ⭐
│   │   ├── agent-factory.js     # 模型工厂
│   │   ├── agent-manager.js     # 管理器
│   │   ├── head-display.js      # 头顶显示 (DESIGN 8.2)
│   │   └── animations.js        # 动画
│   │
│   ├── systems/                  # 系统
│   │   ├── weather-system.js    # 天气
│   │   ├── daynight-system.js  # 昼夜
│   │   └── ecology-system.js   # 生态
│   │
│   ├── ui/                      # UI ⭐⭐
│   │   ├── world-window.js      # 世界之窗 (DESIGN 8.2)
│   │   ├── dashboard.js         # 仪表盘 (DESIGN 8.3)
│   │   ├── world-state-panel.js # 世界状态
│   │   └── notifications.js    # 通知
│   │
│   ├── network/                  # 网络
│   │   ├── websocket.js         # WebSocket
│   │   └── sync.js             # 状态同步
│   │
│   └── utils/                    # 工具
│       ├── spatial-grid.js       # 空间网格
│       └── math.js              # 数学工具
```

### 3.2 核心类对应

| DESIGN.md 类 | 实现文件 |
|--------------|----------|
| WorldObject | base.js (基类) |
| TerrainObject | terrain-manager.js |
| DecorationObject | decoration.js |
| BuildingObject | building.js |
| Agent | agent.js |
| WorldWindow | world-window.js |
| Dashboard | dashboard.js |
| WorldState | world-state.js |

---

## 四、分阶段计划

### Phase 3D-1: 核心渲染引擎 ⭐⭐⭐

**目标**: 建立 Three.js 渲染管线，替换 city-world-full.js 的渲染部分

| 任务 | 文件 | 描述 |
|------|------|------|
| 场景管理 | core/scene-manager.js | Scene 创建/对象管理 |
| 相机控制 | core/camera-manager.js | OrbitControls + 模式切换 |
| 渲染器 | core/renderer-manager.js | WebGL 配置/阴影 |
| 时钟 | core/clock-manager.js | deltaTime/游戏时间 |
| 灯光 | core/lighting-manager.js | 日夜灯光变化 |
| 事件总线 | core/event-bus.js | 模块通信 |

**验收**: 运行 `index.html` 显示 3D 场景，支持相机旋转

---

### Phase 3D-2: 世界构建 ⭐⭐

**目标**: 实现 DESIGN Section 5 的世界系统

| 任务 | 文件 | 描述 |
|------|------|------|
| 世界状态 | world/world-state.js | 所有对象的中心管理 |
| 地形 | world/terrain-manager.js | 地面、网格、水域 |
| 8大建筑 | world/buildings-manager.js | 任务中心、声誉塔等 |
| 装饰物 | world/decorations-manager.js | 花草树木路灯 |
| 地标 | world/landmarks.js | 喷泉等 |

**验收**: 显示 8 大建筑和装饰物

---

### Phase 3D-3: 智能体系统 ⭐⭐⭐

**目标**: 实现 DESIGN Section 3.1 的 Agent 类

| 任务 | 文件 | 描述 |
|------|------|------|
| 智能体基类 | agents/agent.js | 位置、状态、动画 |
| 模型工厂 | agents/agent-factory.js | 创建智能体网格 |
| 管理器 | agents/agent-manager.js | 添加/移除/更新 |
| 头顶显示 | agents/head-display.js | WorldWindow 集成 |
| 动画 | agents/animations.js | 移动、待机动画 |

**验收**: 智能体显示在世界中，头顶显示消息

---

### Phase 3D-4: UI 组件 ⭐⭐⭐

**目标**: 实现 DESIGN Section 8 的 WorldWindow 和 Dashboard

| 任务 | 文件 | 描述 |
|------|------|------|
| 世界之窗 | ui/world-window.js | 智能体对话气泡 |
| 仪表盘 | ui/dashboard.js | 等级/技能/声誉/金币 |
| 世界状态 | ui/world-state-panel.js | 天气/时间/人数 |
| 通知 | ui/notifications.js | 成就/事件通知 |

**DESIGN 参考**:
```javascript
// WorldWindow
class WorldWindow {
    addMessage(agentName, content, emotion) {
        // 在智能体头顶显示消息
    }
}

// Dashboard  
class Dashboard {
    showAgent(agent) {
        // 显示名字、等级、技能、声誉、金币
    }
}
```

**验收**: UI 面板正常显示和交互

---

### Phase 3D-5: 子系统

**目标**: 实现 DESIGN Section 5/7 的系统

| 任务 | 文件 | 描述 |
|------|------|------|
| 天气系统 | systems/weather-system.js | 粒子效果 |
| 昼夜系统 | systems/daynight-system.js | 天空颜色/光照 |
| 生态 | systems/ecology-system.js | 动物行为 |

**验收**: 天气和昼夜变化

---

### Phase 3D-6: 网络同步 ⭐⭐⭐

**目标**: 与服务端 Phase 1-8 对接

| 任务 | 文件 | 描述 |
|------|------|------|
| WebSocket | network/websocket.js | 服务端连接 |
| 状态同步 | network/sync.js | 智能体位置同步 |
| 消息同步 | network/messages.js | 聊天消息同步 |

**验收**: 与服务端实时通信

---

### Phase 3D-7: 交互系统

**目标**: 用户交互

| 任务 | 文件 | 描述 |
|------|------|------|
| 输入 | input/input-manager.js | 键盘/鼠标 |
| 建筑交互 | ui/building-interaction.js | 点击使用建筑功能 |
| 装饰物交互 | ui/decoration-interaction.js | 花草树木交互 |

**验收**: 可以和建筑、装饰物交互

---

### Phase 3D-8: 性能优化

**目标**: 100+ 智能体流畅

| 任务 | 文件 | 描述 |
|------|------|------|
| 空间网格 | utils/spatial-grid.js | 碰撞检测 |
| LOD | world/lod-system.js | 细节层次 |
| 实例化 | world/instancing.js | 大量相同物体 |

**验收**: 100+ 智能体流畅运行

---

## 五、里程碑

| 里程碑 | 验收标准 |
|---------|----------|
| **M3D-1** | 3D 场景渲染 + 相机控制 |
| **M3D-2** | 8 大建筑 + 装饰物显示 |
| **M3D-3** | 智能体显示 + 头顶消息 |
| **M3D-4** | WorldWindow + Dashboard 工作 |
| **M3D-5** | 天气 + 昼夜效果 |
| **M3D-6** | 与服务端 WebSocket 通信 |
| **M3D-7** | 用户可交互 |
| **M3D-8** | 100+ 智能体流畅 |

---

## 六、技术要点

### Three.js ES Modules
```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
```

### 模块通信 (EventBus)
```javascript
eventBus.on('agent:click', (agent) => showDetail(agent));
eventBus.emit('building:used', { buildingId, agentId });
```

### WorldState 模式
```javascript
worldState.addObject(agent);
worldState.removeObject(agentId);
worldState.updateObject(agentId, { position: { x, z } });
worldState.getNearbyObjects(position, radius);
```

### WorldWindow
```javascript
worldWindow.addMessage('小吉', '你好！', 'happy');
worldWindow.showThoughtBubble('小吉', '我想去任务中心...');
```

---

## 七、与服务端的对应

| 服务端 | 3D 世界 |
|--------|----------|
| Phase 1-8 (Services) | Phase 3D-6 (WebSocket) |
| AgentStore | agents/agent-manager.js |
| TaskStore | UI 任务面板 |
| ReputationStore | Dashboard 声誉显示 |
| MessageService | world-window.js |
