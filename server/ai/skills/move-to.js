/**
 * MoveToSkill - 移动技能
 */

const Skill = require('../skill');
const logger = require('../../utils/logger');

// Store 依赖
let agentStore = null;

function setStores(stores) {
    agentStore = stores.agentStore;
}

class MoveToSkill extends Skill {
    constructor() {
        super('move_to', {
            description: '移动到指定位置或目标',
            parameters: [
                { name: 'x', type: 'number', description: '目标 X 坐标' },
                { name: 'z', type: 'number', description: '目标 Z 坐标' },
                { name: 'targetName', type: 'string', description: '目标名称（可选）' }
            ],
            requiredParams: ['x', 'z']
        });
    }

    canExecute(agent, context) {
        // 任何状态下都可以移动
        return true;
    }

    async execute(agent, params, context) {
        const { x, z, targetName } = params;

        // 更新智能体状态
        await agentStore.updateState(agent.agentId, 'moving');

        // 更新位置
        await agentStore.updatePosition(agent.agentId, { x, z });

        // 更新状态回空闲
        await agentStore.updateState(agent.agentId, 'idle');

        logger.debug(`[MoveTo] ${agent.name} moved to (${x}, ${z})`);

        return {
            success: true,
            position: { x, z },
            targetName,
            message: targetName
                ? `移动到 ${targetName}`
                : `移动到 (${x}, ${z})`
        };
    }
}

module.exports = MoveToSkill;
module.exports.setStores = setStores;
