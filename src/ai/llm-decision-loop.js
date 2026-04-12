/**
 * LLMDecisionLoop - LLM 决策循环
 *
 * 使用 LLM 为智能体做决策
 *
 * @module ai/llm-decision-loop
 */

import { eventBus, Events } from '../core/event-bus.js';
import { worldStateProvider } from './world-state-provider.js';
import { LLMPrompt } from './llm-prompt.js';

/**
 * 决策结果
 */
class Decision {
    constructor(action, params, reasoning) {
        this.action = action;
        this.params = params || {};
        this.reasoning = reasoning || '';
        this.timestamp = Date.now();
    }
}

/**
 * LLM 决策循环
 */
class LLMDecisionLoop {
    constructor() {
        this.promptBuilder = new LLMPrompt();
        this.enabled = false;
        this.llmEndpoint = null;
        this.llmModel = 'minimax-cn/MiniMax-M2';
        this.cooldownTime = 3; // 秒
        this.cooldowns = new Map(); // agentId -> remaining time
    }

    /**
     * 启用/禁用
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * 配置 LLM
     */
    configure(endpoint, model) {
        this.llmEndpoint = endpoint;
        this.llmModel = model || this.llmModel;
    }

    /**
     * 每帧更新
     */
    update(agent, deltaTime) {
        if (!this.enabled) return null;

        // 冷却检查
        const cd = this.cooldowns.get(agent.id) || 0;
        if (cd > 0) {
            this.cooldowns.set(agent.id, cd - deltaTime);
            return null;
        }

        // 获取世界状态
        const worldState = worldStateProvider.getStateForAgent(agent);

        // 构建 prompt
        const prompt = this.promptBuilder.buildPrompt(agent, worldState);

        // 通知正在思考
        eventBus.emit(Events.AGENT_THINK, {
            agentId: agent.id,
            message: '思考中...'
        });

        // 实际 LLM 调用需要外部实现
        // 这里返回空决策，由外部注入实际的 LLM 调用
        return null;
    }

    /**
     * 处理 LLM 响应
     */
    async processResponse(agentId, response) {
        // 解析 LLM 响应，生成决策
        const decision = this._parseResponse(response);
        this.cooldowns.set(agentId, this.cooldownTime);

        if (decision) {
            eventBus.emit(Events.AGENT_MOVED, {
                agentId,
                decision
            });
        }

        return decision;
    }

    /**
     * 解析 LLM 响应
     */
    _parseResponse(response) {
        // TODO: 实现 LLM 响应解析
        // 期望格式: { action: "move-to", params: { x: 10, z: 20 }, reasoning: "..." }
        return null;
    }

    /**
     * 清除冷却
     */
    clearCooldown(agentId) {
        this.cooldowns.delete(agentId);
    }

    /**
     * 销毁
     */
    dispose() {
        this.cooldowns.clear();
    }
}

export { LLMDecisionLoop, Decision };
