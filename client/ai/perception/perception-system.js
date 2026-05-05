/**
 * PerceptionSystem - 感知系统
 *
 * 管理智能体的感知能力
 *
 * @module ai/perception/perception-system
 */

import { SpatialIndex } from '../../core/spatial-index.js';

class PerceptionSystem {
    constructor() {
        this.spatialIndex = null;
    }

    /**
     * 设置空间索引
     */
    setSpatialIndex(index) {
        this.spatialIndex = index;
    }

    /**
     * 更新智能体感知
     */
    update(agent, deltaTime) {
        if (!this.spatialIndex) return;

        // 更新视野范围内的对象
        agent._perceptionCache = this.getVisibleObjects(agent);
    }

    /**
     * 获取智能体可见的对象
     */
    getVisibleObjects(agent) {
        if (!this.spatialIndex) return [];

        const range = agent.visionRange || 15;
        return this.spatialIndex.queryRadius(
            agent.position.x, 0, agent.position.z, range
        );
    }

    /**
     * 获取视野范围内的智能体
     */
    getVisibleAgents(agent) {
        return this.getVisibleObjects(agent)
            .filter(e => e.object.type === 'agent' && e.object.id !== agent.id)
            .map(e => ({
                agent: e.object,
                distance: e.distance,
                position: e.position
            }));
    }

    /**
     * 获取最近的物体
     */
    getNearestObjects(agent, type, maxDistance = 10) {
        return this.getVisibleObjects(agent)
            .filter(e => e.object.type === type && e.distance <= maxDistance)
            .sort((a, b) => a.distance - b.distance);
    }
}

export { PerceptionSystem };
