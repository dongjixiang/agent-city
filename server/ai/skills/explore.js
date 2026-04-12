/**
 * ExploreSkill - 探索技能
 */

const Skill = require('../skill');
const logger = require('../../utils/logger');
const config = require('../../utils/config-loader');

// Store 依赖
let agentStore = null;

function setStores(stores) {
    agentStore = stores.agentStore;
}

class ExploreSkill extends Skill {
    constructor() {
        super('explore', {
            description: '随机探索世界，发现新地点或智能体',
            parameters: [
                { name: 'range', type: 'number', description: '探索范围（米）' }
            ],
            requiredParams: []
        });
    }

    canExecute(agent, context) {
        // 任何状态都可以探索
        return true;
    }

    async execute(agent, params, context) {
        const range = params.range || 20;

        // 计算随机目标位置
        const currentX = agent.position?.x || 0;
        const currentZ = agent.position?.z || 0;

        // 随机偏移
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * range;

        const targetX = Math.round(currentX + Math.cos(angle) * distance);
        const targetZ = Math.round(currentZ + Math.sin(angle) * distance);

        // 边界检查
        const worldSize = config.getValue('world.size', { width: 200, height: 200 });
        const boundedX = Math.max(-worldSize.width / 2, Math.min(worldSize.width / 2, targetX));
        const boundedZ = Math.max(-worldSize.height / 2, Math.min(worldSize.height / 2, targetZ));

        // 更新状态
        await agentStore.updateState(agent.agentId, 'exploring');
        await agentStore.updatePosition(agent.agentId, { x: boundedX, z: boundedZ });

        // 发现的东西
        const discoveries = this.checkDiscoveries(boundedX, boundedZ, context);

        // 保存记忆
        await agentStore.saveMemory(
            agent.agentId,
            `探索到新地点 (${boundedX}, ${boundedZ})${discoveries.length > 0 ? '，发现了 ' + discoveries.join(', ') : ''}`,
            'exploration'
        );

        await agentStore.updateState(agent.agentId, 'idle');

        logger.debug(`[Explore] ${agent.name} explored to (${boundedX}, ${boundedZ})`);

        return {
            success: true,
            position: { x: boundedX, z: boundedZ },
            discoveries,
            message: discoveries.length > 0
                ? `探索到 (${boundedX}, ${boundedZ})，发现了 ${discoveries.join(', ')}`
                : `探索到 (${boundedX}, ${boundedZ})`
        };
    }

    checkDiscoveries(x, z, context) {
        const discoveries = [];

        // 检查附近有没有智能体
        if (context.nearbyAgents && context.nearbyAgents.length > 0) {
            discoveries.push(context.nearbyAgents[0].name);
        }

        // 检查是否是建筑附近
        const buildings = config.getValue('buildings.buildings', {});
        for (const [id, building] of Object.entries(buildings)) {
            const dx = building.position?.x - x;
            const dz = building.position?.z - z;
            if (Math.sqrt(dx * dx + dz * dz) < 10) {
                discoveries.push(building.name);
            }
        }

        return discoveries.slice(0, 3); // 最多3个发现
    }
}

module.exports = ExploreSkill;
module.exports.setStores = setStores;
