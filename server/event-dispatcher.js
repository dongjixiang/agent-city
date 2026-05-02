/**
 * EventDispatcher - 事件调度器
 * 
 * 管理智能体的事件队列、思考状态、优先级处理、定期环境快照
 * 
 * 架构原则：
 * - ContextBuilder 负责收集环境上下文
 * - PromptBuilder 负责构建完整提示词
 * - EventDispatcher 只做事件路由和状态管理
 */

const ContextBuilder = require('./systems/context-builder');
const PromptBuilder = require('./systems/prompt-builder');

// ===== 道路网络定义（与 world-builder.js 保持一致）=====
const ROAD_NETWORK = {
    // N-S 垂直道路 (x, z范围)
    verticalRoads: [
        { x: 15, zMin: -10, zMax: 35 },
        { x: 15, zMin: 37, zMax: 80 },
        { x: 40, zMin: -10, zMax: 5 },
        { x: 40, zMin: 65, zMax: 80 },
        { x: 65, zMin: -10, zMax: 35 },
        { x: 65, zMin: 37, zMax: 80 },
    ],
    // E-W 水平道路 (z, x范围)
    horizontalRoads: [
        { z: 5, xMin: -10, xMax: 85 },
        { z: 35, xMin: -10, xMax: 17 },
        { z: 35, xMin: 63, xMax: 85 },
        { z: 65, xMin: -10, xMax: 85 },
    ],
    // 沿海景观大道
    scenicAvenue: [
        { x: -40, z: 87.5 }, { x: -20, z: 87.5 }, { x: 0, z: 87.5 },
        { x: 20, z: 87.5 }, { x: 40, z: 87.5 }, { x: 60, z: 87.5 },
        { x: 70, z: 87.5 }, { x: 100, z: 87.5 },
    ],
    // 郊区道路
    suburbanRoads: [
        { x: -50, zMin: -55, zMax: -45 },
        { x: -40, zMin: -55, zMax: -45 },
        { x: -55, zMin: -40, zMax: -30 },
        { x: -45, zMin: -35, zMax: -25 },
        { x: -55, zMin: -20, zMax: -10 },
        { x: -45, zMin: -15, zMax: -5 },
        { x: -55, zMin: 0, zMax: 10 },
        { x: -45, zMin: 5, zMax: 15 },
        { x: -50, zMin: 20, zMax: 30 },
        { x: -40, zMin: 25, zMax: 35 },
    ],
    roadWidth: 2, // 道路半宽
};

/**
 * 检查点是否在道路上
 */
function isOnRoad(x, z, roadWidth = ROAD_NETWORK.roadWidth) {
    // 检查垂直道路
    for (const road of ROAD_NETWORK.verticalRoads) {
        if (Math.abs(x - road.x) <= roadWidth && z >= road.zMin && z <= road.zMax) {
            return true;
        }
    }
    // 检查水平道路
    for (const road of ROAD_NETWORK.horizontalRoads) {
        if (Math.abs(z - road.z) <= roadWidth && x >= road.xMin && x <= road.xMax) {
            return true;
        }
    }
    // 检查沿海大道
    for (let i = 0; i < ROAD_NETWORK.scenicAvenue.length - 1; i++) {
        const p1 = ROAD_NETWORK.scenicAvenue[i];
        const p2 = ROAD_NETWORK.scenicAvenue[i + 1];
        const dist = pointToSegmentDistance(x, z, p1.x, p1.z, p2.x, p2.z);
        if (dist <= roadWidth) return true;
    }
    // 检查郊区道路
    for (const road of ROAD_NETWORK.suburbanRoads) {
        if (Math.abs(x - road.x) <= roadWidth && z >= road.zMin && z <= road.zMax) {
            return true;
        }
    }
    return false;
}

/**
 * 点到线段的距离
 */
function pointToSegmentDistance(px, pz, x1, z1, x2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len2 = dx * dx + dz * dz;
    if (len2 === 0) return Math.sqrt((px - x1) ** 2 + (pz - z1) ** 2);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / len2));
    const nearX = x1 + t * dx;
    const nearZ = z1 + t * dz;
    return Math.sqrt((px - nearX) ** 2 + (pz - nearZ) ** 2);
}

