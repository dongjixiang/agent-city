/**
 * EventDispatcher - 事件调度器
 * 
 * 管理智能体的事件队列、思考状态、优先级处理、定期环境快照
 * 
 * 架构原则：
 * - ContextBuilder 负责收集环境上下文
 * - PromptBuilder 负责构建完整提示词
 * - MemoryManager 负责记忆管理
 * - Scheduler 负责定时任务
 * - ExploreManager 负责探索行为
 * - WeatherSystem 负责天气
 * - EventDispatcher 只做事件路由和状态管理
 */

const ContextBuilder = require('./systems/context-builder');
const PromptBuilder = require('./systems/prompt-builder');
const MemoryManager = require('./systems/memory-manager');
const Scheduler = require('./systems/scheduler');
const ExploreManager = require('./systems/explore-manager');
const WeatherSystem = require('./systems/weather-system');
const WorldData = require('./data/world-data');

class EventDispatcher {
    constructor() {
        // 状态管理
        this.agentStates = new Map(); // agentId -> { thinking, eventQueue, pendingDecision, agentData }
        
        // 依赖
        this.agentStore = null;
        this.cityState = null;
        this.llmManager = null;
        
        // 子系统
        this.contextBuilder = null;
        this.promptBuilder = new PromptBuilder();
        this.memoryManager = null;
        this.scheduler = new Scheduler();
        this.exploreManager = null;
        this.weatherSystem = new WeatherSystem();
        
        // 回调函数
        this.onSendToAgent = null;
        this.onDecisionReceived = null;
        
        // 配置
        this.snapshotInterval = 10000; // 10秒
    }
    
    /**
     * 设置依赖
     */
    setStores(agentStore, cityState, llmManager, agentRegistry) {
        this.agentStore = agentStore;
        this.cityState = cityState;
        this.llmManager = llmManager;
        
        // 初始化子模块
        this.contextBuilder = new ContextBuilder(cityState, agentRegistry || agentStore);
        this.memoryManager = new MemoryManager(llmManager);
        this.exploreManager = new ExploreManager(agentStore, null);
    }
    
    /**
     * 设置配置
     */
    setConfig(config) {
        // 更新定时器间隔
        this.snapshotInterval = (config?.thinking?.interval || 10) * 1000;
        this.scheduler.setDefaultInterval(this.snapshotInterval);
        
        const exploreCooldown = (config?.thinking?.exploreCooldown || 30) * 1000;
        if (this.exploreManager) {
            // exploreManager 的冷却时间在 trigger 时设置
        }
        
        console.log(`[EventDispatcher] Config loaded: snapshotInterval=${this.snapshotInterval}ms`);
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
        this.memoryManager.initMemory(agentId);
        
        // 启动定期快照定时器
        this.scheduler.startTimer(agentId, (id) => this.sendPeriodicSnapshot(id), this.snapshotInterval);
        
        // 下发记忆摘要
        this.sendMemorySummary(agentId);
    }
    
    /**
     * 注销智能体
     */
    unregisterAgent(agentId) {
        this.agentStates.delete(agentId);
        this.scheduler.stopTimer(agentId);
        this.memoryManager.clearMemory(agentId);
        this.exploreManager?.clearCooldown(agentId);
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
        const memory = this.memoryManager.getMemory(agentId);
        
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
     * 触发事件
     */
    async dispatchEvent(agentId, event) {
        const state = this.agentStates.get(agentId);
        if (!state) return;
        
        state.thinking = true;
        state.pendingDecision = true;
        
        if (!this.contextBuilder) {
            console.log('[EventDispatcher] contextBuilder not initialized, skip');
            state.thinking = false;
            return;
        }
        
        // 使用 ContextBuilder 构建上下文
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
            //this.onSendToAgent(agentId, message);
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
            const needsCompression = this.memoryManager.appendEntry(agentId, decision.params.content);
            if (needsCompression) {
                await this.memoryManager.compressMemory(agentId);
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
     * 处理智能体配置更新
     */
    async handleUpdateAgentConfig(agentId, config) {
        if (!this.agentStore) return;
        
        try {
            if (config.thinkInterval !== undefined) {
                this.snapshotInterval = config.thinkInterval;
                this.scheduler.restartTimer(agentId, (id) => this.sendPeriodicSnapshot(id), config.thinkInterval);
            }
            
            if (config.exploreCooldown !== undefined) {
                // exploreManager 的冷却时间在 trigger 时使用
            }
        } catch (e) {
            console.error('[EventDispatcher] handleUpdateAgentConfig error:', e.message);
        }
    }
    
    /**
     * 发送定期环境快照
     */
    async sendPeriodicSnapshot(agentId) {
        const state = this.agentStates.get(agentId);
        if (!state || !state.agentData) {
            return;
        }
        
        // 如果正在等待决策，跳过
        if (state.pendingDecision) {
            console.log(`[EventDispatcher] ${agentId} 等待决策中，跳过`);
            return;
        }
        
        // 检查探索冷却
        if (this.exploreManager.isInCooldown(agentId)) {
            const remaining = this.exploreManager.getRemainingCooldown(agentId);
            console.log(`[EventDispatcher] ${agentId} 探索冷却中 (剩余 ${remaining}s)`);
            return;
        }
        
        // 检查是否正在行走
        const isWalking = state.agentData?.state === 'walking';
        if (isWalking) {
            console.log(`[EventDispatcher] ${agentId} 正在行走中，跳过`);
            return;
        }
        
        // 执行探索
        const path = await this.exploreManager.triggerDefaultExplore(agentId, state.agentData);
        if (path) {
            console.log(`[EventDispatcher] ${agentId} 探索完成`);
        }
        
        // 触发AI思考（如果不在冷却中）
        const event = {
            agentId: agentId,
            type: 'PERIODIC_SNAPSHOT',
            data: {},
            priority: 1
        };
        this.dispatchEvent(agentId, event).catch(() => {});
    }
    
    /**
     * 设置 WebSocket Handler
     */
    setWsHandler(handler) {
        this.wsHandler = handler;
        if (this.exploreManager) {
            this.exploreManager.setWsHandler(handler);
        }
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
        const result = this.weatherSystem.setWeather(weather);
        if (result) {
            this.broadcastToAll('WEATHER_CHANGE', result);
        }
    }
    
    /**
     * 清理
     */
    dispose() {
        this.scheduler.stopAll();
        this.memoryManager?.dispose();
        this.exploreManager?.dispose();
        this.agentStates.clear();
    }
}

// 全局单例
const eventDispatcher = new EventDispatcher();

module.exports = { EventDispatcher, eventDispatcher };
