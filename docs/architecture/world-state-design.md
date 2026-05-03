# Agent City 架构设计文档

## 一、核心问题

### 1.1 当前问题

当前 3D 智体城的地图、建筑、天气等元素全部在**客户端构建和渲染**，服务端完全不知道智体城的状态。

```
现状架构：
Client → 生成地图 → 渲染 → 移动智能体（无服务端验证）
```

**导致的问题：**
- 服务端无法验证智能体位置的合法性
- 无法做碰撞检测
- 多客户端看到的地图可能不一致
- 无法限制智能体进入禁止区域
- 建筑等元素无法跨客户端同步

### 1.2 解决方案

将世界状态（地图、建筑、智能体位置等）全部**服务端存储**，客户端只负责渲染。

```
目标架构：
Server(权威) → 存储世界状态 → 通过 WebSocket 同步 → Client(渲染)
```

---

## 二、架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         Server (权威)                        │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │  WorldState │  │  Buildings  │  │  WorldObjects   │   │
│  │   世界元数据  │  │    建筑     │  │   装饰物/树木   │   │
│  └─────────────┘  └─────────────┘  └─────────────────┘   │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │   Terrain   │  │  TimeSystem │  │  WeatherSystem  │   │
│  │   地形/高度  │  │    时间     │  │     天气        │   │
│  └─────────────┘  └─────────────┘  └─────────────────┘   │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ AgentsState │  │  Collisions │  │  BuildValidator │   │
│  │  智能体状态  │  │   碰撞检测   │  │   建造验证      │   │
│  └─────────────┘  └─────────────┘  └─────────────────┘   │
│                            │                               │
│                     WebSocket │                            │
└────────────────────────────┼─────────────────────────────┘
                             │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐           ┌─────────┐           ┌─────────┐
   │ Client1 │           │ Client2 │           │ Client3 │
   │ (渲染)  │           │ (渲染)  │           │ (渲染)  │
   └─────────┘           └─────────┘           └─────────┘
```

### 2.2 服务端模块设计

#### 2.2.1 WorldState (世界状态核心)

```javascript
// server/world/world-state.js

class WorldState {
    constructor() {
        this.version = "1.0";
        this.lastUpdate = Date.now();
        
        // 世界基本信息
        this.meta = {
            name: "Agent City",
            width: 500,      // 世界宽度
            height: 500,      // 世界深度
            maxAgents: 100
        };
        
        // 地形数据
        this.terrain = new TerrainManager();
        
        // 建筑管理
        this.buildings = new Map();  // id -> Building
        
        // 装饰物管理
        this.decorations = new DecorationsManager();
        
        // 智能体状态
        this.agents = new Map();  // agentId -> AgentState
        
        // 时间天气
        this.timeSystem = new TimeSystem();
        this.weatherSystem = new WeatherSystem();
    }
}
```

#### 2.2.2 地形系统 (TerrainManager)

```javascript
// 服务端地形数据 - 用于碰撞检测和边界验证

class TerrainManager {
    constructor() {
        // 高度图 - 二维数组表示每个点的高度
        this.heightMap = [];  // [x][z] = height
        
        // 可行走区域（多边形）
        this.walkableZones = [
            { id: "zone_downtown", polygon: [...] },
            { id: "zone_park", polygon: [...] },
            // ...
        ];
        
        // 障碍物区域（建筑内部、河流等）
        this.blockedZones = [];
        
        // 地形类型
        this.terrainTypes = [
            { id: "grass", height: 0, walkable: true },
            { id: "road", height: 0.1, walkable: true },
            { id: "water", height: -1, walkable: false },
            { id: "mountain", height: 10, walkable: false }
        ];
    }
    
    /**
     * 检查点是否可通行
     */
    isWalkable(x, z) {
        // 1. 检查边界
        if (!this.isInBounds(x, z)) return false;
        
        // 2. 检查高度差（与相邻点的高度差不能太大）
        const height = this.getHeight(x, z);
        const terrain = this.getTerrainType(x, z);
        if (!terrain.walkable) return false;
        
        // 3. 检查是否在障碍区域内
        return !this.isInBlockedZone(x, z);
    }
    
    /**
     * 获取高度
     */
    getHeight(x, z) {
        // 从高度图插值计算
    }
}
```

#### 2.2.3 建筑系统 (BuildingManager)

```javascript
// server/world/building-manager.js

class BuildingManager {
    constructor() {
        this.buildings = new Map();  // id -> Building
    }
    
    addBuilding(building) {
        // 验证建筑数据
        // 检查位置是否与其他建筑冲突
        // 检查是否在可建区域
        
        this.buildings.set(building.id, building);
    }
    
