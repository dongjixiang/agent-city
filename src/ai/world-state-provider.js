/**
 * WorldStateProvider - 世界状态提供者
 *
 * 为 AI 决策提供世界状态的实时快照
 *
 * @module ai/world-state-provider
 */

import { SpatialIndex } from '../core/spatial-index.js';

class WorldStateProvider {
    constructor() {
        this.spatialIndex = null;
        this.worldBounds = { minX: -100, maxX: 100, minY: 0, maxY: 60, minZ: -100, maxZ: 100 };
    }

    /**
     * 设置空间索引
     */
    setSpatialIndex(index) {
        this.spatialIndex = index;
    }

    /**
     * 获取智能体视野范围内的世界状态
     */
    getStateForAgent(agent) {
        if (!this.spatialIndex) {
            return this._getFallbackState();
        }

        const range = agent.visionRange || 15;
        const nearby = this.spatialIndex.queryRadius(
            agent.position.x, 0, agent.position.z, range
        );

        return {
            agent: {
                id: agent.id,
                name: agent.name,
                position: { ...agent.position },
                state: agent.state,
                emotion: agent.emotion,
                needs: { ...agent.needs }
            },
            nearbyAgents: nearby
                .filter(e => e.object.type === 'agent' && e.object.id !== agent.id)
                .map(e => ({
                    id: e.object.id,
                    name: e.object.name,
                    position: { ...e.object.position },
                    distance: e.distance,
                    emotion: e.object.emotion
                })),
            nearbyObjects: nearby
                .filter(e => e.object.type !== 'agent')
                .map(e => ({
                    id: e.object.id,
                    type: e.object.type,
                    position: { ...e.object.position },
                    distance: e.distance
                })),
            timestamp: Date.now()
        };
    }

    /**
     * 获取完整世界状态
     */
    getFullWorldState() {
        if (!this.spatialIndex) return {};
        return {
            bounds: this.worldBounds,
            objectCount: this.spatialIndex.getStats().totalObjects,
            timestamp: Date.now()
        };
    }

    /**
     * 降级状态（无空间索引时）
     */
    _getFallbackState() {
        return {
            agent: null,
            nearbyAgents: [],
            nearbyObjects: [],
            timestamp: Date.now()
        };
    }
}

// 全局单例
const worldStateProvider = new WorldStateProvider();

export { WorldStateProvider, worldStateProvider };
