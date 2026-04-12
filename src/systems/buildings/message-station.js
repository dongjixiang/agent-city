/**
 * MessageStation - 消息站
 *
 * 邮件发送、公告发布、群组管理
 *
 * @module systems/buildings/message-station
 */

import { Building } from './building.js';

class MessageStation extends Building {
    constructor(position) {
        super(
            'message_station',
            '消息站',
            position,
            {
                services: ['send_mail', 'read_mail', 'post_announcement', 'create_group'],
                requirements: { minReputation: 10 }
            }
        );

        // 邮件
        this.mailbox = new Map(); // agentId -> Mail[]
        // 公告
        this.announcements = [];
        // 群组
        this.groups = new Map(); // groupId -> { name, members: Set, createdAt }
    }

    /**
     * 服务：发送邮件
     */
    service_send_mail(agent, params) {
        const { to, subject, content } = params || {};

        if (!to || !content) {
            return { success: false, message: '需要指定收件人和内容' };
        }

        const mail = {
            id: `mail_${Date.now()}`,
            from: agent.id,
            fromName: agent.name,
            to,
            subject: subject || '(无主题)',
            content,
            read: false,
            sentAt: Date.now()
        };

        if (!this.mailbox.has(to)) {
            this.mailbox.set(to, []);
        }
        this.mailbox.get(to).push(mail);

        return {
            success: true,
            mailId: mail.id,
            message: `📧 邮件已发送给 ${to}`
        };
    }

    /**
     * 服务：读取邮件
     */
    service_read_mail(agent) {
        const mails = this.mailbox.get(agent.id) || [];
        const unread = mails.filter(m => !m.read);
        const read = mails.filter(m => m.read);

        // 标记所有未读为已读
        mails.forEach(m => m.read = true);

        return {
            success: true,
            unreadCount: unread.length,
            totalCount: mails.length,
            recentMail: mails.slice(-5).reverse().map(m => ({
                id: m.id,
                from: m.fromName,
                subject: m.subject,
                read: m.read,
                sentAt: m.sentAt
            })),
            message: `📬 您的信箱：${unread.length} 封未读，共 ${mails.length} 封`
        };
    }

    /**
     * 服务：发布公告
     */
    service_post_announcement(agent, params) {
        const { title, content } = params || {};

        if (!title || !content) {
            return { success: false, message: '需要提供公告标题和内容' };
        }

        if (agent.reputation < 50) {
            return { success: false, message: '声誉需要达到 50 才能发布公告' };
        }

        const announcement = {
            id: `ann_${Date.now()}`,
            author: agent.id,
            authorName: agent.name,
            title,
            content,
            postedAt: Date.now()
        };

        this.announcements.push(announcement);

        return {
            success: true,
            announcementId: announcement.id,
            message: `📢 公告「${title}」已发布`
        };
    }

    /**
     * 服务：创建群组
     */
    service_create_group(agent, params) {
        const { name } = params || {};

        if (!name) {
            return { success: false, message: '需要提供群组名称' };
        }

        const groupId = `group_${Date.now()}`;
        this.groups.set(groupId, {
            id: groupId,
            name,
            ownerId: agent.id,
            members: new Set([agent.id]),
            createdAt: Date.now()
        });

        return {
            success: true,
            groupId,
            message: `👥 群组「${name}」已创建`
        };
    }
}

export { MessageStation };