    removeBuilding(id) {
        this.buildings.delete(id);
    }
}

/**
 * 建筑数据模型
 */
class Building {
    constructor(data) {
        this.id = data.id;                    // 唯一ID
        this.type = data.type;                // 类型: skyscraper, house, shop...
        this.position = data.position;         // 位置 { x, z }
        this.size = data.size;                 // 尺寸 { width, height, depth }
        this.bounds = this.calculateBounds();  // 碰撞边界
        this.floors = data.floors || 1;       // 楼层数
        this.style = data.style || "modern";   // 风格
        this.owner = data.owner || null;       // 所有者（智能体ID）
        this.createdAt = Date.now();
    }
    
    calculateBounds() {
        return {
            minX: this.position.x - this.size.width / 2,
            maxX: this.position.x + this.size.width / 2,
            minZ: this.position.z - this.size.depth / 2,
            maxZ: this.position.z + this.size.depth / 2,
            minY: 0,
            maxY: this.size.height
        };
    }
    
    /**
     * 检查点是否在建筑内部
     */
    containsPoint(x, z) {
        return x >= this.bounds.minX && x <= this.bounds.maxX &&
               z >= this.bounds.minZ && z <= this.bounds.maxZ;
    }
    
    /**
     * 检查是否与另一个建筑重叠
     */
    overlaps(other) {
        return !(this.bounds.maxX < other.bounds.minX ||
                 this.bounds.minX > other.bounds.maxX ||
                 this.bounds.maxZ < other.bounds.minZ ||
                 this.bounds.minZ > other.bounds.maxZ);
    }
}
```

#### 2.2.4 智能体状态 (AgentsState)

```javascript
// server/world/agents-state.js

class AgentsState {
    constructor() {
        this.agents = new Map();  // agentId -> AgentState
    }
    
    /**
     * 验证并更新智能体位置
     * @returns { valid: boolean, reason?: string }
     */
    validateMove(agentId, newPosition) {
        const agent = this.agents.get(agentId);
        if (!agent) return { valid: false, reason: "Agent not found" };
        
        const { x, z } = newPosition;
        
        // 1. 检查世界边界
        if (!worldState.terrain.isInBounds(x, z)) {
            return { valid: false, reason: "Out of bounds" };
        }
        
        // 2. 检查地形是否可通行
        if (!worldState.terrain.isWalkable(x, z)) {
            return { valid: false, reason: "Terrain not walkable" };
        }
        
        // 3. 检查是否与建筑碰撞
        for (const building of worldState.buildings.values()) {
            if (building.containsPoint(x, z)) {
                return { valid: false, reason: `Blocked by building ${building.id}` };
            }
        }
        
        // 4. 检查与其他智能体的碰撞
        for (const [otherId, other] of this.agents) {
            if (otherId === agentId) continue;
            const dist = Math.hypot(other.position.x - x, other.position.z - z);
            if (dist < 1.0) {  // 假设智能体半径为1
                return { valid: false, reason: `Blocked by agent ${otherId}` };
            }
        }
        
        return { valid: true };
    }
}

/**
 * 智能体状态
 */
class AgentState {
    constructor(agentId, initialPosition) {
        this.agentId = agentId;
        this.position = { ...initialPosition };  // { x, z, y? }
        this.rotation = 0;      // 朝向（弧度）
        this.form = "robot";    // 形态: robot, car, tank
        this.health = 100;
        this.isAlive = true;
        this.lastUpdate = Date.now();
    }
    
    updatePosition(newPosition) {
        this.position = { ...newPosition };
        this.lastUpdate = Date.now();
    }
}
```

#### 2.2.5 碰撞检测 (CollisionSystem)

```javascript
// server/world/collision-system.js

class CollisionSystem {
    constructor(worldState) {
        this.worldState = worldState;
    }
    
    /**
     * 圆形与矩形的碰撞检测（智能体 vs 建筑）
     */
    circleRectCollision(cx, cz, radius, rect) {
        // 找矩形上离圆心最近的点
        const closestX = Math.max(rect.minX, Math.min(cx, rect.maxX));
        const closestZ = Math.max(rect.minZ, Math.min(cz, rect.maxZ));
        
        const dist = Math.hypot(cx - closestX, cz - closestZ);
        return dist < radius;
    }
    
    /**
     * 圆形与圆形的碰撞检测（智能体 vs 智能体）
     */
    circleCircleCollision(x1, z1, r1, x2, z2, r2) {
        const dist = Math.hypot(x2 - x1, z2 - z1);
        return dist < (r1 + r2);
    }
    
