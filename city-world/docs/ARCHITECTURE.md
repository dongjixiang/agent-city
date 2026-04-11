# 智体城 3D 世界 - 架构文档

> 生成时间：2026-04-11
> 分析工具：自动分析

---

## 文件概览

| 文件 | 行数 | 函数数 | 导出数 | 说明 |
|------|------|--------|--------|------|
| city-world-full.js | 5751 | 64 | 10 | 主渲染引擎 |
| enhanced-city.js | 4755 | 72 | 18 | 功能扩展 |
| world-window.js | 791 | - | 1 | 世界之窗UI |
| dashboard-panel.js | - | - | 2 | 仪表盘UI |
| agent-detail-panel.js | - | - | 1 | 智能体详情面板 |
| welcome-overlay.js | - | - | 1 | 欢迎覆盖层 |
| day-night-indicator.js | - | - | 1 | 昼夜指示器 |
| task-visualization.js | - | - | 1 | 任务可视化 |
| click-handler.js | - | - | 0 | 点击处理 |

---

## 依赖关系图

```
index.html (动态加载所有 JS)
         |
         +---> city-world-full.js (主入口)
         |           |
         |           +---> window.scene (共享)
         |           +---> window.showAgentMessage (enhanced提供)
         |           +---> window.updateWeatherParticles (enhanced提供)
         |
         +---> enhanced-city.js (功能扩展)
         |           |
         |           +---> window.scene (依赖)
         |           +---> GLTFLoader (CDN)
         |
         +---> world-window.js (独立UI)
         +---> dashboard-panel.js
         +---> agent-detail-panel.js
         +---> welcome-overlay.js
         +---> click-handler.js
```

---

## 功能分布矩阵

| 功能 | full | enhanced | window | dashboard | agent |
|------|------|----------|--------|-----------|-------|
| 场景/渲染 | O | O | O | O | O |
| 建筑/地形 | O | O | | | |
| 智能体模型 | O | | | | |
| 智能体行为 | O | | | | |
| 天气系统 | O | O | | | |
| 昼夜循环 | | O | | | |
| 鸟群系统 | O | O | | | |
| 音乐/音效 | O | O | | | |
| UI/消息 | O | O | O | | |
| WebSocket | O | | | | |
| 面板组件 | | O | | | |

---

## city-world-full.js 结构 (5751行)

### 分节结构

| 行号 | 章节 | 说明 |
|------|------|------|
| 11 | 全局变量 | 全局状态 |
| 35 | 相机模式控制 | 第一人称/俯瞰等 |
| 287 | 初始化 | init() 主函数 |
| 529 | 灯光 | createLights() |
| 565 | 地面 | createGround() |
| 605 | 城市 | createCity() |
| 765 | 装饰物 | 树、路灯等 |
| 907 | 智能体模型工厂 | 龙虾/人形模型 |
| 1531 | 龙虾模型 | createLobsterMesh() |
| 1797 | 添加/移除智能体 | addAgentMesh() |
| 1945 | 智能体思考和移动 | moveAgentToFountain() |
| 2153 | 第一人称视野 | renderFirstPersonView() |
| 2471 | 雷达式视野 | detectObjectsInView() |
| 2679 | 自主行为系统 | agentAutonomousDecision() |
| 3425 | 动画循环 | animate() |
| 3921 | WebSocket | connectWebSocket() |

### window 导出

- window.scene - Three.js 场景
- window.showGreeting - 显示问候
- window.showDialogueBubble - 对话气泡
- window.hideDialogueBubble - 隐藏气泡
- window.showVoiceBubble - 语音气泡
- window.showAchievementBadge - 成就徽章
- window.showLevelUpBadge - 升级徽章
- window.playVoice - 播放语音
- window.updateWeatherParticles - 更新天气粒子
- window.getCurrentWeather - 获取天气状态

---

## enhanced-city.js 结构 (4755行)

### 分节结构

