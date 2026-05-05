/**
 * AgentBrain - 智能体大脑整合
 *
 * 整合感知、决策、行动系统
 *
 * @module ai/agent-brain
 */

import { eventBus, Events } from '../core/event-bus.js';

/**
 * 智能体大脑
 * 每个智能体有一个大脑实例，协调所有子系统
 */
class AgentBrain {
    constructor(agent) {
        this.agent = agent;

        // 子系统（由外部注入或使用默认实现）
        this.perceptionSystem = null;
        this.decisionLoop = null;
        this.emotionSystem = null;
        this.motivationSystem = null;
        this.skillRegistry = null;
        this.memorySystem = null;
        this.conversationManager = null;
        this.worldStateProvider = null;
    }

    /**
     * 初始化大脑
     */
    init() {
        eventBus.emit(Events.AGENT_THINK, {
            agentId: this.agent.id,
            message: '正在启动大脑...'
        });
        return this;
    }

    /**
     * 每帧更新
     */
    update(deltaTime) {
        // 1. 感知
        if (this.perceptionSystem) {
            this.perceptionSystem.update(this.agent, deltaTime);
        }

        // 2. 决策
        if (this.decisionLoop) {
            this.decisionLoop.update(this.agent, deltaTime);
        }

        // 3. 情绪更新
        if (this.emotionSystem) {
            this.emotionSystem.update(this.agent, deltaTime);
        }

        // 4. 需求更新
        if ( this.motivationSystem) {
            this.motivationSystem.update(this.agent, deltaTime);
        }
    }

    /**
     * 触发行为
     */
    act(action, params) {
        const skill = this.skillRegistry?.getSkill(action);
        if (skill) {
            return skill.execute(this.agent, params);
        }
        return { success: false, message: `未知行为: ${action}` };
    }

    /**
     * 销毁
     */
    dispose() {
        this.perceptionSystem = null;
        this.decisionLoop = null;
        this.emotionSystem = null;
        this.motivationSystem = null;
        this.skillRegistry = null;
        this.memorySystem = null;
        this.conversationManager = null;
        this.worldStateProvider = null;
    }
}

export { AgentBrain };
