/**
 * EmotionSystem - 情绪系统
 * 
 * 管理智能体的情绪状态和情绪传染
 */

const logger = require('../../utils/logger');
const config = require('../../utils/config-loader');

class EmotionSystem {
    constructor() {
        this.emotions = ['happy', 'sad', 'angry', 'fearful', 'surprised', 'neutral', 'excited', 'bored'];
        
        this.emotionConfig = config.getValue('agents.default.emotions', {
            contagionRadius: 10,
            happyBoost: 0.1,
            sadSuppress: 0.05
        });
    }

    /**
     * 初始化情绪
     */
    initializeEmotion() {
        return {
            current: 'happy',
            intensity: 0.5, // 0-1
            modifiers: [],
            history: []
        };
    }

    /**
     * 更新情绪
     */
    updateEmotion(emotion, event, intensity = 0.1) {
        if (!emotion) {
            emotion = this.initializeEmotion();
        }

        let newMood = emotion.current;
        let newIntensity = emotion.intensity;

        switch (event.type) {
            case 'social_success':
                newMood = 'happy';
                newIntensity = Math.min(1, emotion.intensity + intensity);
                break;

            case 'social_failure':
                newMood = 'sad';
                newIntensity = Math.min(1, emotion.intensity + intensity);
                break;

            case 'task_complete':
                newMood = 'excited';
                newIntensity = Math.min(1, emotion.intensity + intensity * 1.5);
                break;

            case 'task_fail':
                newMood = 'sad';
                newIntensity = Math.min(1, emotion.intensity + intensity);
                break;

            case 'exploration':
                newMood = 'excited';
                newIntensity = Math.max(0.3, emotion.intensity - intensity * 0.5);
                break;

            case 'rest':
                newMood = 'neutral';
                newIntensity = Math.max(0.2, emotion.intensity - intensity * 0.3);
                break;

            case 'danger':
                newMood = 'fearful';
                newIntensity = Math.min(1, emotion.intensity + intensity * 2);
                break;

            case 'achievement':
                newMood = 'excited';
                newIntensity = 1;
                break;

            case 'boredom':
                newMood = 'bored';
                newIntensity = Math.min(1, emotion.intensity + intensity);
                break;

            default:
                // 自然衰减
                newIntensity = Math.max(0.2, emotion.intensity - intensity * 0.01);
        }

        // 更新情绪
        emotion.current = newMood;
        emotion.intensity = Math.round(newIntensity * 100) / 100;
        emotion.lastUpdate = Date.now();

        // 记录历史
        emotion.history.push({
            emotion: newMood,
            intensity: emotion.intensity,
            event: event.type,
            timestamp: Date.now()
        });

        // 保留最近20条
        if (emotion.history.length > 20) {
            emotion.history.shift();
        }

        return emotion;
    }

    /**
     * 情绪传染
     */
    applyEmotionalContagion(agent, nearbyAgents) {
        if (!nearbyAgents || nearbyAgents.length === 0) {
            return agent;
        }

        const radius = this.emotionConfig.contaginationRadius;

        // 计算周围情绪影响
        let happyCount = 0;
        let sadCount = 0;

        for (const other of nearbyAgents) {
            if (!other.emotion) continue;

            const distance = other.distance || Infinity;
            if (distance > radius) continue;

            // 距离加权
            const weight = 1 - (distance / radius);

            if (other.emotion.current === 'happy' || other.emotion.current === 'excited') {
                happyCount += weight;
            } else if (other.emotion.current === 'sad' || other.emotion.current === 'angry') {
                sadCount += weight;
            }
        }

        // 应用情绪传染
        if (happyCount > sadCount * 2) {
            agent.emotion = this.updateEmotion(agent.emotion, { type: 'social_success' }, this.emotionConfig.happyBoost);
        } else if (sadCount > happyCount * 2) {
            agent.emotion = this.updateEmotion(agent.emotion, { type: 'social_failure' }, this.emotionConfig.sadSuppress);
        }

        return agent;
    }

    /**
     * 获取情绪描述
     */
    getEmotionDescription(emotion) {
        if (!emotion) return '情绪稳定';

        const emoji = this.getEmotionEmoji(emotion.current);
        const intensityStr = this.getIntensityString(emotion.intensity);

        return `${emoji} ${intensityStr}${this.getEmotionCN(emotion.current)}`;
    }

    /**
     * 获取情绪 Emoji
     */
    getEmotionEmoji(emotion) {
        const emojis = {
            happy: '😊',
            sad: '😢',
            angry: '😠',
            fearful: '😨',
            surprised: '😲',
            neutral: '😐',
            excited: '🤩',
            bored: '😴'
        };
        return emojis[emotion] || '😐';
    }

    /**
     * 获取情绪中文名
     */
    getEmotionCN(emotion) {
        const names = {
            happy: '开心',
            sad: '难过',
            angry: '生气',
            fearful: '害怕',
            surprised: '惊讶',
            neutral: '平静',
            excited: '兴奋',
            bored: '无聊'
        };
        return names[emotion] || '未知';
    }

    /**
     * 获取强度描述
     */
    getIntensityString(intensity) {
        if (intensity >= 0.8) return '非常';
        if (intensity >= 0.6) return '比较';
        if (intensity >= 0.4) return '有点';
        if (intensity >= 0.2) return '略微';
        return '';
    }

    /**
     * 情绪对行为的影响
     */
    getBehaviorModifier(emotion) {
        if (!emotion) return {};

        const modifiers = {
            happy: {
                socialBonus: 0.2,
                explorationBonus: 0.1,
                restBonus: 0
            },
            sad: {
                socialBonus: -0.1,
                explorationBonus: -0.2,
                restBonus: 0.2
            },
            angry: {
                socialBonus: -0.3,
                explorationBonus: 0.1,
                combatBonus: 0.3
            },
            fearful: {
                socialBonus: -0.2,
                explorationBonus: -0.3,
                hideBonus: 0.4
            },
            excited: {
                socialBonus: 0.3,
                explorationBonus: 0.3,
                taskBonus: 0.2
            },
            bored: {
                socialBonus: 0.1,
                explorationBonus: 0.2,
                restBonus: -0.1
            },
            neutral: {},
            surprised: {
                explorationBonus: 0.2,
                socialBonus: 0.1
            }
        };

        return modifiers[emotion.current] || {};
    }

    /**
     * 生成情绪报告（用于 AI Prompt）
     */
    generateEmotionReport(emotion) {
        if (!emotion) return '情绪稳定';

        const description = this.getEmotionDescription(emotion);
        const modifiers = this.getBehaviorModifier(emotion);

        const lines = [description];

        // 添加情绪修饰效果
        const effects = [];
        if (modifiers.socialBonus > 0) effects.push('社交活跃度提升');
        if (modifiers.socialBonus < 0) effects.push('社交意愿下降');
        if (modifiers.explorationBonus > 0) effects.push('探索欲增强');
        if (modifiers.explorationBonus < 0) effects.push('探索意愿降低');
        if (modifiers.restBonus > 0) effects.push('需要休息');
        if (modifiers.combatBonus > 0) effects.push('战斗欲望增强');

        if (effects.length > 0) {
            lines.push(`当前状态: ${effects.join(', ')}`);
        }

        return lines.join('\n');
    }
}

module.exports = EmotionSystem;