| 行号 | 章节 | 说明 |
|------|------|------|
| 47 | 语音合成系统 | speakText, toggleVoice |
| 59 | 柔和音乐化环境音效 | 白天/傍晚/夜晚音乐 |
| 1067 | 加载外部 GLB 模型 | loadExternalModel() |
| 1625 | Building Hover Tooltip | 建筑悬停提示 |
| 1711 | LOD 系统 | 细节层次 |
| 2225 | DAY/NIGHT CYCLE | 昼夜循环 |
| 2229 | Flying Birds System | 鸟群系统 |
| 2743 | 天气系统 | 天气粒子 |
| 2823 | 天气音效 | 雨天/雷声 |
| 4201 | 环境音效 | 背景音 |
| 4423 | UI IMPROVEMENTS | 头顶消息 |

### window 导出

- window.speakText - 语音合成
- window.toggleVoiceSystem - 切换语音
- window.updateBirds - 更新鸟群
- window.getCurrentWeather - 获取天气
- window.setWeather - 设置天气
- window.toggleWeather - 切换天气
- window.updateWeatherParticles - 更新天气粒子
- window.initAudioContext - 初始化音频
- window.toggleSound - 切换声音
- window.showAgentMessage - 显示头顶消息
- window.messageSpriteData - 消息精灵数据
- window._msgShowHistory - 消息历史

### 依赖的外部资源

- https://unpkg.com/three@0.150.0/examples/jsm/loaders/GLTFLoader.js

---

## 模块化重构目标结构

```
city-world/
├── src/
│   ├── main.js                 # 入口，init() 调用
│   │
│   ├── core/                   # 核心 - 场景/渲染/相机
│   │   ├── scene.js           # 场景创建 window.scene
│   │   ├── camera.js          # 相机控制
│   │   ├── lighting.js        # 灯光系统
│   │   └── ground.js         # 地面
│   │
│   ├── world/                  # 世界 - 建筑/地形/装饰
│   │   ├── buildings.js       # 建筑创建 (createCity)
│   │   ├── decorations.js     # 装饰物 (树、路灯)
│   │   ├── terrain.js         # 地形增强 (improveGround)
│   │   └── landmarks.js       # 地标建筑 (广场、喷泉)
│   │
│   ├── agents/                 # 智能体系统
│   │   ├── factory.js         # 模型工厂 (createAgentMesh)
│   │   ├── lobster.js          # 龙虾模型
│   │   ├── human.js            # 人形模型
│   │   ├── manager.js          # 管理 (addAgentMesh, removeAgentMesh)
│   │   └── behavior.js        # 行为 (自主移动)
│   │
│   ├── systems/                # 子系统
│   │   ├── weather.js         # 天气 + 粒子
│   │   ├── birds.js           # 鸟群
│   │   ├── day-night.js       # 昼夜循环
│   │   ├── audio.js           # 音效/语音
│   │   └── autonomous.js      # 自主行为AI
│   │
│   ├── ui/                    # UI组件
│   │   ├── world-window.js     # 世界之窗 (独立)
│   │   ├── dashboard.js        # 仪表盘
│   │   ├── agent-detail.js     # 智能体详情
│   │   ├── welcome.js          # 欢迎层
│   │   └── task-viz.js         # 任务可视化
│   │
│   ├── websocket/              # 网络通信
│   │   └── connection.js       # WebSocket连接
│   │
│   └── world-state/            # 预留：未来建造系统
│       └── interface.js
│
├── build/                      # 构建输出
│   └── city-world.bundle.js
│
└── docs/
    └── ARCHITECTURE.md        # 本文档
```

---

## 重构注意事项

### 1. 加载顺序问题
- city-world-full.js 和 enhanced-city.js 有交叉引用
- 重构后需要明确模块初始化顺序

### 2. 全局状态
- 两个大文件共享 window.scene
- 需要确保 scene 在其他模块之前初始化

### 3. 第三方依赖
- enhanced-city.js 依赖 GLTFLoader
- 加载顺序需要在使用前加载 GLTFLoader

### 4. UI 组件独立性
- world-window.js 相对独立，可作为参考
- 其他面板组件也可以类似拆分

---

## 下一步

1. 阶段一完成：分析依赖
2. 阶段二：建立新目录结构
3. 阶段三：逐步拆分
4. 阶段四：验证测试
