/**
 * SkillRegistry - 技能注册表
 * 
 * 管理所有可用技能
 */

const logger = require('../utils/logger');

class SkillRegistry {
    constructor() {
        this.skills = new Map(); // name -> Skill
        this.categories = new Map(); // category -> [skillNames]
    }

    /**
     * 注册技能
     */
    register(skill, category = 'general') {
        if (typeof skill === 'function') {
            skill = new skill();
        }

        if (!skill.name) {
            throw new Error('Skill must have a name');
        }

        this.skills.set(skill.name, skill);

        // 添加到分类
        if (!this.categories.has(category)) {
            this.categories.set(category, []);
        }
        this.categories.get(category).push(skill.name);

        logger.debug(`[SkillRegistry] Registered skill: ${skill.name} (${category})`);

        return this;
    }

    /**
     * 批量注册
     */
    registerAll(skills, category = 'general') {
        for (const skill of skills) {
            this.register(skill, category);
        }
        return this;
    }

    /**
     * 获取技能
     */
    get(name) {
        return this.skills.get(name);
    }

    /**
     * 获取所有技能
     */
    getAll() {
        return Array.from(this.skills.values());
    }

    /**
     * 获取某类别的技能
     */
    getByCategory(category) {
        const names = this.categories.get(category) || [];
        return names.map(name => this.skills.get(name)).filter(Boolean);
    }

    /**
     * 获取所有类别
     */
    getCategories() {
        return Array.from(this.categories.keys());
    }

    /**
     * 检查技能是否存在
     */
    has(name) {
        return this.skills.has(name);
    }

    /**
     * 移除技能
     */
    remove(name) {
        const skill = this.skills.get(name);
        if (skill) {
            this.skills.delete(name);
            logger.debug(`[SkillRegistry] Removed skill: ${name}`);
        }
        return this;
    }

    /**
     * 启用技能
     */
    enable(name) {
        const skill = this.skills.get(name);
        if (skill) {
            skill.enable();
        }
        return this;
    }

    /**
     * 禁用技能
     */
    disable(name) {
        const skill = this.skills.get(name);
        if (skill) {
            skill.disable();
        }
        return this;
    }

    /**
     * 获取可执行技能列表
     */
    getExecutableSkills(agent, context) {
        const skills = [];

        for (const skill of this.skills.values()) {
            if (!skill.enabled) continue;
            if (skill.canExecute(agent, context)) {
                skills.push({
                    name: skill.name,
                    description: skill.getDescription(),
                    parameters: skill.getParameters()
                });
            }
        }

        return skills;
    }

    /**
     * 执行技能
     */
    async execute(name, agent, params, context) {
        const skill = this.skills.get(name);

        if (!skill) {
            throw new Error(`Skill not found: ${name}`);
        }

        if (!skill.enabled) {
            throw new Error(`Skill is disabled: ${name}`);
        }

        // 验证参数
        skill.validateParams(params);

        // 检查是否可以执行
        if (!skill.canExecute(agent, context)) {
            throw new Error(`Skill cannot be executed now: ${name}`);
        }

        logger.debug(`[SkillRegistry] Executing skill: ${name}`, { agent: agent.agentId, params });

        try {
            const result = await skill.execute(agent, params, context);
            logger.debug(`[SkillRegistry] Skill executed: ${name}`, { result });
            return result;
        } catch (err) {
            logger.error(`[SkillRegistry] Skill execution failed: ${name}`, { error: err.message });
            throw err;
        }
    }

    /**
     * 导出技能列表（用于 AI Prompt）
     */
    exportForPrompt() {
        const lines = [];

        for (const [category, names] of this.categories) {
            lines.push(`\n## ${category} 技能:`);
            for (const name of names) {
                const skill = this.skills.get(name);
                if (skill && skill.enabled) {
                    lines.push(`- ${skill.name}: ${skill.getDescription()}`);
                }
            }
        }

        return lines.join('\n');
    }
}

// 全局注册表
const skillRegistry = new SkillRegistry();

module.exports = {
    SkillRegistry,
    skillRegistry
};
