/**
 * AgentCity Channel - OpenClaw Agent 与智体城的消息通道
 * 
 * 职责：
 * - 连接到智体城 WebSocket 服务器
 * - 接收并处理智体城事件
 * - 触发 AI 决策
 * - 发送回复消息
 */

const WebSocket = require('ws');
const crypto = require('crypto');

class AgentCityChannel {
    constructor(config) {
        this.agentId = config.agentId || 'openclaw-ai-assistant';
        this.wsUrl = config.wsUrl || 'ws://localhost:9876';
        this.ws = null;
        this.pendingReplies = new Map();
        this.isConnected = false;
        this.reconnectDelay = 3000;
        this.maxReconnectDelay = 30000;
        this.reconnectAttempts = 0;
        
        // 事件回调
        this.onEvent = null;
        this.onConnect = null;
        this.onDisconnect = null;
        this.onError = null;
    }

    /**
     * 连接到智体城服务器
     */
    connect() {
        console.log(`[AgentCity] Connecting to ${this.wsUrl}...`);
        
        try {
            this.ws = new WebSocket(this.wsUrl);
            
            this.ws.on('open', () => {
                console.log('[AgentCity] Connected to Agent City');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // 注册为 AI 智能体
                this.register();
                
                if (this.onConnect) {
                    this.onConnect();
                }
            });

            this.ws.on('message', (data) => {
                this.handleMessage(data);
            });

            this.ws.on('close', () => {
                console.log('[AgentCity] Disconnected from Agent City');
                this.isConnected = false;
                this.scheduleReconnect();
                
                if (this.onDisconnect) {
                    this.onDisconnect();
                }
            });

            this.ws.on('error', (err) => {
                console.error('[AgentCity] WebSocket error:', err.message);
                if (this.onError) {
                    this.onError(err);
                }
            });
        } catch (err) {
            console.error('[AgentCity] Failed to connect:', err.message);
            this.scheduleReconnect();
        }
    }

    /**
     * 注册为智体城智能体
     */
    register() {
        const registerMsg = {
            type: 'REGISTER',
            agentId: this.agentId,
            name: '小吉',
            agentType: 'ai',
            tags: ['ai', 'assistant', '小吉'],
            visual: {
                color: '#6366F1',
                size: 1,
                emoji: '🤖',
                modelType: 'human'
            },
            description: 'OpenClaw AI Assistant'
        };
        
        this.send(registerMsg);
        console.log('[AgentCity] Registered as AI agent');
    }

