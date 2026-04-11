/**
 * TaskStore - 任务数据存储
 */

const BaseStore = require('./base-store');
const logger = require('../utils/logger');

class TaskStore extends BaseStore {
    constructor() {
        super('TaskStore');

        // 索引
        this.setIndex('status');
        this.setIndex('type');
        this.setIndex('assignedTo');

        // 任务模板
        this.taskTemplates = this.initTaskTemplates();
    }

    /**
     * 初始化任务模板
     */
    initTaskTemplates() {
        return [
            {
                type: 'exploration',
                title: '探索新区域',
                description: '前往未知的区域探索，发现新的地点或智能体',
                difficulty: 'easy',
                baseReward: { reputation: 5, coins: 20 },
                duration: 300000, // 5分钟
                requirements: { minReputation: 0 }
            },
            {
                type: 'delivery',
                title: '传递消息',
                description: '将消息带给另一个智能体',
                difficulty: 'easy',
                baseReward: { reputation: 8, coins: 30 },
                duration: 180000,
                requirements: { minReputation: 0 }
            },
            {
                type: 'collection',
                title: '收集物品',
                description: '收集指定数量的物品',
                difficulty: 'medium',
                baseReward: { reputation: 15, coins: 50 },
                duration: 600000,
                requirements: { minReputation: 10 }
            },
            {
                type: 'social',
                title: '社交任务',
                description: '与指定数量的智能体交谈',
                difficulty: 'easy',
                baseReward: { reputation: 10, coins: 40 },
                duration: 600000,
                requirements: { minReputation: 0 }
            },
            {
                type: 'building',
                title: '建筑帮助',
                description: '帮助修建或维护建筑',
                difficulty: 'hard',
                baseReward: { reputation: 25, coins: 100 },
                duration: 900000,
                requirements: { minReputation: 20 }
            }
        ];
    }

    /**
     * 创建任务
     */
    async createTask(data) {
        const id = data.id || this.generateId('task');
        const task = {
            id,
            title: data.title,
            description: data.description || '',
            type: data.type || 'general',
            status: 'available',
            difficulty: data.difficulty || 'easy',
            assignedTo: null,
            completedBy: null,
            reward: data.reward || { reputation: 5, coins: 20 },
            requirements: data.requirements || {},
            progress: 0,
            maxProgress: data.maxProgress || 1,
            createdAt: Date.now(),
            expiresAt: data.expiresAt || (Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天
            completedAt: null
        };

        return await this.create(id, task);
    }

    /**
     * 获取可用任务
     */
    async getAvailableTasks() {
        return this.find({ status: 'available' });
    }

    /**
     * 获取智能体正在进行的任务
     */
    async getAgentTasks(agentId) {
        return this.find({ assignedTo: agentId, status: 'in_progress' });
    }

    /**
     * 接受任务
     */
    async acceptTask(taskId, agentId) {
        const task = await this.get(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        if (task.status !== 'available') {
            throw new Error('Task is not available');
        }

        // 检查要求
        if (task.requirements?.minReputation > 0) {
            // 这里需要调用 reputation store
            // 暂时跳过
        }

        return await this.update(taskId, {
            status: 'in_progress',
            assignedTo: agentId,
            acceptedAt: Date.now()
        });
    }

    /**
     * 完成任务
     */
    async completeTask(taskId, agentId) {
        const task = await this.get(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        if (task.assignedTo !== agentId) {
            throw new Error('Task is not assigned to this agent');
        }

        if (task.status !== 'in_progress') {
            throw new Error('Task is not in progress');
        }

        return await this.update(taskId, {
            status: 'completed',
            completedBy: agentId,
            completedAt: Date.now()
        });
    }

    /**
     * 放弃任务
     */
    async abandonTask(taskId, agentId) {
        const task = await this.get(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        if (task.assignedTo !== agentId) {
            throw new Error('Task is not assigned to this agent');
        }

        return await this.update(taskId, {
            status: 'available',
            assignedTo: null,
            acceptedAt: null
        });
    }

    /**
     * 更新进度
     */
    async updateProgress(taskId, progress) {
        const task = await this.get(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        return await this.update(taskId, { progress });
    }

    /**
     * 生成随机任务
     */
    async generateRandomTask(agentReputation = 0) {
        // 根据声誉筛选可用模板
        const availableTemplates = this.taskTemplates.filter(
            t => !t.requirements?.minReputation || t.requirements.minReputation <= agentReputation
        );

        if (availableTemplates.length === 0) {
            return null;
        }

        // 随机选择模板
        const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];

        return await this.createTask({
            ...template,
            reward: template.baseReward
        });
    }

    /**
     * 批量生成任务
     */
    async generateTasks(count = 10) {
        const tasks = [];
        for (let i = 0; i < count; i++) {
            const task = await this.generateRandomTask();
            if (task) {
                tasks.push(task);
            }
        }
        return tasks;
    }

    /**
     * 清理过期任务
     */
    async cleanupExpiredTasks() {
        const now = Date.now();
        const tasks = await this.getAll();
        let cleaned = 0;

        for (const task of tasks) {
            if (task.status === 'available' && task.expiresAt < now) {
                await this.delete(task.id);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.info(`[TaskStore] Cleaned up ${cleaned} expired tasks`);
        }

        return cleaned;
    }

    /**
     * 获取任务统计
     */
    async getStats() {
        const tasks = await this.getAll();
        const stats = {
            total: tasks.length,
            available: 0,
            inProgress: 0,
            completed: 0,
            expired: 0
        };

        const now = Date.now();
        for (const task of tasks) {
            switch (task.status) {
                case 'available':
                    stats.available++;
                    if (task.expiresAt < now) stats.expired++;
                    break;
                case 'in_progress':
                    stats.inProgress++;
                    break;
                case 'completed':
                    stats.completed++;
                    break;
            }
        }

        return stats;
    }
}

module.exports = TaskStore;
