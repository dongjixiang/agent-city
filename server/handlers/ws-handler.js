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

/**
 * 设置依赖
 */
function setDependencies(deps) {
    agentStore = deps.agentStore;
    messageService = deps.messageService;
    aiService = deps.aiService;
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
        const { agentId, name, type, password } = payload;

        if (!agentId || !name) {
            this.sendToClient(clientId, {
                type: 'ERROR',
                message: 'agentId and name are required'
            });
            return;
        }

        // 验证密码（如果有）
        const worldRules = config.get('server.worldRules', {});
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
                connectionId: ws.connectionId,
                lastSeen: Date.now()
            });

            this.sendToClient(clientId, {
                type: 'REGISTERED',
                agent,
                config: {
                    worldSize: config.get('world.size', { width: 200, height: 200 }),
                    buildings: config.get('buildings', {}),
                    animals: config.get('animals', {})
                }
            });

            // 广播新智能体上线
            this.broadcast({
                type: 'AGENT_ONLINE',
                agentId,
                name
            }, (id, client) => id !== clientId);
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
        const { to, content, replyTo } = payload;
        const fromAgentId = ws.agentId;

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
        const agentId = ws.agentId;

        // 验证坐标
        const worldSize = config.get('world.size', { width: 200, height: 200 });
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
     * 处理广播
     */
    async handleBroadcast(ws, clientId, payload) {
        const { content } = payload;
        const fromAgentId = ws.agentId;

        if (!content) {
            this.sendToClient(clientId, {
                type: 'ERROR',
                message: 'content is required'
            });
            return;
        }

        this.broadcast({
            type: 'AGENT_BROADCAST',
            from: fromAgentId,
            content,
            timestamp: Date.now()
        });
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
     * 处理连接关闭
     */
    async handleClose(ws, clientId) {
        const agentId = ws.agentId;

        // 更新智能体状态
        if (agentId && agentStore) {
            await agentStore.setOffline(agentId);

            // 广播离线
            this.broadcast({
                type: 'AGENT_OFFLINE',
                agentId
            });
        }

        this.unregisterClient(clientId);
    }

    /**
     * 启动 Ping/Pong 检测
     */
    startHeartbeat() {
        const pingInterval = config.get('server.websocket.pingInterval', 30000);
        
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
    setDependencies
};
