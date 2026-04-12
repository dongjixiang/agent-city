/**
 * RelationshipSystem - 关系系统
 *
 * 管理智能体之间的关系（熟悉度、信任度等）
 *
 * @module systems/relationship-system
 */

class RelationshipSystem {
    constructor() {
        // agentId -> { otherId -> Relationship }
        this.relationships = new Map();
    }

    /**
     * 获取关系
     */
    getRelationship(agentId, otherId) {
        const key = this._getKey(agentId, otherId);
        return this.relationships.get(key) || {
            familiarity: 0,
            trust: 0,
            lastInteraction: null
        };
    }

    /**
     * 更新关系
     */
    updateRelationship(agentId, otherId, delta) {
        const key = this._getKey(agentId, otherId);
        let rel = this.relationships.get(key);

        if (!rel) {
            rel = { familiarity: 0, trust: 0 };
            this.relationships.set(key, rel);
        }

        if (delta.type === 'positive') {
            rel.familiarity = Math.min(100, rel.familiarity + (delta.familiarity || 5));
            rel.trust = Math.min(100, rel.trust + (delta.trust || 3));
        } else if (delta.type === 'negative') {
            rel.familiarity = Math.max(0, rel.familiarity - (delta.familiarity || 10));
            rel.trust = Math.max(0, rel.trust - (delta.trust || 5));
        }

        rel.lastInteraction = Date.now();
        return rel;
    }

    /**
     * 获取键
     */
    _getKey(a, b) {
        return [a, b].sort().join(':');
    }

    /**
     * 获取智能体的所有关系
     */
    getAllRelationships(agentId) {
        const result = [];
        for (const [key, rel] of this.relationships) {
            if (key.includes(agentId)) {
                const otherId = key.replace(agentId, '').replace(':', '');
                result.push({ agentId: otherId, ...rel });
            }
        }
        return result;
    }
}

export { RelationshipSystem };
