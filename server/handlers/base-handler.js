/**
 * BaseHandler - Handler 基类
 * 
 * 所有 Handler 的基类，提供通用功能
 */

const logger = require('../utils/logger');
const { generateId } = require('../utils/crypto');

class BaseHandler {
    constructor(name) {
        this.name = name;
        this.connectedClients = new Map(); // clientId -> { ws, info }
    }

    /**
     * 生成客户端 ID
     */
    generateClientId() {
        return generateId('client');
    }

    /**
     * 注册客户端
     */
    registerClient(ws, info = {}) {
        const clientId = this.generateClientId();
        this.connectedClients.set(clientId, {
            ws,
            info,
            connectedAt: Date.now(),
            lastActivity: Date.now()
        });
        logger.debug(`[${this.name}] 客户端注册: ${clientId}`, { info });
        return clientId;
    }

    /**
     * 注销客户端
     */
    unregisterClient(clientId) {
        const client = this.connectedClients.get(clientId);
        if (client) {
            logger.debug(`[${this.name}] 客户端注销: ${clientId}`);
            this.connectedClients.delete(clientId);
            return true;
        }
        return false;
    }

    /**
     * 获取客户端
     */
    getClient(clientId) {
        return this.connectedClients.get(clientId);
    }

    /**
     * 更新最后活跃时间
     */
    updateActivity(clientId) {
        const client = this.connectedClients.get(clientId);
        if (client) {
            client.lastActivity = Date.now();
        }
    }

    /**
     * 发送消息到客户端
     */
    sendToClient(clientId, message) {
        const client = this.connectedClients.get(clientId);
        if (!client) {
            logger.warn(`[${this.name}] 客户端不存在: ${clientId}`);
            return false;
        }

        try {
            const data = typeof message === 'string' ? message : JSON.stringify(message);
            client.ws.send(data);
            return true;
        } catch (err) {
            logger.error(`[${this.name}] 发送消息失败`, { clientId, error: err.message });
            this.unregisterClient(clientId);
            return false;
        }
    }

    /**
     * 广播消息
     */
    broadcast(message, filter = null) {
        const data = typeof message === 'string' ? message : JSON.stringify(message);
        let count = 0;

        for (const [clientId, client] of this.connectedClients) {
            if (filter && !filter(clientId, client)) {
                continue;
            }

            try {
                client.ws.send(data);
                count++;
            } catch (err) {
                logger.error(`[${this.name}] 广播失败`, { clientId, error: err.message });
                this.unregisterClient(clientId);
            }
        }

        return count;
    }

    /**
     * 处理 WebSocket 连接
     */
    handle(ws, req, urlInfo) {
        // 子类实现
        throw new Error('handle() must be implemented by subclass');
    }

    /**
     * 处理 WebSocket 消息
     */
    handleMessage(ws, msg, context) {
        // 子类实现
        throw new Error('handleMessage() must be implemented by subclass');
    }

    /**
     * 处理 WebSocket 关闭
     */
    handleClose(ws, clientId) {
        // 子类实现
        this.unregisterClient(clientId);
    }

    /**
     * 获取连接数
     */
    getConnectionCount() {
        return this.connectedClients.size;
    }

    /**
     * 获取所有客户端信息
     */
    getClientsInfo() {
        const result = [];
        for (const [clientId, client] of this.connectedClients) {
            result.push({
                clientId,
                ...client.info,
                connectedAt: client.connectedAt,
                lastActivity: client.lastActivity,
                idle: Date.now() - client.lastActivity
            });
        }
        return result;
    }
}

module.exports = BaseHandler;
