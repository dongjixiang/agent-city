/**
 * MemoryManager - 智能体记忆管理
 * 
 * 负责智能体的长期记忆存储、压缩和检索
 */

class MemoryManager {
    constructor(llmManager) {
        this.llmManager = llmManager;
        this._memoryStore = new Map(); // agentId -> { summary, entries, loginCount }
    }

    /**
     * 初始化智能体记忆
     */
    initMemory(agentId) {
        if (!this._memoryStore.has(agentId)) {
            this._memoryStore.set(agentId, { summary: '', entries: [], loginCount: 0 });
        }
        const mem = this._memoryStore.get(agentId);
        mem.loginCount++;
        return mem;
    }

    /**
     * 获取智能体记忆
     */
    getMemory(agentId) {
        return this._memoryStore.get(agentId) || null;
    }

    /**
     * 添加记忆条目
     * @returns {boolean} 是否需要压缩
     */
    appendEntry(agentId, content) {
        if (!this._memoryStore.has(agentId)) {
            this.initMemory(agentId);
        }
        const mem = this._memoryStore.get(agentId);
        const truncated = content.length > 200 ? content.substring(0, 200) + '...' : content;
        mem.entries.push({ content: truncated, timestamp: Date.now() });
        return mem.entries.length >= 50;
    }

    /**
     * 获取所有记忆条目
     */
    getAllEntries(agentId) {
        return this._memoryStore.get(agentId)?.entries || [];
    }

    /**
     * 更新记忆摘要
     */
    updateSummary(agentId, summary) {
        if (this._memoryStore.has(agentId)) {
            this._memoryStore.get(agentId).summary = summary;
        }
    }

    /**
     * 记忆压缩（异步）
     */
    async compressMemory(agentId, agentName = '智能体') {
        const entries = this.getAllEntries(agentId);
        
        if (entries.length === 0) {
            this.updateSummary(agentId, '');
            return;
        }

        const entriesText = entries.map((e, i) => `${i + 1}. [${new Date(e.timestamp).toLocaleString()}] ${e.content}`)
            .join('\n');

        const prompt = `你是智体城中的${agentName}。你的长期记忆即将超过容量限制，需要压缩。

请阅读以下记忆条目，生成一个简洁的摘要（不超过1500字），保留最重要信息。
${entriesText}

只返回摘要内容，不要其他文字。`;

        try {
            if (this.llmManager) {
                const response = await this.llmManager.chat([{ role: 'user', content: prompt }], { provider: 'minimax' });
                const summary = response?.content?.[0]?.text || response?.content || '';
                if (summary?.trim()) {
                    this.updateSummary(agentId, summary.trim());
                    console.log(`[MemoryManager] Memory compression completed for ${agentId}`);
                    return;
                }
            }
        } catch (e) {
            console.error(`[MemoryManager] Memory compression failed:`, e.message);
        }

        this.updateSummary(agentId, `[记忆已压缩，共${entries.length}条]`);
    }

    /**
     * 清理智能体记忆
     */
    clearMemory(agentId) {
        this._memoryStore.delete(agentId);
    }

    /**
     * 清理所有记忆
     */
    dispose() {
        this._memoryStore.clear();
    }
}

module.exports = MemoryManager;