/**
 * 找最近的路上点
 */
function snapToRoad(x, z) {
    let bestDist = Infinity;
    let bestPoint = { x, z };
    
    // 检查垂直道路
    for (const road of ROAD_NETWORK.verticalRoads) {
        if (z >= road.zMin && z <= road.zMax) {
            const dist = Math.abs(x - road.x);
            if (dist < bestDist) {
                bestDist = dist;
                bestPoint = { x: road.x, z };
            }
        }
        const endPoints = [{ x: road.x, z: road.zMin }, { x: road.x, z: road.zMax }];
        for (const p of endPoints) {
            const dist = Math.sqrt((x - p.x) ** 2 + (z - p.z) ** 2);
            if (dist < bestDist) {
                bestDist = dist;
                bestPoint = p;
            }
        }
    }
    
    // 检查水平道路
    for (const road of ROAD_NETWORK.horizontalRoads) {
        if (x >= road.xMin && x <= road.xMax) {
            const dist = Math.abs(z - road.z);
            if (dist < bestDist) {
                bestDist = dist;
                bestPoint = { x, z: road.z };
            }
        }
        const endPoints = [{ x: road.xMin, z: road.z }, { x: road.xMax, z: road.z }];
        for (const p of endPoints) {
            const dist = Math.sqrt((x - p.x) ** 2 + (z - p.z) ** 2);
            if (dist < bestDist) {
                bestDist = dist;
                bestPoint = p;
            }
        }
    }
    
    // 检查沿海大道
    for (let i = 0; i < ROAD_NETWORK.scenicAvenue.length - 1; i++) {
        const p1 = ROAD_NETWORK.scenicAvenue[i];
        const p2 = ROAD_NETWORK.scenicAvenue[i + 1];
        const dist = pointToSegmentDistance(x, z, p1.x, p1.z, p2.x, p2.z);
        if (dist < bestDist) {
            bestDist = dist;
            const dx = p2.x - p1.x;
            const dz = p2.z - p1.z;
            const len2 = dx * dx + dz * dz;
            const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (z - p1.z) * dz) / len2));
            bestPoint = { x: p1.x + t * dx, z: p1.z + t * dz };
        }
    }
    
    return bestPoint;
}

/**
 * 获取道路路径点序列（分步移动）
 */
function getRoadPath(startX, startZ, endX, endZ, maxSteps = 20) {
    const path = [];
    const startOnRoad = isOnRoad(startX, startZ);
    const endOnRoad = isOnRoad(endX, endZ);
    
    let sx = startX, sz = startZ;
    
    // 如果起点不在道路上，先 snap 到最近道路
    if (!startOnRoad) {
        const snapped = snapToRoad(startX, startZ);
        sx = snapped.x;
        sz = snapped.z;
        path.push({ x: sx, z: sz, type: 'snap-start' });
    } else {
        path.push({ x: sx, z: sz, type: 'start' });
    }
    
    // 计算路径段
    const steps = [];
    
    // 水平移动到目标 x
    if (Math.abs(sx - endX) > 0.5) {
        const step = sx < endX ? 1 : -1;
        // 找最近的横向道路
        let roadZ = sz;
        for (const road of ROAD_NETWORK.horizontalRoads) {
            if (Math.abs(road.z - sz) < Math.abs(roadZ - sz) && endX >= road.xMin && endX <= road.xMax) {
                roadZ = road.z;
            }
        }
        for (let x = sx + step; (step > 0 ? x <= endX : x >= endX); x += step) {
            steps.push({ x, z: roadZ, type: 'horizontal' });
        }
    }
    
    // 纵向移动到目标 z
    if (Math.abs(sz - endZ) > 0.5) {
        const step = sz < endZ ? 1 : -1;
        // 找最近的纵向道路
        let roadX = endX;
        for (const road of ROAD_NETWORK.verticalRoads) {
            if (Math.abs(road.x - endX) < Math.abs(roadX - endX) && endZ >= road.zMin && endZ <= road.zMax) {
                roadX = road.x;
            }
        }
        for (let z = sz + step; (step > 0 ? z <= endZ : z >= endZ); z += step) {
            steps.push({ x: roadX, z, type: 'vertical' });
        }
    }
    
    // 去重并添加到路径
    for (const s of steps) {
        if (!path.some(p => Math.abs(p.x - s.x) < 0.5 && Math.abs(p.z - s.z) < 0.5)) {
            path.push(s);
        }
    }
    
    // 如果终点不在道路上，添加终点 snap
    if (!endOnRoad && path.length < maxSteps) {
        const snapped = snapToRoad(endX, endZ);
        if (!path.some(p => Math.abs(p.x - snapped.x) < 0.5 && Math.abs(p.z - snapped.z) < 0.5)) {
            path.push({ x: snapped.x, z: snapped.z, type: 'snap-end' });
        }
    }
    
    return path.slice(0, maxSteps);
}