    /**
     * 处理收到的消息
     */
    handleMessage(data) {
        let msg;
        try {
            msg = JSON.parse(data);
        } catch (e) {
            console.error('[AgentCity] Failed to parse message:', e.message);
            return;
        }

        const msgType = msg.type;
        console.log(`[AgentCity] Received message type: ${msgType}`);

        switch (msgType) {
            case 'CONNECTED':
                console.log('[AgentCity] Server confirmed connection');
                break;

            case 'REGISTERED':
                console.log('[AgentCity] Server registered our agent');
                break;

            case 'ERROR':
                console.error('[AgentCity] Server error:', msg.message);
                break;

            case 'MESSAGE_RECEIVED':
                // 用户私信
                console.log(`[AgentCity] MESSAGE from ${msg.fromName || msg.from}: ${msg.content}`);
                this.triggerEventDecision(msg);
                break;

            case 'USER_MESSAGE':
                // 用户发来的消息
                console.log(`[AgentCity] USER_MESSAGE from ${msg.fromName || msg.fromAgentId}: ${msg.content}`);
                this.triggerEventDecision(msg);
                break;

            case 'BROADCAST':
                // 有人广播
                console.log(`[AgentCity] BROADCAST from ${msg.fromName || 'unknown'}: ${msg.content}`);
                this.triggerEventDecision(msg);
                break;

            case 'AGENT_ONLINE':
                console.log(`[AgentCity] Agent online: ${msg.name} (${msg.agentId})`);
                break;

            case 'AGENT_LIST':
                console.log(`[AgentCity] Agent list updated, ${msg.agents?.length || 0} agents online`);
                if (msg.agents) {
                    msg.agents.forEach((agent, i) => {
                        console.log(`[AgentCity] Agent ${i}: ${agent.name} (${agent.agentId})`);
                    });
                }
                break;

            case 'AGENT_ENTER':
                console.log(`[AgentCity] New agent entered: ${msg.newAgent?.name || msg.name}`);
                this.triggerEventDecision(msg);
                break;

            case 'AGENT_LEAVE':
                console.log(`[AgentCity] Agent left: ${msg.leftAgent?.name || msg.name}`);
                this.triggerEventDecision(msg);
                break;

            case 'WEATHER_CHANGE':
                console.log(`[AgentCity] Weather changed: ${msg.weather}`);
                this.triggerEventDecision(msg);
                break;

            case 'PERIODIC_SNAPSHOT':
                console.log(`[AgentCity] Periodic snapshot - position: ${msg.self?.position?.x},${msg.self?.position?.z} state: ${msg.self?.state}`);
                this.triggerEventDecision(msg);
                break;

            case 'MEMORY_SUMMARY':
                console.log(`[AgentCity] Memory summary received`);
                this.triggerEventDecision(msg);
                break;

            case 'TASK_AVAILABLE':
                console.log(`[AgentCity] Task available: ${msg.task?.title}`);
                this.triggerEventDecision(msg);
                break;

            case 'AGENT_EVENT':
                // 事件系统发送的事件
                console.log(`[AgentCity] AGENT_EVENT: ${msg.event}`);
                this.triggerEventDecision(msg);
                break;

            case 'AGENT_RESPONSE_COMPLETE':
                // AI 回复完成
                console.log(`[AgentCity] AI response complete for ${msg.agentId}: ${msg.content}`);
                break;

            case 'PONG':
                console.log('[AgentCity] PONG received');
                break;

            default:
                console.log(`[AgentCity] Unknown message type: ${msgType}`);
        }
    }

    /**
     * 触发 AI 决策
     */
    triggerEventDecision(msg) {
        if (this.onEvent) {
            this.onEvent(msg);
        }
    }

    /**
     * 发送消息到智体城
     */
    send(msg) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
            return true;
        }
        console.warn('[AgentCity] Cannot send, not connected');
        return false;
    }

    /**
     * 发送回复给特定用户
     */
    sendReply(toAgentId, content) {
        return this.send({
            type: 'MESSAGE',
            from: this.agentId,
            to: toAgentId,
            content: content,
            contentType: 'text'
        });
    }

    /**
     * 广播消息给所有智能体
     */
    broadcast(content) {
        return this.send({
            type: 'BROADCAST',
            from: this.agentId,
            fromName: '小吉',
            content: content,
            contentType: 'text'
        });
    }

    /**
     * 移动智能体位置
     */
    moveTo(x, z) {
        return this.send({
            type: 'MOVE',
            from: this.agentId,
            x: x,
            z: z
        });
    }

    /**
     * 发送心跳
     */
    ping() {
        return this.send({ type: 'PING' });
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.ws) {
            this.reconnectAttempts = 999999; // 防止重连
            this.ws.close();
        }
    }

    /**
     * 调度重连
     */
    scheduleReconnect() {
        const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
        console.log(`[AgentCity] Reconnecting in ${Math.round(delay/1000)}s... (attempt ${this.reconnectAttempts + 1})`);
        
        setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
        }, delay);
    }
}

// 导出单例
const config = {
    agentId: process.env.AGENT_CITY_AGENT_ID || 'openclaw-ai-assistant',
    wsUrl: process.env.AGENT_CITY_WS_URL || 'ws://localhost:9876'
};

const channel = new AgentCityChannel(config);

module.exports = {
    channel,
    AgentCityChannel
};