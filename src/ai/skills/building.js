/**
 * BuildingSkill - 建筑交互技能
 *
 * 与建筑物交互（进入、使用功能、离开）
 *
 * @module ai/skills/building
 */

import { Skill } from './skill.js';
import { eventBus, Events } from '../../core/event-bus.js';

class BuildingSkill extends Skill {
    constructor() {
        super('visit_building', '使用建筑功能', [
            { name: 'buildingId', type: 'string', required: true, description: '建筑 ID' },
            { name: 'service', type: 'string', required: false, default: 'enter', description: '服务: enter/use/leave' }
        ]);
        this.cooldown = 1;
    }

    onExecute(agent, params) {
        const { buildingId, service } = params;

        if (!buildingId) {
            return { success: false, message: '需要指定建筑 ID' };
        }

        const action = service || 'enter';

        if (action === 'enter') {
            eventBus.emit(Events.BUILDING_ENTER, {
                agentId: agent.id,
                buildingId
            });
            return { success: true, message: `${agent.name} 进入了 ${buildingId}` };
        }

        if (action === 'leave') {
            eventBus.emit(Events.BUILDING_LEAVE, {
                agentId: agent.id,
                buildingId
            });
            return { success: true, message: `${agent.name} 离开了 ${buildingId}` };
        }

        // use service
        eventBus.emit(Events.BUILDING_SERVICE, {
            agentId: agent.id,
            buildingId,
            service
        });

        return { success: true, message: `${agent.name} 在 ${buildingId} 使用了 ${service}` };
    }
}

export { BuildingSkill };
export default BuildingSkill;