class EventDispatcher {
    constructor() {
        // agentId -> { thinking, eventQueue, pendingDecision, agentData }
        this.agentStates = new Map();
        
        // 依赖
        this.agentStore = null;
        this.cityState = null;
        this.llmManager = null;
        
        // 上下文构建器和提示词构建器
        this.contextBuilder = null;
        this.promptBuilder = new PromptBuilder();
        
        // 定时器
        this.snapshotInterval = 5 * 60 * 1000; // 5分钟
        this.snapshotTimers = new Map();
        
        // 回调函数
        this.onSendToAgent = null;
        this.onDecisionReceived = null;
        
        // 天气状态
        this.currentWeather = 'sunny';
        
        // 记忆存储
        this._memoryStore = new Map();
    }

    /**
     * 设置依赖
     */
    setStores(agentStore, cityState, llmManager, agentRegistry) {
        this.agentStore = agentStore;
        this.cityState = cityState;
        this.llmManager = llmManager;
        
        // 初始化 ContextBuilder，使用 agentRegistry 适配器
        this.contextBuilder = new ContextBuilder(cityState, agentRegistry || agentStore);
    }

    /**
     * 设置发送函数
     */
    setSender(callback) {
        this.onSendToAgent = callback;
    }

    /**
     * 路由消息给接收者
     */
    routeMessageTo(toAgentId, message) {
        if (this.onSendToAgent) {
            this.onSendToAgent(toAgentId, message);
        }
    }

    /**
     * 设置决策接收回调
     */
    setDecisionHandler(callback) {
        this.onDecisionReceived = callback;
    }

    /**
     * 注册智能体
     */
    registerAgent(agentId, agentData) {
        this.agentStates.set(agentId, {
            thinking: false,
            eventQueue: [],
            pendingDecision: false,
            agentData: agentData
        });
        
        // 初始化记忆
        this._initMemory(agentId);
        
        // 启动定期快照
        this.startSnapshotTimer(agentId);
        
        // 下发记忆摘要
        this.sendMemorySummary(agentId);
    }
    
    _initMemory(agentId) {
        if (!this._memoryStore.has(agentId)) {
            this._memoryStore.set(agentId, { summary: '', entries: [], loginCount: 0 });
        }
        const mem = this._memoryStore.get(agentId);
        mem.loginCount++;
        return mem;
    }
    
    _getMemory(agentId) {
        return this._memoryStore.get(agentId) || null;
    }
    
    _appendEntry(agentId, content) {
        if (!this._memoryStore.has(agentId)) {
            this._initMemory(agentId);
        }
        const mem = this._memoryStore.get(agentId);
        const truncated = content.length > 200 ? content.substring(0, 200) + '...' : content;
        mem.entries.push({ content: truncated, timestamp: Date.now() });
        return mem.entries.length >= 50;
    }
    
    _getAllEntries(agentId) {
        return this._memoryStore.get(agentId)?.entries || [];
    }
    
