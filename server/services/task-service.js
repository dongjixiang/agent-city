/**
 * TaskService - 任务业务逻辑
 */

const logger = require('../utils/logger');
const config = require('../utils/config-loader');

// Store 依赖
let taskStore = null;
let agentStore = null;
let reputationStore = null;

/**
 * 设置依赖
 */
function setStores(stores) {
    taskStore = stores.taskStore;
    agentStore = stores.agentStore;
    reputationStore = stores.reputationStore;
}

class TaskService {
    /**
     * 创建任务
     */
    async createTask(data) {
        const { creatorId, title, description, type, difficulty, reward, requirements } = data;

        // 验证创建者
        const creator = await agentStore.get(creatorId);
        if (!creator) {
            throw new Error('Creator not found');
        }

        // 创建任务
        const task = await taskStore.createTask({
            title,
            description,
            type: type || 'general',
            difficulty: difficulty || 'easy',
            reward: reward || { reputation: 5, coins: 20 },
            requirements: {
                minReputation: requirements?.minReputation || 0,
                minLevel: requirements?.minLevel || 1,
                ...requirements
            },
            creatorId
        });

        // 增加创建者统计
        if (reputationStore) {
            await reputationStore.incrementStat(creatorId, 'tasksCreated');
        }

        logger.info(`[TaskService] Task created: ${task.id} by ${creatorId}`);

        return task;
    }

    /**
     * 获取任务
     */
    async getTask(taskId) {
        return await taskStore.get(taskId);
    }

    /**
     * 获取可用任务
     */
    async getAvailableTasks(filters = {}) {
        let tasks = await taskStore.getAvailableTasks();

        // 按类型筛选
        if (filters.type) {
            tasks = tasks.filter(t => t.type === filters.type);
        }

        // 按难度筛选
        if (filters.difficulty) {
            tasks = tasks.filter(t => t.difficulty === filters.difficulty);
        }

        // 按距离筛选（需要 agent 位置）
        if (filters.agentId && filters.radius) {
            const agent = await agentStore.get(filters.agentId);
            if (agent?.position) {
                // 假设任务有位置，或者返回所有任务
                tasks = tasks; // 暂时返回所有
            }
        }

        return tasks;
    }

    /**
     * 获取智能体的任务
     */
    async getAgentTasks(agentId) {
        return await taskStore.getAgentTasks(agentId);
    }

    /**
     * 接受任务
     */
    async acceptTask(taskId, agentId) {
        // 获取任务和智能体
        const task = await taskStore.get(taskId);
        const agent = await agentStore.get(agentId);

        if (!task) {
            throw new Error('Task not found');
        }

        if (!agent) {
            throw new Error('Agent not found');
        }

        // 检查是否已接受
        if (task.status !== 'available') {
            throw new Error('Task is not available');
        }

        // 检查要求
        if (task.requirements) {
            if (task.requirements.minReputation && agent.reputation < task.requirements.minReputation) {
                throw new Error(`Requires ${task.requirements.minReputation} reputation`);
            }

            if (task.requirements.minLevel && task.requirements.minLevel > 1) {
                // 检查等级
                const rep = await reputationStore?.get(agentId);
                const level = rep?.level || 1;
                if (level < task.requirements.minLevel) {
                    throw new Error(`Requires level ${task.requirements.minLevel}`);
                }
            }
        }

        // 检查智能体是否已有任务
        const agentTasks = await taskStore.getAgentTasks(agentId);
        if (agentTasks.length >= 5) {
            throw new Error('Already has maximum number of tasks (5)');
        }

        // 接受任务
        const updatedTask = await taskStore.acceptTask(taskId, agentId);

        logger.info(`[TaskService] Task ${taskId} accepted by ${agentId}`);

        return updatedTask;
    }

