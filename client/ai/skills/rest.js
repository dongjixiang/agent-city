/**
 * RestSkill - 休息技能
 *
 * 恢复体力
 *
 * @module ai/skills/rest
 */

import { Skill } from './skill.js';
import { eventBus, Events } from '../../core/event-bus.js';

class RestSkill extends Skill {
    constructor() {
        super('rest', '休息恢复体力', [
            { name: 'duration', type: 'number', required: false, default: 5, description: '休息时长（秒）' }
        ]);
        this.cooldown = 10;
    }

    onExecute(agent, params) {
        const duration = params.duration || 5;

        agent.state = 'resting';

        eventBus.emit(Events.AGENT_SPEAK, {
            agentId: agent.id,
            message: '正在休息...',
            duration
        });

        // 延迟恢复能量
        setTimeout(() => {
            if (agent.state === 'resting') {
                agent.needs.energy = Math.min(100, agent.needs.energy + 30);
                agent.state = 'idle';
            }
        }, duration * 1000);

        return {
            success: true,
            message: `${agent.name} 开始休息 ${duration} 秒`
        };
    }
}

export { RestSkill };
export default RestSkill;