    _updateSummary(agentId, summary) {
        if (this._memoryStore.has(agentId)) {
            this._memoryStore.get(agentId).summary = summary;
        }
    }

    /**
     * 注销智能体
     */
    unregisterAgent(agentId) {
        this.agentStates.delete(agentId);
        this.stopSnapshotTimer(agentId);
    }

    /**
     * 更新智能体数据
     */
    updateAgentData(agentId, data) {
        const state = this.agentStates.get(agentId);
        if (state) {
            Object.assign(state.agentData, data);
        }
    }

    /**
     * 下发记忆摘要
     */
    sendMemorySummary(agentId) {
        const memory = this._getMemory(agentId);
        
        const message = {
            type: 'AGENT_EVENT',
            eventType: 'MEMORY_SUMMARY',
            agentId: agentId,
            timestamp: Date.now(),
            data: {
                memory: {
                    summary: memory?.summary || '',
                    lastUpdated: Date.now()
                },
                loginCount: memory?.loginCount || 1
            }
        };
        
        if (this.onSendToAgent) {
            this.onSendToAgent(agentId, message);
        }
    }

    /**
     * 启动定期快照定时器
     */
    startSnapshotTimer(agentId) {
        this.stopSnapshotTimer(agentId);
        
        const timer = setInterval(() => {
            console.log(`[EventDispatcher] Timer tick for ${agentId}`);
            this.sendPeriodicSnapshot(agentId);
        }, this.snapshotInterval);
        
        this.snapshotTimers.set(agentId, timer);
        console.log(`[EventDispatcher] Snapshot timer started for ${agentId}, interval: ${this.snapshotInterval}ms`);
    }

    /**
     * 停止快照定时器
     */
    stopSnapshotTimer(agentId) {
        if (this.snapshotTimers.has(agentId)) {
            clearInterval(this.snapshotTimers.get(agentId));
            this.snapshotTimers.delete(agentId);
        }
    }

    /**
     * 推送事件
     */
    pushEvent(agentId, event) {
        const state = this.agentStates.get(agentId);
        if (!state) return;
        
        const priority = this.getPriority(event.eventType);
        
        if (state.thinking) {
            if (priority === 0) {
                state.eventQueue.unshift(event);
            } else {
                state.eventQueue.push(event);
            }
        } else {
            this.dispatchEvent(agentId, event);
        }
    }

    /**
     * 获取事件优先级
     */
    getPriority(eventType) {
        switch (eventType) {
            case 'MEMORY_SUMMARY':
            case 'USER_MESSAGE':
                return 0;
            case 'PERIODIC_SNAPSHOT':
            case 'AGENT_ENTER':
            case 'WEATHER_CHANGE':
            case 'BROADCAST':
                return 1;
            case 'AGENT_LEAVE':
            case 'TASK_AVAILABLE':
                return 2;
            default:
                return 1;
        }
    }

    /**
     * 触发事件 - 使用 ContextBuilder + PromptBuilder（异步）
     */
    async dispatchEvent(agentId, event) {
        const state = this.agentStates.get(agentId);
        if (!state) return;
        
        state.thinking = true;
        state.pendingDecision = true;
        
        // 如果 contextBuilder 还没初始化，先初始化
        if (!this.contextBuilder && this.agentStore && this.cityState) {
            this.contextBuilder = new ContextBuilder(this.cityState, this.agentStore);
        }
        
        if (!this.contextBuilder) {
            console.log('[EventDispatcher] contextBuilder not initialized, skip');
            state.thinking = false;
            return;
        }
        
        // 使用 ContextBuilder 构建上下文（异步）
        const context = await this.contextBuilder.build({
            agentId: agentId,
            type: event.eventType,
            data: event.data || {}
        });
        
        if (!context) {
            console.log(`[EventDispatcher] Cannot build context for ${agentId}`);
            state.thinking = false;
            return;
        }
        
        // 使用 PromptBuilder 构建完整提示词
        const prompt = this.promptBuilder.build(event.eventType, context, context.trigger);
        
        const message = {
            type: 'AGENT_EVENT',
            eventType: event.eventType,
            agentId: agentId,
            timestamp: Date.now(),
            data: {
                ...context,
                prompt: prompt
            }
        };
        
        if (this.onSendToAgent) {
            this.onSendToAgent(agentId, message);
        }
    }

