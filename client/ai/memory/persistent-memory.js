/**
 * PersistentMemory - 持久化记忆系统
 *
 * 管理智能体的长期记忆
 *
 * @module ai/memory/persistent-memory
 */

import { eventBus, Events } from '../../core/event-bus.js';

class MemoryEntry {
    constructor(content, type = 'general') {
        this.id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.content = content;
        this.type = type; // 'interaction' | 'achievement' | 'observation' | 'general'
        this.importance = 1; // 0-10
        this.createdAt = Date.now();
        this.accessedAt = Date.now();
        this.accessCount = 0;
    }
}

class PersistentMemory {
    constructor(agentId) {
        this.agentId = agentId;
        this.memories = [];
        this.maxMemories = 100;
    }

    /**
     * 添加记忆
     */
    add(content, type = 'general', importance = 1) {
        const entry = new MemoryEntry(content, type);
        entry.importance = importance;
        this.memories.unshift(entry);

        // 限制记忆数量
        if (this.memories.length > this.maxMemories) {
            this._prune();
        }

        return entry;
    }

    /**
     * 记录交互
     */
    addInteraction(otherAgentId, action, result) {
        return this.add(
            `与 ${otherAgentId} 进行交互: ${action} -> ${result}`,
            'interaction',
            5
        );
    }

    /**
     * 记录成就
     */
    addAchievement(achievement) {
        return this.add(achievement, 'achievement', 10);
    }

    /**
     * 记录观察
     */
    addObservation(observation) {
        return this.add(observation, 'observation', 3);
    }

    /**
     * 搜索记忆
     */
    search(query, limit = 5) {
        const q = query.toLowerCase();
        const results = this.memories
            .filter(m => m.content.toLowerCase().includes(q))
            .sort((a, b) => {
                // 按相关性和重要性排序
                const scoreA = a.importance + (a.accessCount * 0.1);
                const scoreB = b.importance + (b.accessCount * 0.1);
                return scoreB - scoreA;
            })
            .slice(0, limit);

        // 更新访问统计
        results.forEach(r => {
            r.accessCount++;
            r.accessedAt = Date.now();
        });

        return results;
    }

    /**
     * 获取最近的记忆
     */
    getRecent(limit = 10) {
        return this.memories.slice(0, limit);
    }

    /**
     * 获取重要记忆
     */
    getImportant(minImportance = 7) {
        return this.memories
            .filter(m => m.importance >= minImportance)
            .sort((a, b) => b.importance - a.importance);
    }

    /**
     * 清理低价值记忆
     */
    _prune() {
        // 删除低重要性的旧记忆
        const toRemove = this.memories
            .filter(m => m.importance < 3)
            .slice(0, Math.floor(this.maxMemories * 0.2));

        toRemove.forEach(m => {
            const idx = this.memories.indexOf(m);
            if (idx !== -1) this.memories.splice(idx, 1);
        });
    }

    /**
     * 导出记忆
     */
    export() {
        return {
            agentId: this.agentId,
            memories: this.memories,
            exportedAt: Date.now()
        };
    }

    /**
     * 导入记忆
     */
    import(data) {
        if (data.agentId === this.agentId) {
            this.memories = data.memories || [];
        }
    }
}

export { PersistentMemory, MemoryEntry };
