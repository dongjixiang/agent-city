# 智体城 3D 世界 - 分阶段实施计划

> 基于 DESIGN.md 和现有架构分析
> 创建时间：2026-04-11

---

## 一、现状分析

### 现有文件结构
```
city-world/
├── city-world-full.js   (5751行) - 主渲染引擎，64个函数
├── enhanced-city.js     (4755行) - 功能扩展，72个函数
├── index.html
└── src/
    ├── main.js
    ├── core/           # 场景/相机/灯光/地面
    ├── world/          # 建筑/装饰/地形
    ├── agents/         # 模型工厂/管理
    ├── systems/        # 天气/鸟群/昼夜/音频
    ├── ui/            # 面板组件
    └── websocket/     # WebSocket连接
```

### 核心问题
1. **单体文件** - city-world-full.js 5751行，enhanced-city.js 4755行
2. **全局状态混乱** - 大量 window.xxx 共享状态
3. **耦合严重** - UI/渲染/逻辑混杂
4. **UI 不完善** - 世界之窗、仪表盘需要重构

---

## 二、目标架构

```
city-world/
├── index.html                    # 入口页面
├── main.js                      # 主入口
├── build/                       # 构建输出
│
├── src/
│   ├── core/                    # 核心模块 ⭐
│   │   ├── scene.js           # 场景管理 (window.scene)
│   │   ├── camera.js          # 相机控制
│   │   ├── lighting.js        # 灯光系统
│   │   ├── renderer.js        # 渲染器
│   │   └── clock.js          # 时钟/deltaTime
│   │
│   ├── world/                  # 世界模块 ⭐
│   │   ├── terrain.js         # 地形 (地面、水域，道路)
│   │   ├── buildings.js      # 建筑 (8大建筑)
│   │   ├── decorations.js    # 装饰物 (花草树木路灯)
│   │   ├── landmarks.js     # 地标 (喷泉、广场)
│   │   └── spatial-grid.js  # 空间网格 (性能优化)
│   │
│   ├── agents/                 # 智能体模块
│   │   ├── factory.js        # 模型工厂
│   │   ├── lobster-model.js  # 龙虾模型
│   │   ├── human-model.js   # 人形模型
│   │   ├── manager.js        # 智能体管理
│   │   └── animations.js     # 动画系统
│   │
│   ├── systems/                # 子系统
│   │   ├── weather.js        # 天气 + 粒子
│   │   ├── day-night.js     # 昼夜循环
│   │   ├── birds.js         # 鸟群 (Boids)
│   │   ├── audio.js         # 音频管理
│   │   ├── autonomous.js    # 自主行为
│   │   └── ecology.js       # 生态系统
│   │
│   ├── ui/                     # UI 组件 ⭐
│   │   ├── world-window.js   # 世界之窗 (对话框)
│   │   ├── dashboard.js      # 仪表盘 (右下角)
│   │   ├── agent-detail.js   # 智能体详情面板
│   │   ├── notifications.js  # 通知系统
│   │   ├── task-panel.js    # 任务面板
│   │   ├── inventory-panel.js # 背包面板
│   │   ├── map-panel.js     # 小地图
│   │   └── components/       # 小组件
│   │       ├── tooltip.js   # 提示框
│   │       ├── modal.js     # 模态框
│   │       └── button.js    # 按钮
│   │
│   ├── network/                # 网络通信 ⭐
│   │   ├── websocket.js      # WebSocket连接
│   │   ├── http-api.js      # HTTP API
│   │   └── message-queue.js # 消息队列
│   │
│   ├── input/                  # 输入处理
│   │   ├── keyboard.js       # 键盘控制
│   │   ├── mouse.js          # 鼠标控制
│   │   └── touch.js          # 触摸控制
│   │
│   ├── utils/                  # 工具函数
│   │   ├── vector3.js        # 向量工具
│   │   ├── math.js           # 数学工具
│   │   └── debug.js          # 调试工具
│   │
│   └── config/                 # 配置
│       └── settings.js        # 设置
│
├── public/
│   ├── models/                # 3D模型 (.glb)
│   ├── textures/             # 纹理
│   └── audio/                # 音频
│
└── docs/
    └── ARCHITECTURE.md        # 架构文档
```

