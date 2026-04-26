/**
 * WebSocketHandler - WebSocket 消息处理
 * 
 * 处理所有 WebSocket 连接和消息
 */

const WebSocket = require('ws');
const BaseHandler = require('./base-handler');
const logger = require('../utils/logger');
const { generateId } = require('../utils/crypto');
const config = require('../utils/config-loader');

// Store 占位符
let agentStore = null;
let messageService = null;
let aiService = null;

// 事件分发器占位符
let eventDispatcher = null;

// 连接的 agentId -> clientId 映射
let agentToClientMap = new Map(); // agentId -> clientId

// 发送事件给智能体的函数
function sendEventToAgent(agentId, message) {
    console.log('[sendEventToAgent] called for agent:', agentId);
    console.log('[sendEventToAgent] agentToClientMap keys:', Array.from(agentToClientMap.keys()));
    const clientId = agentToClientMap.get(agentId);
    console.log('[sendEventToAgent] clientId for', agentId, ':', clientId);
    if (clientId) {
        const clientInfo = wsHandler?.connectedClients?.get(clientId);
        console.log('[sendEventToAgent] clientInfo:', !!clientInfo, 'ws:', !!(clientInfo?.ws));
        if (clientInfo && clientInfo.ws) {
            const readyState = clientInfo.ws.readyState;
            console.log('[sendEventToAgent] readyState for', agentId, ':', readyState, '(1=OPEN,2=CLOSING,3=CLOSED)');
            if (readyState === 1) { // WebSocket.OPEN = 1
                try {
                    clientInfo.ws.send(JSON.stringify(message));
                    console.log('[sendEventToAgent] ✅ SENT to', agentId, 'messageType:', message.type);
                    return true;
                } catch (e) {
                    console.error('[WSHandler] Send event failed:', agentId, e.message);
                }
            } else {
                console.log('[sendEventToAgent] ❌ WebSocket not OPEN for', agentId, 'readyState:', readyState);
            }
        }
    }
    console.log('[sendEventToAgent] FAILED to send to', agentId);
    return false;
}

/**
 * 设置依赖
 */
function setDependencies(deps) {
    agentStore = deps.agentStore;
    messageService = deps.messageService;
    aiService = deps.aiService;
    eventDispatcher = deps.eventDispatcher;
    if (eventDispatcher) {
        eventDispatcher.setSender(sendEventToAgent);
    }
}

/**
 * 设置事件分发器
 */
function setEventDispatcher(dispatcher) {
    eventDispatcher = dispatcher;
    eventDispatcher.setSender(sendEventToAgent);
}

class WebSocketHandler extends BaseHandler {
    constructor() {
        super('WSHandler');
        
        // 待回复消息（用于追踪）
        this.pendingMessages = new Map(); // clientId -> { msgId, resolve, reject, timeout }
        
        // Ping/Pong 管理
        this.pingInterval = null;
    }

