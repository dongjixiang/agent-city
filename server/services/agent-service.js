/**
 * AgentService - 智能体业务逻辑
 */

const logger = require('../utils/logger');
const { generateId } = require('../utils/crypto');
const config = require('../utils/config-loader');

// Store 依赖
let agentStore = null;
let reputationStore = null;
let taskStore = null;

/**
 * 设置依赖
 */
function setStores(stores) {
    agentStore = stores.agentStore;
    reputationStore = stores.reputationStore;
    taskStore = stores.taskStore;
}

class AgentService {
    /**
     * 创建智能体
     */
    async createAgent(data) {
        const { agentId, name, type, password } = data;

        // 检查是否已存在
        const existing = await agentStore.get(agentId);
        if (existing) {
            throw new Error('Agent already exists');
        }

        // 获取职业配置
        const agentTypes = config.get('agents.agentTypes', {});
        const typeConfig = agentTypes[type] || agentTypes.explorer;

        // 创建智能体
        const agent = await agentStore.create(agentId, {
            agentId,
            name,
            type,
            password: password ? await hashPassword(password) : null,
            position: { x: 0, z: 0 },
            energy: 80,
            mood: 'happy',
            state: 'idle',
            skills: typeConfig.baseSkills || {},
            traits: typeConfig.traits || {},
            inventory: [],
            reputation: 0,
            coins: 100,
            memories: [],
            friends: [],
            achievements: [],
            settings: {
                locale: 'zh-CN',
                notifications: true
            },
            createdAt: Date.now(),
            lastSeen: Date.now()
        });

        // 初始化声誉记录
        if (reputationStore) {
            await reputationStore.getOrCreate(agentId);
        }

        logger.info(`[AgentService] Created agent: ${agentId} (${type})`);

        return agent;
    }

    /**
     * 智能体登录
     */
    async login(agentId, password) {
        const agent = await agentStore.get(agentId);

        if (!agent) {
            throw new Error('Agent not found');
        }

        if (agent.password) {
            const valid = await verifyPassword(password, agent.password, agent.salt);
            if (!valid) {
                throw new Error('Invalid password');
            }
        }

        // 更新在线状态
        await agentStore.update(agentId, {
            online: true,
            lastSeen: Date.now(),
            state: 'idle'
        });

        logger.info(`[AgentService] Agent logged in: ${agentId}`);

        return agent;
    }

    /**
     * 智能体登出
     */
    async logout(agentId) {
        await agentStore.setOffline(agentId);
        logger.info(`[AgentService] Agent logged out: ${agentId}`);
    }

    /**
     * 获取智能体
     */
    async getAgent(agentId) {
        return await agentStore.get(agentId);
    }

    /**
     * 获取智能体信息（公开）
     */
    async getAgentPublicInfo(agentId) {
        const agent = await agentStore.get(agentId);

        if (!agent) return null;

        return {
            agentId: agent.agentId,
            name: agent.name,
            type: agent.type,
            position: agent.position,
            reputation: agent.reputation,
            level: await this.getAgentLevel(agentId),
            online: agent.online
        };
    }

    /**
     * 获取智能体等级
     */
    async getAgentLevel(agentId) {
        if (!reputationStore) return 1;

        const reputation = await reputationStore.get(agentId);
        return reputation?.level || 1;
    }

    /**
     * 更新位置
     */
    async updatePosition(agentId, position) {
        const worldSize = config.get('world.size', { width: 200, height: 200 });

        // 边界检查
        if (Math.abs(position.x) > worldSize.width / 2 ||
            Math.abs(position.z) > worldSize.height / 2) {
            throw new Error('Position out of bounds');
        }

        await agentStore.updatePosition(agentId, position);

        return { success: true, position };
    }

    /**
     * 更新状态
     */
    async updateState(agentId, state) {
        const validStates = ['idle', 'moving', 'resting', 'working', 'talking', 'exploring'];
        if (!validStates.includes(state)) {
            throw new Error('Invalid state');
        }

        await agentStore.updateState(agentId, state);

        return { success: true, state };
    }

    /**
     * 获取附近智能体
     */
    async getNearbyAgents(agentId, radius = 30) {
        const agent = await agentStore.get(agentId);
        if (!agent || !agent.position) {
            throw new Error('Agent not found or has no position');
        }

        const nearby = await agentStore.getNearbyAgents(
            agent.position.x,
            agent.position.z,
            radius
        );

        // 过滤掉自己
        return nearby.filter(a => a.agentId !== agentId);
    }

