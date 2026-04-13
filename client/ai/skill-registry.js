/**
 * SkillRegistry - 技能注册表
 *
 * 管理所有可用技能
 *
 * @module ai/skill-registry
 */

import { Skill } from './skills/skill.js';

/**
 * 技能注册表
 */
class SkillRegistry {
    constructor() {
        this.skills = new Map(); // name -> Skill instance
        this._registerBuiltinSkills();
    }

    /**
     * 注册技能
     */
    register(skill) {
        if (skill instanceof Skill) {
            this.skills.set(skill.name, skill);
        } else if (typeof skill === 'function') {
            // 构造函数
            const instance = new skill();
            this.skills.set(instance.name, instance);
        }
    }

    /**
     * 获取技能
     */
    getSkill(name) {
        return this.skills.get(name) || null;
    }

    /**
     * 获取所有技能
     */
    getAllSkills() {
        return Array.from(this.skills.values());
    }

    /**
     * 获取技能描述
     */
    getSkillDescriptions() {
        return this.getAllSkills().map(s => ({
            name: s.name,
            description: s.description,
            params: s.params
        }));
    }

    /**
     * 注册内置技能
     */
    _registerBuiltinSkills() {
        // Built-in skills are loaded asynchronously in init()
    }

    /**
     * 异步初始化（加载内置技能）
     */
    async init() {
        try {
            const modules = await Promise.all([
                import('./skills/move-to.js'),
                import('./skills/talk-to.js'),
                import('./skills/task.js'),
                import('./skills/rest.js'),
                import('./skills/explore.js'),
                import('./skills/interact-world.js'),
                import('./skills/building.js')
            ]);

            modules.forEach(mod => {
                if (mod.Skill) {
                    this.register(mod.Skill);
                } else if (mod.default) {
                    this.register(mod.default);
                }
            });

            console.log(`[SkillRegistry] Loaded ${this.skills.size} skills`);
        } catch (err) {
            console.warn('[SkillRegistry] Failed to load builtin skills:', err);
        }
    }
}

// 全局单例
const skillRegistry = new SkillRegistry();

export { SkillRegistry, skillRegistry };
