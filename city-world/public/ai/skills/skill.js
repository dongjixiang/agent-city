/**
 * Skill - 技能基类
 *
 * 所有技能的基类
 *
 * @module ai/skills/skill
 */

/**
 * 技能基类
 */
class Skill {
    constructor(name, description, params = []) {
        this.name = name;
        this.description = description;
        this.params = params; // [{ name, type, required, default }]
        this.cooldown = 0; // 秒
        this.lastUsed = 0; // 时间戳
    }

    /**
     * 检查是否可以执行
     */
    canExecute(agent) {
        if (this.cooldown > 0) {
            const elapsed = (Date.now() - this.lastUsed) / 1000;
            if (elapsed < this.cooldown) {
                return { ready: false, reason: `冷却中 (${(this.cooldown - elapsed).toFixed(1)}秒)` };
            }
        }
        return { ready: true };
    }

    /**
     * 执行技能
     * @param {Agent} agent
     * @param {Object} params
     * @returns {Object} { success, message }
     */
    execute(agent, params = {}) {
        const check = this.canExecute(agent);
        if (!check.ready) {
            return { success: false, message: check.reason };
        }

        const result = this.onExecute(agent, params);
        this.lastUsed = Date.now();
        return result;
    }

    /**
     * 技能执行逻辑（子类实现）
     */
    onExecute(agent, params) {
        throw new Error(`Skill ${this.name} must implement onExecute()`);
    }

    /**
     * 验证参数
     */
    validateParams(params) {
        for (const p of this.params) {
            if (p.required && !(p.name in params)) {
                return { valid: false, missing: p.name };
            }
        }
        return { valid: true };
    }

    /**
     * 获取参数默认值
     */
    getDefaultParams() {
        const defaults = {};
        for (const p of this.params) {
            if (p.default !== undefined) {
                defaults[p.name] = p.default;
            }
        }
        return defaults;
    }
}

export { Skill };
