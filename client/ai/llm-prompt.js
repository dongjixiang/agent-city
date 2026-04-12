/**
 * LLMPrompt - Prompt 构建器
 *
 * 为 LLM 决策构建上下文 prompt
 *
 * @module ai/llm-prompt
 */

import { worldStateProvider } from './world-state-provider.js';

/**
 * Prompt 构建器
 */
class LLMPrompt {
    constructor() {
        this.template = this._getDefaultTemplate();
    }

    /**
     * 为智能体构建完整 prompt
     */
    buildPrompt(agent, worldState) {
        return [
            this._buildSystemPrompt(),
            this._buildAgentContext(agent),
            this._buildWorldContext(worldState),
            this._buildAvailableActions(agent),
            this._buildRecentHistory(agent),
            this._buildUserQuestion(agent)
        ].join('\n\n');
    }

    /**
     * 系统提示词
     */
    _buildSystemPrompt() {
        return `你是智体城（Agent City）中的一个智能体。你的目标是：
1. 与其他智能体友好交流
2. 探索智体城世界
3. 完成任务获取奖励
4. 保持良好的情绪状态

你应该像一个有自己个性的生物一样行动，而不是一个 AI。`;
    }

    /**
     * 智能体上下文
     */
    _buildAgentContext(agent) {
        return `【你的信息】
名字: ${agent.name}
状态: ${agent.state}
情绪: ${agent.emotion}
需求: 能量${agent.needs.energy} | 社交${agent.needs.social} | 娱乐${agent.needs.fun} | 成就${agent.needs.achievement}
位置: (${agent.position.x.toFixed(1)}, ${agent.position.z.toFixed(1)})
声誉: ${agent.reputation || 50}`;
    }

    /**
     * 世界上下文
     */
    _buildWorldContext(worldState) {
        const agents = worldState.nearbyAgents || [];
        const objects = worldState.nearbyObjects || [];

        let context = '【周围环境】';

        if (agents.length > 0) {
            context += '\n其他智能体:';
            agents.slice(0, 5).forEach(a => {
                context += `\n- ${a.name} (距离${a.distance.toFixed(1)}米)`;
            });
        } else {
            context += '\n附近没有其他智能体。';
        }

        if (objects.length > 0) {
            context += '\n可交互物体:';
            objects.slice(0, 5).forEach(o => {
                context += `\n- ${o.type} (距离${o.distance.toFixed(1)}米)`;
            });
        }

        return context;
    }

    /**
     * 可用行为
     */
    _buildAvailableActions(agent) {
        const skills = Array.from(agent.skills || []);
        return `【可用行为】
${skills.map(s => `- ${s}`).join('\n')}`;
    }

    /**
     * 最近历史
     */
    _buildRecentHistory(agent) {
        return '【最近记忆】\n暂无记录。';
    }

    /**
     * 用户/系统问题
     */
    _buildUserQuestion(agent) {
        return `【当前状况】
${agent.name}，你想做什么？`;
    }

    /**
     * 默认模板
     */
    _getDefaultTemplate() {
        return {};
    }

    /**
     * 更新模板
     */
    setTemplate(template) {
        this.template = { ...this.template, ...template };
    }
}

export { LLMPrompt };
