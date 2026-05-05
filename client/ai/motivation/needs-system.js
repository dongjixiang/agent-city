/**
 * NeedsSystem - 需求/动机系统
 *
 * 管理智能体的需求（能量、社交、娱乐、成就）
 *
 * @module ai/motivation/needs-system
 */

import { eventBus, Events } from '../../core/event-bus.js';

const NeedType = {
    ENERGY: 'energy',
    SOCIAL: 'social',
    FUN: 'fun',
    ACHIEVEMENT: 'achievement'
};

class NeedsSystem {
    constructor() {
        // 需求衰减速率（每秒）
        this.decayRates = {
            energy: 0.1,
            social: 0.05,
            fun: 0.02,
            achievement: 0.01
        };
    }

    /**
     * 更新需求状态
     */
    update(agent, deltaTime) {
        const rate = deltaTime;

        // 衰减需求
        for (const [need, decay] of Object.entries(this.decayRates)) {
            if (agent.needs[need] !== undefined) {
                agent.needs[need] = Math.max(0, agent.needs[need] - decay * rate);
            }
        }

        // 检查紧急需求
        this._checkUrgentNeeds(agent);
    }

    /**
     * 满足需求
     */
    satisfy(agent, needType, amount) {
        if (agent.needs[needType] !== undefined) {
            agent.needs[needType] = Math.min(100, agent.needs[needType] + amount);
        }
    }

    /**
     * 检查紧急需求
     */
    _checkUrgentNeeds(agent) {
        const urgent = [];

        if (agent.needs.energy < 20) {
            urgent.push({ type: 'energy', level: agent.needs.energy, message: '需要休息！' });
        }
        if (agent.needs.social < 15) {
            urgent.push({ type: 'social', level: agent.needs.social, message: '需要社交！' });
        }

        if (urgent.length > 0 && !agent._lastUrgentWarning || Date.now() - agent._lastUrgentWarning > 30000) {
            agent._lastUrgentWarning = Date.now();
            eventBus.emit(Events.AGENT_THINK, {
                agentId: agent.id,
                message: urgent[0].message
            });
        }
    }

    /**
     * 获取最紧急的需求
     */
    getMostUrgentNeed(agent) {
        let min = { type: null, value: Infinity };
        for (const [need, value] of Object.entries(agent.needs)) {
            if (value < min.value) {
                min = { type: need, value };
            }
        }
        return min;
    }
}

export { NeedsSystem, NeedType };