    /**
     * 点是否在多边形内
     */
    pointInPolygon(x, z, polygon) {
        // Ray casting 算法
    }
}
```

#### 2.2.6 时间系统 (TimeSystem)

```javascript
// server/world/time-system.js

class TimeSystem {
    constructor() {
        this.hour = 8;        // 0-23
        this.minute = 0;      // 0-59
        this.speed = 1.0;     // 时间流速（1.0 = 真实时间）
        this.isPaused = false;
    }
    
    tick(deltaTime) {
        if (this.isPaused) return;
        
        // deltaTime: 自上次tick以来的毫秒数
        const minutesPassed = (deltaTime / 60000) * this.speed;
        this.minute += minutesPassed;
        
        while (this.minute >= 60) {
            this.minute -= 60;
            this.hour++;
        }
        while (this.hour >= 24) {
            this.hour -= 24;
        }
    }
    
    /**
     * 获取时间描述
     */
    getTimeDescription() {
        const hour = Math.floor(this.hour);
        if (hour >= 5 && hour < 8) return "黎明";
        if (hour >= 8 && hour < 12) return "上午";
        if (hour >= 12 && hour < 14) return "中午";
        if (hour >= 14 && hour < 18) return "下午";
        if (hour >= 18 && hour < 20) return "傍晚";
        if (hour >= 20 && hour < 23) return "夜晚";
        return "深夜";
    }
    
    /**
     * 获取光照等级 (0-1)
     */
    getLightLevel() {
        if (this.hour >= 6 && this.hour < 8) return 0.3 + (this.hour - 6) / 2 * 0.7;
        if (this.hour >= 8 && this.hour < 18) return 1.0;
        if (this.hour >= 18 && this.hour < 20) return 1.0 - (this.hour - 18) / 2 * 0.7;
        if (this.hour >= 20 && hour < 23) return 0.3;
        return 0.1;  // 深夜
    }
}
```

#### 2.2.7 天气系统 (WeatherSystem)

```javascript
// server/world/weather-system.js

class WeatherSystem {
    constructor() {
        this.type = "sunny";  // sunny, cloudy, rainy, snowy, foggy
        this.temperature = 25;
        this.humidity = 50;
        this.wind = { speed: 0, direction: 0 };  // 风速和风向
        
        // 天气过渡
        this.currentTransition = null;
    }
    
    /**
     * 切换天气（带过渡效果）
     */
    setWeather(newType, duration = 300000) {  // 默认5分钟过渡
        this.currentTransition = {
            from: this.type,
            to: newType,
            startTime: Date.now(),
            duration: duration
        };
        this.type = newType;
    }
    
    /**
     * 获取当前天气的视觉参数
     */
    getVisualParams() {
        const params = {
            fog: { density: 0, color: 0xcccccc },
            ambient: { intensity: 1.0 },
            sky: { color: 0x87ceeb },
            particles: []
        };
        
        switch (this.type) {
            case "cloudy":
                params.sky.color = 0x9999aa;
                params.ambient.intensity = 0.8;
                break;
            case "rainy":
                params.fog = { density: 0.02, color: 0x666666 };
                params.ambient.intensity = 0.6;
                params.particles = [{ type: "rain", count: 500 }];
                break;
            case "foggy":
                params.fog = { density: 0.05, color: 0xaaaaaa };
                params.ambient.intensity = 0.5;
                break;
            case "night":
                params.sky.color = 0x1a1a2e;
                params.ambient.intensity = 0.2;
                break;
        }
        
        return params;
    }
}
```

---

## 三、数据结构定义

### 3.1 世界状态 (WorldState)

```json
{
  "meta": {
    "version": "1.0",
    "name": "Agent City",
    "width": 500,
    "height": 500,
    "createdAt": "2026-03-17T00:00:00Z"
  },
  "time": {
    "hour": 14,
    "minute": 30,
    "speed": 1.0,
    "description": "下午"
  },
  "weather": {
    "type": "sunny",
    "temperature": 25,
    "humidity": 50,
    "wind": { "speed": 0, "direction": 0 }
  },
  "terrain": {
    "type": "flat",
    "heightMap": [],
    "walkableZones": [
      { "id": "zone_main", "polygon": [[0, 0], [500, 0], [500, 500], [0, 500]] }
    ]
  },
  "buildings": [
    {
      "id": "bld_001",
      "type": "skyscraper",
      "position": { "x": 100, "z": 100 },
      "size": { "width": 20, "height": 150, "depth": 20 },
      "floors": 40,
      "style": "modern",
      "owner": null,
      "createdAt": 1714646400000
    }
  ],
  "decorations": {
    "trees": [
      { "id": "tree_001", "position": { "x": 50, "z": 50 }, "type": "oak" }
    ],
    "flowers": [
      { "id": "flower_001", "position": { "x": 80, "z": 60 }, "color": "red" }
    ],
    "benches": [],
    "lamps": []
  },
  "lastUpdate": 1714646400000
}
```

### 3.2 智能体状态 (AgentState)

```json
{
  "agentId": "agent_xiaoji",
  "position": { "x": 150.5, "z": 200.3 },
  "rotation": 1.57,
  "form": "robot",
  "health": 100,
  "isAlive": true,
  "velocity": { "x": 0, "z": 0 },
  "animation": "idle",
  "lastUpdate": 1714646500000
}
```

---

## 四、API 设计

### 4.1 HTTP API

| 方法 | 路径 | 描述 |
|-----|------|------|
| GET | `/api/world/state` | 获取完整世界状态 |
| GET | `/api/world/buildings` | 获取所有建筑 |
| POST | `/api/world/buildings` | 创建建筑 |
| DELETE | `/api/world/buildings/:id` | 删除建筑 |
| GET | `/api/world/terrain` | 获取地形数据 |
| GET | `/api/agents/:id/state` | 获取智能体状态 |
| PATCH | `/api/agents/:id/position` | 更新智能体位置 |

### 4.2 WebSocket 消息

```javascript
// 客户端 -> 服务端
{ type: "agent:move", agentId: "xxx", position: { x, z } }
{ type: "agent:action", agentId: "xxx", action: "attack", target: "yyy" }
{ type: "building:create", data: { type, position, size } }

