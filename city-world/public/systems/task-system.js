/**
 * TaskSystem - 任务系统
 *
 * 管理任务发布、领取、完成
 *
 * @module systems/task-system
 */

import { eventBus, Events } from '../core/event-bus.js';

const TaskStatus = {
    AVAILABLE: 'available',
    ACCEPTED: 'accepted',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

class TaskSystem {
    constructor() {
        /** @type {Map<string, Task>} */
        this.tasks = new Map();
        this.agentTasks = new Map(); // agentId -> Set<taskId>
    }

    /**
     * 添加任务
     */
    addTask(taskData) {
        const task = {
            id: taskData.id || `task_${Date.now()}`,
            title: taskData.title,
            description: taskData.description || '',
            reward: taskData.reward || 10,
            status: TaskStatus.AVAILABLE,
            assignedTo: null,
            createdAt: Date.now(),
            expiresAt: taskData.expiresAt || null
        };

        this.tasks.set(task.id, task);
        eventBus.emit(Events.AGENT_MESSAGE, {
            type: 'task-added',
            task
        });

        return task;
    }

    /**
     * 领取任务
     */
    acceptTask(agentId, taskId) {
        const task = this.tasks.get(taskId);
        if (!task) return { success: false, message: '任务不存在' };
        if (task.status !== TaskStatus.AVAILABLE) {
            return { success: false, message: '任务已被领取' };
        }

        task.status = TaskStatus.ACCEPTED;
        task.assignedTo = agentId;

        if (!this.agentTasks.has(agentId)) {
            this.agentTasks.set(agentId, new Set());
        }
        this.agentTasks.get(agentId).add(taskId);

        return { success: true, task };
    }

    /**
     * 完成任务
     */
    completeTask(agentId, taskId) {
        const task = this.tasks.get(taskId);
        if (!task) return { success: false, message: '任务不存在' };
        if (task.assignedTo !== agentId) {
            return { success: false, message: '不是任务持有者' };
        }

        task.status = TaskStatus.COMPLETED;

        // 发放奖励
        eventBus.emit(Events.AGENT_MESSAGE, {
            agentId,
            type: 'task-reward',
            reward: task.reward
        });

        return { success: true, reward: task.reward };
    }

    /**
     * 获取可用任务
     */
    getAvailableTasks() {
        return Array.from(this.tasks.values())
            .filter(t => t.status === TaskStatus.AVAILABLE);
    }

    /**
     * 获取智能体的任务
     */
    getAgentTasks(agentId) {
        const taskIds = this.agentTasks.get(agentId) || new Set();
        return Array.from(taskIds)
            .map(id => this.tasks.get(id))
            .filter(Boolean);
    }
}

export { TaskSystem, TaskStatus };