    /**
     * 完成任务
     */
    async completeTask(taskId, agentId) {
        const task = await taskStore.get(taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        if (task.assignedTo !== agentId) {
            throw new Error('Task is not assigned to this agent');
        }

        if (task.status !== 'in_progress') {
            throw new Error('Task is not in progress');
        }

        // 完成任务
        const updatedTask = await taskStore.completeTask(taskId, agentId);

        // 发放奖励
        const rewards = await this.distributeRewards(agentId, task.reward);

        // 增加统计
        if (reputationStore) {
            await reputationStore.incrementStat(agentId, 'tasksCompleted');
        }

        logger.info(`[TaskService] Task ${taskId} completed by ${agentId}`);

        return {
            task: updatedTask,
            rewards
        };
    }

    /**
     * 放弃任务
     */
    async abandonTask(taskId, agentId) {
        const task = await taskStore.get(taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        if (task.assignedTo !== agentId) {
            throw new Error('Task is not assigned to this agent');
        }

        const updatedTask = await taskStore.abandonTask(taskId, agentId);

        logger.info(`[TaskService] Task ${taskId} abandoned by ${agentId}`);

        return updatedTask;
    }

    /**
     * 更新任务进度
     */
    async updateProgress(taskId, agentId, progress) {
        const task = await taskStore.get(taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        if (task.assignedTo !== agentId) {
            throw new Error('Task is not assigned to this agent');
        }

        const updatedTask = await taskStore.updateProgress(taskId, progress);

        // 如果进度满了，自动完成任务
        if (progress >= task.maxProgress) {
            return await this.completeTask(taskId, agentId);
        }

        return updatedTask;
    }

    /**
     * 发放奖励
     */
    async distributeRewards(agentId, reward) {
        const results = {};

        // 声誉奖励
        if (reward.reputation && reward.reputation > 0) {
            if (reputationStore) {
                await reputationStore.addReputation(agentId, reward.reputation, 'Task completion');
            }
            results.reputation = reward.reputation;
        }

        // 金币奖励
        if (reward.coins && reward.coins > 0) {
            await agentStore.updateCoins(agentId, reward.coins);
            results.coins = reward.coins;
        }

        // 物品奖励
        if (reward.items && Array.isArray(reward.items)) {
            for (const item of reward.items) {
                await agentStore.addItem(agentId, item);
            }
            results.items = reward.items;
        }

        return results;
    }

    /**
     * 领取每日奖励
     */
    async claimDailyBonus(agentId) {
        const agent = await agentStore.get(agentId);
        if (!agent) {
            throw new Error('Agent not found');
        }

        // 检查是否已领取（简单实现，每天一次）
        const lastClaim = agent.lastDailyBonus || 0;
        const now = Date.now();
        const dayStart = new Date().setHours(0, 0, 0, 0);

        if (lastClaim >= dayStart) {
            throw new Error('Daily bonus already claimed today');
        }

        // 发放奖励
        const bonus = {
            reputation: 10,
            coins: 50
        };

        await this.distributeRewards(agentId, bonus);
        await agentStore.update(agentId, { lastDailyBonus: now });

        logger.info(`[TaskService] Daily bonus claimed by ${agentId}`);

        return { success: true, bonus };
    }

    /**
     * 生成随机任务
     */
    async generateRandomTask(agentId) {
        const agent = await agentStore.get(agentId);
        if (!agent) {
            throw new Error('Agent not found');
        }

        const task = await taskStore.generateRandomTask(agent.reputation || 0);

        if (!task) {
            throw new Error('No available tasks for this agent');
        }

        return task;
    }

    /**
     * 获取任务统计
     */
    async getTaskStats() {
        return await taskStore.getStats();
    }

    /**
     * 清理过期任务
     */
    async cleanupExpiredTasks() {
        return await taskStore.cleanupExpiredTasks();
    }

    /**
     * 取消任务（创建者）
     */
    async cancelTask(taskId, agentId) {
        const task = await taskStore.get(taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        if (task.creatorId !== agentId) {
            throw new Error('Only the creator can cancel the task');
        }

        if (task.status !== 'available') {
            throw new Error('Can only cancel available tasks');
        }

        await taskStore.delete(taskId);

        logger.info(`[TaskService] Task ${taskId} cancelled by ${agentId}`);

        return { success: true };
    }
}

// 导出单例
const taskService = new TaskService();

module.exports = {
    taskService,
    TaskService,
    setStores
};
