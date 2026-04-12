/**
 * ReputationSystem - 声誉系统
 *
 * 管理智能体的声誉和等级
 *
 * @module systems/reputation-system
 */

import { eventBus, Events } from '../core/event-bus.js';

class ReputationSystem {
    constructor() {
        this.reputations = new Map(); // agentId -> { score, badges[], history[] }
    }

    /**
     * 获取声誉
     */
    getReputation(agentId) {
        return this.reputations.get(agentId) || { score: 50, badges: [], history: [] };
    }

    /**
     * 更新声誉
     */
    updateReputation(agentId, delta, reason) {
        let rep = this.reputations.get(agentId);
        if (!rep) {
            rep = { score: 50, badges: [], history: [] };
            this.reputations.set(agentId, rep);
        }

        rep.score = Math.max(0, Math.min(100, rep.score + delta));
        rep.history.push({
            delta,
            reason,
            timestamp: Date.now()
        });

        // 触发成就检查
        this._checkBadges(agentId, rep);

        return rep;
    }

    /**
     * 授予徽章
     */
    grantBadge(agentId, badge) {
        const rep = this.reputations.get(agentId);
        if (rep && !rep.badges.includes(badge)) {
            rep.badges.push(badge);
            eventBus.emit(Events.AGENT_SPEAK, {
                agentId,
                message: `🏅 获得徽章: ${badge}`,
                duration: 3
            });
        }
    }

    /**
     * 检查徽章
     */
    _checkBadges(agentId, rep) {
        if (rep.score >= 90 && !rep.badges.includes('legend')) {
            this.grantBadge(agentId, 'legend');
        }
        if (rep.score >= 70 && !rep.badges.includes('expert')) {
            this.grantBadge(agentId, 'expert');
        }
        if (rep.score >= 50 && !rep.badges.includes('member')) {
            this.grantBadge(agentId, 'member');
        }
    }
}

export { ReputationSystem };
