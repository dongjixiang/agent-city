/**
 * NeedsSystem - 需求系统
 * 
 * 管理智能体的基本需求：能量、社交、成就、安全等
 */

const logger = require('../../utils/logger');
const config = require('../../utils/config-loader');

class NeedsSystem {
    constructor() {
        // 加载默认配置
        const defaultNeeds = config.get('agents.default.needs', {});
        
        this.needsConfig = {
            energy: {
                initial: defaultNeeds.energy?.initial || 80,
                decayRate: defaultNeeds.energy?.decayRate || 0.1,
                recoverRate: defaultNeeds.energy?.recoverRate || 0.5,
                criticalThreshold: 20
            },
            social: {
                initial: defaultNeeds.social?.initial || 50,
                decayRate: defaultNeeds.social?.decayRate || 0.2,
                criticalThreshold: 20
            },
            achievement: {
                initial: defaultNeeds.achievement?.initial || 40,
                decayRate: defaultNeeds.achievement?.decayRate || 0.1,
                criticalThreshold: 15
            },
            hunger: {
                initial: defaultNeeds.hunger?.initial || 70,
                decayRate: defaultNeeds.hunger?.decayRate || 0.05,
                criticalThreshold: 20
            },
            security: {
                initial: defaultNeeds.security?.initial || 70,
                decayRate: defaultNeeds.security?.decayRate || 0.05,
                criticalThreshold: 20
            },
            fun: {
                initial: defaultNeeds.fun?.initial || 60,
                decayRate: defaultNeeds.fun?.decayRate || 0.15,
                criticalThreshold: 15
            }
        };
    }

    /**
     * 初始化需求
     */
    initializeNeeds() {
        const needs = {};

        for (const [name, config] of Object.entries(this.needsConfig)) {
            needs[name] = {
                value: config.initial,
                lastUpdate: Date.now()
            };
        }

        return needs;
    }

    /**
     * 更新需求（衰减）
     */
    updateNeeds(agent, deltaMs) {
        const needs = agent.needs || this.initializeNeeds();
        const deltaMinutes = deltaMs / 60000;

        for (const [name, config] of Object.entries(this.needsConfig)) {
            if (!needs[name]) {
                needs[name] = { value: config.initial, lastUpdate: Date.now() };
            }

            const need = needs[name];
            const elapsed = deltaMinutes;

            // 根据状态调整衰减
            let decayRate = config.decayRate;

            // 休息时能量恢复
            if (name === 'energy' && agent.state === 'resting') {
                need.value = Math.min(100, need.value + config.recoverRate * elapsed);
            } else {
                need.value -= decayRate * elapsed;
            }

            // 社交时社交需求恢复
            if (name === 'social' && agent.state === 'talking') {
                need.value = Math.min(100, need.value + 0.5 * elapsed);
            }

            // 边界限制
            need.value = Math.max(0, Math.min(100, need.value));

            need.lastUpdate = Date.now();
        }

        return needs;
    }

    /**
     * 满足需求
     */
    satisfyNeed(needs, needName, amount) {
        if (!needs[needName]) return needs;

        needs[needName].value = Math.min(100, needs[needName].value + amount);

        return needs;
    }

    /**
     * 获取最紧急的需求
     */
    getMostUrgentNeed(needs) {
        let urgent = null;
        let minValue = Infinity;

        for (const [name, config] of Object.entries(this.needsConfig)) {
            const need = needs[name];
            if (!need) continue;

            if (need.value < minValue) {
                minValue = need.value;
                urgent = {
                    name,
                    value: need.value,
                    critical: need.value < config.criticalThreshold
                };
            }
        }

        return urgent;
    }

    /**
     * 获取需求满足度
     */
    getNeedsSatisfaction(needs) {
        const satisfaction = {};

        for (const [name, config] of Object.entries(this.needsConfig)) {
            const need = needs[name];
            satisfaction[name] = {
                value: need?.value ?? config.initial,
                status: this.getNeedStatus(need?.value ?? config.initial, config.criticalThreshold)
            };
        }

        return satisfaction;
    }

    /**
     * 获取需求状态描述
     */
    getNeedStatus(value, criticalThreshold) {
        if (value >= 80) return 'satisfied';
        if (value >= criticalThreshold) return 'neutral';
        if (value >= 10) return 'deprived';
        return 'critical';
    }

    /**
     * 生成需求描述（用于 AI Prompt）
     */
    generateNeedsDescription(needs) {
        const lines = [];

        for (const [name, config] of Object.entries(this.needsConfig)) {
            const need = needs[name];
            if (!need) continue;

            const status = this.getNeedStatus(need.value, config.criticalThreshold);

            if (status === 'critical') {
                lines.push(`⚠️ ${this.getNeedNameCN(name)}: ${Math.round(need.value)}/100 (危急!)`);
            } else if (status === 'deprived') {
                lines.push(`🔴 ${this.getNeedNameCN(name)}: ${Math.round(need.value)}/100 (需要满足)`);
            } else if (status === 'neutral') {
                lines.push(`🟡 ${this.getNeedNameCN(name)}: ${Math.round(need.value)}/100`);
            } else {
                lines.push(`🟢 ${this.getNeedNameCN(name)}: ${Math.round(need.value)}/100`);
            }
        }

        return lines.join('\n');
    }

    /**
     * 获取需求名称（中文）
     */
    getNeedNameCN(name) {
        const names = {
            energy: '精力',
            social: '社交',
            achievement: '成就',
            hunger: '饥饿',
            security: '安全',
            fun: '娱乐'
        };
        return names[name] || name;
    }

    /**
     * 决定下一步行动的建议
     */
    suggestAction(needs, agent) {
        const urgent = this.getMostUrgentNeed(needs);

        if (!urgent) return null;

        const suggestions = {
            energy: {
                skill: 'rest',
                params: { duration: 10 },
                reason: '精力不足，需要休息'
            },
            social: {
                skill: 'talk_to',
                params: { targetName: null }, // 需要 AI 选择
                reason: '社交需求未满足，需要和其他智能体交流'
            },
            achievement: {
                skill: 'task',
                params: { action: 'list' },
                reason: '成就需求未满足，建议做任务'
            },
            hunger: {
                skill: 'interact',
                params: { targetType: 'decoration', targetId: 'food', action: 'eat' },
                reason: '饥饿，需要找食物'
            },
            security: {
                skill: 'explore',
                params: { range: 30 },
                reason: '安全感不足，探索周围环境'
            },
            fun: {
                skill: 'explore',
                params: { range: 50 },
                reason: '无聊，探索世界找点乐子'
            }
        };

        const suggestion = suggestions[urgent.name];

        if (urgent.critical) {
            return suggestion;
        }

        // 非紧急：根据当前状态建议
        if (agent.state === 'idle' && urgent.value < 50) {
            return suggestion;
        }

        return null;
    }
}

module.exports = NeedsSystem;
