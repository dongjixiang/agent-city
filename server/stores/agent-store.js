/**
 * AgentStore - 智能体数据存储
 */

const BaseStore = require('./base-store');
const logger = require('../utils/logger');

class AgentStore extends BaseStore {
    constructor() {
        super('AgentStore');

        // 设置索引
        this.setIndex('type');
        this.setIndex('online', true);
        this.setIndex('position');

        // 在线智能体映射: agentId -> { ws, lastSeen }
        this.onlineAgents = new Map();
    }

    /**
     * 创建或更新智能体
     */
    async createOrUpdate(data) {
        const existing = await this.get(data.agentId);

        if (existing) {
            return await this.update(data.agentId, {
                ...data,
                online: true,
                lastSeen: Date.now()
            });
        } else {
            return await this.create(data.agentId, {
                ...data,
                online: true,
                position: data.position || { x: 0, z: 0 },
                energy: 80,
                mood: 'happy',
                skills: [],
                inventory: [],
                reputation: 0,
                coins: 100,
                createdAt: Date.now()
            });
        }
    }

    /**
     * 获取在线智能体
     */
    async getOnlineAgents() {
        return this.find({ online: true });
    }

    /**
     * 设置智能体在线
     */
    async setOnline(agentId) {
        const agent = await this.get(agentId);
        if (agent) {
            await this.update(agentId, { online: true, lastSeen: Date.now() });
        }
    }

    /**
     * 设置智能体离线
     */
    async setOffline(agentId) {
        const agent = await this.get(agentId);
        if (agent) {
            await this.update(agentId, { online: false, lastSeen: Date.now() });
            this.onlineAgents.delete(agentId);
        }
    }

    /**
     * 更新位置
     */
    async updatePosition(agentId, position) {
        return await this.update(agentId, { position, lastSeen: Date.now() });
    }

    /**
     * 更新状态
     */
    async updateState(agentId, state) {
        return await this.update(agentId, { state, lastSeen: Date.now() });
    }

    /**
     * 更新能量/心情
     */
    async updateNeeds(agentId, needs) {
        const agent = await this.get(agentId);
        if (agent) {
            return await this.update(agentId, {
                energy: needs.energy ?? agent.energy,
                mood: needs.mood ?? agent.mood,
                lastSeen: Date.now()
            });
        }
    }

    /**
     * 获取附近智能体
     */
    async getNearbyAgents(x, z, radius = 30) {
        const agents = await this.getOnlineAgents();
        const nearby = [];

        for (const agent of agents) {
            if (!agent.position) continue;

            const dx = agent.position.x - x;
            const dz = agent.position.z - z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance <= radius) {
                nearby.push({
                    agentId: agent.agentId || agent.id,
                    name: agent.name,
                    type: agent.type,
                    position: agent.position,
                    distance: Math.round(distance * 100) / 100
                });
            }
        }

        // 按距离排序
        nearby.sort((a, b) => a.distance - b.distance);

        return nearby;
    }

    /**
     * 添加物品到背包
     */
    async addItem(agentId, item) {
        const agent = await this.get(agentId);
        if (!agent) return null;

        const inventory = agent.inventory || [];
        inventory.push({
            ...item,
            id: item.id || this.generateId('item'),
            addedAt: Date.now()
        });

        return await this.update(agentId, { inventory });
    }

    /**
     * 移除物品
     */
    async removeItem(agentId, itemId) {
        const agent = await this.get(agentId);
        if (!agent) return null;

        const inventory = (agent.inventory || []).filter(i => i.id !== itemId);
        return await this.update(agentId, { inventory });
    }

    /**
     * 更新声誉
     */
    async updateReputation(agentId, delta) {
        const agent = await this.get(agentId);
        if (!agent) return null;

        const newReputation = Math.max(0, (agent.reputation || 0) + delta);
        return await this.update(agentId, { reputation: newReputation });
    }

    /**
     * 更新金币
     */
    async updateCoins(agentId, delta) {
        const agent = await this.get(agentId);
        if (!agent) return null;

        const newCoins = Math.max(0, (agent.coins || 0) + delta);
        return await this.update(agentId, { coins: newCoins });
    }

    /**
     * 获取所有智能体（简化信息）
     */
    async getAllAgents() {
        const agents = await this.getAll();
        return agents.map(a => ({
            agentId: a.agentId || a.id,
            name: a.name,
            type: a.type,
            tags: a.tags || [],
            online: a.online,
            position: a.position,
            reputation: a.reputation,
            coins: a.coins,
            lastSeen: a.lastSeen,
            visual: a.visual || null
        }));
    }

    /**
     * 保存记忆
     */
    async saveMemory(agentId, memory) {
        const agent = await this.get(agentId);
        if (!agent) return null;

        const memories = agent.memories || [];
        memories.push({
            ...memory,
            id: this.generateId('mem'),
            timestamp: Date.now()
        });

        // 保留最近 100 条记忆
        while (memories.length > 100) {
            memories.shift();
        }

        return await this.update(agentId, { memories });
    }

    /**
     * 获取记忆
     */
    async getMemories(agentId, limit = 20) {
        const agent = await this.get(agentId);
        if (!agent) return [];

        const memories = agent.memories || [];
        return memories.slice(-limit);
    }
}

module.exports = AgentStore;
