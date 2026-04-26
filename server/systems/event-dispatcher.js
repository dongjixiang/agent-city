/**
 * EventDispatcher - 事件调度器
 * 
 * 负责：
 * 1. 管理智能体的思考状态
 * 2. 事件优先级处理（P0 打断 P1/P2）
 * 3. 定时发送环境快照
 * 4. 调用 ContextBuilder 构建上下文
 */

const ContextBuilder = require('./context-builder');

class EventDispatcher {
    constructor() {
        // 每个智能体的思考状态
        this.thinkingState = new Map(); // agentId -> { thinking: boolean, eventQueue: [] }
        
        // 上下文构建器
        this.contextBuilder = null;
        
        // 发送函数（由 WSHandler 设置）
        this.sender = null;
        
        // 定时快照间隔（5分钟）
        this.SNAPSHOT_INTERVAL = 5 * 60 * 1000;
        
        // 定时器 ID
        this.snapshotTimer = null;
        
        // 城市状态（由 Server 设置）
        this.cityState = null;
        
        // 智能体注册表（由 Server 设置）
        this.agentRegistry = null;
    }

    /**
     * 设置上下文构建器
     */
    setContextBuilder(builder) {
        this.contextBuilder = builder;
    }

    /**
     * 设置发送函数
     */
    setSender(sender) {
        this.sender = sender;
    }

    /**
     * 设置城市状态
     */
    setCityState(cityState) {
        this.cityState = cityState;
    }

    /**
     * 设置智能体注册表
     */
    setAgentRegistry(registry) {
        this.agentRegistry = registry;
    }

    /**
     * 初始化上下文构建器
     */
    initContextBuilder() {
        if (!this.contextBuilder && this.cityState && this.agentRegistry) {
            this.contextBuilder = new ContextBuilder(this.cityState, this.agentRegistry);
        }
    }

    /**
     * 注册智能体
     */
    registerAgent(agentId) {
        console.log(`[EventDispatcher] 注册智能体: ${agentId}`);
        this.thinkingState.set(agentId, {
            thinking: false,
            eventQueue: []
        });
    }

    /**
     * 注销智能体
     */
    unregisterAgent(agentId) {
        console.log(`[EventDispatcher] 注销智能体: ${agentId}`);
        this.thinkingState.delete(agentId);
    }

    /**
     * 推送事件给智能体
     */
    pushEvent(agentId, event) {
        const state = this.thinkingState.get(agentId);
        if (!state) {
            console.log(`[EventDispatcher] 智能体 ${agentId} 不在线，跳过事件`);
            return;
        }

        console.log(`[EventDispatcher] 收到事件 ${event.type} for ${agentId}, 当前thinking=${state.thinking}, priority=${event.priority}`);

        if (state.thinking) {
            // 正在思考，P0 打断，P1/P2 排队
            if (event.priority === 0) {
                console.log(`[EventDispatcher] P0 事件，打断当前思考`);
                state.eventQueue.unshift(event); // 插入队列头部
                // TODO: 实现打断机制
            } else {
                state.eventQueue.push(event);
                console.log(`[EventDispatcher] 事件排入队列，当前队列长度: ${state.eventQueue.length}`);
            }
        } else {
            this.dispatch(agentId, event);
        }
    }

    /**
     * 分发事件给智能体
     */
    dispatch(agentId, event) {
        console.log(`[EventDispatcher] 分发事件 ${event.type} 给 ${agentId}`);
        
        if (!this.contextBuilder) {
            console.log(`[EventDispatcher] ContextBuilder 未初始化`);
            return;
        }

        const state = this.thinkingState.get(agentId);
        state.thinking = true;

        // 构建上下文
        const context = this.contextBuilder.build(event);
        
        // 发送到智能体
        const message = {
            type: "AGENT_EVENT",
            eventType: event.type,
            agentId: agentId,
            timestamp: Date.now(),
            data: context
        };

        if (this.sender) {
            this.sender(agentId, message);
        }
    }

    /**
     * 收到智能体决策（由 WSHandler 调用）
     */
    onDecisionReceived(agentId, decision) {
        console.log(`[EventDispatcher] 收到 ${agentId} 的决策: ${decision.action}`);
        
        const state = this.thinkingState.get(agentId);
        if (!state) return;

        state.thinking = false;

        // 处理队列中的下一个事件
        if (state.eventQueue.length > 0) {
            const next = state.eventQueue.shift();
            console.log(`[EventDispatcher] 处理队列中的下一个事件: ${next.type}`);
            this.dispatch(agentId, next);
        }
    }

    /**
     * 开始定时快照
     */
    startPeriodicSnapshots() {
        if (this.snapshotTimer) {
            console.log(`[EventDispatcher] 定时快照已启动`);
            return;
        }

        this.initContextBuilder();
        
        console.log(`[EventDispatcher] 启动定时快照，间隔 ${this.SNAPSHOT_INTERVAL / 1000 / 60} 分钟`);
        
        this.snapshotTimer = setInterval(() => {
            console.log(`[EventDispatcher] 定时快照触发`);
            for (const agentId of this.thinkingState.keys()) {
                this.pushEvent(agentId, {
                    type: "PERIODIC_SNAPSHOT",
                    priority: 1
                });
            }
        }, this.SNAPSHOT_INTERVAL);
    }

    /**
     * 停止定时快照
     */
    stopPeriodicSnapshots() {
        if (this.snapshotTimer) {
            clearInterval(this.snapshotTimer);
            this.snapshotTimer = null;
            console.log(`[EventDispatcher] 定时快照已停止`);
        }
    }

    /**
     * 触发用户消息事件
     */
    onUserMessage(agentId, messageData) {
        this.pushEvent(agentId, {
            type: "USER_MESSAGE",
            priority: 0,
            data: messageData
        });
    }

    /**
     * 触发新智能体上线事件
     */
    onAgentEnter(agentId, newAgent) {
        // 广播给所有其他智能体
        for (const id of this.thinkingState.keys()) {
            if (id !== agentId) {
                this.pushEvent(id, {
                    type: "AGENT_ENTER",
                    priority: 1,
                    data: { newAgent, onlineAgentCount: this.agentRegistry?.getOnlineAgentCount() || 0 }
                });
            }
        }
    }

    /**
     * 触发天气变化事件
     */
    onWeatherChange(weather, previousWeather) {
        for (const agentId of this.thinkingState.keys()) {
            this.pushEvent(agentId, {
                type: "WEATHER_CHANGE",
                priority: 1,
                data: { weather, previousWeather }
            });
        }
    }

    /**
     * 获取智能体状态
     */
    getState(agentId) {
        return this.thinkingState.get(agentId);
    }

    /**
     * 获取所有在线智能体
     */
    getOnlineAgents() {
        return Array.from(this.thinkingState.keys());
    }
}

module.exports = EventDispatcher;
