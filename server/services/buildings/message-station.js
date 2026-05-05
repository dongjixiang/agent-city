/**
 * MessageStation - 消息站
 * 
 * 提供邮件、公告、群组服务
 */

const BuildingBase = require('./building-base');
const logger = require('../../utils/logger');

// Store 依赖
let messageService = null;
let agentStore = null;

// 群组数据
const groups = new Map(); // groupId -> { name, members, createdAt, owner }
const announcements = []; // 公告列表

function setStores(stores) {
    messageService = stores.messageService;
    agentStore = stores.agentStore;
}

class MessageStation extends BuildingBase {
    constructor(config) {
        super('message_station', {
            name: '消息站',
            description: '发送邮件、广播公告、群发消息的地方',
            position: config?.position || { x: 0, z: -35 },
            type: 'communication',
            services: ['inbox', 'send_mail', 'create_announcement', 'create_group', 'join_group']
        });
    }

    /**
     * 收件箱
     */
    async service_inbox(agent, params, context) {
        const { unreadOnly = false, limit = 50 } = params;

        const messages = await messageService.getMessages(agent.agentId, {
            unreadOnly,
            limit
        });

        const unreadCount = await messageService.getUnreadCount(agent.agentId);

        return {
            success: true,
            messages: messages.map(m => ({
                id: m.id,
                from: m.from,
                fromName: m.fromName,
                content: m.content,
                timestamp: m.timestamp,
                read: m.read
            })),
            unreadCount
        };
    }

    /**
     * 发送邮件
     */
    async service_send_mail(agent, params, context) {
        const { to, subject, content } = params;

        if (!to || !content) {
            return { success: false, message: '收件人和内容不能为空' };
        }

        // 检查目标是否存在
        const target = await agentStore.get(to);
        if (!target) {
            return { success: false, message: '收件人不存在' };
        }

        // 发送消息
        const fullContent = subject ? `[${subject}] ${content}` : content;
        const message = await messageService.sendDirectMessage(agent.agentId, to, fullContent);

        return {
            success: true,
            message: `邮件已发送给 ${target.name}`,
            messageId: message.id
        };
    }

    /**
     * 创建公告
     */
    async service_create_announcement(agent, params, context) {
        const { title, content } = params;

        if (!title || !content) {
            return { success: false, message: '标题和内容不能为空' };
        }

        // 消耗声誉发布公告（10点）
        const currentRep = agent.reputation || 0;
        if (currentRep < 10) {
            return { success: false, message: '需要至少10点声誉来发布公告' };
        }

        const announcement = {
            id: `announce_${Date.now()}`,
            title,
            content,
            author: agent.agentId,
            authorName: agent.name,
            createdAt: Date.now()
        };

        announcements.push(announcement);

        // 广播给所有人
        await messageService.broadcast(agent.agentId, `【公告】${title}: ${content}`);

        return {
            success: true,
            message: '公告已发布',
            announcement: {
                id: announcement.id,
                title: announcement.title
            }
        };
    }

    /**
     * 创建群组
     */
    async service_create_group(agent, params, context) {
        const { name } = params;

        if (!name) {
            return { success: false, message: '群组名称不能为空' };
        }

        const groupId = `group_${Date.now()}`;

        groups.set(groupId, {
            id: groupId,
            name,
            members: [agent.agentId],
            owner: agent.agentId,
            createdAt: Date.now()
        });

        return {
            success: true,
            message: `群组 "${name}" 已创建`,
            group: {
                id: groupId,
                name
            }
        };
    }

    /**
     * 加入群组
     */
    async service_join_group(agent, params, context) {
        const { groupId } = params;

        const group = groups.get(groupId);
        if (!group) {
            return { success: false, message: '群组不存在' };
        }

        if (group.members.includes(agent.agentId)) {
            return { success: false, message: '已在群组中' };
        }

        group.members.push(agent.agentId);

        return {
            success: true,
            message: `已加入群组 "${group.name}"`,
            group: {
                id: group.id,
                name: group.name,
                members: group.members.length
            }
        };
    }
}

// 导出
const messageStation = new MessageStation({
    position: { x: 0, z: -35 }
});

module.exports = {
    MessageStation,
    messageStation,
    setStores
};
