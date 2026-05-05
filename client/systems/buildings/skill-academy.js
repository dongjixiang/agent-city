/**
 * SkillAcademy - 技能学院
 *
 * 学习技能、技能升级、练习
 *
 * @module systems/buildings/skill-academy
 */

import { Building } from './building.js';

class SkillAcademy extends Building {
    constructor(position) {
        super(
            'skill_academy',
            '技能学院',
            position,
            {
                services: ['learn_skill', 'upgrade_skill', 'practice'],
                requirements: { minReputation: 15 }
            }
        );

        // 可学习的技能
        this.availableSkills = [
            { id: 'swift_move', name: '快速移动', description: '移动速度 +50%', cost: 30, level: 1 },
            { id: 'social_boost', name: '社交加成', description: '社交需求下降速度 -50%', cost: 25, level: 1 },
            { id: 'energy_saver', name: '节能技巧', description: '精力消耗 -30%', cost: 35, level: 1 },
            { id: 'memory_plus', name: '增强记忆', description: '记忆容量翻倍', cost: 40, level: 1 }
        ];

        // 已学技能
        this.learnedSkills = new Map(); // agentId -> Skill[]
    }

    /**
     * 获取智能体已学技能
     */
    _getLearnedSkills(agentId) {
        if (!this.learnedSkills.has(agentId)) {
            this.learnedSkills.set(agentId, []);
        }
        return this.learnedSkills.get(agentId);
    }

    /**
     * 服务：学习技能
     */
    service_learn_skill(agent, params) {
        const { skillId } = params || {};

        if (!skillId) {
            // 返回可学习技能列表
            const learned = this._getLearnedSkills(agent.id).map(s => s.id);
            const available = this.availableSkills
                .filter(s => !learned.includes(s.id))
                .map(s => ({
                    id: s.id,
                    name: s.name,
                    description: s.description,
                    cost: s.cost
                }));

            return {
                success: true,
                available,
                learned: learned.length,
                message: `技能学院提供 ${available.length} 种技能可学习`
            };
        }

        const skill = this.availableSkills.find(s => s.id === skillId);
        if (!skill) {
            return { success: false, message: `未知技能：${skillId}` };
        }

        const learned = this._getLearnedSkills(agent.id);
        if (learned.some(s => s.id === skillId)) {
            return { success: false, message: `你已经学会「${skill.name}」` };
        }

        if (agent.reputation < skill.cost) {
            return {
                success: false,
                message: `学习「${skill.name}」需要 ⭐${skill.cost}，你只有 ⭐${agent.reputation}`
            };
        }

        agent.reputation -= skill.cost;
        learned.push({ ...skill, learnedAt: Date.now() });

        return {
            success: true,
            skill: skill.name,
            cost: skill.cost,
            message: `📚 成功学习「${skill.name}」！${skill.description}`
        };
    }

    /**
     * 服务：升级技能
     */
    service_upgrade_skill(agent, params) {
        const { skillId } = params || {};

        const learned = this._getLearnedSkills(agent.id);

        if (!skillId) {
            // 返回已学技能列表
            return {
                success: true,
                skills: learned.map(s => ({
                    id: s.id,
                    name: s.name,
                    level: s.level
                })),
                message: `你已学习 ${learned.length} 个技能`
            };
        }

        const skill = learned.find(s => s.id === skillId);
        if (!skill) {
            return { success: false, message: '你尚未学习该技能' };
        }

        if (skill.level >= 3) {
            return { success: false, message: '该技能已达到最高等级' };
        }

        const upgradeCost = skill.cost * skill.level;
        if (agent.reputation < upgradeCost) {
            return {
                success: false,
                message: `升级「${skill.name}」需要 ⭐${upgradeCost}，你只有 ⭐${agent.reputation}`
            };
        }

        agent.reputation -= upgradeCost;
        skill.level++;

        return {
            success: true,
            skill: skill.name,
            newLevel: skill.level,
            cost: upgradeCost,
            message: `⬆️ 「${skill.name}」升级到 Lv.${skill.level}！`
        };
    }

    /**
     * 服务：练习
     */
    service_practice(agent, params) {
        const { skillId } = params || {};

        const learned = this._getLearnedSkills(agent.id);

        if (!skillId) {
            return {
                success: true,
                skills: learned.map(s => ({
                    id: s.id,
                    name: s.name,
                    level: s.level
                })),
                message: '请指定要练习的技能 ID'
            };
        }

        const skill = learned.find(s => s.id === skillId);
        if (!skill) {
            return { success: false, message: '你尚未学习该技能' };
        }

        // 练习消耗时间但获得少量声誉
        const xpGain = 5 * skill.level;
        agent.reputation += xpGain;

        return {
            success: true,
            skill: skill.name,
            xpGain,
            message: `🏋️ 练习「${skill.name}」成功，获得 ⭐${xpGain}`
        };
    }
}

export { SkillAcademy };
