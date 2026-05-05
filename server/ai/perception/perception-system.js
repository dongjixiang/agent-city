/**
 * PerceptionSystem - 感知系统
 * 
 * 管理智能体的感知：视野、注意力、信息过滤
 */

const logger = require('../../utils/logger');
const config = require('../../utils/config-loader');

class PerceptionSystem {
    constructor() {
        this.visualRange = config.getValue('agents.default.perception.visualRange', 30);
        this.hearingRange = config.getValue('agents.default.perception.hearingRange', 15);
        this.interactionRange = config.getValue('agents.default.perception.interactionRange', 5);
    }

    /**
     * 获取智能体视野范围内的对象
     */
    getVisibleObjects(agent, allObjects) {
        if (!agent.position) return [];

        return allObjects.filter(obj => {
            const distance = this.calculateDistance(agent.position, obj.position || obj);
            return distance <= this.visualRange;
        });
    }

    /**
     * 获取视野范围内的智能体
     */
    getVisibleAgents(agent, allAgents) {
        if (!agent.position) return [];

        const visible = [];

        for (const other of allAgents) {
            if (other.agentId === agent.agentId) continue;
            if (!other.position) continue;

            const distance = this.calculateDistance(agent.position, other.position);

            if (distance <= this.visualRange) {
                visible.push({
                    ...other,
                    distance: Math.round(distance * 100) / 100
                });
            }
        }

        // 按距离排序
        visible.sort((a, b) => a.distance - b.distance);

        return visible;
    }

    /**
     * 获取可听到的声音
     */
    getAudibleSounds(agent, sounds) {
        if (!agent.position) return [];

        return sounds.filter(sound => {
            const distance = this.calculateDistance(agent.position, sound.position);
            return distance <= this.hearingRange;
        });
    }

    /**
     * 获取可交互的对象
     */
    getInteractableObjects(agent, objects) {
        if (!agent.position) return [];

        return objects.filter(obj => {
            const distance = this.calculateDistance(agent.position, obj.position);
            return distance <= this.interactionRange;
        });
    }

    /**
     * 计算距离
     */
    calculateDistance(pos1, pos2) {
        if (!pos1 || !pos2) return Infinity;

        const dx = pos1.x - pos2.x;
        const dz = pos1.z - pos2.z;

        return Math.sqrt(dx * dx + dz * dz);
    }

    /**
     * 计算注意力分数
     */
    calculateAttention(agent, target, baseAttention = 1.0) {
        if (!agent.position || !target.position) return 0;

        const distance = this.calculateDistance(agent.position, target.position);

        // 距离衰减
        const distanceFactor = Math.max(0, 1 - distance / this.visualRange);

        // 类型权重
        const typeWeights = {
            agent: 1.5,
            building: 1.2,
            animal: 1.3,
            decoration: 0.8
        };

        const typeWeight = typeWeights[target.type] || 1.0;

        // 移动中物体的权重更高
        const movementBonus = target.velocity ? 0.2 : 0;

        // 综合注意力分数
        const attention = baseAttention * distanceFactor * typeWeight + movementBonus;

        return Math.round(attention * 100) / 100;
    }

    /**
     * 过滤相关信息（用于减少 Prompt token）
     */
    filterRelevantInformation(agent, worldState, options = {}) {
        const {
            maxAgents = 5,
            maxBuildings = 3,
            maxDecorations = 5,
            maxDistance = 50
        } = options;

        const result = {
            nearbyAgents: [],
            nearbyBuildings: [],
            nearbyDecorations: [],
            sounds: []
        };

        if (!agent.position) return result;

        // 智能体
        if (worldState.agents) {
            const visibleAgents = this.getVisibleAgents(agent, worldState.agents);
            result.nearbyAgents = visibleAgents
                .slice(0, maxAgents)
                .map(a => ({
                    name: a.name,
                    type: a.type,
                    distance: a.distance,
                    state: a.state,
                    mood: a.mood
                }));
        }

        // 建筑
        if (worldState.buildings) {
            const visibleBuildings = this.getVisibleObjects(agent, worldState.buildings);
            result.nearbyBuildings = visibleBuildings
                .filter(b => b.distance <= maxDistance)
                .slice(0, maxBuildings)
                .map(b => ({
                    name: b.name,
                    type: b.type,
                    distance: Math.round(b.distance)
                }));
        }

        // 装饰物
        if (worldState.decorations) {
            const visibleDecorations = this.getVisibleObjects(agent, worldState.decorations);
            result.nearbyDecorations = visibleDecorations
                .filter(d => d.distance <= maxDistance)
                .slice(0, maxDecorations)
                .map(d => ({
                    name: d.name,
                    type: d.decorationType,
                    distance: Math.round(d.distance)
                }));
        }

        // 声音
        if (worldState.sounds) {
            result.sounds = this.getAudibleSounds(agent, worldState.sounds);
        }

        return result;
    }

    /**
     * 获取方向描述
     */
    getDirectionDescription(fromPos, toPos) {
        if (!fromPos || !toPos) return '未知方向';

        const dx = toPos.x - fromPos.x;
        const dz = toPos.z - fromPos.z;

        const directions = [];

        if (Math.abs(dx) > Math.abs(dz)) {
            directions.push(dx > 0 ? '东' : '西');
        } else {
            directions.push(dz > 0 ? '南' : '北');
        }

        if (Math.abs(dx) > 5 && Math.abs(dz) > 5) {
            directions.push(dx > 0 ? '偏东' : '偏西');
        }

        return directions.join('') || '这里';
    }
}

module.exports = PerceptionSystem;
