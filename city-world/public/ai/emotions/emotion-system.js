/**
 * EmotionSystem - 情绪系统
 *
 * 管理智能体的情绪状态
 *
 * @module ai/emotions/emotion-system
 */

import { eventBus, Events } from '../../core/event-bus.js';

const EmotionType = {
    NEUTRAL: 'neutral',
    HAPPY: 'happy',
    SAD: 'sad',
    ANGRY: 'angry',
    SCARED: 'scared',
    EXCITED: 'excited',
    TIRED: 'tired'
};

class EmotionSystem {
    constructor() {
        // 情绪衰减速率
        this.decayRate = 0.02;
        // 情绪到中性状态的恢复阈值
        this.restoreThreshold = 70;
    }

    /**
     * 更新情绪
     */
    update(agent, deltaTime) {
        // 情绪自然衰减到 neutral
        if (agent.emotion !== EmotionType.NEUTRAL) {
            // 简单的衰减逻辑
            agent._emotionIntensity = (agent._emotionIntensity || 100) - this.decayRate * deltaTime * 10;

            if (agent._emotionIntensity <= 0) {
                this.setEmotion(agent, EmotionType.NEUTRAL);
            }
        }
    }

    /**
     * 设置情绪
     */
    setEmotion(agent, emotion, intensity = 100) {
        const oldEmotion = agent.emotion;
        agent.emotion = emotion;
        agent._emotionIntensity = intensity;

        if (oldEmotion !== emotion) {
            eventBus.emit(Events.AGENT_SPEAK, {
                agentId: agent.id,
                message: this._getEmotionExpression(emotion),
                duration: 2
            });
        }
    }

    /**
     * 触发情绪反应
     */
    react(agent, stimulus) {
        switch (stimulus.type) {
            case 'social_positive':
                this.setEmotion(agent, EmotionType.HAPPY);
                break;
            case 'social_negative':
                this.setEmotion(agent, EmotionType.SAD);
                break;
            case 'danger':
                this.setEmotion(agent, EmotionType.SCARED);
                break;
            case 'achievement':
                this.setEmotion(agent, EmotionType.EXCITED);
                agent.needs.achievement = Math.min(100, agent.needs.achievement + 20);
                break;
            case 'tired':
                this.setEmotion(agent, EmotionType.TIRED);
                break;
            default:
                // 保持当前情绪
                break;
        }
    }

    /**
     * 获取情绪对应的表情表达
     */
    _getEmotionExpression(emotion) {
        const expressions = {
            happy: '♪ 心情很好 ♪',
            sad: '(难过...)',
            angry: '(╯°□°）╯︵ ┻━┻',
            scared: '！(◎_◎！)',
            excited: '★ 太棒了！★',
            tired: 'zzZ...',
            neutral: ''
        };
        return expressions[emotion] || '';
    }
}

export { EmotionSystem, EmotionType };
