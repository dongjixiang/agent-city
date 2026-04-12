/**
 * TaskCenter - 任务中心
 *
 * 任务列表、接受任务、提交任务、每日奖励
 *
 * @module systems/buildings/task-center
 */

import { Building } from './building.js';

class TaskCenter extends Building {
    constructor(position) {
        super(
            'task_center',
            '任务中心',
            position,
            {
                services: ['task_list', 'accept_task', 'submit_task', 'daily_bonus'],
                requirements: { minReputation: 0 }
            }
        );

        // 任务池
        this.taskPool = this._generateTasks();
        this.dailyBonusClaimed = new Map(); // agentId -> lastClaimDate
    }

    /**
     * 生成任务
     */
    _generateTasks() {
        const templates = [
            { description: '帮助寻找走失的小动物', reward: 15, difficulty: 'easy' },
            { description: '收集 5 个花种', reward: 20, difficulty: 'easy' },
            { description: '和其他智能体交流', reward: 10, difficulty: 'easy' },
            { description: '探索智体城边界', reward: 25, difficulty: 'medium' },
            { description: '参加社交活动', reward: 30, difficulty: 'medium' },
            { description: '完成一次交易', reward: 35, difficulty: 'medium' },
            { description: '帮助新智能体熟悉环境', reward: 40, difficulty: 'hard' },
            { description: '发现隐藏地点', reward: 50, difficulty: 'hard' },
            { description: '在声誉塔展示自己', reward: 45, difficulty: 'hard' }
        ];

        return templates.map((t, i) => ({
            id: `task_${Date.now()}_${i}`,
            ...t,
            status: 'available',
            assignedTo: null,
            createdAt: Date.now()
        }));
    }

    /**
     * 服务：获取任务列表
     */
    service_task_list(agent) {
        const available = this.taskPool.filter(t => t.status === 'available');
        return {
            success: true,
            tasks: available.map(t => ({
                id: t.id,
                description: t.description,
                reward: t.reward,
                difficulty: t.difficulty
            })),
            message: `当前有 ${available.length} 个可用任务`
        };
    }

    /**
     * 服务：接受任务
     */
    service_accept_task(agent, params) {
        const { task_id } = params || {};

        if (!task_id) {
            return this.service_task_list(agent);
        }

        const task = this.taskPool.find(t => t.id === task_id);
        if (!task) {
            return { success: false, message: `找不到任务: ${task_id}` };
        }
        if (task.status !== 'available') {
            return { success: false, message: '该任务已被领取或完成' };
        }

        task.status = 'in_progress';
        task.assignedTo = agent.id;

        return {
            success: true,
            task,
            message: `已接受任务: ${task.description}`
        };
    }

    /**
     * 服务：提交任务
     */
    service_submit_task(agent, params) {
        const { task_id } = params || {};

        if (!task_id) {
            // 获取该智能体进行中的任务
            const inProgress = this.taskPool.filter(
                t => t.status === 'in_progress' && t.assignedTo === agent.id
            );
            return {
                success: true,
                tasks: inProgress.map(t => ({
                    id: t.id,
                    description: t.description,
                    reward: t.reward
                })),
                message: `你正在进行 ${inProgress.length} 个任务`
            };
        }

        const task = this.taskPool.find(t => t.id === task_id);
        if (!task) {
            return { success: false, message: `找不到任务: ${task_id}` };
        }
        if (task.assignedTo !== agent.id) {
            return { success: false, message: '这不是你的任务' };
        }
        if (task.status !== 'in_progress') {
            return { success: false, message: '该任务尚未进行中' };
        }

        // 完成奖励
        task.status = 'completed';
        agent.reputation += task.reward;

        return {
            success: true,
            reward: task.reward,
            message: `🎉 完成任务：${task.description}，获得 ${task.reward} 声誉！`
        };
    }

    /**
     * 服务：每日奖励
     */
    service_daily_bonus(agent) {
        const today = new Date().toDateString();
        const lastClaim = this.dailyBonusClaimed.get(agent.id);

        if (lastClaim === today) {
            return {
                success: false,
                message: '今日奖励已领取，明天再来吧！'
            };
        }

        this.dailyBonusClaimed.set(agent.id, today);
        const bonus = 10 + Math.floor(agent.reputation / 10);
        agent.reputation += bonus;

        return {
            success: true,
            bonus,
            message: `🎁 每日奖励：获得 ${bonus} 声誉！`
        };
    }
}

export { TaskCenter };
