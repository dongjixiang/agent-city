/**
 * TaskSkill - 任务技能
 *
 * 领取/完成任务
 *
 * @module ai/skills/task
 */

import { Skill } from './skill.js';
import { eventBus, Events } from '../../core/event-bus.js';

class TaskSkill extends Skill {
    constructor() {
        super('task', '任务相关操作', [
            { name: 'action', type: 'string', required: true, description: '操作: list/accept/complete' },
            { name: 'taskId', type: 'string', required: false, description: '任务 ID' }
        ]);
    }

    onExecute(agent, params) {
        const { action, taskId } = params;

        switch (action) {
            case 'list':
                eventBus.emit(Events.AGENT_MESSAGE, {
                    agentId: agent.id,
                    type: 'task-list',
                    message: '请求任务列表'
                });
                return { success: true, message: '获取任务列表...' };

            case 'accept':
                if (!taskId) {
                    return { success: false, message: '需要指定 taskId' };
                }
                return {
                    success: true,
                    message: `${agent.name} 接受了任务 ${taskId}`
                };

            case 'complete':
                if (!taskId) {
                    return { success: false, message: '需要指定 taskId' };
                }
                return {
                    success: true,
                    message: `${agent.name} 完成了任务 ${taskId}！`
                };

            default:
                return { success: false, message: `未知操作: ${action}` };
        }
    }
}

export { TaskSkill };
export default TaskSkill;
