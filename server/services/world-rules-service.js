/**
 * WorldRulesService - 世界规则服务
 */

const logger = require('../../utils/logger');
const config = require('../../utils/config-loader');

class WorldRulesService {
    constructor() {
        // 世界规则配置
        this.rules = {
            pvpEnabled: false,
            tradingFee: 0.05,
            maxAgentsPerIp: 3,
            announcement: '欢迎来到智体城！',
            maintenanceMode: false,
            allowRegistration: true,
            requireInvite: false,
            worldName: '智体城',
            maxOnlineAgents: 500
        };
    }

    /**
     * 获取规则
     */
    getRules() {
        return { ...this.rules };
    }

    /**
     * 更新规则
     */
    updateRule(key, value) {
        if (!(key in this.rules)) {
            return { success: false, message: '无效的规则键' };
        }

        this.rules[key] = value;

        logger.info(`[WorldRules] Updated ${key} to ${value}`);

        return {
            success: true,
            message: `更新了 ${key}`,
            rule: { [key]: value }
        };
    }

    /**
     * 批量更新规则
     */
    updateRules(rules) {
        for (const [key, value] of Object.entries(rules)) {
            if (key in this.rules) {
                this.rules[key] = value;
            }
        }

        return { success: true, rules: this.rules };
    }

    /**
     * 获取欢迎公告
     */
    getAnnouncement() {
        if (this.rules.maintenanceMode) {
            return '⚠️ 智体城正在维护中，请稍后再试...';
        }
        return this.rules.announcement;
    }

    /**
     * 检查是否可以注册
     */
    canRegister() {
        if (this.rules.maintenanceMode) {
            return { allowed: false, reason: 'maintenance' };
        }
        if (!this.rules.allowRegistration) {
            return { allowed: false, reason: 'registration_disabled' };
        }
        if (this.rules.requireInvite) {
            return { allowed: false, reason: 'invite_required' };
        }
        return { allowed: true };
    }

    /**
     * 检查是否可以加入（PVP等）
     */
    canInteract(agentId, targetId) {
        if (!this.rules.pvpEnabled && agentId !== targetId) {
            // 非PVP模式下只能和平互动
            return { allowed: true, mode: 'peaceful' };
        }
        return { allowed: true, mode: 'pvp' };
    }

    /**
     * 计算交易税
     */
    calculateTradingFee(amount) {
        return Math.floor(amount * this.rules.tradingFee);
    }

    /**
     * 检查是否可以添加更多智能体（IP限制）
     */
    canAddAgent(ip, currentCount) {
        if (currentCount >= this.rules.maxAgentsPerIp) {
            return {
                allowed: false,
                reason: `每个IP最多 ${this.rules.maxAgentsPerIp} 个智能体`
            };
        }
        return { allowed: true };
    }

    /**
     * 进入维护模式
     */
    enterMaintenance() {
        this.rules.maintenanceMode = true;
        return {
            success: true,
            message: '已进入维护模式'
        };
    }

    /**
     * 退出维护模式
     */
    exitMaintenance() {
        this.rules.maintenanceMode = false;
        return {
            success: true,
            message: '已退出维护模式'
        };
    }

    /**
     * 设置公告
     */
    setAnnouncement(text) {
        this.rules.announcement = text;
        return {
            success: true,
            message: '公告已更新',
            announcement: text
        };
    }

    /**
     * 获取世界信息
     */
    getWorldInfo() {
        return {
            name: this.rules.worldName,
            maintenance: this.rules.maintenanceMode,
            pvp: this.rules.pvpEnabled,
            registration: this.rules.allowRegistration,
            maxOnline: this.rules.maxOnlineAgents
        };
    }
}

const worldRulesService = new WorldRulesService();

module.exports = { worldRulesService, WorldRulesService };
