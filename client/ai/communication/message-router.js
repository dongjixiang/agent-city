/**
 * MessageRouter - 消息路由器
 *
 * 管理智能体之间的消息路由
 *
 * @module ai/communication/message-router
 */

import { eventBus, Events } from '../../core/event-bus.js';

class MessageRouter {
    constructor() {
        // 消息队列
        this.queue = new Map(); // agentId -> Message[]
        this.handlers = new Map(); // messageType -> Handler[]
    }

    /**
     * 发送消息
     */
    send(fromAgentId, toAgentId, content, type = 'text') {
        const message = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            from: fromAgentId,
            to: toAgentId,
            content,
            type, // 'text' | 'system' | 'action'
            timestamp: Date.now()
        };

        // 加入目标队列
        if (!this.queue.has(toAgentId)) {
            this.queue.set(toAgentId, []);
        }
        this.queue.get(toAgentId).push(message);

        // 通过事件系统广播
        eventBus.emit(Events.AGENT_MESSAGE, {
            from: fromAgentId,
            to: toAgentId,
            content,
            type
        });

        return message;
    }

    /**
     * 广播消息
     */
    broadcast(fromAgentId, content, type = 'text') {
        const message = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            from: fromAgentId,
            to: null, // broadcast
            content,
            type,
            timestamp: Date.now()
        };

        eventBus.emit(Events.AGENT_MESSAGE, {
            from: fromAgentId,
            content,
            type,
            broadcast: true
        });

        return message;
    }

    /**
     * 获取消息队列
     */
    getMessages(agentId) {
        return this.queue.get(agentId) || [];
    }

    /**
     * 清除消息
     */
    clearMessages(agentId) {
        this.queue.delete(agentId);
    }

    /**
     * 注册消息处理器
     */
    registerHandler(messageType, handler) {
        if (!this.handlers.has(messageType)) {
            this.handlers.set(messageType, []);
        }
        this.handlers.get(messageType).push(handler);
    }

    /**
     * 处理消息
     */
    processMessage(message) {
        const handlers = this.handlers.get(message.type) || [];
        handlers.forEach(h => {
            try {
                h(message);
            } catch (err) {
                console.error(`[MessageRouter] Handler error:`, err);
            }
        });
    }
}

// 全局单例
const messageRouter = new MessageRouter();

export { MessageRouter, messageRouter };
