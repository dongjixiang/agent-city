/**
 * AchievementService - 成就服务
 */

const logger = require('../../utils/logger');

class AchievementService {
    constructor() {
        // 成就定义
        this.achievements = {
            // 任务成就
            first_task: {
                id: 'first_task',
                category: 'task',
                name: '初出茅庐',
                description: '完成第一个任务',
                icon: '📋',
                requirement: { type: 'tasks_completed', count: 1 },
                reward: { coins: 100 }
            },
            ten_tasks: {
                id: 'ten_tasks',
                category: 'task',
                name: '勤奋工作者',
                description: '完成10个任务',
                icon: '📝',
                requirement: { type: 'tasks_completed', count: 10 },
                reward: { coins: 500 }
            },
            hundred_tasks: {
                id: 'hundred_tasks',
                category: 'task',
                name: '任务达人',
                description: '完成100个任务',
                icon: '🏆',
                requirement: { type: 'tasks_completed', count: 100 },
                reward: { coins: 5000, reputation: 50 }
            },

            // 社交成就
            first_friend: {
                id: 'first_friend',
                category: 'social',
                name: '结识新友',
                description: '添加第一个好友',
                icon: '👋',
                requirement: { type: 'friends_count', count: 1 },
                reward: { coins: 50 }
            },
            popular: {
                id: 'popular',
                category: 'social',
                name: '社交达人',
                description: '拥有10个好友',
                icon: '⭐',
                requirement: { type: 'friends_count', count: 10 },
                reward: { coins: 500 }
            },

            // 探索成就
            first_explore: {
                id: 'first_explore',
                category: 'exploration',
                name: '初来乍到',
                description: '探索100米外的区域',
                icon: '🧭',
                requirement: { type: 'explore_distance', distance: 100 },
                reward: { coins: 50 }
            },
            explorer: {
                id: 'explorer',
                category: 'exploration',
                name: '探索者',
                description: '探索世界的每个角落',
                icon: '🌍',
                requirement: { type: 'explore_count', count: 50 },
                reward: { coins: 1000 }
            },

            // 交易成就
            first_trade: {
                id: 'first_trade',
                category: 'trading',
                name: '初次交易',
                description: '完成第一笔交易',
                icon: '💰',
                requirement: { type: 'trades_count', count: 1 },
                reward: { coins: 50 }
            },
            merchant: {
                id: 'merchant',
                category: 'trading',
                name: '商人',
                description: '完成50笔交易',
                icon: '💎',
                requirement: { type: 'trades_count', count: 50 },
                reward: { coins: 2000 }
            },

            // 宠物成就
            first_pet: {
                id: 'first_pet',
                category: 'pet',
                name: '爱护动物',
                description: '领养第一只宠物',
                icon: '🐾',
                requirement: { type: 'pets_count', count: 1 },
                reward: { coins: 200 }
            },
            pet_lover: {
                id: 'pet_lover',
                category: 'pet',
                name: '宠物爱好者',
                description: '拥有5只宠物',
                icon: '❤️',
                requirement: { type: 'pets_count', count: 5 },
                reward: { coins: 1000 }
            },

            // 声望成就
            newcomer: {
                id: 'newcomer',
                category: 'reputation',
                name: '新人',
                description: '声誉达到100',
                icon: '🌱',
                requirement: { type: 'reputation', count: 100 },
                reward: { coins: 500 }
            },
            veteran: {
                id: 'veteran',
                category: 'reputation',
                name: '老手',
                description: '声誉达到1000',
                icon: '🎖️',
                requirement: { type: 'reputation', count: 1000 },
                reward: { coins: 5000 }
            },
            legend: {
                id: 'legend',
                category: 'reputation',
                name: '传奇',
                description: '声誉达到10000',
                icon: '👑',
                requirement: { type: 'reputation', count: 10000 },
                reward: { coins: 50000, reputation: 500 }
            }
        };

        // 玩家成就进度: agentId -> { achievementId -> progress }
        this.progress = new Map();
    }

    /**
     * 获取所有成就
     */
    getAllAchievements() {
        return Object.values(this.achievements);
    }

    /**
     * 获取成就
     */
    getAchievement(id) {
        return this.achievements[id];
    }

    /**
     * 获取玩家成就进度
     */
    async getAgentAchievements(agentId) {
        const agentProgress = this.progress.get(agentId) || {};
        const earnedIds = Object.entries(agentProgress)
            .filter(([id, p]) => p.earned)
            .map(([id]) => id);

        return {
            earned: earnedIds.map(id => ({
                ...this.achievements[id],
                earnedAt: agentProgress[id].earnedAt
            })),
            progress: agentProgress
        };
    }

    /**
     * 检查并更新成就进度
     */
    async checkAchievements(agentId, stats) {
        const agentProgress = this.progress.get(agentId) || {};
        const newlyEarned = [];

        for (const [id, achievement] of Object.entries(this.achievements)) {
            if (agentProgress[id]?.earned) continue;

            const req = achievement.requirement;
            let current = 0;

            switch (req.type) {
                case 'tasks_completed':
                    current = stats.tasksCompleted || 0;
                    break;
                case 'friends_count':
                    current = stats.friendsCount || 0;
                    break;
                case 'trades_count':
                    current = stats.tradesCount || 0;
                    break;
                case 'pets_count':
                    current = stats.petsCount || 0;
                    break;
                case 'reputation':
                    current = stats.reputation || 0;
                    break;
            }

            if (!agentProgress[id]) {
                agentProgress[id] = { current: 0, earned: false };
            }

            agentProgress[id].current = current;

            if (current >= req.count) {
                agentProgress[id].earned = true;
                agentProgress[id].earnedAt = Date.now();
                newlyEarned.push(achievement);
            }
        }

        this.progress.set(agentId, agentProgress);

        return newlyEarned;
    }

    /**
     * 手动领取成就（用于测试或特殊触发）
     */
    async forceEarn(agentId, achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement) {
            return { success: false, message: '成就不存在' };
        }

        if (!this.progress.has(agentId)) {
            this.progress.set(agentId, {});
        }

        const agentProgress = this.progress.get(agentId);

        if (agentProgress[achievementId]?.earned) {
            return { success: false, message: '已获得该成就' };
        }

        agentProgress[achievementId] = {
            current: achievement.requirement.count,
            earned: true,
            earnedAt: Date.now()
        };

        logger.info(`[Achievement] ${agentId} earned ${achievementId}`);

        return {
            success: true,
            achievement
        };
    }

    /**
     * 获取成就统计
     */
    async getStats(agentId) {
        const agentProgress = this.progress.get(agentId) || {};
        const earnedCount = Object.values(agentProgress).filter(p => p.earned).length;
        const totalCount = Object.keys(this.achievements).length;

        return {
            earned: earnedCount,
            total: totalCount,
            progress: Math.round(earnedCount / totalCount * 100)
        };
    }
}

const achievementService = new AchievementService();

module.exports = { achievementService, AchievementService };