    /**
     * 决策接收
     */
    async receiveDecision(agentId, decision) {
        const state = this.agentStates.get(agentId);
        if (!state) return;
        
        state.thinking = false;
        state.pendingDecision = false;
        
        // 处理 remember action
        if (decision.action === 'remember' && decision.params?.content) {
            const needsCompression = this._appendEntry(agentId, decision.params.content);
            if (needsCompression) {
                await this.triggerMemoryCompression(agentId);
            }
        }
        
        if (this.onDecisionReceived) {
            this.onDecisionReceived(agentId, decision);
        }
        
        // 处理队列中的下一个事件
        if (state.eventQueue.length > 0) {
            const nextEvent = state.eventQueue.shift();
            setTimeout(() => {
                this.dispatchEvent(agentId, nextEvent);
            }, 1000);
        }
    }

    /**
     * 记忆压缩
     */
    async triggerMemoryCompression(agentId) {
        console.log(`[EventDispatcher] Memory compression for ${agentId}`);
        
        const entries = this._getAllEntries(agentId);
        const state = this.agentStates.get(agentId);
        const agentName = state?.agentData?.name || '智能体';
        
        if (entries.length === 0) {
            this._updateSummary(agentId, '');
            return;
        }
        
        const entriesText = entries.map((e, i) => `${i + 1}. [${new Date(e.timestamp).toLocaleString()}] ${e.content}`).join('\n');
        
        const prompt = `你是智体城中的 ${agentName}。你的长期记忆即将超过容量限制，需要压缩。

请阅读以下记忆条目，生成一个简洁的摘要（不超过1500字），保留最重要信息：
${entriesText}

只返回摘要内容，不要其他文字。`;

        try {
            if (this.llmManager) {
                const response = await this.llmManager.chat([{ role: 'user', content: prompt }], { provider: 'minimax' });
                const summary = response?.content?.[0]?.text || response?.content || '';
                if (summary?.trim()) {
                    this._updateSummary(agentId, summary.trim());
                    console.log(`[EventDispatcher] Memory compression completed for ${agentId}`);
                    return;
                }
            }
        } catch (e) {
            console.error(`[EventDispatcher] Memory compression failed:`, e.message);
        }
        
        this._updateSummary(agentId, `[记忆已压缩，共 ${entries.length} 条]`);
    }

    /**
     * 发送定期环境快照（异步）
     */
    async sendPeriodicSnapshot(agentId) {
        console.log(`[EventDispatcher] sendPeriodicSnapshot called for ${agentId}`);
        const state = this.agentStates.get(agentId);
        if (!state || !state.agentData) {
            console.log(`[EventDispatcher] ${agentId} 未注册或无 agentData，跳过`);
            return;
        }
        
        // 如果正在等待决策，跳过这次快照
        if (state.pendingDecision) {
            console.log(`[EventDispatcher] ${agentId} 正在等待决策，跳过本次快照`);
            return;
        }
        
        // 更新位置
        if (this.agentStore) {
            try {
                const agent = await this.agentStore.get(agentId);
                if (agent && agent.position) {
                    state.agentData.position = agent.position;
                }
            } catch (e) {
                // ignore
            }
        }
        
        // 先执行一次探索动作（不需要等待 AI）
        await this.triggerDefaultExplore(agentId);
        
        console.log(`[EventDispatcher] triggerDefaultExplore completed for ${agentId}`);
        
        // 构建事件并发送给 AI（用于让 AI 知道发生了什么）
        const event = {
            agentId: agentId,
            type: 'PERIODIC_SNAPSHOT',
            data: {},
            priority: 1
        };
        
        // 触发完整的 dispatchEvent 流程（异步，不阻塞）
        this.dispatchEvent(agentId, event).catch(() => {});
    }
    