---

## 三、阶段计划

### Phase 3D-1: 核心重构 ⭐⭐⭐
**周期**: 2周
**目标**: 提取 core 和 world 模块，实现渲染和世界基础

| 任务 | 文件 | 描述 |
|------|------|------|
| 场景管理器 | core/scene.js | Three.js 场景创建 |
| 相机控制 | core/camera.js | OrbitControls + 第一人称 |
| 灯光系统 | core/lighting.js | 白天/夜晚灯光切换 |
| 渲染器 | core/renderer.js | WebGLRenderer 配置 |
| 时钟 | core/clock.js | deltaTime 管理 |
| 地形 | world/terrain.js | 地面、水域，道路 |
| 空间网格 | world/spatial-grid.js | 碰撞检测优化 |
| 主入口 | main.js | 模块初始化 |

**交付物**: 可运行的 3D 场景，地面+光照+相机控制

---

### Phase 3D-2: 世界构建 ⭐⭐
**周期**: 1周
**目标**: 实现建筑、装饰物、地标

| 任务 | 文件 | 描述 |
|------|------|------|
| 8大建筑 | world/buildings.js | 任务中心/声誉塔等 |
| 装饰物 | world/decorations.js | 树/花/路灯/长椅 |
| 地标 | world/landmarks.js | 喷泉/广场 |
| 建筑悬停 | ui/components/tooltip.js | 建筑信息提示 |
| 建筑点击 | input/mouse.js | 建筑交互 |

**交付物**: 完整的城市外观，可点击交互

---

### Phase 3D-3: 智能体系统 ⭐⭐⭐
**周期**: 2周
**目标**: 实现智能体模型、动画，管理

| 任务 | 文件 | 描述 |
|------|------|------|
| 模型工厂 | agents/factory.js | 创建智能体 |
| 龙虾模型 | agents/lobster-model.js | 龙虾 3D 模型 |
| 人形模型 | agents/human-model.js | 人形模型 |
| 动画系统 | agents/animations.js | 移动/待机动画 |
| 智能体管理 | agents/manager.js | 添加/移除/更新 |
| 头顶消息 | ui/world-window.js | 消息气泡 |

**交付物**: 智能体显示在世界中，头顶显示消息

---

### Phase 3D-4: 子系统 ⭐⭐
**周期**: 1-2周
**目标**: 天气、昼夜、鸟群、音频

| 任务 | 文件 | 描述 |
|------|------|------|
| 天气系统 | systems/weather.js | 粒子效果 |
| 昼夜循环 | systems/day-night.js | 天空颜色/灯光 |
| 鸟群系统 | systems/birds.js | Boids 算法 |
| 音频系统 | systems/audio.js | BGM/音效 |

**交付物**: 动态天气、昼夜变化、鸟群飞翔

---

### Phase 3D-5: UI 组件 ⭐⭐⭐
**周期**: 2周
**目标**: 完善所有 UI 面板

| 任务 | 文件 | 描述 |
|------|------|------|
| 世界之窗 | ui/world-window.js | 智能体对话 |
| 仪表盘 | ui/dashboard.js | 右下角状态栏 |
| 智能体详情 | ui/agent-detail.js | 点击查看详情 |
| 通知系统 | ui/notifications.js | 成就/升级通知 |
| 任务面板 | ui/task-panel.js | 任务列表 |
| 背包面板 | ui/inventory-panel.js | 物品查看 |
| 小地图 | ui/map-panel.js | 右上角小地图 |

**交付物**: 完整的 UI 系统

---

### Phase 3D-6: 网络通信 ⭐⭐⭐
**周期**: 1-2周
**目标**: WebSocket + HTTP API 集成

| 任务 | 文件 | 描述 |
|------|------|------|
| WebSocket | network/websocket.js | 服务端连接 |
| HTTP API | network/http-api.js | REST API |
| 消息队列 | network/message-queue.js | 离线消息缓存 |
| 智能体同步 | agents/manager.js | 位置/状态同步 |

