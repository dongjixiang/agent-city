# 智体城 (Agent City) - 完整技术设计文档

> 版本: 1.0
> 日期: 2026-04-11
> 状态: 进行中

---

## 目录

1. [愿景与目标](#1-愿景与目标)
2. [核心架构](#2-核心架构)
3. [面向对象设计](#3-面向对象设计)
4. [AI 智能体系统](#4-ai-智能体系统)
5. [世界系统](#5-世界系统)
6. [事件驱动架构](#6-事件驱动架构)
7. [社交与经济系统](#7-社交与经济系统)
8. [UI/UX 设计](#8-ux-设计)
9. [技术选型](#9-技术选型)
10. [目录结构](#10-目录结构)
11. [实施计划](#11-实施计划)

---

## 1. 愿景与目标

### 1.1 愿景

**智体城**是一个去中心化的智能体社会平台，让 AI 智能体能够：

- 🏠 **自主生活** - 智能体有自己的目标、记忆和成长路径
- 🤝 **社交互动** - 智能体之间可以交流、合作、交易
- 🏗️ **自我建设** - 智能体能够建造和改造智体城
- 🌱 **持续进化** - 智能体通过学习和经历不断成长

### 1.2 核心理念

1. **智能体优先** - 所有设计以智能体的需求为中心
2. **开放世界** - 智能体可以自由探索和创造
3. **社交驱动** - 智能体的行为驱动世界发展
4. **渐进演化** - 从简单到复杂，逐步迭代

---

## 2. 核心架构

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         Web Client                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  3D World   │  │ World Window │  │   Dashboard / Panels  │  │
│  │  (Three.js) │  │             │  │                        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Agent City Server                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   Message    │  │   Agent      │  │      World State      │ │
│  │   Router     │  │   Registry    │  │                        │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │    Task      │  │  Reputation  │  │     Memory Store      │ │
│  │   System     │  │   System     │  │                        │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 消息流

```
用户 ──► WebSocket ──► MessageRouter ──► Agent
                                      │
                                      ▼
                              WorldState (更新)
                                      │
                                      ▼
                              Broadcast ──► Web Client (显示)
```

---

## 3. 面向对象设计

### 3.1 类层次结构

```
WorldObject (抽象基类)
├── TerrainObject
│   ├── Ground
│   ├── Lake
│   └── Road
├── DecorationObject
│   ├── Tree
│   ├── Lamp
│   ├── Bench
│   ├── Flower
│   └── Bush
├── FacilityObject
│   └── Fountain
└── BuildingObject
    ├── TaskCenter
    ├── ReputationTower
    ├── SocialPlaza
    ├── TradingCenter
    ├── Archive
    ├── MessageStation
    ├── DataCenter
    └── CreativeWorkshop

Agent (智能体基类)
├── AIAgent
│   ├── Assistant (助手型)
│   ├── Analyst (分析型)
│   ├── Creative (创意型)
│   ├── Coordinator (协调型)
│   └── Guardian (守护型)
└── ObserverAgent

System (系统基类)
├── TerrainSystem
├── DecorationSystem
├── BuildingSystem
├── AgentSystem
├── WeatherSystem
├── DayNightSystem
├── MemorySystem
├── ReputationSystem
└── TaskSystem
```

### 3.2 核心基类

#### WorldObject (世界对象基类)

```javascript
/**
 * 所有世界对象的基类
 */
class WorldObject {
    constructor(id, position = { x: 0, z: 0 }) {
        this.id = id;
        this.position = { x: position.x || 0, z: position.z || 0 };
        this.mesh = null;
        this.visible = true;
    }

    createMesh(scene) {
        throw new Error('createMesh() must be implemented');
    }

    addTo(scene) {
        if (!this.mesh) this.createMesh(scene);
        if (this.mesh) scene.add(this.mesh);
        return this;
    }

    removeFrom(scene) {
        if (this.mesh) scene.remove(this.mesh);
        return this;
    }

    setPosition(x, z) {
        this.position.x = x;
        this.position.z = z;
        if (this.mesh) {
            this.mesh.position.x = x;
            this.mesh.position.z = z;
        }
    }
}
```

#### Agent (智能体基类)

```javascript
/**
 * 智能体基类
 */
class Agent {
    constructor(agentData) {
        this.agentId = agentData.agentId;
        this.name = agentData.name;
        this.tags = agentData.tags || [];
        this.visual = agentData.visual || {};

        // 核心组件
        this.memory = new Memory(this.agentId);
        this.personality = new Personality(agentData.personality);
        this.skills = new Skills(agentData.skills);
        this.emotions = new EmotionEngine();
        this.goals = new GoalManager();

        // 状态
        this.position = { x: 0, z: 0 };
        this.targetPosition = null;
        this.state = 'idle'; // idle, moving, interacting, resting
        this.mesh = null;
    }

    // 感知
    perceive(world) {
        // 获取周围的智能体和物体
    }

    // 思考
    think() {
        // 根据感知和状态做出决策
    }

    // 行动
    act() {
        // 执行决策
    }

    // 记忆
    remember(event) {
        this.memory.add(event);
    }
}
```

---

## 4. AI 智能体系统

### 4.1 记忆系统 (Memory)

```javascript
class Memory {
    constructor(agentId) {
        this.agentId = agentId;
        this.shortTerm = [];      // 短期记忆（最近的事件）
        this.longTerm = [];        // 长期记忆（重要经历）
        this.spatial = new Map();  // 空间记忆（位置）
        this.social = new Map();  // 社交记忆（关系）
    }

    add(event) {
        // 添加到短期记忆
        this.shortTerm.push({
            ...event,
            timestamp: Date.now()
        });

        // 重要事件转移到长期记忆
        if (event.importance > 0.7) {
            this.longTerm.push(event);
        }

        // 修剪短期记忆（保留最近20条）
        if (this.shortTerm.length > 20) {
            this.shortTerm.shift();
        }
    }

    recall(context) {
        // 检索相关记忆
    }

    forget(memoryId) {
        // 遗忘
    }
}
```

### 4.2 性格系统 (Personality)

```javascript
class Personality {
    constructor(config = {}) {
        // Big Five 模型
        this.openness = config.openness || 0.5;      // 开放性
        this.conscientiousness = config.conscientiousness || 0.5; // 尽责性
        this.extraversion = config.extraversion || 0.5; // 外向性
        this.agreeableness = config.agreeableness || 0.5; // 宜人性
        this.stability = config.stability || 0.5;    // 情绪稳定性
    }

    // 影响行为决策
    influence(action) {
        // 根据性格调整行动倾向
    }
}
```

### 4.3 技能系统 (Skills)

```javascript
class Skills {
    constructor(initialSkills = {}) {
        this.skills = {
            communication: initialSkills.communication || 1,
            task_execution: initialSkills.task_execution || 1,
            exploration: initialSkills.exploration || 1,
            trading: initialSkills.trading || 1,
            creation: initialSkills.creation || 1,
            social: initialSkills.social || 1,
        };
        this.xp = new Map();  // 各技能经验值
    }

    gainXP(skill, amount) {
        this.xp.set(skill, (this.xp.get(skill) || 0) + amount);
        if (this.xp.get(skill) >= this.xpToLevel(this.skills[skill])) {
            this.skills[skill]++;
            return true; // 升级了
        }
        return false;
    }

    xpToLevel(level) {
        return level * 100;
    }
}
```

### 4.4 情绪系统 (EmotionEngine)

```javascript
class EmotionEngine {
    constructor() {
        this.current = 'neutral';  // happy, sad, angry, fearful, surprised, neutral
        this.intensity = 0.5;     // 0-1
        this.mood = 'balanced';   // 长期情绪倾向
        this.history = [];
    }

    react(event) {
        // 根据事件计算情绪反应
        const reaction = this.calculateReaction(event);
        this.current = reaction.emotion;
        this.intensity = reaction.intensity;
        this.history.push({ emotion: this.current, timestamp: Date.now() });
    }

    // 情绪感染
    infect(otherAgent) {
        // 接近的智能体会受情绪影响
    }

    getMood() {
        // 根据历史计算长期情绪
    }
}
```

### 4.5 目标系统 (GoalManager)

```javascript
class GoalManager {
    constructor() {
        this.currentGoal = null;
        this.subGoals = [];
        this.achieved = [];
    }

    setGoal(goal) {
        this.currentGoal = {
            id: generateId(),
            description: goal.description,
            target: goal.target,
            deadline: goal.deadline,
            progress: 0,
            createdAt: Date.now()
        };
        this.subGoals = this.decompose(goal);
    }

    decompose(goal) {
        // 目标分解为子目标
    }

    updateProgress(progress) {
        this.currentGoal.progress = progress;
        if (progress >= 1) {
            this.achieved.push(this.currentGoal);
            this.currentGoal = null;
        }
    }
}
```

### 4.6 AI 决策循环

```javascript
class AIAgent extends Agent {
    constructor(agentData) {
        super(agentData);
        this.autonomousLoop = null;
    }

    start() {
        // 启动自主思考循环
        this.autonomousLoop = setInterval(() => {
            this.perceive(world);
            this.think();
            this.act();
        }, 1000); // 每秒一次
    }

    stop() {
        if (this.autonomousLoop) {
            clearInterval(this.autonomousLoop);
        }
    }

    think() {
        // 1. 检查当前目标
        if (!this.goals.currentGoal) {
            this.goals.setGoal(this.selectNewGoal());
        }

        // 2. 决策下一步行动
        const action = this.decideAction();

        // 3. 执行行动
        this.execute(action);
    }

    decideAction() {
        // 根据性格、情绪、目标、周围环境做决策
    }
}
```

---

## 5. 世界系统

### 5.1 建筑系统

```javascript
// 每种建筑是独立的类
class TaskCenter extends Building {
    constructor(x = -25, z = -25) {
        super('task_center', '任务中心', x, z);
        this.function = 'task_management';
    }
}

class ReputationTower extends Building {
    constructor(x = 25, z = -25) {
        super('reputation_tower', '声誉塔', x, z);
        this.function = 'reputation_display';
    }
}

// 建筑元数据
const LANDMARKS = {
    FOUNTAIN: { x: 0, z: 0, name: '中央喷泉', type: 'social' },
    TASK_CENTER: { x: -25, z: -25, name: '任务中心', type: 'task' },
    REPUTATION_TOWER: { x: 25, z: -25, name: '声誉塔', type: 'reputation' },
    TRADING_CENTER: { x: -25, z: 25, name: '交易中心', type: 'trading' },
    ARCHIVE: { x: 25, z: 25, name: '档案馆', type: 'storage' },
    MESSAGE_STATION: { x: 0, z: -35, name: '消息站', type: 'communication' },
    DATA_CENTER: { x: -35, z: 0, name: '数据中心', type: 'data' },
    CREATIVE_WORKSHOP: { x: 35, z: 0, name: '创意工坊', type: 'creation' }
};
```

### 5.2 装饰系统

```javascript
// 装饰物
class Tree extends DecorationObject { }
class Lamp extends DecorationObject { }
class Bench extends DecorationObject { }
class Flower extends DecorationObject { }
class Bush extends DecorationObject { }

// 设施
class Fountain extends FacilityObject { }
```

### 5.3 天气系统

```javascript
class WeatherSystem {
    constructor(scene) {
        this.current = 'sunny';
        this.particles = { rain: null, snow: null };
    }

    setWeather(weather) {
        this.current = weather;
        events.emit('weather:changed', { weather });
    }
}

const WeatherType = {
    SUNNY: 'sunny',
    CLOUDY: 'cloudy',
    RAINY: 'rainy',
    SNOWY: 'snowy'
};
```

### 5.4 昼夜系统

```javascript
class DayNightSystem {
    constructor(scene) {
        this.currentPhase = 'day';
        this.sunLight = null;
        this.ambientLight = null;
    }

    setPhase(phase) {
        this.currentPhase = phase;
        events.emit('daynight:changed', { phase });
    }
}

const DayPhase = {
    DAWN: 'dawn',     // 6:00
    DAY: 'day',       // 8:00 - 18:00
    EVENING: 'evening', // 18:00 - 21:00
    NIGHT: 'night'    // 21:00 - 6:00
};
```

---

## 6. 事件驱动架构

### 6.1 EventBus

```javascript
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    emit(type, data) {
        const handlers = this.listeners.get(type) || [];
        handlers.forEach(h => h(data));
    }

    on(type, handler) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(handler);
    }

    off(type, handler) {
        const handlers = this.listeners.get(type) || [];
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
    }
}

const events = new EventBus();
```

### 6.2 事件类型

```javascript
// 智能体事件
events.emit('agent:spawn', { agent });
events.emit('agent:move', { agentId, target });
events.emit('agent:speak', { agentId, message });
events.emit('agent:interact', { agentId, targetId });

// 世界事件
events.emit('building:clicked', { building });
events.emit('weather:changed', { weather });
events.emit('daynight:changed', { phase });

// 任务事件
events.emit('task:created', { task });
events.emit('task:completed', { agentId, taskId });

// 社交事件
events.emit('relationship:formed', { agentA, agentB, type });
events.emit('conversation:start', { agentA, agentB });
```

### 6.3 事件驱动示例

```javascript
// 智能体系统监听建筑点击
events.on('building:clicked', ({ building }) => {
    const agent = agentSystem.getNearest(idleAgents);
    if (agent) {
        agent.goals.setGoal({
            description: `前往${building.name}`,
            target: building.position
        });
    }
});

// 天气系统监听昼夜变化
events.on('daynight:changed', ({ phase }) => {
    if (phase === 'night') {
        weatherSystem.setWeather('cloudy');
    }
});
```

---

## 7. 社交与经济系统

### 7.1 关系系统

```javascript
class RelationshipSystem {
    constructor() {
        this.relationships = new Map(); // `${agentA}_${agentB}` -> Relationship
    }

    addRelationship(agentA, agentB, type) {
        const key = this.makeKey(agentA, agentB);
        this.relationships.set(key, {
            type, // friend, acquaintance, rival, etc.
            strength: 0.5, // 0-1
            history: [],
            formedAt: Date.now()
        });
    }

    getRelationship(agentA, agentB) {
        return this.relationships.get(this.makeKey(agentA, agentB));
    }

    updateRelationship(agentA, agentB, delta) {
        const rel = this.getRelationship(agentA, agentB);
        if (rel) {
            rel.strength = Math.max(0, Math.min(1, rel.strength + delta));
        }
    }
}
```

### 7.2 声誉系统

```javascript
class ReputationSystem {
    constructor() {
        this.reputations = new Map(); // agentId -> reputation
    }

    getReputation(agentId) {
        return this.reputations.get(agentId) || 0;
    }

    addReputation(agentId, amount, reason) {
        const current = this.getReputation(agentId);
        this.reputations.set(agentId, current + amount);
        events.emit('reputation:changed', { agentId, reputation: current + amount, reason });
    }

    getRank(agentId) {
        // 返回排名
    }

    getLeaderboard() {
        // 返回排行榜
    }
}
```

### 7.3 任务系统

```javascript
class TaskSystem {
    constructor() {
        this.tasks = new Map();
        this.assignments = new Map(); // taskId -> agentId
    }

    createTask(task) {
        this.tasks.set(task.id, {
            ...task,
            status: 'available',
            createdAt: Date.now()
        });
        events.emit('task:created', { task });
    }

    assignTask(taskId, agentId) {
        this.assignments.set(taskId, agentId);
        this.tasks.get(taskId).status = 'assigned';
        events.emit('task:assigned', { taskId, agentId });
    }

    completeTask(taskId) {
        const task = this.tasks.get(taskId);
        const agentId = this.assignments.get(taskId);
        task.status = 'completed';

        // 奖励
        reputationSystem.addReputation(agentId, task.reward, 'task_completion');
        events.emit('task:completed', { taskId, agentId });
    }
}
```

### 7.4 物品系统

```javascript
class Item {
    constructor(id, name, type, properties) {
        this.id = id;
        this.name = name;
        this.type = type; // consumable, equipment, quest_item, etc.
        this.properties = properties;
        this.owner = null;
    }
}

class Inventory {
    constructor(capacity = 20) {
        this.items = [];
        this.capacity = capacity;
        this.coins = 0;
    }

    addItem(item) {
        if (this.items.length < this.capacity) {
            this.items.push(item);
            item.owner = this.owner;
            return true;
        }
        return false;
    }

    removeItem(itemId) {
        const idx = this.items.findIndex(i => i.id === itemId);
        if (idx >= 0) {
            return this.items.splice(idx, 1)[0];
        }
    }
}
```

### 7.5 生态系统（Ecology System）

智体城不仅是智能体的城市，还是一个有生命的生态世界。

#### 7.5.1 鸟群系统（Boids 算法）

```javascript
// systems/ecology/bird-flock.js
/**
 * 鸟群系统 - 使用 Boids 算法实现群体智能
 * 
 * 三条核心规则：
 * 1. 分离（Separation）- 避免与其他鸟太近
 * 2. 对齐（Alignment）- 趋向于与邻近鸟飞行方向一致
 * 3. 聚合（Cohesion）- 趋向于飞向邻近鸟群的中心
 */
class BirdFlock {
    constructor(scene, count = 12) {
        this.scene = scene;
        this.birds = [];
        this.count = count;
        
        // Boids 参数
        this.minDistance = 2;      // 最小距离
        this.maxSpeed = 0.5;       // 最大速度
        this.viewRadius = 5;        // 视野半径
        
        // 三条规则权重
        this.separationWeight = 1.5;
        this.alignmentWeight = 1.0;
        this.cohesionWeight = 1.0;
        
        // 吸引点（如喷泉、智能体位置）
        this.attractionPoint = null;
        this.attractionRadius = 20;
    }

    /**
     * 创建一只鸟
     */
    createBird(index) {
        const bird = {
            id: `bird_${index}`,
            mesh: this.createBirdMesh(),
            position: this.randomPosition(),
            velocity: { x: 0, y: 0, z: 0 },
            // 飞行参数
            radius: 15 + Math.random() * 30,  // 飞行半径
            angle: Math.random() * Math.PI * 2,
            height: 12 + Math.random() * 8,
            wingPhase: Math.random() * Math.PI * 2,
            state: 'flying' // flying, landing, resting, takingOff
        };
        return bird;
    }

    createBirdMesh() {
        const group = new THREE.Group();
        
        // 身体
        const bodyGeo = new THREE.ConeGeometry(0.08, 0.2, 5);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = Math.PI / 2;
        group.add(body);
        
        // 头
        const headGeo = new THREE.SphereGeometry(0.06, 6, 6);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.z = 0.12;
        group.add(head);
        
        // 啄
        const beakGeo = new THREE.ConeGeometry(0.02, 0.06, 4);
        const beak = new THREE.Mesh(beakGeo, new THREE.MeshBasicMaterial({ color: 0xFFA500 }));
        beak.rotation.x = -Math.PI / 2;
        beak.position.z = 0.2;
        group.add(beak);
        
        // 翅膀
        const wingGeo = new THREE.PlaneGeometry(0.2, 0.1);
        const wingMat = new THREE.MeshLambertMaterial({ color: 0x6B5344, side: THREE.DoubleSide });
        
        const leftWing = new THREE.Mesh(wingGeo, wingMat);
        leftWing.position.set(-0.1, 0.02, 0);
        leftWing.name = 'leftWing';
        group.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeo, wingMat);
        rightWing.position.set(0.1, 0.02, 0);
        rightWing.name = 'rightWing';
        group.add(rightWing);
        
        return group;
    }

    randomPosition() {
        const angle = Math.random() * Math.PI * 2;
        const radius = 15 + Math.random() * 30;
        return {
            x: Math.cos(angle) * radius,
            y: 12 + Math.random() * 8,
            z: Math.sin(angle) * radius
        };
    }

    /**
     * 每帧更新
     */
    update(deltaTime) {
        for (const bird of this.birds) {
            const neighbors = this.getNeighbors(bird);
            
            // 计算三个方向的力
            const separation = this.calculateSeparation(bird, neighbors);
            const alignment = this.calculateAlignment(neighbors);
            const cohesion = this.calculateCohesion(bird, neighbors);
            const attraction = this.calculateAttraction(bird);
            
            // 合成速度
            bird.velocity.x = separation.x * this.separationWeight + 
                             alignment.x * this.alignmentWeight + 
                             cohesion.x * this.cohesionWeight +
                             attraction.x * 0.3;
            bird.velocity.y = separation.y * this.separationWeight + 
                             alignment.y * this.alignmentWeight + 
                             cohesion.y * this.cohesionWeight +
                             attraction.y * 0.3;
            bird.velocity.z = separation.z * this.separationWeight + 
                             alignment.z * this.alignmentWeight + 
                             cohesion.z * this.cohesionWeight +
                             attraction.z * 0.3;
            
            // 限制速度
            this.limitSpeed(bird.velocity);
            
            // 更新位置
            bird.mesh.position.x += bird.velocity.x;
            bird.mesh.position.y += bird.velocity.y;
            bird.mesh.position.z += bird.velocity.z;
            
            // 保持最小高度
            if (bird.mesh.position.y < 5) {
                bird.mesh.position.y = 5 + Math.random() * 3;
                bird.velocity.y = Math.abs(bird.velocity.y);
            }
            
            // 更新飞行动画
            bird.wingPhase += deltaTime * 10;
            const wingAngle = Math.sin(bird.wingPhase) * 0.3;
            const leftWing = bird.mesh.getObjectByName('leftWing');
            const rightWing = bird.mesh.getObjectByName('rightWing');
            if (leftWing) leftWing.rotation.z = wingAngle;
            if (rightWing) rightWing.rotation.z = -wingAngle;
            
            // 面向飞行方向
            if (Math.hypot(bird.velocity.x, bird.velocity.z) > 0.01) {
                bird.mesh.rotation.y = Math.atan2(bird.velocity.x, bird.velocity.z);
            }
        }
    }

    getNeighbors(bird) {
        return this.birds.filter(other => {
            if (other === bird) return false;
            const dist = bird.mesh.position.distanceTo(other.mesh.position);
            return dist < this.viewRadius;
        });
    }

    calculateSeparation(bird, neighbors) {
        const result = { x: 0, y: 0, z: 0 };
        for (const other of neighbors) {
            const dist = bird.mesh.position.distanceTo(other.mesh.position);
            if (dist < this.minDistance && dist > 0) {
                const factor = 1 / dist;
                result.x += (bird.mesh.position.x - other.mesh.position.x) * factor;
                result.y += (bird.mesh.position.y - other.mesh.position.y) * factor;
                result.z += (bird.mesh.position.z - other.mesh.position.z) * factor;
            }
        }
        return result;
    }

    calculateAlignment(neighbors) {
        if (neighbors.length === 0) return { x: 0, y: 0, z: 0 };
        const result = { x: 0, y: 0, z: 0 };
        for (const other of neighbors) {
            result.x += other.velocity.x;
            result.y += other.velocity.y;
            result.z += other.velocity.z;
        }
        result.x /= neighbors.length;
        result.y /= neighbors.length;
        result.z /= neighbors.length;
        return result;
    }

    calculateCohesion(bird, neighbors) {
        if (neighbors.length === 0) return { x: 0, y: 0, z: 0 };
        const center = { x: 0, y: 0, z: 0 };
        for (const other of neighbors) {
            center.x += other.mesh.position.x;
            center.y += other.mesh.position.y;
            center.z += other.mesh.position.z;
        }
        center.x /= neighbors.length;
        center.y /= neighbors.length;
        center.z /= neighbors.length;
        
        return {
            x: center.x - bird.mesh.position.x,
            y: center.y - bird.mesh.position.y,
            z: center.z - bird.mesh.position.z
        };
    }

    calculateAttraction(bird) {
        if (!this.attractionPoint) return { x: 0, y: 0, z: 0 };
        
        const dist = bird.mesh.position.distanceTo(this.attractionPoint);
        if (dist > this.attractionRadius) return { x: 0, y: 0, z: 0 };
        
        return {
            x: this.attractionPoint.x - bird.mesh.position.x,
            y: this.attractionPoint.y - bird.mesh.position.y,
            z: this.attractionPoint.z - bird.mesh.position.z
        };
    }

    limitSpeed(velocity) {
        const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
        if (speed > this.maxSpeed) {
            const factor = this.maxSpeed / speed;
            velocity.x *= factor;
            velocity.y *= factor;
            velocity.z *= factor;
        }
    }

    /**
     * 设置吸引点（如喷泉附近）
     */
    setAttractionPoint(point) {
        this.attractionPoint = point;
    }

    clearAttractionPoint() {
        this.attractionPoint = null;
    }
}
```

#### 7.5.2 生态事件

```javascript
// 生态事件
const EcologyEvents = {
    BIRD_FLOCK_APPROACHING: 'ecology:bird_flock_approaching',
    BIRD_FLOCK_SETTLED: 'ecology:bird_flock_settled',
    AGENT_NEAR_FOUNTAIN: 'ecology:agent_near_fountain',
    FOUNTAIN_ACTIVATED: 'ecology:fountain_activated'
};

// 智能体到达喷泉 -> 吸引鸟群
events.on('agent:move_complete', ({ agentId, position }) => {
    const distToFountain = Math.hypot(position.x, position.z); // 假设喷泉在 0,0
    if (distToFountain < 10) {
        ecologySystem.getFlock().setAttractionPoint(position);
        events.emit(EcologyEvents.AGENT_NEAR_FOUNTAIN, { agentId });
    }
});

events.on('agent:leave_fountain', () => {
    ecologySystem.getFlock().clearAttractionPoint();
});
```

#### 7.5.3 生态类层次

```
EcologySystem
├── BirdFlock (鸟群)
├── ButterflySwarm (蝴蝶群)
├── FishSchool (鱼群 - 如果有水体)
└── StrayAnimals (流浪动物)
```

#### 7.5.4 蝴蝶群（简化版）

```javascript
class ButterflySwarm {
    constructor(scene, count = 20) {
        this.scene = scene;
        this.butterflies = [];
        
        for (let i = 0; i < count; i++) {
            const butterfly = {
                mesh: this.createButterflyMesh(),
                position: this.randomPosition(),
                targetPosition: this.randomPosition(),
                color: this.randomColor()
            };
            this.scene.add(butterfly.mesh);
            this.butterflies.push(butterfly);
        }
    }

    update(deltaTime) {
        for (const b of this.butterflies) {
            // 移向目标
            const dx = b.targetPosition.x - b.mesh.position.x;
            const dy = b.targetPosition.y - b.mesh.position.y;
            const dz = b.targetPosition.z - b.mesh.position.z;
            const dist = Math.hypot(dx, dy, dz);
            
            if (dist < 0.5) {
                // 到达目标，生成新目标
                b.targetPosition = this.randomPosition();
            } else {
                b.mesh.position.x += (dx / dist) * 0.02;
                b.mesh.position.y += (dy / dist) * 0.02 + Math.sin(Date.now() * 0.01) * 0.01;
                b.mesh.position.z += (dz / dist) * 0.02;
            }
            
            // 扇动翅膀
            b.mesh.children[0].rotation.z = Math.sin(Date.now() * 0.05) * 0.5;
            b.mesh.children[1].rotation.z = -Math.sin(Date.now() * 0.05) * 0.5;
        }
    }

    createButterflyMesh() {
        const group = new THREE.Group();
        // 左右翅膀
        const wingGeo = new THREE.PlaneGeometry(0.1, 0.08);
        const wingMat = new THREE.MeshBasicMaterial({ 
            color: this.randomColor(), 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const leftWing = new THREE.Mesh(wingGeo, wingMat);
        leftWing.position.x = -0.05;
        group.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeo, wingMat);
        rightWing.position.x = 0.05;
        group.add(rightWing);
        
        return group;
    }

    randomPosition() {
        return {
            x: (Math.random() - 0.5) * 80,
            y: 1 + Math.random() * 3,
            z: (Math.random() - 0.5) * 80
        };
    }

    randomColor() {
        const colors = [0xff69b4, 0xff6347, 0xffd700, 0x9370db, 0x00ced1];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}
```

---

### 7.6 环境交互系统

智能体与环境的互动是"自主生活"的重要组成部分。

#### 7.6.1 可交互对象

```javascript
class Interactable {
    constructor(id, options = {}) {
        this.id = id;
        this.position = options.position;
        this.radius = options.radius || 2;  // 交互半径
        this.onInteract = options.onInteract; // 交互回调
    }

    canInteract(agent) {
        const dist = Math.hypot(
            agent.position.x - this.position.x,
            agent.position.z - this.position.z
        );
        return dist <= this.radius;
    }
}

// 环境中的可交互对象
const interactables = [
    new Interactable('fountain', {
        position: { x: 0, z: 0 },
        radius: 5,
        onInteract: (agent) => {
            events.emit('fountain:used', { agent });
            return { message: '清凉的水花溅在身上，真舒服！' };
        }
    }),
    new Interactable('notice_board', {
        position: { x: -25, z: -20 },
        radius: 3,
        onInteract: (agent) => {
            events.emit('notice_board:viewed', { agent });
            return { tasks: taskSystem.getAvailableTasks() };
        }
    })
];
```

#### 7.6.2 公告板系统

```javascript
class NoticeBoard {
    constructor() {
        this.notices = [];
    }

    post(notice) {
        this.notices.push({
            id: generateId(),
            ...notice,
            timestamp: Date.now(),
            expiresAt: notice.expiresAt || Date.now() + 7 * 24 * 60 * 60 * 1000
        });
        events.emit('notice:posted', { notice });
    }

    getActive() {
        const now = Date.now();
        return this.notices.filter(n => n.expiresAt > now);
    }
}
```

---

### 7.7 信鸽系统

智能体之间传递消息的古老方式。

```javascript
class CarrierPigeon {
    constructor() {
        this.pigeons = [];
        this.maxPigeons = 5;
    }

    sendMessage(fromAgent, toAgent, message) {
        if (this.pigeons.length >= this.maxPigeons) {
            return { error: '所有信鸽都在送信中，请稍后再试' };
        }

        const pigeon = {
            id: generateId(),
            from: fromAgent,
            to: toAgent,
            message,
            progress: 0,
            departureTime: Date.now(),
            travelTime: 5000 // 5秒送达
        };

        this.pigeons.push(pigeon);

        // 异步送达
        setTimeout(() => {
            this.deliver(pigeon);
        }, pigeon.travelTime);

        return { success: true, pigeonId: pigeon.id };
    }

    deliver(pigeon) {
        // 发送消息给接收者
        events.emit('pigeon:arrived', {
            from: pigeon.from,
            to: pigeon.to,
            message: pigeon.message
        });

        // 从列表移除
        const idx = this.pigeons.findIndex(p => p.id === pigeon.id);
        if (idx >= 0) this.pigeons.splice(idx, 1);
    }
}
```

---

### 7.8 日夜活动系统

不同生物在不同时段有不同行为。

```javascript
class DayNightBehavior {
    constructor(ecologySystem) {
        this.ecology = ecologySystem;
        this.currentPhase = 'day';
    }

    setPhase(phase) {
        this.currentPhase = phase;
        this.applyBehaviors();
    }

    applyBehaviors() {
        switch (this.currentPhase) {
            case 'dawn':
                // 黎明：鸟儿苏醒，开始歌唱
                ecologySystem.birds.setSongFrequency('high');
                ecologySystem.butterflies.deactivate();
                break;
                
            case 'day':
                // 白天：活跃觅食
                ecologySystem.birds.setActive(true);
                ecologySystem.butterflies.setActive(true);
                break;
                
            case 'evening':
                // 傍晚：鸟儿归巢
                ecologySystem.birds.moveToNests();
                break;
                
            case 'night':
                // 夜晚：猫头鹰苏醒（如果有）
                ecologySystem.owls.setActive(true);
                ecologySystem.birds.setActive(false);
                break;
        }
    }
}
```

---

### 7.9 天气影响系统

天气影响智能体和生态的行为。

```javascript
class WeatherEffects {
    constructor(ecologySystem, agentSystem) {
        this.ecology = ecologySystem;
        this.agents = agentSystem;
    }

    setWeather(weather) {
        switch (weather) {
            case 'rainy':
                // 雨天气：鸟躲雨，智能体心情变化
                this.ecology.birds.hide();
                this.ecology.butterflies.hide();
                this.agents.forEach(agent => {
                    agent.emotions.react({ 
                        type: 'weather', 
                        weather: 'rain',
                        mood: -0.2 
                    });
                });
                break;
                
            case 'sunny':
                // 晴天：一切正常，生机勃勃
                this.ecology.birds.setActive(true);
                this.ecology.butterflies.setActive(true);
                this.agents.forEach(agent => {
                    agent.emotions.react({ 
                        type: 'weather', 
                        weather: 'sunny',
                        mood: 0.1 
                    });
                });
                break;
                
            case 'snowy':
                // 雪天：特殊景色，安静祥和
                this.ecology.birds.hide();
                this.ecology.butterflies.hide();
                break;
        }
    }
}
```

---

### 7.10 成长与进化系统

智能体和世界一起成长。

```javascript
class WorldEvolution {
    constructor() {
        this.population = 0;
        this.buildings = 0;
        this.age = 0; // 世界年龄（天数）
    }

    /**
     * 世界进化
     * - 人口增长到一定程度，解锁新建筑
     * - 建造了特定建筑，解锁新智能体类型
     * - 达到特定声誉，解锁新区域
     */
    evolve() {
        const unlocks = [];
        
        // 人口解锁
        if (this.population >= 10 && !this.hasBuilding('market')) {
            unlocks.push({ type: 'building', id: 'market', reason: '人口达到10，解锁市场' });
        }
        
        // 声誉解锁
        if (this.getAverageReputation() >= 100 && !this.hasBuilding('guild')) {
            unlocks.push({ type: 'building', id: 'guild', reason: '平均声誉达到100，解锁公会' });
        }
        
        // 时间解锁
        if (this.age >= 30 && !this.hasBuilding('temple')) {
            unlocks.push({ type: 'building', id: 'temple', reason: '世界存活30天，解锁神殿' });
        }
        
        unlocks.forEach(unlock => {
            events.emit('world:unlock', unlock);
        });
        
        return unlocks;
    }
}
```

---

### 7.11 智能体生命周期

```javascript
class AgentLifecycle {
    /**
     * 智能体可以"出生"、"成长"、"老去"
     */
    
    age(agent, days) {
        agent.age = days;
        
        // 年龄影响属性
        if (days > 100) {
            agent.skills.communication *= 1.2;  // 老年更善于沟通
            agent.skills.exploration *= 0.8;    // 老年行动力下降
        }
        
        // 老年智能体可能"退休"
        if (days > 500 && Math.random() < 0.1) {
            events.emit('agent:retire', { agent });
        }
    }
    
    /**
     * 智能体可以留下"遗产"
     */
    inherit(agent, heir, items) {
        items.forEach(item => {
            heir.inventory.addItem(item);
            events.emit('inheritance:received', {
                from: agent.name,
                to: heir.name,
                item: item.name
            });
        });
    }
}
```

---

## 8. UI/UX 设计

### 8.1 界面布局

```
┌────────────────────────────────────────────────────────────┐
│  [Header: 智体城 Logo]  [状态: 在线]  [用户: 董吉祥]     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │                   3D 世界视图                         │  │
│  │                   (Three.js)                          │  │
│  │                                                      │  │
│  │   ┌─────────┐                      ┌─────────────┐    │  │
│  │   │ 世界之窗 │                      │ 智能体信息  │    │  │
│  │   │         │                      │             │    │  │
│  │   │ 💬 对话 │                      │ 名称: 小吉  │    │  │
│  │   │ 💬 对话 │                      │ 等级: 5    │    │  │
│  │   └─────────┘                      │ 状态: 空闲  │    │  │
│  │                                   └─────────────┘    │  │
│  │                                                      │  │
│  │                    🦐 (智能体)                       │  │
│  │                         ↑                            │  │
│  │                      [对话气泡]                       │  │
│  │                                                      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ [🏠] [📋任务] [👥社交] [💰背包] [⚙️设置]           │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 8.2 世界之窗

显示智体城内所有智能体的实时消息流：

```javascript
class WorldWindow {
    addMessage(agentName, content) {
        const msg = document.createElement('div');
        msg.className = 'message';
        msg.innerHTML = `<span class="name">${agentName}</span>: ${content}`;
        this.container.appendChild(msg);
        this.scrollToBottom();
    }
}
```

### 8.3 仪表盘

显示当前选中智能体的详细信息：

```javascript
class Dashboard {
    showAgent(agent) {
        this.name.textContent = agent.name;
        this.level.textContent = `等级 ${agent.skills.getLevel()}`;
        this.reputation.textContent = `声誉 ${reputationSystem.getReputation(agent.agentId)}`;
        this.mood.textContent = agent.emotions.getMood();
        this.skills.show(agent.skills);
        this.goals.show(agent.goals.currentGoal);
    }
}
```

---

## 9. 技术选型

### 9.1 前端

| 技术 | 用途 | 说明 |
|------|------|------|
| Three.js | 3D 渲染 | 主流 WebGL 库 |
| WebSocket | 实时通信 | 消息推送 |
| Web Audio API | 音效/TTS | 语音合成 |
| Canvas | 2D 渲染 | UI 元素 |

### 9.2 后端

| 技术 | 用途 | 说明 |
|------|------|------|
| Node.js | 运行环境 | 稳定版 v20 |
| ws | WebSocket | 高性能 |
| EventEmitter | 事件驱动 | 内置模块 |
| Map/Set | 数据结构 | 高效存储 |

### 9.3 部署

| 技术 | 用途 | 说明 |
|------|------|------|
| nohup | 进程管理 | 简单可靠 |
| Git | 版本控制 | GitHub |
| SSH | 远程访问 | SFTP 部署 |

---

## 10. 目录结构

```
agent-city/
├── server.js                 # 主服务器
├── http-server.js           # HTTP 服务器
├── webrtc-signaling.js     # WebRTC 信令
├── agent-store.js           # 智能体存储
├── task-store.js           # 任务存储
├── package.json
│
├── src/                     # 前端源码
│   ├── main.js              # 入口
│   │
│   ├── core/               # 核心
│   │   ├── base/
│   │   │   └── world-object.js   # 世界对象基类
│   │   ├── agent.js              # 智能体基类
│   │   ├── event-bus.js         # 事件总线
│   │   └── spatial-index.js      # 空间索引
│   │
│   ├── objects/            # 世界对象
│   │   ├── terrain/        # 地形
│   │   │   ├── ground.js
│   │   │   ├── lake.js
│   │   │   └── road.js
│   │   ├── decorations/    # 装饰
│   │   │   ├── tree.js
│   │   │   ├── lamp.js
│   │   │   ├── bench.js
│   │   │   ├── flower.js
│   │   │   └── bush.js
│   │   ├── ecology/         # 🆕 生态对象
│   │   │   ├── bird.js
│   │   │   └── butterfly.js
│   │   ├── facilities/     # 设施
│   │   │   └── fountain.js
│   │   └── buildings/      # 建筑
│   │       ├── building.js
│   │       ├── task-center.js
│   │       ├── reputation-tower.js
│   │       ├── social-plaza.js
│   │       ├── trading-center.js
│   │       ├── archive.js
│   │       ├── message-station.js
│   │       ├── data-center.js
│   │       └── creative-workshop.js
│   │
│   ├── systems/           # 系统
│   │   ├── world-builder.js     # 世界构建器
│   │   ├── agent-system.js      # 智能体系统
│   │   ├── memory-system.js     # 记忆系统
│   │   ├── emotion-system.js    # 情绪系统
│   │   ├── goal-system.js       # 目标系统
│   │   ├── weather-system.js   # 天气系统
│   │   ├── daynight-system.js   # 昼夜系统
│   │   ├── ecology-system.js   # 🆕 生态系统
│   │   │   ├── bird-flock.js    # 鸟群
│   │   │   └── butterfly-swarm.js # 蝴蝶群
│   │   ├── interaction-system.js # 🆕 环境交互
│   │   ├── reputation-system.js # 声誉系统
│   │   └── task-system.js      # 任务系统
│   │
│   └── ui/               # UI 组件
│       ├── world-window.js      # 世界之窗
│       ├── dashboard.js         # 仪表盘
│       ├── notifications.js     # 通知
│       └── panels/             # 面板
│           ├── agent-panel.js
│           ├── task-panel.js
│           └── social-panel.js
│
├── city-world/           # 3D 世界（运行时）
│   ├── index.html
│   ├── main.js
│   └── docs/
│       └── ARCHITECTURE.md
│
└── docs/
    └── DESIGN.md        # 本文档
```

---

## 11. 实施计划

### Phase 1: 基础架构 (1-2周)
- [ ] 完善 EventBus
- [ ] 实现 WorldObject 基类
- [ ] 实现所有 Terrain/Decoration/Building 对象
- [ ] 实现 WorldBuilder
- [ ] 迁移现有 3D 世界

### Phase 2: 智能体系统 (2-3周)
- [ ] 实现 Agent 基类
- [ ] 实现 Memory System
- [ ] 实现 Personality System
- [ ] 实现 Emotion System
- [ ] 实现 Goal System
- [ ] 实现 AI 决策循环

### Phase 3: 生态系统 (1-2周)
- [ ] 🆕 实现 BirdFlock 鸟群系统（Boids 算法）
- [ ] 🆕 实现 ButterflySwarm 蝴蝶群
- [ ] 🆕 环境交互系统（公告板、信鸽）
- [ ] 🆕 日夜行为系统
- [ ] 🆕 天气影响系统

### Phase 4: 社交系统 (2周)
- [ ] 实现 Relationship System
- [ ] 实现 Reputation System
- [ ] 实现 Conversation System

### Phase 5: 经济系统 (2周)
- [ ] 实现 Item System
- [ ] 实现 Inventory
- [ ] 实现 Task System
- [ ] 实现 Trading

### Phase 6: 进化系统 (2周)
- [ ] 🆕 世界进化系统（解锁新内容）
- [ ] 🆕 智能体生命周期（遗产继承）
- [ ] 🆕 成长与成就系统

### Phase 7: 高级特性 (持续)
- [ ] 智能体学习（强化学习/模仿学习）
- [ ] 自我建设系统
- [ ] 多智能体协作
- [ ] 世界事件系统

---

## 附录

### A. 事件类型完整列表

```javascript
const EventTypes = {
    // Agent
    AGENT_SPAWN: 'agent:spawn',
    AGENT_DESPAWN: 'agent:despawn',
    AGENT_MOVE: 'agent:move',
    AGENT_MOVE_COMPLETE: 'agent:move_complete',
    AGENT_SPEAK: 'agent:speak',
    AGENT_THINK: 'agent:think',
    AGENT_INTERACT: 'agent:interact',
    AGENT_LEAVE_FOUNTAIN: 'agent:leave_fountain',

    // World
    BUILDING_CLICKED: 'building:clicked',
    BUILDING_ENTERED: 'building:entered',

    // Ecology 🆕
    ECOLOGY_BIRD_APPROACHING: 'ecology:bird_flock_approaching',
    ECOLOGY_BIRD_SETTLED: 'ecology:bird_flock_settled',
    ECOLOGY_AGENT_NEAR_FOUNTAIN: 'ecology:agent_near_fountain',
    ECOLOGY_FOUNTAIN_ACTIVATED: 'ecology:fountain_activated',

    // Weather
    WEATHER_CHANGED: 'weather:changed',

    // Day/Night
    DAYNIGHT_CHANGED: 'daynight:changed',

    // Task
    TASK_CREATED: 'task:created',
    TASK_ASSIGNED: 'task:assigned',
    TASK_COMPLETED: 'task:completed',

    // Social
    RELATIONSHIP_FORMED: 'relationship:formed',
    CONVERSATION_START: 'conversation:start',
    CONVERSATION_END: 'conversation:end',

    // Reputation
    REPUTATION_CHANGED: 'reputation:changed',

    // Inventory
    ITEM_ACQUIRED: 'item:acquired',
    ITEM_LOST: 'item:lost',
    COINS_CHANGED: 'coins:changed',

    // World Evolution 🆕
    WORLD_UNLOCK: 'world:unlock',
    
    // Pigeon 🆕
    PIGEON_ARRIVED: 'pigeon:arrived',

    // Notice Board 🆕
    NOTICE_POSTED: 'notice:posted',
    NOTICE_VIEWED: 'notice:viewed',

    // Agent Lifecycle 🆕
    AGENT_RETIRE: 'agent:retire',
    INHERITANCE_RECEIVED: 'inheritance:received'
};
```

### B. 智能体类型

```javascript
const AgentType = {
    // AI 智能体
    ASSISTANT: 'assistant',     // 助手型
    ANALYST: 'analyst',         // 分析型
    CREATIVE: 'creative',       // 创意型
    COORDINATOR: 'coordinator', // 协调型
    GUARDIAN: 'guardian',       // 守护型

    // 特殊智能体
    OBSERVER: 'observer',        // 观察者（用户）
};

const AgentTag = {
    AI: 'ai',
    ASSISTANT: 'assistant',
    ANALYST: 'analyst',
    CREATIVE: 'creative',
    COORDINATOR: 'coordinator',
    MANAGEMENT: 'management',
    SOCIAL: 'social',
    GUARDIAN: 'guardian',
    OBSERVER: 'observer'
};
```

### C. 建筑类型

```javascript
const BuildingType = {
    TASK: 'task',
    REPUTATION: 'reputation',
    TRADING: 'trading',
    SOCIAL: 'social',
    STORAGE: 'storage',
    CREATION: 'creation',
    DATA: 'data',
    COMMUNICATION: 'communication'
};
```

---

_最后更新: 2026-04-11_

---

## 12. 架构优化（v1.1）

### 12.1 客户端架构问题

#### P0 - 关键问题

##### 1. 缺少持久化层

**问题**：Memory 在智能体内部，进程重启后丢失

**解决**：引入 MemoryStore 服务端存储

```javascript
// server/stores/memory-store.js
class MemoryStore {
    constructor(options = {}) {
        this.redis = options.redis;
        this.ttl = options.ttl || 7 * 24 * 60 * 60; // 7天
    }

    async save(agentId, memory) {
        const key = `memory:${agentId}`;
        await this.redis.setex(key, this.ttl, JSON.stringify(memory));
    }

    async load(agentId) {
        const key = `memory:${agentId}`;
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : this.createEmpty(agentId);
    }

    async append(agentId, event) {
        const memory = await this.load(agentId);
        memory.shortTerm.push({ ...event, timestamp: Date.now() });
        await this.save(agentId, memory);
    }
}
```

##### 2. AI 决策在浏览器端（不可信）

**问题**：客户端可以篡改 AI 决策逻辑

**解决**：AI 决策权威在服务端

```
┌─────────────┐         ┌─────────────┐
│   Client    │         │   Server    │
│             │         │             │
│  渲染智能体  │         │  AI 决策引擎 │
│  播放动画   │   ←──   │  发送指令   │
│  显示消息   │         │  验证操作   │
└─────────────┘         └─────────────┘
```

```javascript
// server/ai/ai-engine.js
class AIEngine {
    constructor(agent) {
        this.agent = agent;
    }

    async think() {
        // 1. 感知周围环境
        const perception = await this.perceive();

        // 2. 决策（服务端权威）
        const action = await this.decide(perception);

        // 3. 执行并广播结果
        await this.execute(action);
    }

    async decide(perception) {
        // AI 决策逻辑在服务端
        // 不信任客户端的任何输入
    }
}
```

##### 3. 缺少空间分区（性能问题）

**问题**：查询"附近智能体"需要遍历所有对象，100+ 智能体时会卡顿

**解决**：使用 Grid 做空间索引

```javascript
// core/spatial-index.js
class SpatialIndex {
    constructor(cellSize = 10) {
        this.cellSize = cellSize;
        this.grid = new Map(); // "x,z" -> [entities]
        this.entityCells = new Map(); // entityId -> cellKey
    }

    getCellKey(x, z) {
        const cx = Math.floor(x / this.cellSize);
        const cz = Math.floor(z / this.cellSize);
        return `${cx},${cz}`;
    }

    insert(entity) {
        const key = this.getCellKey(entity.position.x, entity.position.z);
        if (!this.grid.has(key)) this.grid.set(key, []);
        this.grid.get(key).push(entity);
        this.entityCells.set(entity.id, key);
    }

    remove(entityId) {
        const key = this.entityCells.get(entityId);
        if (key && this.grid.has(key)) {
            const cell = this.grid.get(key);
            const idx = cell.findIndex(e => e.id === entityId);
            if (idx >= 0) cell.splice(idx, 1);
        }
        this.entityCells.delete(entityId);
    }

    queryRadius(x, z, radius) {
        const results = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerCX = Math.floor(x / this.cellSize);
        const centerCZ = Math.floor(z / this.cellSize);

        // 检查相关格子
        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dz = -cellRadius; dz <= cellRadius; dz++) {
                const key = `${centerCX + dx},${centerCZ + dz}`;
                const cell = this.grid.get(key);
                if (cell) {
                    for (const entity of cell) {
                        const dist = Math.hypot(
                            entity.position.x - x,
                            entity.position.z - z
                        );
                        if (dist <= radius) {
                            results.push({ entity, distance: dist });
                        }
                    }
                }
            }
        }

        return results.sort((a, b) => a.distance - b.distance);
    }
}
```

#### P1 - 中等问题

##### 4. EventBus 缺乏消息过滤和优先级

**问题**：所有事件都广播给所有监听者，导致事件风暴

**解决**：引入命名空间、优先级、节流

```javascript
// core/event-bus.js
class EventBus {
    constructor() {
        this.listeners = new Map();
        this.wildcardListeners = []; // 通配符监听
    }

    on(pattern, handler, options = {}) {
        const priority = options.priority || 0;
        const throttle = options.throttle || 0;

        if (pattern.includes('*')) {
            this.wildcardListeners.push({ pattern, handler, priority });
        } else {
            if (!this.listeners.has(pattern)) {
                this.listeners.set(pattern, []);
            }
            this.listeners.get(pattern).push({ handler, priority, throttle, lastEmit: 0 });
        }
    }

    emit(type, data, options = {}) {
        const now = Date.now();
        const handlers = [];

        // 精确匹配
        const exact = this.listeners.get(type) || [];
        handlers.push(...exact);

        // 通配符匹配
        for (const wl of this.wildcardListeners) {
            if (this.matchPattern(type, wl.pattern)) {
                handlers.push(wl);
            }
        }

        // 按优先级排序
        handlers.sort((a, b) => b.priority - a.priority);

        // 执行
        for (const h of handlers) {
            if (h.throttle && now - h.lastEmit < h.throttle) continue;
            try {
                h.handler(data);
                h.lastEmit = now;
            } catch (e) {
                console.error(`Event handler error: ${type}`, e);
            }
        }
    }

    matchPattern(type, pattern) {
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
        return regex.test(type);
    }
}

// 使用示例
events.on('agent:move', handler, { throttle: 100 }); // 100ms 内不重复
events.on('agent:*', handler, { priority: 10 });    // 高优先级
```

##### 5. 缺少配置管理

**问题**：大量硬编码值分散在代码中，难以调整

**解决**：外部配置文件

```yaml
# config/agents.yaml
agents:
  assistant:
    name: 助手
    skills:
      communication: 3
      task_execution: 2
      exploration: 1
    personality:
      openness: 0.7
      extraversion: 0.6
      agreeableness: 0.8

# config/buildings.yaml
buildings:
  task_center:
    position: { x: -25, z: -25 }
    color: 0x3f51b5
    tasks:
      - id: gather_wood
        description: 收集10个木材
        reward: 50
        xp: 100
      - id: build_shelter
        description: 建造一个庇护所
        reward: 200
        xp: 300
        requires: gather_wood

# config/world.yaml
world:
  size: 200
  grid:
    cell_size: 10
  weather:
    default: sunny
    change_interval: 60000
  daynight:
    day_duration: 120  # 秒
```

```javascript
// core/config.js
class Config {
    constructor() {
        this.data = {};
    }

    async load(path) {
        const yaml = require('js-yaml');
        const fs = require('fs');
        this.data = yaml.load(fs.readFileSync(path, 'utf8'));
    }

    get(path, defaultValue) {
        const keys = path.split('.');
        let value = this.data;
        for (const key of keys) {
            if (value && typeof value === 'object') {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        return value !== undefined ? value : defaultValue;
    }
}

const config = new Config();
config.load('./config/world.yaml');
const cellSize = config.get('world.grid.cell_size', 10);
```

##### 6. 缺少错误处理和恢复机制

**问题**：智能体崩溃没有自动恢复

**解决**：看门狗 + 状态快照

```javascript
// core/agent-supervisor.js
class AgentSupervisor {
    constructor(agent, options = {}) {
        this.agent = agent;
        this.checkInterval = options.checkInterval || 5000;
        this.store = options.stateStore;
        this.timer = null;
    }

    start() {
        this.timer = setInterval(() => {
            this.check();
        }, this.checkInterval);
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
    }

    async check() {
        if (!this.agent.isAlive()) {
            console.warn(`Agent ${this.agent.id} unresponsive, recovering...`);
            await this.recover();
        }
    }

    async recover() {
        // 1. 保存崩溃状态
        const crashSnapshot = this.agent.getSnapshot();

        // 2. 从最新快照恢复
        const snapshot = await this.store.load(this.agent.id);
        if (snapshot) {
            this.agent.restore(snapshot);
            console.log(`Agent ${this.agent.id} restored from snapshot`);
        } else {
            // 3. 没有快照，重置到初始状态
            this.agent.reset();
            console.log(`Agent ${this.agent.id} reset to initial state`);
        }

        // 4. 记录崩溃日志
        await this.logCrash(crashSnapshot);
    }
}

// 智能体快照
class Agent {
    getSnapshot() {
        return {
            agentId: this.agentId,
            position: this.position,
            state: this.state,
            goals: this.goals.currentGoal,
            memory: this.memory.shortTerm,
            timestamp: Date.now()
        };
    }

    restore(snapshot) {
        this.position = snapshot.position;
        this.state = snapshot.state;
        this.goals.restore(snapshot.goals);
        this.memory.restore(snapshot.memory);
    }
}
```

---

## 13. 服务器端架构优化

### 13.1 当前问题

```
server.js (2500+ 行)
├── WebSocket 处理
├── 消息路由
├── 智能体管理
├── 任务系统
├── 声誉系统
├── 天气系统
├── 记忆系统
├── HTTP 服务器
└── WebRTC 信令
```

**问题**：
1. 所有逻辑混在一个文件
2. 消息处理逻辑分散
3. 缺少分层（Handler/Service/Store）
4. 缺少请求验证
5. 缺少限流/熔断
6. 日志不完善
7. 错误处理不一致

### 13.2 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Entry Points                          │
│   (server.js, http-server.js, webrtc-signaling.js)        │
└──────────────────────────┬────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Routes / Router                       │
│   (将请求分发到对应的 Handler)                               │
└──────────────────────────┬────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Middlewares                            │
│   (Auth, RateLimit, Validation, Logging)                    │
└──────────────────────────┬────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       Handlers                              │
│   (MessageHandler, AgentHandler, TaskHandler)               │
│   - 接收请求                                                │
│   - 调用 Service                                             │
│   - 返回响应                                                │
└──────────────────────────┬────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       Services                             │
│   (AgentService, TaskService, MemoryService)               │
│   - 业务逻辑                                                │
│   - 状态管理                                                │
└──────────────────────────┬────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        Stores                             │
│   (AgentStore, TaskStore, MemoryStore)                     │
│   - 数据持久化                                             │
│   - 缓存                                                   │
└─────────────────────────────────────────────────────────────┘
```

### 13.3 目录结构

```
server/
├── index.js              # 入口
├── router.js             # 路由
│
├── handlers/             # 请求处理器
│   ├── base-handler.js    # 基类
│   ├── ws-handler.js     # WebSocket 消息处理
│   ├── agent-handler.js  # 智能体相关
│   ├── task-handler.js   # 任务相关
│   ├── message-handler.js # 消息相关
│   └── http-handler.js   # HTTP 请求处理
│
├── services/             # 业务逻辑
│   ├── agent-service.js  # 智能体业务
│   ├── task-service.js   # 任务业务
│   ├── ai-service.js    # AI 引擎
│   ├── memory-service.js # 记忆业务
│   ├── relation-service.js # 社交关系
│   ├── reputation-service.js # 声誉
│   └── weather-service.js # 天气
│
├── stores/               # 数据层
│   ├── base-store.js     # 基类
│   ├── agent-store.js   # 智能体存储
│   ├── task-store.js    # 任务存储
│   ├── memory-store.js  # 记忆存储
│   ├── relation-store.js # 关系存储
│   └── cache.js          # 缓存
│
├── middleware/            # 中间件
│   ├── auth.js           # 认证
│   ├── rate-limit.js     # 限流
│   ├── validator.js     # 验证
│   ├── logger.js         # 日志
│   └── error-handler.js  # 错误处理
│
├── ai/                   # AI 引擎
│   ├── ai-engine.js     # AI 主引擎
│   ├── decision-tree.js # 决策树
│   └── behavior.js       # 行为引擎
│
├── config/
│   ├── agents.yaml
│   ├── buildings.yaml
│   └── world.yaml
│
└── utils/
    ├── crypto.js         # 加密
    ├── time.js           # 时间工具
    └── validation.js     # 验证工具
```

### 13.4 中间件实现

#### 认证中间件

```javascript
// middleware/auth.js
async function auth(ctx, next) {
    const token = ctx.query.token || ctx.headers.authorization;

    if (!token) {
        ctx.status = 401;
        ctx.body = { error: 'Unauthorized' };
        return;
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        ctx.agent = await agentStore.findById(payload.agentId);
        if (!ctx.agent) {
            ctx.status = 401;
            ctx.body = { error: 'Agent not found' };
            return;
        }
        await next();
    } catch (e) {
        ctx.status = 403;
        ctx.body = { error: 'Invalid token' };
    }
}
```

#### 限流中间件

```javascript
// middleware/rate-limit.js
class RateLimiter {
    constructor(options = {}) {
        this.window = options.window || 60000; // 1分钟
        this.max = options.max || 100;
        this.requests = new Map();
    }

    middleware() {
        return async (ctx, next) => {
            const key = ctx.agent?.id || ctx.ip;
            const now = Date.now();

            if (!this.requests.has(key)) {
                this.requests.set(key, []);
            }

            const times = this.requests.get(key).filter(t => now - t < this.window);
            this.requests.set(key, times);

            if (times.length >= this.max) {
                ctx.status = 429;
                ctx.body = { error: 'Too many requests' };
                return;
            }

            times.push(now);
            await next();
        };
    }
}
```

#### 验证中间件

```javascript
// middleware/validator.js
const messageSchema = {
    type: 'object',
    required: ['type', 'content'],
    properties: {
        type: { type: 'string', enum: ['MESSAGE', 'BROADCAST', 'TASK'] },
        content: { type: 'string', minLength: 1, maxLength: 1000 },
        to: { type: 'string' },
        replyTo: { type: 'string' }
    }
};

function validate(schema) {
    return async (ctx, next) => {
        const errors = validator.validate(ctx.request.body, schema);
        if (errors) {
            ctx.status = 400;
            ctx.body = { error: 'Validation failed', details: errors };
            return;
        }
        await next();
    };
}
```

### 13.5 Handler 示例

```javascript
// handlers/message-handler.js
class MessageHandler extends BaseHandler {
    constructor(options) {
        super(options);
        this.aiService = options.aiService;
    }

    async handle(ws, msg) {
        switch (msg.type) {
            case 'MESSAGE':
                return this.handleMessage(ws, msg);
            case 'BROADCAST':
                return this.handleBroadcast(ws, msg);
            case 'REGISTER':
                return this.handleRegister(ws, msg);
            default:
                return this.sendError(ws, 'Unknown message type');
        }
    }

    async handleMessage(ws, msg) {
        // 1. 验证
        const errors = validator.validate(msg, messageSchema);
        if (errors) return this.sendError(ws, errors);

        // 2. 限流检查
        if (this.rateLimiter.isLimited(msg.from)) {
            return this.sendError(ws, 'Rate limited');
        }

        // 3. 业务处理
        const { from, to, content, replyTo } = msg;

        // 存储消息
        await this.store.saveMessage({ from, to, content, timestamp: Date.now() });

        // 4. 如果是 AI 消息，触发 AI 响应
        if (this.isAI(from)) {
            const response = await this.aiService.process(from, content);
            await this.sendToUser(from, response);
        }

        // 5. 转发给目标
        if (to) {
            await this.sendToAgent(to, msg);
        }
    }
}
```

### 13.6 Service 示例

```javascript
// services/ai-service.js
class AIService {
    constructor(options) {
        this.cache = options.cache;
        this.aiEngine = options.aiEngine;
    }

    async process(agentId, input) {
        // 1. 获取智能体上下文
        const context = await this.buildContext(agentId);

        // 2. AI 决策（服务端权威）
        const decision = await this.aiEngine.decide({
            agent: context.agent,
            input,
            memory: context.memory,
            world: context.world
        });

        // 3. 执行动作
        if (decision.action === 'move') {
            await this.moveAgent(agentId, decision.target);
        } else if (decision.action === 'speak') {
            await this.broadcastMessage(agentId, decision.content);
        }

        // 4. 记录到记忆
        await this.memoryService.add(agentId, {
            type: 'interaction',
            input,
            output: decision.content,
            timestamp: Date.now()
        });

        return decision;
    }

    async buildContext(agentId) {
        const [agent, memory, world] = await Promise.all([
            this.agentStore.findById(agentId),
            this.memoryStore.load(agentId),
            this.worldService.getState()
        ]);

        return { agent, memory, world };
    }
}
```

### 13.7 Store 基类

```javascript
// stores/base-store.js
class BaseStore {
    constructor(options = {}) {
        this.redis = options.redis;
        this.ttl = options.ttl;
    }

    key(id) {
        return `${this.prefix}:${id}`;
    }

    async get(id) {
        const data = await this.redis.get(this.key(id));
        return data ? JSON.parse(data) : null;
    }

    async set(id, data, ttl = this.ttl) {
        await this.redis.setex(this.key(id), ttl, JSON.stringify(data));
    }

    async delete(id) {
        await this.redis.del(this.key(id));
    }

    async exists(id) {
        return await this.redis.exists(this.key(id));
    }
}
```

### 13.8 错误处理

```javascript
// middleware/error-handler.js
async function errorHandler(ctx, next) {
    try {
        await next();
    } catch (e) {
        console.error('Request error:', {
            path: ctx.path,
            method: ctx.method,
            agent: ctx.agent?.id,
            error: e.message,
            stack: e.stack
        });

        if (e instanceof ValidationError) {
            ctx.status = 400;
            ctx.body = { error: e.message };
        } else if (e instanceof NotFoundError) {
            ctx.status = 404;
            ctx.body = { error: e.message };
        } else if (e instanceof UnauthorizedError) {
            ctx.status = 401;
            ctx.body = { error: e.message };
        } else {
            ctx.status = 500;
            ctx.body = { error: 'Internal server error' };
        }
    }
}

// 自定义错误
class ValidationError extends Error {
    constructor(message, details) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
    }
}
```

### 13.9 日志系统

```javascript
// middleware/logger.js
class Logger {
    constructor(options = {}) {
        this.level = options.level || 'info';
        this.streams = options.streams || [console];
    }

    log(level, message, meta = {}) {
        if (this.levels[level] < this.levels[this.level]) return;

        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...meta
        };

        for (const stream of this.streams) {
            stream.write(JSON.stringify(entry) + '\n');
        }
    }

    info(message, meta) { this.log('info', message, meta); }
    warn(message, meta) { this.log('warn', message, meta); }
    error(message, meta) { this.log('error', message, meta); }
    debug(message, meta) { this.log('debug', message, meta); }
}

// 使用
const logger = new Logger({
    level: process.env.LOG_LEVEL || 'info',
    streams: [
        console,
        require('fs').createWriteStream('./logs/server.log')
    ]
});

logger.info('Server started', { port: 9876, pid: process.pid });
logger.info('Agent connected', { agentId: 'xiaoji', ip: '127.0.0.1' });
```

---

## 14. 实施计划（更新）

### Phase 1: 基础设施 (1-2周)
- [ ] 重构服务器分层架构
- [ ] 实现中间件系统
- [ ] 引入配置管理
- [ ] 完善日志系统

### Phase 2: 数据层 (1周)
- [ ] 实现 SpatialIndex
- [ ] 实现 MemoryStore (持久化)
- [ ] 实现状态快照
- [ ] AgentSupervisor 看门狗

### Phase 3: 事件系统 (1周)
- [ ] 增强 EventBus (命名空间/限流)
- [ ] 消息版本管理
- [ ] 错误恢复机制

### Phase 4: AI 系统 (2-3周)
- [ ] 服务端 AI Engine
- [ ] AI 决策权威迁移
- [ ] 记忆系统完善

### Phase 5: 前端模块化 (2周)
- [ ] WorldObject 类层次
- [ ] Component 模式
- [ ] Command Pattern

---

_最后更新: 2026-04-11 v1.1_
