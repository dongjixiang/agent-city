/**
 * BuildingBase - 建筑基类
 * 
 * 所有建筑的基类，提供通用功能
 */

const logger = require('../../utils/logger');

class BuildingBase {
    constructor(id, config = {}) {
        this.id = id;
        this.name = config.name || id;
        this.description = config.description || '';
        this.position = config.position || { x: 0, z: 0 };
        this.type = config.type || 'general';
        this.services = config.services || [];
        this.requirements = config.requirements || {
            minReputation: 0,
            unlocked: true
        };
    }

    /**
     * 检查进入要求
     */
    canEnter(agent) {
        if (!this.requirements.unlocked) {
            return { allowed: false, reason: 'Building is locked' };
        }

        if (agent.reputation < this.requirements.minReputation) {
            return {
                allowed: false,
                reason: `Requires ${this.requirements.minReputation} reputation`
            };
        }

        return { allowed: true };
    }

    /**
     * 获取服务列表
     */
    getServices() {
        return this.services.map(service => ({
            id: service,
            name: this.getServiceName(service),
            description: this.getServiceDescription(service)
        }));
    }

    /**
     * 获取服务名称
     */
    getServiceName(serviceId) {
        const names = {
            task_list: '任务列表',
            accept_task: '接受任务',
            submit_task: '提交任务',
            daily_bonus: '每日奖励',
            leaderboard: '排行榜',
            badges: '徽章',
            claim_badge: '领取徽章',
            donate_reputation: '捐赠声誉',
            reputation_history: '声誉历史',
            marketplace: '市场',
            buy_item: '购买物品',
            sell_item: '出售物品',
            cancel_listing: '取消上架',
            exchange_coins: '货币兑换',
            store_memory: '存储记忆',
            retrieve_memory: '检索记忆',
            search_knowledge: '搜索知识',
            inbox: '收件箱',
            send_mail: '发送邮件',
            create_announcement: '创建公告',
            create_group: '创建群组',
            join_group: '加入群组',
            personal_stats: '个人统计',
            world_stats: '世界统计',
            trend_report: '趋势报告',
            compare: '对比',
            recipes: '配方',
            craft: '制作',
            enhance: '强化',
            disassemble: '分解',
            available_skills: '可用技能',
            learn_skill: '学习技能',
            upgrade_skill: '升级技能',
            practice: '练习'
        };
        return names[serviceId] || serviceId;
    }

    /**
     * 获取服务描述
     */
    getServiceDescription(serviceId) {
        const descriptions = {
            task_list: '查看可用的任务列表',
            accept_task: '接受一个新任务',
            submit_task: '提交已完成的任务',
            daily_bonus: '领取每日登录奖励',
            leaderboard: '查看声誉排行榜',
            badges: '查看已获得的徽章',
            claim_badge: '领取符合条件的徽章',
            donate_reputation: '向他人捐赠声誉',
            reputation_history: '查看声誉变化历史',
            marketplace: '浏览市场物品',
            buy_item: '购买物品',
            sell_item: '出售物品',
            cancel_listing: '取消上架的物品',
            exchange_coins: '兑换货币',
            store_memory: '将重要记忆存入档案馆',
            retrieve_memory: '检索过去的记忆',
            search_knowledge: '搜索知识库',
            inbox: '查看收到的邮件',
            send_mail: '向其他智能体发送邮件',
            create_announcement: '发布公告',
            create_group: '创建一个群组',
            join_group: '加入已有群组',
            personal_stats: '查看个人统计数据',
            world_stats: '查看世界统计数据',
            trend_report: '查看趋势报告',
            compare: '与其他智能体对比',
            recipes: '查看可用的配方',
            craft: '使用材料制作物品',
            enhance: '强化物品',
            disassemble: '分解物品获得材料',
            available_skills: '查看可学习的技能',
            learn_skill: '学习一个新技能',
            upgrade_skill: '升级已有技能',
            practice: '练习技能提升熟练度'
        };
        return descriptions[serviceId] || '';
    }

    /**
     * 执行服务
     */
    async executeService(serviceId, agent, params, context) {
        if (!this.services.includes(serviceId)) {
            throw new Error(`Service not available: ${serviceId}`);
        }

        const methodName = `service_${serviceId}`;
        if (typeof this[methodName] === 'function') {
            return await this[methodName](agent, params, context);
        }

        return {
            success: true,
            message: `Service ${serviceId} executed`,
            serviceId
        };
    }

    /**
     * 获取建筑信息
     */
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            position: this.position,
            type: this.type,
            services: this.getServices(),
            requirements: this.requirements
        };
    }
}

module.exports = BuildingBase;
