# 智体城 3D 世界 - 分阶段实施计划

> 基于 `DESIGN.md` 架构设计
> 版本: 1.0
> 创建时间：2026-04-11

---

## 一、设计依据 (DESIGN.md)

### 核心架构 (Section 2.1)

```
┌─────────────────────────────────────────────────────────────┐
│                         Web Client                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  3D World   │  │ World Window │  │ Dashboard/Panels │  │
│  │  (Three.js) │  │   智能体对话  │  │    信息面板      │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 类层次结构 (Section 3.1)

```
WorldObject (抽象基类)
├── TerrainObject (地形)
├── DecorationObject (装饰物)
├── FacilityObject (设施)
└── BuildingObject (建筑 - 8大建筑)

Agent (智能体基类)
├── AIAgent (AI 智能体)
└── ObserverAgent

System (系统基类)
├── TerrainSystem
├── DecorationSystem
├── BuildingSystem
├── AgentSystem
├── WeatherSystem
├── DayNightSystem
└── ... (更多)
```

---

## 二、现有实现分析

### city-world/ 目录结构

```
city-world/
├── city-world-full.js  (5751行) - 主渲染引擎，64个函数 ⚠️ 单体文件
├── enhanced-city.js    (4755行) - 功能扩展，72个函数  ⚠️ 单体文件
├── index.html
└── src/
    ├── main.js
    ├── core/           # 已创建：scene, camera, renderer, clock, lighting
    ├── world/          # 已创建：terrain
    ├── agents/
    ├── systems/
    ├── ui/
    ├── network/
    ├── input/
    └── utils/
