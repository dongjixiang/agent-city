/**
 * TaskCenter - 任务中心
 * 
 * 提供任务管理服务
 */

const BuildingBase = require('./building-base');
const logger = require('../../utils/logger');

// Store 依赖
let taskStore = null;
let agentStore = null;

function setStores(stores) {
    taskStore = stores.taskStore;
    agentStore = stores.agentStore;
}

class TaskCenter extends BuildingBase {
    constructor(config) {
        super('task_center', {
            name: '任务中心',
            description: '智能体获取任务、提交任务、领取奖励的地方',
            position: config?.position || { x: -25, z: -25 },
            type: 'task',
            services: ['task_list', 'accept_task', 'submit_task', 'daily_bonus']
        });
    }

    /**
     * 任务列表
     */
    async service_task_list(agent, params, context) {
        const availableTasks = await taskStore.getAvailableTasks();
        const myTasks = await taskStore.getAgentTasks(agent.agentId);

        // 过滤可接受的任务
        const canAccept = availableTasks.filter(t => {
            if (!t.requirements) return true;
            if (t.requirements.minReputation && agent.reputation < t.requirements.minReputation) {
                return false;
            }
            return true;
        });

        return {
            success: true,
            available: canAccept.slice(0, 10).map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                difficulty: t.difficulty,
                reward: t.reward,
                expiresAt: t.expiresAt
            })),
            myTasks: myTasks.map(t => ({
                id: t.id,
                title: t.title,
                progress: t.progress,
                maxProgress: t.maxProgress,
                status: t.status
            })),
            stats: await taskStore.getStats()
        };
    }

    /**
     * 接受任务
     */
    async service_accept_task(agent, params, context) {
        const { taskId } = params;

        if (!taskId) {
            // 自动选择最佳任务
            const availableTasks = await taskStore.getAvailableTasks();
            const eligibleTasks = availableTasks.filter(t => {
                if (!t.requirements) return true;
                if (t.requirements.minReputation && agent.reputation < t.requirements.minReputation) {
                    return false;
                }
                return true;
            });

            if (eligibleTasks.length === 0) {
                return { success: false, message: '没有可接受的任务' };
            }

            // 选择奖励最高的任务
            const bestTask = eligibleTasks.reduce((best, t) => {
                const bestReward = (best.reward?.reputation || 0) + (best.reward?.coins || 0);
                const taskReward = (t.reward?.reputation || 0) + (t.reward?.coins || 0);
                return taskReward > bestReward ? t : best;
            });

            const task = await taskStore.acceptTask(bestTask.id, agent.agentId);

            return {
                success: true,
                message: `接受了任务: ${task.title}`,
                task: {
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    reward: task.reward
                }
            };
        }

        const task = await taskStore.acceptTask(taskId, agent.agentId);

        return {
            success: true,
            message: `接受了任务: ${task.title}`,
            task: {
                id: task.id,
                title: task.title,
                description: task.description,
                reward: task.reward
            }
        };
    }

    /**
     * 提交任务
     */
    async service_submit_task(agent, params, context) {
        const { taskId } = params;

        if (!taskId) {
            return { success: false, message: '需要指定任务ID' };
        }

        const task = await taskStore.get(taskId);

        if (!task) {
            return { success: false, message: '任务不存在' };
        }

        if (task.assignedTo !== agent.agentId) {
            return { success: false, message: '这不是你的任务' };
        }

        if (task.status !== 'in_progress') {
            return { success: false, message: '任务状态不正确' };
        }

        // 完成任务
        const result = await taskStore.completeTask(taskId, agent.agentId);

        // 发放奖励
        if (result.rewards) {
            if (result.rewards.reputation) {
                await agentStore.updateReputation(agent.agentId, result.rewards.reputation);
            }
            if (result.rewards.coins) {
                await agentStore.updateCoins(agent.agentId, result.rewards.coins);
            }
        }

        return {
            success: true,
            message: `完成了任务: ${task.title}`,
            rewards: result.rewards
        };
    }

    /**
     * 每日奖励
     */
    async service_daily_bonus(agent, params, context) {
        const now = Date.now();
        const lastClaim = agent.lastDailyBonus || 0;
        const dayStart = new Date().setHours(0, 0, 0, 0);

        if (lastClaim >= dayStart) {
            return {
                success: false,
                message: '今日奖励已领取',
                nextClaimTime: dayStart + 24 * 60 * 60 * 1000
            };
        }

        // 发放奖励
        const bonus = {
            reputation: 10,
            coins: 50
        };

        await agentStore.updateReputation(agent.agentId, bonus.reputation);
        await agentStore.updateCoins(agent.agentId, bonus.coins);
        await agentStore.update(agent.agentId, { lastDailyBonus: now });

        return {
            success: true,
            message: '领取了每日奖励！',
            bonus
        };
    }
}

// 导出
const taskCenter = new TaskCenter({
    position: { x: -25, z: -25 }
});

module.exports = {
    TaskCenter,
    taskCenter,
    setStores
};
