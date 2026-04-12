/**
 * TalkToSkill - 交谈技能
 *
 * 与其他智能体交谈
 *
 * @module ai/skills/talk-to
 */

import { Skill } from './skill.js';
import { eventBus, Events } from '../../core/event-bus.js';

class TalkToSkill extends Skill {
    constructor() {
        super('talk-to', '与其他智能体交谈', [
            { name: 'targetId', type: 'string', required: true, description: '目标智能体 ID' },
            { name: 'message', type: 'string', required: false, default: '你好！', description: '对话内容' }
        ]);
        this.cooldown = 2;
    }

    onExecute(agent, params) {
        const { targetId, message } = params;

        if (!targetId) {
            return { success: false, message: '需要指定目标智能体' };
        }

        // 通过事件系统通知
        eventBus.emit(Events.AGENT_SPEAK, {
            agentId: agent.id,
            targetId,
            message: message || '你好！',
            duration: 3
        });

        agent.state = 'speaking';

        return {
            success: true,
            message: `${agent.name} 对 ${targetId} 说: ${message || '你好！'}`
        };
    }
}

export { TalkToSkill };
export default TalkToSkill;
