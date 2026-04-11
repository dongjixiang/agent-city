/**
 * InteractSkill - 交互技能
 */

const Skill = require('../skill');
const logger = require('../../utils/logger');
const config = require('../../utils/config-loader');

// Store 依赖
let agentStore = null;

function setStores(stores) {
    agentStore = stores.agentStore;
}

class InteractSkill extends Skill {
    constructor() {
        super('interact', {
            description: '与世界中的物体或动物互动',
            parameters: [
                { name: 'targetType', type: 'string', description: '目标类型 (decoration/animal/building)' },
                { name: 'targetId', type: 'string', description: '目标 ID' },
                { name: 'action', type: 'string', description: '动作 (look/touch/feed/ride)' }
            ],
            requiredParams: ['targetType', 'targetId']
        });
    }

    canExecute(agent, context) {
        // 任何状态都可以互动
        return true;
    }

    async execute(agent, params, context) {
        const { targetType, targetId, action } = params;

        let result;

        switch (targetType) {
            case 'decoration':
                result = await this.interactDecoration(agent, targetId, action);
                break;
            case 'animal':
                result = await this.interactAnimal(agent, targetId, action);
                break;
            case 'building':
                result = await this.interactBuilding(agent, targetId, action);
                break;
            default:
                result = { success: false, message: `Unknown target type: ${targetType}` };
        }

        // 保存记忆
        if (result.success) {
            await agentStore.saveMemory(
                agent.agentId,
                `和 ${targetType} ${targetId} 进行了 ${action || '互动'}: ${result.message}`,
                'interaction'
            );
        }

        return result;
    }

    async interactDecoration(agent, targetId, action) {
        // 装饰物配置
        const decorations = config.get('world.decorations', {});

        // 找到对应的装饰类型
        let foundType = null;
        for (const [type, config] of Object.entries(decorations)) {
            if (targetId.includes(type)) {
                foundType = type;
                break;
            }
        }

        if (!foundType) {
            // 通用装饰
            return {
                success: true,
                message: `${action || '互动'}了 ${targetId}`
            };
        }

        const actions = {
            look: `观察了 ${foundType}`,
            touch: `触摸了 ${foundType}`,
            smell: `闻了闻 ${foundType}`,
            water: `给 ${foundType} 浇了水`
        };

        return {
            success: true,
            message: actions[action] || `${action || '互动'}了 ${foundType}`
        };
    }

    async interactAnimal(agent, targetId, action) {
        const animals = config.get('animals', {});

        // 找到对应的动物类型
        let animalType = null;
        for (const [type, config] of Object.entries(animals)) {
            if (targetId.includes(type) || targetId.toLowerCase().includes(type)) {
                animalType = type;
                break;
            }
        }

        if (!animalType) {
            animalType = 'unknown';
        }

        const actions = {
            look: `观察了 ${animalType}`,
            feed: `喂养了 ${animalType}`,
            pet: `抚摸 ${animalType}`,
            chase: `追逐 ${animalType}`
        };

        // 增加心情
        const moodBoost = 5;
        const newMood = agent.mood === 'happy' ? 'happy' :
                       agent.mood === 'neutral' ? 'happy' : 'neutral';

        await agentStore.updateNeeds(agent.agentId, { mood: newMood });

        return {
            success: true,
            message: actions[action] || `${action || '互动'}了 ${animalType}`,
            moodBoost
        };
    }

    async interactBuilding(agent, targetId, action) {
        const buildings = config.get('buildings.buildings', {});

        const building = buildings[targetId];

        if (!building) {
            return {
                success: false,
                message: `建筑 ${targetId} 不存在`
            };
        }

        // 检查距离
        if (agent.position) {
            const dx = building.position?.x - agent.position.x;
            const dz = building.position?.z - agent.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance > 10) {
                return {
                    success: false,
                    message: `距离 ${building.name} 太远，需要先走过去`,
                    requiredAction: 'move_to',
                    params: { x: building.position.x, z: building.position.z }
                };
            }
        }

        return {
            success: true,
            message: `到达了 ${building.name}`,
            building: {
                id: building.id,
                name: building.name,
                description: building.description,
                services: building.services
            }
        };
    }
}

module.exports = InteractSkill;
module.exports.setStores = setStores;
