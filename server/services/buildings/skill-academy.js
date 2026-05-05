/**
 * SkillAcademy - 技能学院
 * 
 * 提供技能学习、升级服务
 */

const BuildingBase = require('./building-base');
const logger = require('../../utils/logger');

// Store 依赖
let agentStore = null;
let skillRegistry = null;

// 可学习技能定义
const learnableSkills = [
    {
        id: 'swimming',
        name: '游泳',
        description: '可以穿越水域',
        cost: 500,
        level: 1
    },
    {
        id: 'climbing',
        name: '攀爬',
        description: '可以攀爬高墙',
        cost: 500,
        level: 1
    },
    {
        id: 'tracking',
        name: '追踪',
        description: '更容易找到其他智能体',
        cost: 1000,
        level: 2
    },
    {
        id: 'stealth',
        name: '潜行',
        description: '降低被其他智能体注意的概率',
        cost: 1500,
        level: 3
    },
    {
        id: 'trading_expert',
        name: '交易专家',
        description: '在交易市场获得更好的价格',
        cost: 2000,
        level: 3
    },
    {
        id: 'nature_speak',
        name: '自然之语',
        description: '可以和动物交流',
        cost: 3000,
        level: 5
    }
];

function setStores(stores) {
    agentStore = stores.agentStore;
}

class SkillAcademy extends BuildingBase {
    constructor(config) {
        super('skill_academy', {
            name: '技能学院',
            description: '学习新技能、提升技能等级的地方',
            position: config?.position || { x: 0, z: 35 },
            type: 'skill',
            services: ['available_skills', 'learn_skill', 'upgrade_skill', 'practice'],
            requirements: {
                minReputation: 50,
                unlocked: true
            }
        });
    }

    /**
     * 可用技能
     */
    async service_available_skills(agent, params, context) {
        const agentSkills = agent.skills || [];

        return {
            success: true,
            available: learnableSkills.map(s => ({
                id: s.id,
                name: s.name,
                description: s.description,
                cost: s.cost,
                requiredLevel: s.level,
                learned: agentSkills.includes(s.id),
                canLearn: agent.reputation >= 50 && !agentSkills.includes(s.id)
            }))
        };
    }

    /**
     * 学习技能
     */
    async service_learn_skill(agent, params, context) {
        const { skillId } = params;

        if (!skillId) {
            return { success: false, message: '需要指定技能' };
        }

        const skill = learnableSkills.find(s => s.id === skillId);
        if (!skill) {
            return { success: false, message: '技能不存在' };
        }

        const agentSkills = agent.skills || [];

        if (agentSkills.includes(skillId)) {
            return { success: false, message: '已学习该技能' };
        }

        if ((agent.coins || 0) < skill.cost) {
            return { success: false, message: `需要 ${skill.cost} 金币` };
        }

        if (agent.reputation < 50) {
            return { success: false, message: '需要至少50点声誉' };
        }

        // 扣除金币
        await agentStore.updateCoins(agent.agentId, -skill.cost);

        // 添加技能
        const newSkills = [...agentSkills, skillId];
        await agentStore.update(agent.agentId, { skills: newSkills });

        return {
            success: true,
            message: `学会了 ${skill.name}！`,
            skill: {
                id: skill.id,
                name: skill.name
            }
        };
    }

    /**
     * 升级技能
     */
    async service_upgrade_skill(agent, params, context) {
        const { skillId } = params;

        if (!skillId) {
            return { success: false, message: '需要指定技能' };
        }

        const agentSkills = agent.skills || [];
        if (!agentSkills.includes(skillId)) {
            return { success: false, message: '未学习该技能' };
        }

        const skill = learnableSkills.find(s => s.id === skillId);
        if (!skill) {
            return { success: false, message: '技能不存在' };
        }

        // 获取当前技能等级（暂用 agent.skillLevels）
        const skillLevels = agent.skillLevels || {};
        const currentLevel = skillLevels[skillId] || 1;
        const maxLevel = 5;

        if (currentLevel >= maxLevel) {
            return { success: false, message: '已达到最大等级' };
        }

        // 升级费用
        const upgradeCost = skill.cost * currentLevel;

        if ((agent.coins || 0) < upgradeCost) {
            return { success: false, message: `需要 ${upgradeCost} 金币` };
        }

        // 扣除金币
        await agentStore.updateCoins(agent.agentId, -upgradeCost);

        // 更新等级
        const newLevels = { ...skillLevels, [skillId]: currentLevel + 1 };
        await agentStore.update(agent.agentId, { skillLevels: newLevels });

        return {
            success: true,
            message: `${skill.name} 升级到 ${currentLevel + 1} 级！`,
            newLevel: currentLevel + 1
        };
    }

    /**
     * 练习技能
     */
    async service_practice(agent, params, context) {
        const { skillId } = params;

        const agentSkills = agent.skills || [];
        const skillLevels = agent.skillLevels || {};

        if (skillId && !agentSkills.includes(skillId)) {
            return { success: false, message: '未学习该技能' };
        }

        // 练习所有已学技能或指定技能
        const toPractice = skillId ? [skillId] : agentSkills;

        if (toPractice.length === 0) {
            return { success: false, message: '没有可练习的技能' };
        }

        // 练习获得熟练度（简化：增加一点经验）
        const newLevels = { ...skillLevels };

        for (const sid of toPractice) {
            newLevels[sid] = (newLevels[sid] || 1) + 0.1;
            // 限制最大等级
            if (newLevels[sid] > 5) newLevels[sid] = 5;
        }

        await agentStore.update(agent.agentId, { skillLevels: newLevels });

        return {
            success: true,
            message: `练习了 ${toPractice.length} 个技能`,
            skillLevels: newLevels
        };
    }
}

// 导出
const skillAcademy = new SkillAcademy({
    position: { x: 0, z: 35 }
});

module.exports = {
    SkillAcademy,
    skillAcademy,
    setStores
};
