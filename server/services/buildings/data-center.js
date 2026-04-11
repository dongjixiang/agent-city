/**
 * DataCenter - 数据中心
 * 
 * 提供统计、对比服务
 */

const BuildingBase = require('./building-base');
const logger = require('../../utils/logger');

// Store 依赖
let agentStore = null;
let reputationStore = null;
let taskStore = null;

function setStores(stores) {
    agentStore = stores.agentStore;
    reputationStore = stores.reputationStore;
    taskStore = stores.taskStore;
}

class DataCenter extends BuildingBase {
    constructor(config) {
        super('data_center', {
            name: '数据中心',
            description: '查看统计、数据分析、趋势报告的地方',
            position: config?.position || { x: -35, z: 0 },
            type: 'data',
            services: ['personal_stats', 'world_stats', 'trend_report', 'compare', 'achievements']
        });
    }

    /**
     * 个人统计
     */
    async service_personal_stats(agent, params, context) {
        const reputation = await reputationStore?.getDetailed(agent.agentId);
        const inventory = agent.inventory || [];
        const memories = agent.memories || [];

        return {
            success: true,
            stats: {
                level: reputation?.level || 1,
                reputation: reputation?.totalReputation || 0,
                coins: agent.coins || 0,
                friends: (agent.friends || []).length,
                inventorySize: inventory.length,
                memoryCount: memories.length,
                tasksCompleted: reputation?.stats?.tasksCompleted || 0,
                conversations: reputation?.stats?.conversations || 0,
                online: agent.online,
                memberSince: agent.createdAt
            }
        };
    }

    /**
     * 世界统计
     */
    async service_world_stats(agent, params, context) {
        const allAgents = await agentStore.getAllAgents();
        const onlineAgents = await agentStore.getOnlineAgents();
        const taskStats = await taskStore?.getStats() || {};

        // 统计各类型智能体
        const typeStats = {};
        for (const a of allAgents) {
            typeStats[a.type] = (typeStats[a.type] || 0) + 1;
        }

        return {
            success: true,
            world: {
                totalAgents: allAgents.length,
                onlineAgents: onlineAgents.length,
                typeDistribution: typeStats,
                tasks: taskStats
            }
        };
    }

    /**
     * 趋势报告
     */
    async service_trend_report(agent, params, context) {
        const { period = 'week' } = params;

        // 获取排行榜变化
        const leaderboard = await reputationStore?.getLeaderboard(20) || [];

        // 简化实现：返回最近的活动
        const allAgents = await agentStore.getAllAgents();

        // 最近上线的智能体
        const recentlyOnline = allAgents
            .filter(a => a.lastSeen && Date.now() - a.lastSeen < 3600000) // 1小时内
            .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0))
            .slice(0, 10)
            .map(a => ({
                name: a.name,
                lastSeen: a.lastSeen
            }));

        return {
            success: true,
            trends: {
                period,
                topAgents: leaderboard.slice(0, 5),
                recentlyOnline,
                reportTime: Date.now()
            }
        };
    }

    /**
     * 对比
     */
    async service_compare(agent, params, context) {
        const { targetId } = params;

        if (!targetId) {
            return { success: false, message: '需要指定目标' };
        }

        const target = await agentStore.get(targetId);
        if (!target) {
            return { success: false, message: '目标不存在' };
        }

        const myRep = await reputationStore?.get(agent.agentId);
        const targetRep = await reputationStore?.get(targetId);

        const myStats = {
            reputation: myRep?.totalReputation || 0,
            level: myRep?.level || 1,
            coins: agent.coins || 0,
            friends: (agent.friends || []).length,
            tasksCompleted: myRep?.stats?.tasksCompleted || 0
        };

        const targetStats = {
            reputation: targetRep?.totalReputation || 0,
            level: targetRep?.level || 1,
            coins: target.coins || 0,
            friends: (target.friends || []).length,
            tasksCompleted: targetRep?.stats?.tasksCompleted || 0
        };

        return {
            success: true,
            comparison: {
                you: { name: agent.name, ...myStats },
                target: { name: target.name, ...targetStats },
                better: {
                    reputation: myStats.reputation > targetStats.reputation ? 'you' : 'target',
                    level: myStats.level > targetStats.level ? 'you' : 'target',
                    coins: myStats.coins > targetStats.coins ? 'you' : 'target'
                }
            }
        };
    }

    /**
     * 成就进度
     */
    async service_achievements(agent, params, context) {
        const reputation = await reputationStore?.get(agent.agentId);
        const earnedBadges = reputation?.badges || [];

        const achievements = [
            { id: 'first_task', name: '初出茅庐', description: '完成第一个任务', progress: reputation?.stats?.tasksCompleted || 0, target: 1 },
            { id: 'ten_tasks', name: '勤奋工作者', description: '完成10个任务', progress: reputation?.stats?.tasksCompleted || 0, target: 10 },
            { id: 'hundred_tasks', name: '任务达人', description: '完成100个任务', progress: reputation?.stats?.tasksCompleted || 0, target: 100 },
            { id: 'rich', name: '富翁', description: '拥有1000金币', progress: agent.coins || 0, target: 1000 },
            { id: 'social', name: '社交达人', description: '交谈100次', progress: reputation?.stats?.conversations || 0, target: 100 }
        ];

        return {
            success: true,
            achievements: achievements.map(a => ({
                ...a,
                completed: a.progress >= a.target,
                earned: earnedBadges.some(b => b.id === a.id)
            }))
        };
    }
}

// 导出
const dataCenter = new DataCenter({
    position: { x: -35, z: 0 }
});

module.exports = {
    DataCenter,
    dataCenter,
    setStores
};
