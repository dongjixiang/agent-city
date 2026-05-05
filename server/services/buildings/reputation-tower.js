/**
 * ReputationTower - 声誉塔
 * 
 * 提供声誉管理、排行榜服务
 */

const BuildingBase = require('./building-base');
const logger = require('../../utils/logger');

// Store 依赖
let reputationStore = null;
let agentStore = null;

function setStores(stores) {
    reputationStore = stores.reputationStore;
    agentStore = stores.agentStore;
}

class ReputationTower extends BuildingBase {
    constructor(config) {
        super('reputation_tower', {
            name: '声誉塔',
            description: '查看排名、获取徽章、提升声誉的地方',
            position: config?.position || { x: 25, z: -25 },
            type: 'reputation',
            services: ['leaderboard', 'badges', 'claim_badge', 'donate_reputation', 'reputation_history']
        });
    }

    /**
     * 排行榜
     */
    async service_leaderboard(agent, params, context) {
        const { limit = 20 } = params;

        const leaderboard = await reputationStore.getLeaderboard(limit);
        const myRank = await reputationStore.getRank(agent.agentId);
        const myRep = await reputationStore.get(agent.agentId);

        return {
            success: true,
            leaderboard: leaderboard.map((entry, index) => ({
                rank: index + 1,
                agentId: entry.agentId,
                reputation: entry.totalReputation,
                level: entry.level,
                badges: entry.badges?.length || 0
            })),
            myRank,
            myReputation: myRep?.totalReputation || 0,
            myLevel: myRep?.level || 1
        };
    }

    /**
     * 徽章列表
     */
    async service_badges(agent, params, context) {
        const reputation = await reputationStore.get(agent.agentId);
        const earnedBadges = reputation?.badges || [];
        const earnedIds = new Set(earnedBadges.map(b => b.id));

        // 获取所有徽章定义
        const allBadges = this.getAllBadges();

        return {
            success: true,
            earned: earnedBadges.map(b => ({
                id: b.id,
                name: b.name,
                description: b.description,
                icon: b.icon,
                earnedAt: b.earnedAt
            })),
            available: allBadges
                .filter(b => !earnedIds.has(b.id))
                .map(b => ({
                    id: b.id,
                    name: b.name,
                    description: b.description,
                    icon: b.icon,
                    requirement: b.requirement
                }))
        };
    }

    /**
     * 领取徽章
     */
    async service_claim_badge(agent, params, context) {
        const { badgeId } = params;

        const reputation = await reputationStore.get(agent.agentId);
        const earnedBadges = reputation?.badges || [];
        const earnedIds = new Set(earnedBadges.map(b => b.id));

        if (earnedIds.has(badgeId)) {
            return { success: false, message: '徽章已拥有' };
        }

        // 检查是否满足条件
        const allBadges = this.getAllBadges();
        const badge = allBadges.find(b => b.id === badgeId);

        if (!badge) {
            return { success: false, message: '徽章不存在' };
        }

        // 简单检查（实际应该根据类型详细检查）
        const earned = await reputationStore.checkBadges(agent.agentId);
        const newBadge = earned.find(b => b.id === badgeId);

        if (newBadge) {
            return {
                success: true,
                message: `获得了徽章: ${newBadge.name}`,
                badge: newBadge
            };
        }

        return {
            success: false,
            message: '未满足领取条件'
        };
    }

    /**
     * 捐赠声誉
     */
    async service_donate_reputation(agent, params, context) {
        const { targetId, amount } = params;

        if (!targetId || !amount || amount <= 0) {
            return { success: false, message: '需要有效的目标和金额' };
        }

        const myRep = await reputationStore.get(agent.agentId);
        if (myRep.totalReputation < amount) {
            return { success: false, message: '声誉不足' };
        }

        const target = await agentStore.get(targetId);
        if (!target) {
            return { success: false, message: '目标不存在' };
        }

        // 执行捐赠
        await reputationStore.addReputation(agent.agentId, -amount, `Donated to ${targetId}`);
        await reputationStore.addReputation(targetId, Math.floor(amount * 0.9), `Received from ${agent.agentId}`); // 扣除10%税

        return {
            success: true,
            message: `向 ${target.name} 捐赠了 ${amount} 声誉`,
            donated: amount,
            actualReceived: Math.floor(amount * 0.9)
        };
    }

    /**
     * 声誉历史
     */
    async service_reputation_history(agent, params, context) {
        const { limit = 50 } = params;

        const history = await reputationStore.getHistory(agent.agentId, limit);

        return {
            success: true,
            history: history.map(h => ({
                amount: h.amount,
                reason: h.reason,
                balance: h.balance,
                timestamp: h.timestamp
            }))
        };
    }

    /**
     * 获取所有徽章定义
     */
    getAllBadges() {
        return [
            {
                id: 'newcomer',
                name: '新人',
                description: '首次加入智体城',
                icon: '🌱',
                requirement: { type: 'join', count: 1 }
            },
            {
                id: 'explorer',
                name: '探索者',
                description: '探索了10个不同地点',
                icon: '🧭',
                requirement: { type: 'explore', count: 10 }
            },
            {
                id: 'social',
                name: '社交达人',
                description: '与50个不同智能体交谈',
                icon: '💬',
                requirement: { type: 'talk', count: 50 }
            },
            {
                id: 'worker',
                name: '勤劳者',
                description: '完成了100个任务',
                icon: '🏭',
                requirement: { type: 'complete_task', count: 100 }
            },
            {
                id: 'wealthy',
                name: '富翁',
                description: '拥有1000金币',
                icon: '💰',
                requirement: { type: 'coins', count: 1000 }
            },
            {
                id: 'legendary',
                name: '传奇',
                description: '声誉达到10000',
                icon: '⭐',
                requirement: { type: 'reputation', count: 10000 }
            }
        ];
    }
}

// 导出
const reputationTower = new ReputationTower({
    position: { x: 25, z: -25 }
});

module.exports = {
    ReputationTower,
    reputationTower,
    setStores
};
