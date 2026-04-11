/**
 * RestSkill - 休息技能
 */

const Skill = require('../skill');
const logger = require('../../utils/logger');

// Store 依赖
let agentStore = null;

function setStores(stores) {
    agentStore = stores.agentStore;
}

class RestSkill extends Skill {
    constructor() {
        super('rest', {
            description: '休息恢复精力',
            parameters: [
                { name: 'duration', type: 'number', description: '休息时长（秒）' }
            ],
            requiredParams: []
        });
    }

    canExecute(agent, context) {
        // 能量低时优先休息
        return agent.energy < 80 || !context.force;
    }

    async execute(agent, params, context) {
        const duration = params.duration || 5;

        // 更新状态
        await agentStore.updateState(agent.agentId, 'resting');

        // 模拟休息（实际应该异步等待）
        await new Promise(resolve => setTimeout(resolve, duration * 1000));

        // 恢复能量
        const energy恢复 = duration * 5;
        const newEnergy = Math.min(100, (agent.energy || 80) + energy恢复);

        await agentStore.updateNeeds(agent.agentId, { energy: newEnergy });
        await agentStore.updateState(agent.agentId, 'idle');

        logger.debug(`[Rest] ${agent.name} rested for ${duration}s, energy: ${newEnergy}`);

        return {
            success: true,
            energy恢复,
            newEnergy,
            message: `休息了 ${duration} 秒，精力恢复了 ${energy恢复}`
        };
    }
}

module.exports = RestSkill;
module.exports.setStores = setStores;