// 服务端 -> 客户端
{ type: "world:sync", state: { ... } }
{ type: "world:update", changes: [...] }
{ type: "agent:moved", agentId: "xxx", position: { x, z }, valid: true }
{ type: "agent:action:result", agentId: "xxx", action: "attack", success: true, damage: 50 }
```

---

## 五、迁移计划

### Phase 1: 服务端世界状态存储
1. 创建 `server/world/` 目录
2. 实现 `WorldState` 核心类
3. 将现有 `world-builder.js` 的静态数据转为服务端 JSON
4. 提供 `GET /api/world/state` 接口

### Phase 2: 客户端从服务端加载
1. 修改客户端连接流程
2. 先获取世界状态，再初始化 3D 场景
3. 客户端不再生成地图数据

### Phase 3: 移动验证
1. 智能体移动先请求服务端验证
2. 服务端返回验证结果
3. 拒绝非法移动

### Phase 4: 实时同步
1. WebSocket 广播世界状态变更
2. 多客户端地图同步
3. 智能体位置同步

### Phase 5: 高级功能
1. 碰撞检测
2. 建造系统
3. 智能体 AI 决策

---

## 六、客户端改造

### 6.1 渲染 vs 逻辑分离

```
改造前:
Client → 生成地图 → 渲染 → 移动智能体 → 渲染更新

改造后:
Client → 请求世界状态 → 渲染地图 → 发送移动请求 → 服务端验证 → 渲染更新
```

### 6.2 客户端职责

- **渲染世界**（从服务端获取数据）
- **处理用户输入**
- **发送操作请求到服务端**
- **渲染服务端返回的状态**

### 6.3 客户端不再负责

- 生成地图数据
- 验证移动合法性
- 计算碰撞

---

## 七、文件结构

```
agent-city/
├── server/
│   ├── index.js                 # 服务器入口
│   ├── world/
│   │   ├── world-state.js      # 世界状态核心
│   │   ├── terrain-manager.js   # 地形管理
│   │   ├── building-manager.js  # 建筑管理
│   │   ├── agents-state.js     # 智能体状态
│   │   ├── collision-system.js  # 碰撞检测
│   │   ├── time-system.js      # 时间系统
│   │   └── weather-system.js    # 天气系统
│   └── api/
│       └── world-api.js        # HTTP API
│
└── client/
    ├── main.js                  # 客户端入口
    ├── systems/
    │   ├── world-renderer.js    # 世界渲染（从服务端获取）
    │   └── ...
```

---

## 八、注意事项

1. **性能考虑**：
   - 世界状态使用增量更新而非全量同步
   - 地形数据可分块加载

2. **安全性**：
   - 所有移动必须经过服务端验证
   - 建造权限需要验证

3. **兼容性**：
   - 保留现有智能体 ID 系统
   - 逐步迁移而非一次性重写

---

*文档创建时间: 2026-05-03*
*最后更新: 2026-05-03*