```

### 已创建的模块 (Phase 3D-1 进行中)

| 文件 | 状态 | 功能 |
|------|------|------|
| core/scene.js | ✅ | 场景管理器 |
| core/renderer.js | ✅ | 渲染器管理 |
| core/camera.js | ✅ | 相机控制 + OrbitControls |
| core/clock.js | ✅ | 游戏时钟 + 日夜 |
| core/lighting.js | ✅ | 灯光系统 + 日夜切换 |
| world/terrain.js | ✅ | 地面 + 网格 |

---

## 三、目标架构 (DESIGN.md 映射)

### 3.1 核心模块 (对应 WorldObject 基类)

```
src/
├── core/                    # ✅ 已完成
│   ├── scene.js           # 场景管理
│   ├── renderer.js         # WebGL 渲染器
│   ├── camera.js           # 相机控制 (OrbitControls)
│   ├── clock.js           # 游戏时钟
│   └── lighting.js         # 日夜灯光
│
├── world/                  # ⏳ 进行中
│   ├── terrain.js         # ✅ 地面/水域
│   ├── buildings.js       # 📋 8大建筑 (DESIGN 5.1)
│   ├── decorations.js     # 📋 装饰物 (DESIGN 7.12)
│   ├── landmarks.js       # 📋 地标 (喷泉等)
│   └── spatial-grid.js    # 📋 空间分区 (性能)
```

### 3.2 智能体模块 (对应 Agent 基类)

```
src/
├── agents/
│   ├── factory.js         # 模型工厂
│   ├── lobster-model.js   # 龙虾模型
│   ├── human-model.js     # 人形模型
│   ├── manager.js         # 智能体管理
│   ├── animations.js      # 动画系统
│   └── head-display.js    # 头顶消息 (DESIGN 8.2)
```

### 3.3 子系统 (对应 System 基类)

```
src/
├── systems/
│   ├── weather.js         # 天气 + 粒子 (DESIGN 7.12)
│   ├── day-night.js       # 昼夜循环 (DESIGN 5)
│   ├── birds.js           # 鸟群 Boids (DESIGN 7.12)
│   ├── autonomous.js      # 自主行为
│   └── ecology.js         # 生态系统
```

### 3.4 UI 组件 (DESIGN Section 8)

```
src/
├── ui/
│   ├── world-window.js    # ⭐ 智能体对话 (DESIGN 8.2)
│   ├── dashboard.js       # ⭐ 信息面板 (DESIGN 8.3)
│   ├── agent-detail.js    # 智能体详情
│   ├── notifications.js   # 通知
│   ├── task-panel.js     # 任务面板
│   ├── inventory-panel.js # 背包面板
│   ├── map-panel.js      # 小地图
│   └── components/
│       ├── tooltip.js
│       ├── modal.js
│       └── button.js
```

### 3.5 网络通信 (DESIGN Section 2)

```
src/
├── network/
│   ├── websocket.js       # WebSocket 连接
│   ├── http-api.js       # HTTP API
│   └── message-queue.js  # 消息队列
```

---

## 四、分阶段计划

### Phase 3D-1: 核心渲染 ⭐ (已完成基础)

**目标**: 建立 Three.js 渲染管线

| 任务 | 文件 | 描述 | 状态 |
|------|------|------|------|
| 场景管理 | core/scene.js | Three.js Scene | ✅ |
| 渲染器 | core/renderer.js | WebGLRenderer | ✅ |
| 相机控制 | core/camera.js | OrbitControls | ✅ |
| 时钟 | core/clock.js | deltaTime/日夜 | ✅ |
| 灯光 | core/lighting.js | 日夜灯光切换 | ✅ |
| 地形 | world/terrain.js | 地面/水域 | ✅ |
| 主入口 | main.js | ES Module 入口 | 📋 |

**交付物**: 可运行的 3D 场景，地面 + 光照 + 相机控制

---

### Phase 3D-2: 世界构建 ⭐⭐

**目标**: 实现 Design.md 中的建筑系统和装饰物

#### 建筑 (DESIGN 5.1)

| 建筑 | 位置 | 功能 |
|------|------|------|
| TaskCenter | (-25, -25) | 任务列表/接受/提交 |
| ReputationTower | (25, -25) | 排行榜/徽章/捐赠 |
| TradingCenter | (-25, 25) | 市场/购买/出售 |
| Archive | (25, 25) | 记忆存储/检索 |
| MessageStation | (0, -35) | 邮件/公告/群组 |
| DataCenter | (-35, 0) | 统计/对比 |
| CreativeWorkshop | (35, 0) | 制作/强化/分解 |
| SkillAcademy | (0, 35) | 技能学习/升级 |

#### 装饰物 (DESIGN 7.12)

| 类型 | 交互 |
|------|------|
| 花草 | 闻/浇水/采摘 |
| 树木 | 靠近/倚靠/摇晃/爬 |
| 路灯 | 开关 |
| 长椅 | 坐下/躺下 |
| 喷泉 | 查看 |

| 任务 | 文件 |
|------|------|
| 8大建筑 | world/buildings.js |
| 装饰物 | world/decorations.js |
| 地标 | world/landmarks.js |
| 空间分区 | world/spatial-grid.js |

---

### Phase 3D-3: 智能体系统 ⭐⭐⭐

**目标**: 实现 Design.md 中的 Agent 基类和模型

| 任务 | 文件 | 描述 |
|------|------|------|
| 模型工厂 | agents/factory.js | 创建智能体网格 |
| 龙虾模型 | agents/lobster-model.js | 龙虾 3D 模型 |
| 动画系统 | agents/animations.js | 移动/待机 |
| 智能体管理 | agents/manager.js | 添加/移除/更新 |
| 头顶消息 | agents/head-display.js | 对话气泡 |

---

### Phase 3D-4: UI 组件 ⭐⭐⭐

**目标**: 实现 Design.md Section 8 的 UI

#### 世界之窗 (8.2)

```javascript
class WorldWindow {
    addMessage(agentName, content) {
        // 显示智能体消息流
    }
}
```

#### 仪表盘 (8.3)

```javascript
class Dashboard {
    showAgent(agent) {
        this.name.textContent = agent.name;
        this.level.textContent = `等级 ${agent.skills.getLevel()}`;
        this.reputation.textContent = `声誉 ${reputationSystem.getReputation()}`;
    }
}
```

| 任务 | 文件 |
|------|------|
| 世界之窗 | ui/world-window.js |
| 仪表盘 | ui/dashboard.js |
| 通知系统 | ui/notifications.js |
| 任务面板 | ui/task-panel.js |
| 背包面板 | ui/inventory-panel.js |

---

### Phase 3D-5: 子系统

**目标**: 天气/昼夜/动物

| 任务 | 文件 | 描述 |
|------|------|------|
| 天气 | systems/weather.js | 粒子效果 |
| 昼夜 | systems/day-night.js | 天空颜色 |
| 鸟群 | systems/birds.js | Boids 算法 |
| 动物行为 | systems/animals.js | 蝴蝶/兔子 |

---

### Phase 3D-6: 网络通信 ⭐⭐⭐

**目标**: 与服务端 (Phase 1-8) 对接

| 任务 | 文件 | 描述 |
|------|------|------|
| WebSocket | network/websocket.js | 实时通信 |
| HTTP API | network/http-api.js | REST API |
| 消息同步 | network/sync.js | 智能体位置同步 |

---

### Phase 3D-7: 交互系统

**目标**: 键盘/鼠标/触摸

| 任务 | 文件 | 描述 |
|------|------|------|
| 键盘 | input/keyboard.js | WASD 移动 |
| 鼠标 | input/mouse.js | 点击/悬浮 |
| 触摸 | input/touch.js | 移动端 |

---

### Phase 3D-8: 性能优化

**目标**: 100+ 智能体流畅

| 任务 | 文件 | 描述 |
|------|------|------|
| LOD | world/buildings.js | 细节层次 |
| 实例化 | world/decorations.js | 大量树木 |
| 裁剪 | core/camera.js | 视锥裁剪 |

---

## 五、里程碑

| M3D-1 | ✅ | 地面 + 相机 + 光照可运行 |
|--------|---|--------------------------|
| M3D-2 | ⏳ | 8 大建筑 + 装饰物显示 |
| M3D-3 | ⏳ | 智能体 + 头顶消息 |
| M3D-4 | ⏳ | 世界之窗 + 仪表盘 |
| M3D-5 | ⏳ | 天气 + 昼夜 + 动物 |
| M3D-6 | ⏳ | WebSocket 服务端同步 |
| M3D-7 | ⏳ | WASD 移动 |
| M3D-8 | ⏳ | 100+ 智能体流畅 |

---

## 六、与服务端对应

| 服务端 Phase | 3D 世界 Phase | 关联 |
|-------------|---------------|------|
| Phase 1 (Handler) | Phase 6 (网络) | WebSocket |
| Phase 2 (Services) | Phase 3 (智能体) | 数据同步 |
| Phase 4 (建筑) | Phase 2 (建筑) | 建筑模型 |
| Phase 5 (生态) | Phase 5 (子系统) | 天气/动物 |

---

## 七、技术要点

### Three.js ES Modules

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
```

### 模块通信 (EventBus)

```javascript
events.on('agent:move', ({ agentId, position }) => {
    // 更新 3D 位置
});
events.emit('building:clicked', { buildingId });
```

### 空间分区 (100+ 智能体)

```javascript
class SpatialGrid {
    query(position, radius) { ... }
}
```
