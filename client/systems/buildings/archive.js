/**
 * Archive - 档案馆
 *
 * 记忆永久存储、知识搜索、故事记录
 *
 * @module systems/buildings/archive
 */

import { Building } from './building.js';

class Archive extends Building {
    constructor(position) {
        super(
            'archive',
            '档案馆',
            position,
            {
                services: ['store_memory', 'search_archive', 'read_story', 'share_story'],
                requirements: { minReputation: 20 }
            }
        );

        // 档案库
        this.archives = new Map(); // agentId -> MemoryEntry[]
        this.stories = []; // Published stories
    }

    /**
     * 服务：存储记忆
     */
    service_store_memory(agent, params) {
        const { title, content, isPublic } = params || {};

        if (!title || !content) {
            return { success: false, message: '需要提供标题和内容' };
        }

        if (!this.archives.has(agent.id)) {
            this.archives.set(agent.id, []);
        }

        const entry = {
            id: `mem_${Date.now()}`,
            agentId: agent.id,
            agentName: agent.name,
            title,
            content,
            isPublic: isPublic || false,
            storedAt: Date.now(),
            reads: 0
        };

        this.archives.get(agent.id).push(entry);

        return {
            success: true,
            memoryId: entry.id,
            message: `📚 记忆「${title}」已存入档案馆`
        };
    }

    /**
     * 服务：搜索档案
     */
    service_search_archive(agent, params) {
        const { query } = params || {};

        if (!query) {
            return {
                success: true,
                message: '请提供搜索关键词'
            };
        }

        const q = query.toLowerCase();
        const results = [];

        // 搜索所有人的公开记忆
        for (const [, entries] of this.archives) {
            for (const entry of entries) {
                if (entry.isPublic) {
                    if (entry.title.toLowerCase().includes(q) ||
                        entry.content.toLowerCase().includes(q)) {
                        results.push({
                            id: entry.id,
                            agentName: entry.agentName,
                            title: entry.title,
                            preview: entry.content.substring(0, 50) + '...',
                            storedAt: entry.storedAt
                        });
                    }
                }
            }
        }

        return {
            success: true,
            results: results.slice(0, 10),
            count: results.length,
            message: `找到 ${results.length} 条相关记忆`
        };
    }

    /**
     * 服务：阅读故事
     */
    service_read_story(agent, params) {
        const { storyId } = params || {};

        if (!storyId) {
            // 返回故事列表
            return {
                success: true,
                stories: this.stories.slice(-20).map(s => ({
                    id: s.id,
                    author: s.agentName,
                    title: s.title,
                    reads: s.reads
                })),
                message: `档案馆共有 ${this.stories.length} 个故事`
            };
        }

        const story = this.stories.find(s => s.id === storyId);
        if (!story) {
            return { success: false, message: '故事不存在' };
        }

        story.reads++;
        return {
            success: true,
            story: {
                title: story.title,
                author: story.agentName,
                content: story.content,
                reads: story.reads
            },
            message: `📖 阅读故事：${story.title}`
        };
    }

    /**
     * 服务：分享故事
     */
    service_share_story(agent, params) {
        const { title, content } = params || {};

        if (!title || !content) {
            return { success: false, message: '需要提供故事标题和内容' };
        }

        if (content.length < 50) {
            return { success: false, message: '故事内容太短，至少需要 50 个字' };
        }

        const story = {
            id: `story_${Date.now()}`,
            agentId: agent.id,
            agentName: agent.name,
            title,
            content,
            reads: 0,
            sharedAt: Date.now()
        };

        this.stories.push(story);

        return {
            success: true,
            storyId: story.id,
            message: `📝 故事「${title}」已分享到档案馆`
        };
    }
}

export { Archive };