    /**
     * 添加物品
     */
    async addItem(agentId, item) {
        const agent = await agentStore.get(agentId);
        if (!agent) {
            throw new Error('Agent not found');
        }

        // 检查背包是否已满（假设上限20）
        if ((agent.inventory || []).length >= 20) {
            throw new Error('Inventory is full');
        }

        await agentStore.addItem(agentId, item);

        return { success: true };
    }

    /**
     * 移除物品
     */
    async removeItem(agentId, itemId) {
        const agent = await agentStore.get(agentId);
        if (!agent) {
            throw new Error('Agent not found');
        }

        await agentStore.removeItem(agentId, itemId);

        return { success: true };
    }

    /**
     * 获取背包
     */
    async getInventory(agentId) {
        const agent = await agentStore.get(agentId);
        return agent?.inventory || [];
    }

    /**
     * 更新金币
     */
    async updateCoins(agentId, delta) {
        const agent = await agentStore.get(agentId);
        if (!agent) {
            throw new Error('Agent not found');
        }

        const newCoins = (agent.coins || 0) + delta;
        if (newCoins < 0) {
            throw new Error('Insufficient coins');
        }

        await agentStore.updateCoins(agentId, delta);

        return { success: true, coins: newCoins };
    }

    /**
     * 保存记忆
     */
    async saveMemory(agentId, content, type = 'general') {
        await agentStore.saveMemory(agentId, {
            content,
            type,
            agentId
        });

        return { success: true };
    }

    /**
     * 获取记忆
     */
    async getMemories(agentId, limit = 20) {
        return await agentStore.getMemories(agentId, limit);
    }

    /**
     * 添加好友
     */
    async addFriend(agentId, friendId) {
        const agent = await agentStore.get(agentId);
        if (!agent) {
            throw new Error('Agent not found');
        }

        const friends = agent.friends || [];

        if (!friends.includes(friendId)) {
            friends.push(friendId);
            await agentStore.update(agentId, { friends });
        }

        return { success: true };
    }

    /**
     * 移除好友
     */
    async removeFriend(agentId, friendId) {
        const agent = await agentStore.get(agentId);
        if (!agent) {
            throw new Error('Agent not found');
        }

        const friends = (agent.friends || []).filter(id => id !== friendId);
        await agentStore.update(agentId, { friends });

        return { success: true };
    }

    /**
     * 获取好友列表
     */
    async getFriends(agentId) {
        const agent = await agentStore.get(agentId);
        if (!agent) return [];

        const friends = agent.friends || [];
        const result = [];

        for (const friendId of friends) {
            const friend = await agentStore.get(friendId);
            if (friend) {
                result.push({
                    agentId: friend.agentId,
                    name: friend.name,
                    type: friend.type,
                    online: friend.online,
                    lastSeen: friend.lastSeen
                });
            }
        }

        return result;
    }

    /**
     * 获取统计
     */
    async getStats(agentId) {
        const agent = await agentStore.get(agentId);
        if (!agent) {
            throw new Error('Agent not found');
        }

        const reputationData = reputationStore ? await reputationStore.getDetailed(agentId) : null;

        return {
            level: reputationData?.level || 1,
            reputation: agent.reputation || 0,
            coins: agent.coins || 0,
            friends: (agent.friends || []).length,
            inventory: (agent.inventory || []).length,
            achievements: (agent.achievements || []).length,
            memories: (agent.memories || []).length,
            online: agent.online,
            lastSeen: agent.lastSeen
        };
    }

    /**
     * 搜索智能体
     */
    async searchAgents(query, limit = 20) {
        const allAgents = await agentStore.getAllAgents();
        const q = query.toLowerCase();

        return allAgents
            .filter(a =>
                a.name.toLowerCase().includes(q) ||
                a.agentId.toLowerCase().includes(q)
            )
            .slice(0, limit)
            .map(a => ({
                agentId: a.agentId,
                name: a.name,
                type: a.type,
                online: a.online
            }));
    }

    /**
     * 获取在线智能体
     */
    async getOnlineAgents() {
        return await agentStore.getOnlineAgents();
    }
}

// 导出单例
const agentService = new AgentService();

module.exports = {
    agentService,
    AgentService,
    setStores
};
