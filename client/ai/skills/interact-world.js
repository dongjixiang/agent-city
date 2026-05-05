/**
 * InteractSkill - 世界交互技能
 *
 * 与世界中的物体（建筑、装饰、设施）交互
 *
 * @module ai/skills/interact
 */

import { Skill } from './skill.js';
import { eventBus, Events } from '../../core/event-bus.js';

class InteractSkill extends Skill {
    constructor() {
        super('interact', '与世界物体交互', [
            { name: 'targetId', type: 'string', required: true, description: '目标物体 ID' },
            { name: 'action', type: 'string', required: false, default: 'look', description: '交互动作: look/use/enter' }
        ]);
        this.cooldown = 1;
    }

    onExecute(agent, params) {
        const { targetId, action } = params;

        if (!targetId) {
            return { success: false, message: '需要指定目标物体' };
        }

        // 通知交互系统处理
        eventBus.emit(Events.DECORATION_INTERACT, {
            agentId: agent.id,
            targetId,
            action: action || 'look'
        });

        return {
            success: true,
            message: `${agent.name} 对 ${targetId} 执行了 ${action || 'look'} 操作`
        };
    }
}

export { InteractSkill };
export default InteractSkill;