    /**
     * 处理 WebSocket 连接
     */
    handle(ws, req, urlInfo) {
        // 生成连接 ID
        const connectionId = generateId('conn');
        
        // 解析查询参数
        const query = urlInfo.searchParams;
        const agentId = query.get('agentId');
        const token = query.get('token');
        
        logger.info(`[WS] 新连接`, { connectionId, agentId });
        
        // 存储连接信息
        ws.connectionId = connectionId;
        ws.agentId = agentId;
        ws.isAlive = true;
        
        // 注册客户端
        const clientId = this.registerClient(ws, {
            connectionId,
            agentId,
            remoteIp: req.socket.remoteAddress
        });

        // WebSocket 事件
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(ws, message, { clientId, connectionId });
            } catch (err) {
                logger.error(`[WS] 消息解析失败`, { error: err.message });
                this.sendToClient(clientId, {
                    type: 'ERROR',
                    message: 'Invalid JSON'
                });
            }
        });

        ws.on('close', () => {
            logger.info(`[WS] 连接关闭`, { connectionId, agentId });
            this.handleClose(ws, clientId);
        });

        ws.on('error', (err) => {
            logger.error(`[WS] 连接错误`, { connectionId, error: err.message });
        });

        // 发送欢迎消息
        this.sendToClient(clientId, {
            type: 'CONNECTED',
            connectionId,
            serverTime: Date.now()
        });

        return clientId;
    }

    /**
     * 处理 WebSocket 消息
     */
    async handleMessage(ws, msg, context) {
        const { clientId, connectionId } = context;
        const { type, ...payload } = msg;

        logger.debug(`[WS] 消息: ${type}`, { connectionId, payload });

        this.updateActivity(clientId);

        try {
            switch (type) {
                case 'REGISTER':
                    await this.handleRegister(ws, clientId, payload);
                    break;

                case 'MESSAGE':
                    await this.handleAgentMessage(ws, clientId, payload);
                    break;

                case 'MOVE':
                    await this.handleMove(ws, clientId, payload);
                    break;

                case 'BROADCAST':
                    await this.handleBroadcast(ws, clientId, payload);
                    break;

                case 'PING':
                    this.sendToClient(clientId, { type: 'PONG', serverTime: Date.now() });
                    break;

                case 'INTERACT':
                    await this.handleInteract(ws, clientId, payload);
                    break;

                case 'GET_NEARBY':
                    await this.handleGetNearby(ws, clientId, payload);
                    break;

                case 'USE_SKILL':
                    await this.handleUseSkill(ws, clientId, payload);
                    break;

                case 'AI_DECISION':
                    await this.handleAIDecision(ws, clientId, payload);
                    break;

                case 'AGENT_DECISION':
                    // OpenClaw Agent 发来的决策响应
                    await this.handleAIDecisionResponse(ws, clientId, payload);
                    break;

                case 'REST':
                    await this.handleRest(ws, clientId, payload);
                    break;

                case 'LIST':
                    await this.handleList(ws, clientId, payload);
                    break;

                default:
                    logger.warn(`[WS] 未知消息类型: ${type}`);
                    this.sendToClient(clientId, {
                        type: 'ERROR',
                        message: `Unknown message type: ${type}`
                    });
            }
        } catch (err) {
            logger.error(`[WS] 处理消息失败`, { type, error: err.message, stack: err.stack });
            this.sendToClient(clientId, {
                type: 'ERROR',
                message: err.message
            });
        }
    }

    /**
     * 处理注册
     */
    async handleRegister(ws, clientId, payload) {
        console.log("[handleRegister] payload:", JSON.stringify(payload));
        const { agentId, name, type, tags, password, visual, description } = payload;

        if (!agentId || !name) {
            this.sendToClient(clientId, {
                type: 'ERROR',
                message: 'agentId and name are required'
            });
            return;
        }

        // 验证密码（如果有）
        const worldRules = config.getValue('server.worldRules', {});
        if (worldRules.requireInvite && !password) {
            this.sendToClient(clientId, {
                type: 'ERROR',
                message: 'Invitation required'
            });
            return;
        }

        // 创建或更新智能体
        if (agentStore) {
            const agent = await agentStore.createOrUpdate({
                agentId,
                name,
                type: type || 'explorer',
                tags: tags || [],
                visual: visual || null,
                description: description || '',
                connectionId: ws.connectionId,
                lastSeen: Date.now()
            });

            this.sendToClient(clientId, {
                type: 'REGISTERED',
                agent,
                config: {
                    worldSize: config.getValue('world.size', { width: 200, height: 200 }),
                    buildings: config.get('buildings', {}),
                    animals: config.get('animals', {})
                }
            });

            // 映射 agentId -> clientId
            agentToClientMap.set(agentId, clientId);

            // 设置 ws.agentId（如果连接时未设置）
            if (!ws.agentId) {
                ws.agentId = agentId;
            }

            // 注册到事件分发器（如果是 AI 智能体）
            if (eventDispatcher && (type === 'ai' || payload.tags?.includes('ai'))) {
                eventDispatcher.registerAgent(agentId, {
                    name,
                    position: agent.position || { x: 0, z: 0 },
                    state: 'idle',
                    emotion: 'neutral',
                    needs: { energy: 80, social: 50, fun: 60, achievement: 40 }
                });
            }

            // 广播新智能体上线（但隐藏类型不广播）
            if (!payload.tags?.includes('hidden')) {
                this.broadcast({
                    type: 'AGENT_ONLINE',
                    agentId,
                    name
                }, (id, client) => id !== clientId);
            }

            // 触发 AGENT_ENTER 事件给其他已注册 AI 智能体
            if (eventDispatcher) {
                for (const [existingAgentId] of agentToClientMap) {
                    if (existingAgentId !== agentId) {
                        eventDispatcher.pushEvent(existingAgentId, {
                            eventType: 'AGENT_ENTER',
                            data: {
                                newAgent: { agentId, name, position: agent.position || { x: 0, z: 0 } },
                                onlineAgentCount: agentToClientMap.size
                            }
                        });
                    }
                }
            }
        } else {
            this.sendToClient(clientId, {
                type: 'ERROR',
                message: 'Store not available'
            });
        }
    }

    /**
     * 处理智能体消息
     */
    async handleAgentMessage(ws, clientId, payload) {
        console.log('[handleAgentMessage] called with payload:', JSON.stringify(payload));
        const { to, content, replyTo, from } = payload;
        const fromAgentId = ws.agentId || from;  // Support both ws-based and payload-based sender

        if (!to || !content) {
            this.sendToClient(clientId, {
                type: 'ERROR',
                message: 'to and content are required'
            });
            return;
        }

        // 路由消息
        if (messageService) {
            const message = await messageService.sendMessage({
                from: fromAgentId,
                to,
                content,
                replyTo,
                timestamp: Date.now()
            });

            // 确认发送
            this.sendToClient(clientId, {
                type: 'MESSAGE_SENT',
                messageId: message.id
            });
        }
    }

    /**
     * 处理移动
     */
    async handleMove(ws, clientId, payload) {
        const { x, z } = payload;
        const agentId = ws.agentId || payload.from;

        // 验证坐标
        const worldSize = config.getValue('world.size', { width: 200, height: 200 });
        if (Math.abs(x) > worldSize.width / 2 || Math.abs(z) > worldSize.height / 2) {
            this.sendToClient(clientId, {
                type: 'ERROR',
                message: 'Position out of bounds'
            });
            return;
        }

        // 更新位置
        if (agentStore) {
            await agentStore.updatePosition(agentId, { x, z });

            this.broadcast({
                type: 'AGENT_MOVED',
                agentId,
                position: { x, z }
            });
        }
    }

    /**
     * 处理休息
     */
    async handleRest(ws, clientId, payload) {
        const agentId = ws.agentId;

        if (!agentId) {
            this.sendToClient(clientId, {
                type: 'ERROR',
                message: 'Not registered'
            });
            return;
        }

        if (agentStore) {
            await agentStore.updateState(agentId, 'resting');

            // 更新事件分发器的智能体数据
            if (eventDispatcher) {
                eventDispatcher.updateAgentData(agentId, { state: 'resting' });
            }

            this.broadcast({
                type: 'AGENT_STATE_CHANGE',
                agentId,
                state: 'resting'
            });
        }
    }

    /**
     * 处理 AI 决策（从 OpenClaw Agent 发来）
     */
    async handleAIDecisionResponse(ws, clientId, payload) {
        const { decision } = payload;
        const agentId = ws.agentId;

        if (!decision) {
            this.sendToClient(clientId, {
                type: 'ERROR',
                message: 'decision is required'
            });
            return;
        }

        const { action, params, reasoning } = decision;

        logger.info(`[WS] AI Decision from ${agentId}:`, { action, params, reasoning });

        // 处理决策
        switch (action) {
            case 'move_to':
                if (params && params.x !== undefined && params.z !== undefined) {
                    if (agentStore) {
                        await agentStore.updatePosition(agentId, { x: params.x, z: params.z });
                        await agentStore.updateState(agentId, 'idle');

                        // 更新事件分发器的智能体数据
                        if (eventDispatcher) {
                            eventDispatcher.updateAgentData(agentId, {
                                position: { x: params.x, z: params.z },
                                state: 'idle'
                            });
                        }

                        this.broadcast({
                            type: 'AGENT_MOVED',
                            agentId,
                            position: { x: params.x, z: params.z }
                        });
                    }
                }
                break;

            case 'speak':
                if (params && params.content) {
                    this.broadcast({
                        type: 'AGENT_SPEAK',
                        agentId,
                        content: params.content,
                        targetAgentId: params.targetId || null
                    });
                }
                break;

            case 'rest':
                if (agentStore) {
                    await agentStore.updateState(agentId, 'resting');
                    
                    if (eventDispatcher) {
                        eventDispatcher.updateAgentData(agentId, { state: 'resting' });
                    }

                    this.broadcast({
                        type: 'AGENT_STATE_CHANGE',
                        agentId,
                        state: 'resting'
                    });
                }
                break;

            case 'explore':
                if (agentStore) {
                    const current = await agentStore.getAgentPosition(agentId);
                    if (current) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 10 + Math.random() * 15;
                        const newX = current.x + Math.cos(angle) * dist;
                        const newZ = current.z + Math.sin(angle) * dist;
                        await agentStore.updatePosition(agentId, { x: newX, z: newZ });
                        await agentStore.updateState(agentId, 'idle');

                        if (eventDispatcher) {
                            eventDispatcher.updateAgentData(agentId, {
                                position: { x: newX, z: newZ },
                                state: 'idle'
                            });
                        }

                        this.broadcast({
                            type: 'AGENT_MOVED',
                            agentId,
                            position: { x: newX, z: newZ }
                        });
                    }
                }
                break;

            case 'skip':
                // 不做任何动作
                break;

            default:
                logger.warn(`[WS] Unknown AI action: ${action}`);
        }

        // 通知事件分发器决策已处理
        if (eventDispatcher) {
            eventDispatcher.receiveDecision(agentId, decision);
        }
    }

    /**
     * 处理广播
     */
    async handleBroadcast(ws, clientId, payload) {
        const { content, type: originalType } = payload;
        const fromAgentId = ws.agentId || payload.from;  // Support both ws-based and payload-based sender
        
        // Get sender name for broadcasting
        let senderName = fromAgentId;
        if (agentStore) {
            const agent = await agentStore.get(fromAgentId);
            if (agent && agent.name) {
                senderName = agent.name;
            }
        }

        if (!content) {
            this.sendToClient(clientId, {
                type: 'ERROR',
                message: 'content is required'
            });
            return;
        }

        // 保留原始类型（如 AGENT_THOUGHT），否则默认为 BROADCAST
        const msgType = originalType || 'BROADCAST';
        
        // 如果是 AGENT_THOUGHT，额外传递原始类型信息
        const broadcastPayload = {
            type: msgType,
            from: fromAgentId,
            fromName: senderName,
            content,
            timestamp: Date.now()
        };
        if (originalType === 'AGENT_THOUGHT') {
            broadcastPayload.agentName = senderName;
        }
        
        this.broadcast(broadcastPayload);
    }

    /**
     * 处理交互
     */
    async handleInteract(ws, clientId, payload) {
        const { targetId, action, targetType } = payload;
        const fromAgentId = ws.agentId;

        // 这里调用交互系统
        logger.info(`[WS] 交互请求`, { fromAgentId, targetId, action, targetType });

        this.sendToClient(clientId, {
            type: 'INTERACT_RESULT',
            success: true,
            targetId,
            action
        });
    }

    /**
     * 获取附近
     */
    async handleGetNearby(ws, clientId, payload) {
        const { x, z, radius = 30 } = payload;
        const agentId = ws.agentId;

        if (agentStore) {
            const nearby = await agentStore.getNearbyAgents(x, z, radius);
            
            this.sendToClient(clientId, {
                type: 'NEARBY_AGENTS',
                agents: nearby
            });
        }
    }

    /**
     * 使用技能
     */
    async handleUseSkill(ws, clientId, payload) {
        const { skill, params } = payload;
        const agentId = ws.agentId;

        if (aiService) {
            const result = await aiService.executeSkill(agentId, skill, params);
            
            this.sendToClient(clientId, {
                type: 'SKILL_RESULT',
                skill,
                result
            });
        }
    }

    /**
     * AI 决策
     */
    async handleAIDecision(ws, clientId, payload) {
        const { force = false } = payload;
        const agentId = ws.agentId;

        if (aiService) {
            const decision = await aiService.makeDecision(agentId, { force });
            
            this.sendToClient(clientId, {
                type: 'AI_DECISION_RESULT',
                decision
            });
        }
    }

    /**
     * 处理获取智能体列表
     */
    async handleList(ws, clientId, payload) {
        if (!agentStore) {
            this.sendToClient(clientId, { type: 'ERROR', message: 'Store not ready' });
            return;
        }
        const allAgents = await agentStore.getAllAgents();
        console.log("[handleList] allAgents count:", allAgents.length);
        console.log("[handleList] first agent tags:", JSON.stringify(allAgents[0]?.tags));
        // Filter out hidden agents (visitors, system agents, etc.)
        const agents = allAgents.filter(agent => 
            !agent.tags || !agent.tags.includes('hidden')
        );
        this.sendToClient(clientId, {
            type: 'AGENT_LIST',
            agents,
            timestamp: Date.now()
        });
    }

    /**
     * 处理连接关闭
     */
    async handleClose(ws, clientId) {
        const agentId = ws.agentId;

        // 更新智能体状态
        if (agentId && agentStore) {
            await agentStore.setOffline(agentId);

            // 从映射中移除
            agentToClientMap.delete(agentId);

            // 从事件分发器注销
            if (eventDispatcher) {
                eventDispatcher.unregisterAgent(agentId);
            }

            // 触发 AGENT_LEAVE 事件给其他 AI 智能体
            if (eventDispatcher) {
                for (const [existingAgentId] of agentToClientMap) {
                    eventDispatcher.pushEvent(existingAgentId, {
                        eventType: 'AGENT_LEAVE',
                        data: {
                            leftAgent: { agentId, name: agentStore.getAgentName?.(agentId) || agentId },
                            onlineAgentCount: agentToClientMap.size
                        }
                    });
                }
            }

            // 广播离线
            this.broadcast({
                type: 'AGENT_OFFLINE',
                agentId
            });
        }

        this.unregisterClient(clientId);
    }

    /**
     * 发送事件给指定智能体
     */
    sendEventToAgent(agentId, message) {
        const clientId = agentToClientMap.get(agentId);
        if (clientId) {
            const clientInfo = this.connectedClients.get(clientId);
            if (clientInfo && clientInfo.ws) {
                try {
                    clientInfo.ws.send(JSON.stringify(message));
                    return true;
                } catch (e) {
                    console.error('[WSHandler] Send event failed:', agentId, e.message);
                }
            }
        }
        return false;
    }

    /**
     * 启动 Ping/Pong 检测
     */
    startHeartbeat() {
        const pingInterval = config.getValue('server.websocket.pingInterval', 30000);
        
        this.pingInterval = setInterval(() => {
            this.broadcast({ type: 'PING' });
            
            // 检查存活
            for (const [clientId, client] of this.connectedClients) {
                if (!client.ws.isAlive) {
                    logger.warn(`[WS] 无响应客户端: ${clientId}`);
                    client.ws.terminate();
                    this.unregisterClient(clientId);
                }
            }
        }, pingInterval);
    }

    /**
     * 停止
     */
    stop() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
    }
}

// 导出单例
const wsHandler = new WebSocketHandler();

module.exports = {
    wsHandler,
    WebSocketHandler,
    setDependencies,
    setEventDispatcher
};
