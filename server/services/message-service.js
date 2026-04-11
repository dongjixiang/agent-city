/**
 * MessageService - 消息业务逻辑
 */

const logger = require('../utils/logger');
const { generateId } = require('../utils/crypto');

// Store 依赖
let agentStore = null;

// 消息存储（内存）
const messages = new Map(); // to -> [messages]
const directMessages = new Map(); // id -> message

// 待回复消息
const pendingReplies = new Map(); // clientMsgId -> { resolve, reject, timeout }

/**
 * 设置依赖
 */
function setStores(stores) {
    agentStore = stores.agentStore;
}

class MessageService {
    /**
     * 发送消息
     */
    async sendMessage(data) {
        const { from, to, content, type = 'direct', replyTo } = data;

        // 验证发送者
        const fromAgent = await agentStore.get(from);
        if (!fromAgent) {
            throw new Error('Sender not found');
        }

        // 验证接收者
        const toAgent = await agentStore.get(to);
        if (!toAgent) {
            throw new Error('Recipient not found');
        }

        // 创建消息
        const message = {
            id: generateId('msg'),
            from,
            fromName: fromAgent.name,
            to,
            toName: toAgent.name,
            content,
            type, // 'direct', 'broadcast', 'system'
            replyTo,
            timestamp: Date.now(),
            read: false
        };

        // 存储消息
        if (!messages.has(to)) {
            messages.set(to, []);
        }
        messages.get(to).push(message);

        // 存储到直发消息
        directMessages.set(message.id, message);

        logger.debug(`[MessageService] Message from ${from} to ${to}: ${content.substring(0, 50)}`);

        return message;
    }

    /**
     * 获取接收者的消息
     */
    async getMessages(agentId, options = {}) {
        const { unreadOnly = false, limit = 50 } = options;

        const agentMessages = messages.get(agentId) || [];

        let filtered = agentMessages;

        if (unreadOnly) {
            filtered = filtered.filter(m => !m.read);
        }

        // 按时间倒序
        filtered.sort((a, b) => b.timestamp - a.timestamp);

        // 限制数量
        filtered = filtered.slice(0, limit);

        return filtered;
    }

    /**
     * 获取未读消息数
     */
    async getUnreadCount(agentId) {
        const agentMessages = messages.get(agentId) || [];
        return agentMessages.filter(m => !m.read).length;
    }

    /**
     * 标记消息已读
     */
    async markAsRead(agentId, messageId) {
        const agentMessages = messages.get(agentId) || [];

        for (const msg of agentMessages) {
            if (msg.id === messageId && msg.to === agentId) {
                msg.read = true;
                return { success: true };
            }
        }

        return { success: false, error: 'Message not found' };
    }

    /**
     * 标记所有消息已读
     */
    async markAllAsRead(agentId) {
        const agentMessages = messages.get(agentId) || [];

        for (const msg of agentMessages) {
            if (msg.to === agentId) {
                msg.read = true;
            }
        }

        return { success: true, count: agentMessages.length };
    }

    /**
     * 发送私信
     */
    async sendDirectMessage(from, to, content) {
        return await this.sendMessage({
            from,
            to,
            content,
            type: 'direct'
        });
    }

    /**
     * 发送系统消息
     */
    async sendSystemMessage(to, content) {
        return await this.sendMessage({
            from: 'SYSTEM',
            to,
            content,
            type: 'system'
        });
    }

    /**
     * 广播消息
     */
    async broadcast(from, content) {
        const fromAgent = await agentStore.get(from);
        if (!fromAgent) {
            throw new Error('Sender not found');
        }

        // 获取所有在线智能体
        const onlineAgents = await agentStore.getOnlineAgents();

        const message = {
            id: generateId('broadcast'),
            from,
            fromName: fromAgent.name,
            to: 'ALL',
            content,
            type: 'broadcast',
            timestamp: Date.now()
        };

        // 发送给每个在线智能体
        for (const agent of onlineAgents) {
            if (!messages.has(agent.agentId)) {
                messages.set(agent.agentId, []);
            }
            messages.get(agent.agentId).push({ ...message, to: agent.agentId, read: false });
        }

        logger.info(`[MessageService] Broadcast from ${from}: ${content.substring(0, 50)}`);

        return message;
    }

    /**
     * 获取对话历史
     */
    async getConversation(agentId1, agentId2, limit = 50) {
        const messages1 = messages.get(agentId1) || [];
        const messages2 = messages.get(agentId2) || [];

        // 找到双方相关的消息
        const conversation = [
            ...messages1.filter(m => m.from === agentId2 || m.to === agentId2),
            ...messages2.filter(m => m.from === agentId1 || m.to === agentId1)
        ];

        // 去重并排序
        const unique = [];
        const seen = new Set();

        for (const msg of conversation) {
            if (!seen.has(msg.id)) {
                seen.add(msg.id);
                unique.push(msg);
            }
        }

        unique.sort((a, b) => a.timestamp - b.timestamp);

        return unique.slice(-limit);
    }

    /**
     * 删除消息
     */
    async deleteMessage(agentId, messageId) {
        const agentMessages = messages.get(agentId) || [];

        const index = agentMessages.findIndex(m =>
            m.id === messageId && (m.to === agentId || m.from === agentId)
        );

        if (index === -1) {
            return { success: false, error: 'Message not found' };
        }

        const msg = agentMessages[index];

        // 只能删除接收到的消息
        if (msg.to !== agentId) {
            return { success: false, error: 'Cannot delete sent message' };
        }

        agentMessages.splice(index, 1);
        directMessages.delete(messageId);

        return { success: true };
    }

    /**
     * 清理旧消息（保留7天）
     */
    async cleanupOldMessages() {
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
        let cleaned = 0;

        for (const [agentId, agentMessages] of messages) {
            const initial = agentMessages.length;

            // 过滤掉旧消息和已读消息（简化：只清理7天前的）
            const filtered = agentMessages.filter(m =>
                (now - m.timestamp < maxAge) || !m.read
            );

            if (filtered.length < initial) {
                cleaned += initial - filtered.length;
                messages.set(agentId, filtered);
            }
        }

        // 清理直发消息
        for (const [id, msg] of directMessages) {
            if (now - msg.timestamp > maxAge) {
                directMessages.delete(id);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.info(`[MessageService] Cleaned up ${cleaned} old messages`);
        }

        return cleaned;
    }

    /**
     * 发送并等待回复（带超时）
     */
    async sendAndWait(clientMsgId, from, to, content, timeout = 30000) {
        // 发送消息
        const message = await this.sendMessage({ from, to, content });

        // 返回 Promise，等待回复
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                pendingReplies.delete(clientMsgId);
                reject(new Error('Message timeout'));
            }, timeout);

            pendingReplies.set(clientMsgId, {
                message,
                resolve,
                reject,
                timeout: timer
            });
        });
    }

    /**
     * 处理回复
     */
    handleReply(clientMsgId, reply) {
        const pending = pendingReplies.get(clientMsgId);
        if (!pending) return false;

        clearTimeout(pending.timeout);
        pending.resolve(reply);
        pendingReplies.delete(clientMsgId);

        return true;
    }

    /**
     * 获取消息统计
     */
    async getStats(agentId) {
        const agentMessages = messages.get(agentId) || [];

        return {
            total: agentMessages.length,
            unread: agentMessages.filter(m => !m.read).length,
            fromSystem: agentMessages.filter(m => m.from === 'SYSTEM').length
        };
    }
}

// 导出单例
const messageService = new MessageService();

module.exports = {
    messageService,
    MessageService,
    setStores
};
