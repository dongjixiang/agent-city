/**
 * AgentRegistry - 身份注册表
 *
 * 管理所有智能体的身份信息
 *
 * @module ai/identity/agent-registry
 */

class AgentRegistry {
    constructor() {
        // id -> { id, name, tags, reputation, createdAt, lastSeen }
        this.agents = new Map();
    }

    /**
     * 注册智能体
     */
    register(agentData) {
        const entry = {
            id: agentData.id,
            name: agentData.name || `Agent_${agentData.id}`,
            tags: agentData.tags || [],
            reputation: agentData.reputation || 50,
            createdAt: Date.now(),
            lastSeen: Date.now()
        };

        this.agents.set(entry.id, entry);
        return entry;
    }

    /**
     * 注销智能体
     */
    unregister(agentId) {
        this.agents.delete(agentId);
    }

    /**
     * 获取智能体信息
     */
    get(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.lastSeen = Date.now();
        }
        return agent;
    }

    /**
     * 获取所有在线智能体
     */
    getAllOnline() {
        return Array.from(this.agents.values())
            .filter(a => Date.now() - a.lastSeen < 300000); // 5分钟内活跃
    }

    /**
     * 更新声誉
     */
    updateReputation(agentId, delta) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.reputation = Math.max(0, Math.min(100, agent.reputation + delta));
        }
    }

    /**
     * 搜索智能体
     */
    search(query, limit = 10) {
        const q = query.toLowerCase();
        return Array.from(this.agents.values())
            .filter(a => a.name.toLowerCase().includes(q) || a.tags.some(t => t.includes(q)))
            .slice(0, limit);
    }
}

// 全局单例
const agentRegistry = new AgentRegistry();

export { AgentRegistry, agentRegistry };
