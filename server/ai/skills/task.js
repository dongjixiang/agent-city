/**
 * TaskSkill - 任务技能
 */

const Skill = require('../skill');
const logger = require('../../utils/logger');

// Store 依赖
let taskStore = null;
let agentStore = null;

function setStores(stores) {
    taskStore = stores.taskStore;
    agentStore = stores.agentStore;
}

class TaskSkill extends Skill {
    constructor() {
        super('task', {
            description: '接受任务、提交任务、或放弃任务',
            parameters: [
                { name: 'action', type: 'string', description: '动作 (accept/complete/abandon/list)' },
                { name: 'taskId', type: 'string', description: '任务 ID（accept/complete/abandon 时需要）' }
            ],
            requiredParams: ['action']
        });
    }

    canExecute(agent, context) {
        // 任何状态都可以查看任务列表
        return true;
    }

    async execute(agent, params, context) {
        const { action, taskId } = params;

        switch (action) {
            case 'list':
                return await this.listTasks(agent);
            case 'accept':
                return await this.acceptTask(agent, taskId);
            case 'complete':
                return await this.completeTask(agent, taskId);
            case 'abandon':
                return await this.abandonTask(agent, taskId);
            default:
                return {
                    success: false,
                    message: `Unknown action: ${action}`
                };
        }
    }

    async listTasks(agent) {
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
            available: canAccept.slice(0, 5).map(t => ({
                id: t.id,
                title: t.title,
                difficulty: t.difficulty,
                reward: t.reward
            })),
            myTasks: myTasks.map(t => ({
                id: t.id,
                title: t.title,
                progress: t.progress,
                maxProgress: t.maxProgress
            })),
            message: `有 ${canAccept.length} 个可接受任务，${myTasks.length} 个进行中`
        };
    }

    async acceptTask(agent, taskId) {
        if (!taskId) {
            // 自动选择任务
            const availableTasks = await taskStore.getAvailableTasks();
            const eligibleTasks = availableTasks.filter(t => {
                if (!t.requirements) return true;
                if (t.requirements.minReputation && agent.reputation < t.requirements.minReputation) {
                    return false;
                }
                return true;
            });

            if (eligibleTasks.length === 0) {
                return {
                    success: false,
                    message: '没有可接受的任务'
                };
            }

            // 选择奖励最高的任务
            const bestTask = eligibleTasks.reduce((best, t) => {
                const bestReward = (best.reward?.reputation || 0) + (best.reward?.coins || 0);
                const taskReward = (t.reward?.reputation || 0) + (t.reward?.coins || 0);
                return taskReward > bestReward ? t : best;
            });

            taskId = bestTask.id;
        }

        try {
            const task = await taskStore.acceptTask(taskId, agent.agentId);

            // 保存记忆
            await agentStore.saveMemory(
                agent.agentId,
                `接受了任务: ${task.title}`,
                'task'
            );

            return {
                success: true,
                task: {
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    reward: task.reward
                },
                message: `接受了任务: ${task.title}`
            };
        } catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    }

    async completeTask(agent, taskId) {
        if (!taskId) {
            return {
                success: false,
                message: '需要指定 taskId'
            };
        }

        try {
            const result = await taskStore.completeTask(taskId, agent.agentId);

            // 保存记忆
            await agentStore.saveMemory(
                agent.agentId,
                `完成了任务: ${result.task.title}`,
                'task'
            );

            return {
                success: true,
                task: result.task,
                rewards: result.rewards,
                message: `完成了任务: ${result.task.title}，获得 ${result.rewards.reputation} 声誉和 ${result.rewards.coins} 金币`
            };
        } catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    }

    async abandonTask(agent, taskId) {
        if (!taskId) {
            return {
                success: false,
                message: '需要指定 taskId'
            };
        }

        try {
            const task = await taskStore.abandonTask(taskId, agent.agentId);

            // 保存记忆
            await agentStore.saveMemory(
                agent.agentId,
                `放弃了任务: ${task.title}`,
                'task'
            );

            return {
                success: true,
                message: `放弃了任务: ${task.title}`
            };
        } catch (err) {
            return {
                success: false,
                message: err.message
            };
        }
    }
}

module.exports = TaskSkill;
module.exports.setStores = setStores;
