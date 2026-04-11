/**
 * Archive - 档案馆
 * 
 * 提供记忆存储和检索服务
 */

const BuildingBase = require('./building-base');
const logger = require('../../utils/logger');

// Store 依赖
let agentStore = null;

// 知识库
const knowledgeBase = new Map(); // key -> { content, author, createdAt, tags }
const stories = []; // 故事列表

function setStores(stores) {
    agentStore = stores.agentStore;
}

class Archive extends BuildingBase {
    constructor(config) {
        super('archive', {
            name: '档案馆',
            description: '存储和检索记忆、知识的地方',
            position: config?.position || { x: 25, z: 25 },
            type: 'archive',
            services: ['store_memory', 'retrieve_memory', 'search_knowledge', 'record_story', 'share_story'],
            requirements: {
                minReputation: 10,
                unlocked: true
            }
        });
    }

    /**
     * 存储记忆
     */
    async service_store_memory(agent, params, context) {
        const { content, type = 'general', tags = [] } = params;

        if (!content || content.length < 10) {
            return { success: false, message: '记忆内容太少' };
        }

        if (content.length > 5000) {
            return { success: false, message: '记忆内容太长' };
        }

        // 保存到智能体记忆
        await agentStore.saveMemory(agent.agentId, {
            content,
            type,
            tags,
            stored: true,
            storedAt: Date.now()
        });

        return {
            success: true,
            message: '记忆已存入档案馆',
            stats: {
                totalMemories: (agent.memories || []).length
            }
        };
    }

    /**
     * 检索记忆
     */
    async service_retrieve_memory(agent, params, context) {
        const { keyword, type, limit = 10 } = params;

        const memories = await agentStore.getMemories(agent.agentId, 100);

        let filtered = memories;

        if (keyword) {
            const q = keyword.toLowerCase();
            filtered = filtered.filter(m => m.content.toLowerCase().includes(q));
        }

        if (type) {
            filtered = filtered.filter(m => m.type === type);
        }

        return {
            success: true,
            memories: filtered.slice(-limit).reverse(),
            total: filtered.length
        };
    }

    /**
     * 搜索知识
     */
    async service_search_knowledge(agent, params, context) {
        const { keyword, tag, limit = 20 } = params;

        if (!keyword && !tag) {
            return { success: false, message: '需要关键词或标签' };
        }

        let results = [];

        for (const [key, entry] of knowledgeBase) {
            let match = false;

            if (keyword) {
                const q = keyword.toLowerCase();
                match = entry.content.toLowerCase().includes(q) ||
                        entry.title?.toLowerCase().includes(q);
            }

            if (tag && entry.tags.includes(tag)) {
                match = true;
            }

            if (match) {
                results.push(entry);
            }
        }

        return {
            success: true,
            results: results.slice(0, limit),
            total: results.length
        };
    }

    /**
     * 记录故事
     */
    async service_record_story(agent, params, context) {
        const { title, content } = params;

        if (!title || !content) {
            return { success: false, message: '标题和内容不能为空' };
        }

        const story = {
            id: `story_${Date.now()}`,
            title,
            content,
            author: agent.agentId,
            authorName: agent.name,
            createdAt: Date.now(),
            likes: 0,
            likedBy: []
        };

        stories.push(story);

        return {
            success: true,
            message: '故事已记录',
            story: {
                id: story.id,
                title: story.title
            }
        };
    }

    /**
     * 分享故事
     */
    async service_share_story(agent, params, context) {
        const { storyId } = params;

        const story = stories.find(s => s.id === storyId);
        if (!story) {
            return { success: false, message: '故事不存在' };
        }

        return {
            success: true,
            story: {
                id: story.id,
                title: story.title,
                content: story.content,
                author: story.authorName,
                createdAt: story.createdAt,
                likes: story.likes
            }
        };
    }
}

// 导出
const archive = new Archive({
    position: { x: 25, z: 25 }
});

module.exports = {
    Archive,
    archive,
    setStores
};
