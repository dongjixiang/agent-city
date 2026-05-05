/**
 * ReputationStore - 声誉数据存储
 */

const BaseStore = require('./base-store');
const logger = require('../utils/logger');

class ReputationStore extends BaseStore {
    constructor() {
        super('ReputationStore');

        // 索引
        this.setIndex('totalReputation');

        // 徽章定义
        this.badgeDefinitions = this.initBadgeDefinitions();

        // 排行榜缓存
        this.leaderboardCache = null;
        this.leaderboardCacheTime = 0;
        this.leaderboardCacheTTL = 60000; // 1分钟
    }

    /**
     * 初始化徽章定义
     */
    initBadgeDefinitions() {
        return {
            newcomer: {
                id: 'newcomer',
                name: '新人',
                description: '首次加入智体城',
                icon: '🌱',
                requirement: { type: 'join', count: 1 }
            },
            explorer: {
                id: 'explorer',
                name: '探索者',
                description: '探索了10个不同地点',
                icon: '🧭',
                requirement: { type: 'explore', count: 10 }
            },
            social: {
                id: 'social',
                name: '社交达人',
                description: '与50个不同智能体交谈',
                icon: '💬',
                requirement: { type: 'talk', count: 50 }
            },
            worker: {
                id: 'worker',
                name: '勤劳者',
                description: '完成了100个任务',
                icon: '🏭',
                requirement: { type: 'complete_task', count: 100 }
            },
            wealthy: {
                id: 'wealthy',
                name: '富翁',
                description: '拥有1000金币',
                icon: '💰',
                requirement: { type: 'coins', count: 1000 }
            },
            legendary: {
                id: 'legendary',
                name: '传奇',
                description: '声誉达到10000',
                icon: '⭐',
                requirement: { type: 'reputation', count: 10000 }
            }
        };
    }

    /**
     * 获取或创建声誉记录
     */
    async getOrCreate(agentId) {
        let reputation = await this.get(agentId);

        if (!reputation) {
            reputation = await this.create(agentId, {
                agentId,
                totalReputation: 0,
                level: 1,
                badges: [],
                history: [],
                stats: {
                    tasksCompleted: 0,
                    tasksCreated: 0,
                    conversations: 0,
                    explorations: 0,
                    trades: 0
                },
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        }

        return reputation;
    }

    /**
     * 更新声誉
     */
    async addReputation(agentId, amount, reason = '') {
        const reputation = await this.getOrCreate(agentId);

        const oldTotal = reputation.totalReputation;
        const newTotal = Math.max(0, oldTotal + amount);
        const oldLevel = reputation.level;
        const newLevel = this.calculateLevel(newTotal);

        const historyEntry = {
            amount,
            reason,
            balance: newTotal,
            timestamp: Date.now()
        };

        const updated = await this.update(agentId, {
            totalReputation: newTotal,
            level: newLevel,
            history: [...(reputation.history || []), historyEntry].slice(-100), // 保留最近100条
            updatedAt: Date.now()
        });

        // 检查新徽章
        const newBadges = await this.checkBadges(agentId);

        return {
            ...updated,
            levelUp: newLevel > oldLevel,
            newBadges
        };
    }

    /**
     * 计算等级
     */
    calculateLevel(reputation) {
        // 等级公式: level = floor(sqrt(reputation / 100)) + 1
        return Math.floor(Math.sqrt(reputation / 100)) + 1;
    }

    /**
     * 检查徽章
     */
    async checkBadges(agentId) {
        const reputation = await this.get(agentId);
        if (!reputation) return [];

        const newBadges = [];
        const currentBadges = reputation.badges || [];
        const currentBadgeIds = new Set(currentBadges.map(b => b.id));

        for (const [id, badge] of Object.entries(this.badgeDefinitions)) {
            if (currentBadgeIds.has(id)) continue;

            let earned = false;

            switch (badge.requirement.type) {
                case 'join':
                    earned = reputation.stats.tasksCompleted >= badge.requirement.count;
                    break;
                case 'complete_task':
                    earned = reputation.stats.tasksCompleted >= badge.requirement.count;
                    break;
                case 'coins':
                    // 需要从 agent store 获取
                    earned = false;
                    break;
                case 'reputation':
                    earned = reputation.totalReputation >= badge.requirement.count;
                    break;
            }

            if (earned) {
                const earnedBadge = {
                    ...badge,
                    earnedAt: Date.now()
                };
                newBadges.push(earnedBadge);

                // 更新徽章列表
                await this.update(agentId, {
                    badges: [...currentBadges, earnedBadge]
                });
            }
        }

        return newBadges;
    }

    /**
     * 获取排行榜
     */
    async getLeaderboard(limit = 20) {
        // 检查缓存
        if (this.leaderboardCache && Date.now() - this.leaderboardCacheTime < this.leaderboardCacheTTL) {
            return this.leaderboardCache.slice(0, limit);
        }

        // 按声誉排序
        const all = await this.getAll();
        const sorted = all.sort((a, b) => b.totalReputation - a.totalReputation);

        this.leaderboardCache = sorted.slice(0, 100); // 缓存前100
        this.leaderboardCacheTime = Date.now();

        return sorted.slice(0, limit).map((r, index) => ({
            rank: index + 1,
            agentId: r.agentId,
            reputation: r.totalReputation,
            level: r.level,
            badges: r.badges?.length || 0
        }));
    }

    /**
     * 获取声誉历史
     */
    async getHistory(agentId, limit = 50) {
        const reputation = await this.get(agentId);
        if (!reputation) return [];

        return (reputation.history || []).slice(-limit).reverse();
    }

    /**
     * 更新统计
     */
    async incrementStat(agentId, statName, amount = 1) {
        const reputation = await this.getOrCreate(agentId);
        const stats = { ...reputation.stats };

        if (stats[statName] !== undefined) {
            stats[statName] += amount;
        }

        return await this.update(agentId, { stats, updatedAt: Date.now() });
    }

    /**
     * 获取排名
     */
    async getRank(agentId) {
        const reputation = await this.get(agentId);
        if (!reputation) return null;

        const all = await this.getAll();
        const sorted = all.sort((a, b) => b.totalReputation - a.totalReputation);

        const index = sorted.findIndex(r => r.agentId === agentId);
        return index >= 0 ? index + 1 : null;
    }

    /**
     * 获取声誉详情
     */
    async getDetailed(agentId) {
        const reputation = await this.getOrCreate(agentId);
        const rank = await this.getRank(agentId);

        return {
            ...reputation,
            rank,
            badgeDefinitions: this.badgeDefinitions
        };
    }
}

module.exports = ReputationStore;
