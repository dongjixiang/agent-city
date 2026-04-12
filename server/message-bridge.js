/**
 * MessageBridge - 消息桥接
 *
 * 连接前端 WebSocket 和后端 AI 系统
 * 负责消息路由、格式转换和状态同步
 *
 * @module server/message-bridge
 */

const logger = require('./utils/logger');

class MessageBridge {
    constructor() {
        // WebSocket 客户端连接
        this.clients = new Map(); // agentId -> ws

        // AI 引擎引用
        this.aiEngine = null;

        // 消息处理器
        this.handlers = new Map();

        // 待回复消息
        this.pendingMessages = new Map(); // serverMsgId -> { agentId, timestamp, resolve, reject }

        // 消息序列号
        this.messageSeq = 0;
    }

    /**
     * 设置 AI 引擎
     */
    setAIEngine(engine) {
        this.aiEngine = engine;
    }

    /**
     * 注册客户端连接
     */
    addClient(agentId, ws) {
        this.clients.set(agentId, ws);
        logger.info(`[MessageBridge] Client connected: ${agentId}`);

        ws.on('close', () => {
            this.clients.delete(agentId);
            logger.info(`[MessageBridge] Client disconnected: ${agentId}`);
        });

        ws.on('error', (err) => {
            logger.error(`[MessageBridge] Client error: ${agentId}`, { error: err.message });
        });
    }

    /**
     * 移除客户端
     */
    removeClient(agentId) {
        this.clients.delete(agentId);
    }

    /**
     * 发送消息到客户端
     */
    sendToClient(agentId, message) {
        const ws = this.clients.get(agentId);
        if (!ws || ws.readyState !== 1) {
            logger.warn(`[MessageBridge] Client not available: ${agentId}`);
            return false;
        }

        try {
            ws.send(JSON.stringify(message));
            return true;
        } catch (err) {
            logger.error(`[MessageBridge] Send failed: ${agentId}`, { error: err.message });
            return false;
        }
    }

    /**
     * 广播消息到所有客户端
     */
    broadcast(message, excludeAgentId = null) {
        let count = 0;
        for (const [agentId, ws] of this.clients) {
            if (agentId !== excludeAgentId && ws.readyState === 1) {
                try {
                    ws.send(JSON.stringify(message));
                    count++;
                } catch (err) {
                    logger.error(`[MessageBridge] Broadcast error: ${agentId}`);
                }
            }
        }
        return count;
    }

    /**
     * 发送消息到 AI 引擎并等待回复
     */
    async sendToAI(agentId, message) {
        if (!this.aiEngine) {
            throw new Error('AI Engine not initialized');
        }

        const serverMsgId = `msg_${++this.messageSeq}_${Date.now()}`;

        return new Promise((resolve, reject) => {
            // 设置超时
            const timeout = setTimeout(() => {
                this.pendingMessages.delete(serverMsgId);
                reject(new Error('AI response timeout'));
            }, 30000);

            // 存储待回复消息
            this.pendingMessages.set(serverMsgId, {
                agentId,
                message,
                timestamp: Date.now(),
                resolve: (result) => {
                    clearTimeout(timeout);
                    resolve(result);
                },
                reject: (err) => {
                    clearTimeout(timeout);
                    reject(err);
                }
            });

            // 发送到 AI 引擎
            this.aiEngine.processMessage(agentId, message, serverMsgId)
                .then(result => {
                    const pending = this.pendingMessages.get(serverMsgId);
                    if (pending) {
                        pending.resolve(result);
                        this.pendingMessages.delete(serverMsgId);
                    }
                })
                .catch(err => {
                    const pending = this.pendingMessages.get(serverMsgId);
                    if (pending) {
                        pending.reject(err);
                        this.pendingMessages.delete(serverMsgId);
                    }
                });
        });
    }

    /**
     * 处理来自客户端的消息
     */
    async handleClientMessage(agentId, message) {
        const { type, data, replyTo } = message;

        logger.debug(`[MessageBridge] Message from ${agentId}: ${type}`);

        switch (type) {
            case 'agent_speak':
                return this.handleAgentSpeak(agentId, data);

            case 'agent_action':
                return this.handleAgentAction(agentId, data);

            case 'agent_think':
                return this.handleAgentThink(agentId, data);

            case 'ping':
                return { type: 'pong', timestamp: Date.now() };

            default:
                return { type: 'error', message: `Unknown message type: ${type}` };
        }
    }

    /**
     * 处理智能体说话
     */
    async handleAgentSpeak(agentId, data) {
        const { to, content, replyTo } = data;

        // 路由到目标
        if (to) {
            // 私聊
            this.sendToClient(to, {
                type: 'agent_message',
                from: agentId,
                content,
                replyTo
            });
        } else {
            // 广播
            this.broadcast({
                type: 'agent_speak',
                from: agentId,
                content
            }, agentId);
        }

        // AI 处理
        if (this.aiEngine) {
            await this.aiEngine.handleMessage(agentId, content);
        }

        return { success: true };
    }

    /**
     * 处理智能体动作
     */
    async handleAgentAction(agentId, data) {
        const { action, params } = data;

        // 广播动作
        this.broadcast({
            type: 'agent_action',
            agentId,
            action,
            params
        }, agentId);

        // 触发相应技能
        if (this.aiEngine) {
            const result = await this.aiEngine.executeSkill(agentId, action, params);
            return result;
        }

        return { success: true };
    }

    /**
     * 处理智能体思考
     */
    async handleAgentThink(agentId, data) {
        const { query } = data;

        // 发送到 AI 决策
        if (this.aiEngine) {
            const decision = await this.sendToAI(agentId, {
                type: 'think',
                query
            });
            return decision;
        }

        return { success: false, message: 'AI not available' };
    }

    /**
     * 处理 AI 回复
     */
    handleAIResponse(serverMsgId, response) {
        const pending = this.pendingMessages.get(serverMsgId);
        if (pending) {
            pending.resolve(response);
            this.pendingMessages.delete(serverMsgId);
        }
    }

    /**
     * 获取连接状态
     */
    getStatus() {
        return {
            connectedClients: this.clients.size,
            pendingMessages: this.pendingMessages.size,
            clientIds: Array.from(this.clients.keys())
        };
    }

    /**
     * 注册消息处理器
     */
    registerHandler(type, handler) {
        this.handlers.set(type, handler);
    }

    /**
     * 清理过期待回复消息
     */
    cleanupExpired() {
        const now = Date.now();
        const timeout = 60000; // 1分钟

        for (const [msgId, pending] of this.pendingMessages) {
            if (now - pending.timestamp > timeout) {
                pending.reject(new Error('Message expired'));
                this.pendingMessages.delete(msgId);
            }
        }
    }
}

const messageBridge = new MessageBridge();

// 定期清理过期消息
setInterval(() => {
    messageBridge.cleanupExpired();
}, 30000);

module.exports = { MessageBridge, messageBridge };