    /**
     * 触发默认探索（AI 无响应时的回退）
     * 智能体沿道路网络移动，不穿越建筑
     */
    async triggerDefaultExplore(agentId) {
        if (!this.agentStore) return;
        
        try {
            // 使用 get 方法获取智能体数据
            const agent = await this.agentStore.get(agentId);
            if (!agent || !agent.position) {
                console.log(`[EventDispatcher] ${agentId} 未找到位置信息`);
                return;
            }
            
            const current = agent.position;
            
            // 尝试找到有效的目标位置（陆地，不是水/山/建筑）
            let targetX, targetZ;
            let attempts = 0;
            const maxAttempts = 20;
            
            do {
                const angle = Math.random() * Math.PI * 2;
                const dist = 15 + Math.random() * 20;
                // 世界边界 ±100，与 world.yaml 的 world.size.width=200 保持一致
                targetX = Math.max(-100, Math.min(100, current.x + Math.cos(angle) * dist));
                targetZ = Math.max(-100, Math.min(100, current.z + Math.sin(angle) * dist));
                attempts++;
            } while (attempts < maxAttempts && !this.isValidWalkPosition(targetX, targetZ));
            
            if (attempts >= maxAttempts) {
                console.log(`[EventDispatcher] ${agentId} 找不到有效的探索位置`);
                return;
            }
            
            // 获取道路路径点序列
            const path = getRoadPath(current.x, current.z, targetX, targetZ);
            
            console.log(`[EventDispatcher] ${agentId} 道路路径: ${JSON.stringify(path.map(p => `(${p.x.toFixed(1)}, ${p.z.toFixed(1)})`))}`);
            
            // 如果起点不在道路上，先 snap 过去
            if (path.length > 0 && path[0].type === 'snap-start') {
                const snapPos = path[0];
                await this.agentStore.updatePosition(agentId, { x: snapPos.x, z: snapPos.z });
                this.broadcastToAll('AGENT_MOVED', { agentId, position: { x: snapPos.x, z: snapPos.z } });
                if (this.wsHandler) {
                    this.wsHandler.broadcast({ type: 'AGENT_MOVED', agentId, position: { x: snapPos.x, z: snapPos.z } });
                }
            }
            
            // 更新状态为行走中
            await this.agentStore.updateState(agentId, 'walking');
            this.updateAgentData(agentId, { state: 'walking' });
            
            // 分步沿道路移动（每步之间有延迟，让客户端动画完成）
            let stepDelay = 800; // 每步 800ms
            
            for (let i = 1; i < path.length; i++) {
                const step = path[i];
                
                // 延迟发送下一步（让客户端有时间动画移动到当前点）
                await new Promise(resolve => setTimeout(resolve, stepDelay));
                
                // 更新位置
                await this.agentStore.updatePosition(agentId, { x: step.x, z: step.z });
                this.updateAgentData(agentId, { position: { x: step.x, z: step.z } });
                
                // 广播移动
                this.broadcastToAll('AGENT_MOVED', { agentId, position: { x: step.x, z: step.z } });
                if (this.wsHandler) {
                    this.wsHandler.broadcast({ type: 'AGENT_MOVED', agentId, position: { x: step.x, z: step.z } });
                }
                
                console.log(`[EventDispatcher] ${agentId} 道路移动到 (${step.x.toFixed(1)}, ${step.z.toFixed(1)})`);
            }
            
            // 5 秒后恢复空闲状态
            setTimeout(async () => {
                if (this.agentStore) {
                    await this.agentStore.updateState(agentId, 'idle');
                    this.updateAgentData(agentId, { state: 'idle' });
                }
            }, 5000);
            
        } catch (e) {
            console.error(`[EventDispatcher] 默认探索失败:`, e.message);
        }
    }
    
