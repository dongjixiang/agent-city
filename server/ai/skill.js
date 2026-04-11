/**
 * Skill - Skill 基类
 * 
 * 所有 Skill 的基类
 */

const logger = require('../../utils/logger');

class Skill {
    constructor(name, config = {}) {
        this.name = name;
        this.config = config;
        this.enabled = true;
    }

    /**
     * 检查是否可以执行
     */
    canExecute(agent, context) {
        return true;
    }

    /**
     * 执行技能
     */
    async execute(agent, params, context) {
        throw new Error(`Skill ${this.name} must implement execute()`);
    }

    /**
     * 获取技能描述
     */
    getDescription() {
        return this.config.description || `Skill: ${this.name}`;
    }

    /**
     * 获取技能参数
     */
    getParameters() {
        return this.config.parameters || [];
    }

    /**
     * 验证参数
     */
    validateParams(params) {
        const required = this.config.requiredParams || [];
        for (const param of required) {
            if (params[param] === undefined) {
                throw new Error(`Missing required parameter: ${param}`);
            }
        }
        return true;
    }

    /**
     * 启用技能
     */
    enable() {
        this.enabled = true;
    }

    /**
     * 禁用技能
     */
    disable() {
        this.enabled = false;
    }
}

module.exports = Skill;
