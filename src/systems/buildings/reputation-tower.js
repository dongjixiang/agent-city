/**
 * ReputationTower - 声誉塔
 *
 * 排行榜、徽章领取、声誉捐赠
 *
 * @module systems/buildings/reputation-tower
 */

import { Building } from './building.js';

class ReputationTower extends Building {
    constructor(position) {
        super(
            'reputation_tower',
            '声誉塔',
            position,
            {
                services: ['leaderboard', 'claim_badge', 'donate_reputation'],
                requirements: { minReputation: 10 }
            }
        );

        // 排行榜
        this.leaderboard = []; // [{ agentId, name, reputation }]
        this.badges = new Map(); // agentId -> Set<badge>
    }

    /**
     * 更新排行榜
     */
    updateLeaderboard(agents) {
        this.leaderboard = agents
            .map(a => ({
                agentId: a.id,
                name: a.name,
                reputation: a.reputation || 0
            }))
            .sort((a, b) => b.reputation - a.reputation)
            .slice(0, 10);
    }

    /**
     * 服务：排行榜
     */
    service_leaderboard(agent) {
        this.updateLeaderboard([]); // 需要传入 agents 列表

        return {
            success: true,
            leaderboard: this.leaderboard.map((e, i) => ({
                rank: i + 1,
                name: e.name,
                reputation: e.reputation
            })),
            message: '🏆 当前声誉排行榜'
        };
    }

    /**
     * 获取徽章
     */
    _getBadges(agentId) {
        if (!this.badges.has(agentId)) {
            this.badges.set(agentId, new Set());
        }
        return this.badges.get(agentId);
    }

    /**
     * 检查并授予徽章
     */
    _checkBadges(agent) {
        const badges = this._getBadges(agent.id);
        const reputation = agent.reputation || 0;
        const newBadges = [];

        const badgeList = [
            { id: 'newcomer', minRep: 1, name: '新人', desc: '首次获得声誉' },
            { id: 'member', minRep: 50, name: '成员', desc: '声誉达到 50' },
            { id: 'expert', minRep: 70, name: '专家', desc: '声誉达到 70' },
            { id: 'elite', minRep: 85, name: '精英', desc: '声誉达到 85' },
            { id: 'legend', minRep: 95, name: '传说', desc: '声誉达到 95' }
        ];

        for (const badge of badgeList) {
            if (reputation >= badge.minRep && !badges.has(badge.id)) {
                badges.add(badge.id);
                newBadges.push(badge);
            }
        }

        return newBadges;
    }

    /**
     * 服务：领取徽章
     */
    service_claim_badge(agent) {
        const newBadges = this._checkBadges(agent);
        const allBadges = this._getBadges(agent.id);

        const badgeList = [
            { id: 'newcomer', name: '新人' },
            { id: 'member', name: '成员' },
            { id: 'expert', name: '专家' },
            { id: 'elite', name: '精英' },
            { id: 'legend', name: '传说' }
        ];

        return {
            success: true,
            newBadges: newBadges.map(b => b.name),
            allBadges: badgeList
                .filter(b => allBadges.has(b.id))
                .map(b => b.name),
            message: newBadges.length > 0
                ? `🏅 获得新徽章：${newBadges.map(b => b.name).join('、')}`
                : '暂无新徽章可领取'
        };
    }

    /**
     * 服务：捐赠声誉
     */
    service_donate_reputation(agent, params) {
        const { targetId, amount } = params || {};

        if (!targetId || !amount) {
            return {
                success: false,
                message: '需要指定目标智能体 ID 和捐赠数量'
            };
        }

        const amountNum = parseInt(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return { success: false, message: '捐赠数量必须为正数' };
        }

        if (agent.reputation < amountNum) {
            return { success: false, message: '声誉不足' };
        }

        // 扣除捐赠者声誉（扣除 90%，10% 作为手续费）
        const actualAmount = Math.floor(amountNum * 0.9);
        agent.reputation -= amountNum;

        return {
            success: true,
            donated: actualAmount,
            message: `向 ${targetId} 捐赠了 ${actualAmount} 声誉（扣除 10% 手续费）`
        };
    }
}

export { ReputationTower };