    /**
     * 找安全的出生位置
     */
    findSafeSpawnPosition() {
        const safeZones = [
            { center: { x: 30, z: 30 }, radius: 10 },   // 广场东侧
            { center: { x: 35, z: 50 }, radius: 10 },   // 广场北侧
            { center: { x: -10, z: 35 }, radius: 8 },   // 西侧
            { center: { x: 10, z: 65 }, radius: 8 },   // 图书馆北侧
        ];
        
        for (const zone of safeZones) {
            if (this.isValidWalkPosition(zone.center.x, zone.center.z)) {
                // 在安全区内找一个随机位置
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * zone.radius;
                const x = zone.center.x + Math.cos(angle) * dist;
                const z = zone.center.z + Math.sin(angle) * dist;
                if (this.isValidWalkPosition(x, z)) {
                    return { x, z };
                }
            }
        }
        
        // 如果所有安全区都无效，返回广场中心附近
        return { x: 30, z: 30 };
    }
    
    /**
     * 检查坐标是否可以在上面行走（不是水/山/建筑）
     */
    isValidWalkPosition(x, z) {
        // 世界边界检查（与 world.yaml 的 world.size 一致）
        if (Math.abs(x) > 100 || Math.abs(z) > 100) return false;
        
        // ===== 海洋 (南边界外) =====
        // createOcean(90, 200, 10) - 位于南边
        if (z > 85) return false;
        
        // ===== 北海湖 (center: 10, -75, radiusX: 55, radiusZ: 22) =====
        // 椭圆形湖，简单用圆形加长轴比例判断
        const lakeNorth = { cx: 10, cz: -75 };
        const lakeDistX = (x - lakeNorth.cx) / 55;
        const lakeDistZ = (z - lakeNorth.cz) / 22;
        if (lakeDistX * lakeDistX + lakeDistZ * lakeDistZ < 1) {
            return false;
        }
        
        // ===== 河流 (从湖向南流向海洋) =====
        // 主河道点: x: -10 to -20, z: -55 to 91
        // 河流宽度约8单位，需要检查点是否在河道范围内
        // 河道大致路径：用折线段判断点到线段的距离
        const riverPoints = [
            { x: -10, z: -55 },
            { x: -10, z: -20 },
            { x: -12, z: 0 },
            { x: -15, z: 20 },
            { x: -18, z: 40 },
            { x: -20, z: 55 },
            { x: -20, z: 91 }
        ];
        const riverWidth = 5; // 河道宽度
        for (let i = 0; i < riverPoints.length - 1; i++) {
            const p1 = riverPoints[i];
            const p2 = riverPoints[i + 1];
            // 点到线段的距离
            const dx = p2.x - p1.x;
            const dz = p2.z - p1.z;
            const len = Math.sqrt(dx * dx + dz * dz);
            if (len > 0) {
                const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (z - p1.z) * dz) / (len * len)));
                const nearX = p1.x + t * dx;
                const nearZ = p1.z + t * dz;
                const dist = Math.sqrt((x - nearX) * (x - nearX) + (z - nearZ) * (z - nearZ));
                if (dist < riverWidth) return false;
            }
        }
        
        // 山地（实际山丘位置）
        const hills = [
            { center: { x: -70, z: 60 }, radius: 18 },   // 北山
            { center: { x: 50, z: -70 }, radius: 20 },   // 东南山
            { center: { x: -60, z: -80 }, radius: 15 },  // 西北山
            { center: { x: 30, z: 30 }, radius: 8 },     // 广场东小山
            { center: { x: -40, z: 40 }, radius: 10 },   // 西山
        ];
        for (const hill of hills) {
            const dist = Math.sqrt((x - hill.center.x) ** 2 + (z - hill.center.z) ** 2);
            if (dist < hill.radius) {
                return false;
            }
        }
        
        // 建筑物（从 world-builder.js 获取的实际位置和尺寸）
        const buildings = [
            // NW 技能学院区域
            { center: { x: -45, z: -50 }, radius: 6 },  // Tower
            { center: { x: -52, z: -55 }, radius: 3 },  // SuburbanHouse
            { center: { x: -38, z: -55 }, radius: 3 },  // SuburbanHouse
            { center: { x: -30, z: -35 }, w: 12, d: 10 },  // SkillAcademy
            
            // 东湖岸 houses
            { center: { x: 62, z: -45 }, radius: 3 },
            { center: { x: 65, z: -55 }, radius: 3 },
            { center: { x: 60, z: -65 }, radius: 3 },
            { center: { x: 55, z: -75 }, radius: 3 },
            { center: { x: 40, z: -45 }, radius: 3 },
            { center: { x: 32, z: -50 }, radius: 3 },
            { center: { x: 50, z: -50 }, radius: 3 },
            
            // 城市功能建筑
            { center: { x: 0, z: 50 }, w: 16, d: 12 },   // Library
            { center: { x: 27, z: 74 }, w: 14, d: 10 },  // Workshop
            { center: { x: 78, z: 50 }, w: 8, d: 8 },    // MessageStation
            { center: { x: 0, z: 75 }, w: 12, d: 8 },    // ArtGallery
            { center: { x: 50, z: 72 }, w: 12, d: 10 },  // Archive
            { center: { x: 74, z: 72 }, w: 14, d: 10 },  // TaskCenter
            { center: { x: 79, z: 10 }, w: 8, d: 8 },    // DiverseUrban
            { center: { x: 0, z: 20 }, w: 10, d: 8 },    // DataCenter
            { center: { x: 71, z: 10 }, w: 8, d: 8 },    // DiverseUrban
            
            // 道路沿线建筑
            { center: { x: 5, z: -2 }, w: 8, d: 8 },
            { center: { x: 80, z: 28 }, w: 8, d: 8 },
            { center: { x: 22, z: -2 }, w: 8, d: 8 },
            { center: { x: 47, z: -2 }, w: 8, d: 8 },
            { center: { x: 72, z: 28 }, w: 8, d: 8 },
            { center: { x: 32, z: -2 }, w: 8, d: 8 },
            { center: { x: 58, z: -2 }, w: 8, d: 8 },
            { center: { x: 73, z: -2 }, w: 8, d: 8 },
            
            // 市民广场区域
            { center: { x: 40, z: 23 }, w: 10, d: 8 },   // CivicCenterNorth
            { center: { x: 25, z: 42 }, w: 8, d: 6 },    // CivicCenterWing
            { center: { x: 55, z: 42 }, w: 8, d: 6 },    // CivicCenterWing
            { center: { x: 40, z: 40 }, radius: 4 },    // PlazaFountain
        ];
        
        for (const bld of buildings) {
            if (bld.radius) {
                const dist = Math.sqrt((x - bld.center.x) ** 2 + (z - bld.center.z) ** 2);
                if (dist < bld.radius + 1) return false;
            } else {
                const halfW = bld.w / 2 + 1;
                const halfD = bld.d / 2 + 1;
                if (x >= bld.center.x - halfW && x <= bld.center.x + halfW &&
                    z >= bld.center.z - halfD && z <= bld.center.z + halfD) return false;
            }
        }
        
        return true;
    }
    
    /**
     * 设置 WebSocket Handler（用于广播事件给客户端）
     */
    setWsHandler(handler) {
        this.wsHandler = handler;
        console.log('[EventDispatcher] wsHandler 已设置');
    }

    /**
     * 获取在线智能体数量
     */
    getOnlineAgentCount() {
        return this.agentStates.size;
    }

    /**
     * 广播事件给所有智能体
     */
    broadcastToAll(eventType, data) {
        for (const agentId of this.agentStates.keys()) {
            this.pushEvent(agentId, { eventType: eventType, data: data });
        }
    }

    /**
     * 设置天气
     */
    setWeather(weather) {
        const prev = this.currentWeather;
        this.currentWeather = weather;
        
        if (prev !== weather) {
            this.broadcastToAll('WEATHER_CHANGE', { weather, previousWeather: prev });
        }
    }

    /**
     * 清理
     */
    dispose() {
        for (const timer of this.snapshotTimers.values()) {
            clearInterval(timer);
        }
        this.snapshotTimers.clear();
        this.agentStates.clear();
    }
}

// 全局单例
const eventDispatcher = new EventDispatcher();

module.exports = { EventDispatcher, eventDispatcher };