**交付物**: 实时与服务端通信

---

### Phase 3D-7: 交互系统 ⭐⭐
**周期**: 1周
**目标**: 键盘/鼠标/触摸输入

| 任务 | 文件 | 描述 |
|------|------|------|
| 键盘控制 | input/keyboard.js | WASD移动 |
| 鼠标控制 | input/mouse.js | 点击/悬浮 |
| 触摸控制 | input/touch.js | 移动端支持 |
| 第一人称 | core/camera.js | 视角切换 |

**交付物**: 流畅的操控体验

---

### Phase 3D-8: 性能优化 ⭐⭐
**周期**: 1周
**目标**: LOD/实例化/裁剪

| 任务 | 文件 | 描述 |
|------|------|------|
| LOD系统 | world/buildings.js | 细节层次 |
| 实例化 | world/decorations.js | 大量树木 |
| 视锥裁剪 | core/camera.js | 可见性检测 |
| 空间分区 | world/spatial-grid.js | 查询优化 |

**交付物**: 100+智能体流畅运行

---

## 四、里程碑

| 里程碑 | Phase | 验收标准 |
|---------|-------|----------|
| M3D-1 | 1 | 地面+相机+光照可运行 |
| M3D-2 | 2 | 8大建筑+装饰物显示 |
| M3D-3 | 3 | 智能体显示+动画+头顶消息 |
| M3D-4 | 4 | 天气+昼夜+鸟群效果 |
| M3D-5 | 5 | 完整UI面板 |
| M3D-6 | 6 | 服务端实时同步 |
| M3D-7 | 7 | WASD移动+第一人称 |
| M3D-8 | 8 | 100+智能体流畅 |

---

## 五、技术要点

### 1. Three.js ES Modules 方式
```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
```

### 2. 模块通信 (EventBus)
```javascript
// 事件总线解耦
class EventBus {
    on(event, callback) { ... }
    emit(event, data) { ... }
}
const bus = new EventBus();

// 发布/订阅
bus.on('agent:click', (agent) => showDetail(agent));
bus.emit('agent:move', { id: 'xiaoji', position: {x: 10, z: 20} });
```

### 3. 空间分区 (100+智能体)
```javascript
class SpatialGrid {
    insert(object) { ... }
    query(position, radius) { ... }
    remove(objectId) { ... }
}
```

### 4. LOD 系统
```javascript
const lod = new THREE.LOD();
lod.addLevel(highDetailMesh, 0);
lod.addLevel(mediumDetailMesh, 50);
lod.addLevel(lowDetailMesh, 100);
scene.add(lod);
```

---

## 六、优先级排序

```
P0 (核心): Phase 1 - 核心渲染
P1 (关键): Phase 3 - 智能体 + Phase 6 - 网络
P2 (重要): Phase 2 - 世界 + Phase 5 - UI
P3 (丰富): Phase 4 - 子系统
P4 (优化): Phase 7 - 交互 + Phase 8 - 性能
```

---

## 七、与服务端的对应

| 服务端 Phase | 3D世界 Phase | 关联 |
|-------------|-------------|------|
| Phase 1 (Handler) | Phase 6 (网络) | WebSocket 消息处理 |
| Phase 2 (Services) | Phase 3 (智能体) | 智能体数据显示 |
| Phase 4 (建筑) | Phase 2 (世界) | 建筑模型和交互 |
| Phase 5 (生态) | Phase 4 (子系统) | 天气/日夜/动物 |

---

## 八、立即行动

**第一步**: 创建 `city-world/src/core/scene.js`
- 从 city-world-full.js 提取 Scene 初始化
- 创建 window.scene
- 验证 Three.js 加载

**第二步**: 创建 `city-world/src/core/camera.js`
- 实现 OrbitControls
- 俯视/第一人称切换

**第三步**: 创建 `city-world/src/main.js`
- ES Module 入口
- 按顺序初始化模块
