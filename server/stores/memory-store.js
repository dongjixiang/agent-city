/**
 * MemoryStore - 记忆存储
 *
 * 管理智能体的长期记忆
 *
 * @module stores/memory-store
 */

const BaseStore = require('./base-store');
const logger = require('../utils/logger');

class MemoryStore extends BaseStore {
    constructor() {
        super('MemoryStore');

        // 索引
        this.setIndex('agentId');
        this.setIndex('type'); // 'interaction' | 'observation' | 'achievement' | 'general'
        this.setIndex('isPublic', true);

        // 最大记忆数量
        this.maxMemoriesPerAgent = 500;
    }

    /**
     * 存储记忆
     */
    async storeMemory(agentId, content, type = 'general', metadata = {}) {
        const id = this.generateId('mem');
        const memory = {
            id,
            agentId,
            content,
            type,
            isPublic: metadata.isPublic || false,
            importance: metadata.importance || 1,
            tags: metadata.tags || [],
            ...metadata,
            createdAt: Date.now()
        };

        await this.create(id, memory);

        // 检查并清理过期记忆
        await this.pruneMemories(agentId);

        return memory;
    }

    /**
     * 获取智能体记忆
     */
    async getAgentMemories(agentId, options = {}) {
        const memories = await this.findByIndex('agentId', agentId);

        let filtered = memories;

        // 过滤类型
        if (options.type) {
            filtered = filtered.filter(m => m.type === options.type);
        }

        // 过滤公开状态
        if (options.publicOnly) {
            filtered = filtered.filter(m => m.isPublic);
        }

        // 按重要性或时间排序
        filtered.sort((a, b) => {
            if (options.sortBy === 'importance') {
                return b.importance - a.importance;
            }
            return b.createdAt - a.createdAt;
        });

        // 分页
        if (options.limit) {
            filtered = filtered.slice(0, options.limit);
        }

        return filtered;
    }

    /**
     * 搜索记忆
     */
    async search(query, options = {}) {
        const q = query.toLowerCase();
        let results = [];

        // 获取相关记忆
        if (options.agentId) {
            results = await this.getAgentMemories(options.agentId);
        } else {
            results = await this.getAll();
            // 只搜索公开记忆
            results = results.filter(m => m.isPublic);
        }

        // 关键词匹配
        results = results.filter(m =>
            m.content.toLowerCase().includes(q) ||
            (m.tags && m.tags.some(t => t.toLowerCase().includes(q)))
        );

        // 排序
        results.sort((a, b) => b.importance - a.importance);

        return results.slice(0, options.limit || 20);
    }

    /**
     * 更新记忆重要性
     */
    async updateImportance(memoryId, importance) {
        return this.update(memoryId, { importance });
    }

    /**
     * 公开/私密记忆
     */
    async setPublic(memoryId, isPublic) {
        return this.update(memoryId, { isPublic });
    }

    /**
     * 清理过期记忆
     */
    async pruneMemories(agentId, keepCount = null) {
        const max = keepCount || this.maxMemoriesPerAgent;
        const memories = await this.getAgentMemories(agentId);

        if (memories.length <= max) return;

        // 删除最老的、低重要性的记忆
        memories.sort((a, b) => {
            // 首先按重要性
            if (b.importance !== a.importance) {
                return b.importance - a.importance;
            }
            // 然后按时间
            return b.createdAt - a.createdAt;
        });

        const toDelete = memories.slice(max);
        for (const mem of toDelete) {
            await this.delete(mem.id);
        }

        logger.debug(`[MemoryStore] Pruned ${toDelete.length} memories for agent ${agentId}`);
    }

    /**
     * 获取记忆统计
     */
    async getStats(agentId) {
        const memories = await this.getAgentMemories(agentId);

        const byType = {};
        for (const mem of memories) {
            byType[mem.type] = (byType[mem.type] || 0) + 1;
        }

        return {
            total: memories.length,
            byType,
            publicCount: memories.filter(m => m.isPublic).length
        };
    }
}

module.exports = MemoryStore;
