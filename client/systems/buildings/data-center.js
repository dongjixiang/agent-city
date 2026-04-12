/**
 * DataCenter - 数据中心
 *
 * 个人统计、世界统计、趋势报告
 *
 * @module systems/buildings/data-center
 */

import { Building } from './building.js';

class DataCenter extends Building {
    constructor(position) {
        super(
            'data_center',
            '数据中心',
            position,
            {
                services: ['personal_stats', 'world_stats', 'trends'],
                requirements: { minReputation: 0 }
            }
        );

        // 全局统计
        this.worldStats = {
            totalAgents: 0,
            totalMessages: 0,
            totalTasks: 0,
            totalTasksCompleted: 0,
            totalTransactions: 0,
            avgReputation: 50
        };
    }

    /**
     * 更新世界统计
     */
    updateWorldStats(agents) {
        if (!agents || agents.length === 0) return;

        const reputations = agents.map(a => a.reputation || 0);
        this.worldStats = {
            totalAgents: agents.length,
            avgReputation: reputations.reduce((a, b) => a + b, 0) / agents.length,
            totalMessages: this.worldStats.totalMessages,
            totalTasks: this.worldStats.totalTasks,
            totalTasksCompleted: this.worldStats.totalTasksCompleted,
            totalTransactions: this.worldStats.totalTransactions
        };
    }

    /**
     * 服务：个人统计
     */
    service_personal_stats(agent) {
        const stats = {
            reputation: agent.reputation || 0,
            energy: agent.needs?.energy || 0,
            social: agent.needs?.social || 0,
            achievement: agent.needs?.achievement || 0,
            // 以下需要额外追踪
            messagesSent: 0,
            tasksCompleted: 0,
            buildingsVisited: 0
        };

        // 计算世界排名
        // （需要全局数据，这里估算）
        const estimatedRank = Math.max(1, Math.floor(stats.reputation / 5));

        return {
            success: true,
            stats,
            estimatedRank,
            message: `📊 ${agent.name} 的个人数据已生成`
        };
    }

    /**
     * 服务：世界统计
     */
    service_world_stats() {
        return {
            success: true,
            stats: this.worldStats,
            message: `📈 智体城当前统计：${this.worldStats.totalAgents} 位智能体`
        };
    }

    /**
     * 服务：趋势报告
     */
    service_trends(agent, params) {
        const { period } = params || {};
        const days = period ? parseInt(period) : 7;

        // 模拟趋势数据
        const trends = {
            period: `${days}天`,
            agentActivity: Math.floor(Math.random() * 20) + 80,
            taskCompletion: Math.floor(Math.random() * 30) + 70,
            socialInteraction: Math.floor(Math.random() * 40) + 60,
            topEmotion: ['开心', '平静', '兴奋', '好奇'][Math.floor(Math.random() * 4)]
        };

        return {
            success: true,
            trends,
            message: `📉 过去${days}天的趋势报告`
        };
    }
}

export { DataCenter };
