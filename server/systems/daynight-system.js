/**
 * DayNightSystem - 日夜系统
 */

const logger = require('../../utils/logger');
const config = require('../../utils/config-loader');

class DayNightSystem {
    constructor() {
        this.enabled = true;
        this.cycleSpeed = 60; // 1现实秒 = 1游戏分钟
        this.gameTime = 6 * 60; // 从 6:00 开始
        this.lastUpdate = Date.now();

        this.daynightConfig = config.getValue('world.daynight', {
            enabled: true,
            cycleSpeed: 60,
            dawnHour: 6,
            dayHour: 8,
            eveningHour: 18,
            nightHour: 21
        });

        this.phases = {
            dawn: {
                hourRange: [6, 8],
                skyColor: 0xFFD700,
                ambientColor: 0xFFE4B5,
                lightIntensity: 0.6,
                description: '黎明'
            },
            day: {
                hourRange: [8, 18],
                skyColor: 0x87CEEB,
                ambientColor: 0xFFFFFF,
                lightIntensity: 1.0,
                description: '白天'
            },
            evening: {
                hourRange: [18, 21],
                skyColor: 0xFF6B6B,
                ambientColor: 0xFFA07A,
                lightIntensity: 0.7,
                description: '傍晚'
            },
            night: {
                hourRange: [21, 6],
                skyColor: 0x1a1a2e,
                ambientColor: 0x4A4A6A,
                lightIntensity: 0.3,
                description: '夜晚'
            }
        };
    }

    /**
     * 更新
     */
    update(deltaTime) {
        if (!this.enabled) return this.getState();

        // 更新游戏时间
        const gameMinutesElapsed = (deltaTime / 1000) * this.cycleSpeed;
        this.gameTime = (this.gameTime + gameMinutesElapsed) % (24 * 60);

        this.lastUpdate = Date.now();

        return this.getState();
    }

    /**
     * 获取当前阶段
     */
    getCurrentPhase() {
        const hour = Math.floor(this.gameTime / 60);

        for (const [phase, config] of Object.entries(this.phases)) {
            const [start, end] = config.hourRange;

            if (start <= end) {
                if (hour >= start && hour < end) {
                    return phase;
                }
            } else {
                // 跨越午夜
                if (hour >= start || hour < end) {
                    return phase;
                }
            }
        }

        return 'day';
    }

    /**
     * 获取插值效果
     */
    getInterpolatedEffects() {
        const hour = this.gameTime / 60;
        const phase = this.getCurrentPhase();
        const phaseConfig = this.phases[phase];
        const [start, end] = phaseConfig.hourRange;

        let phaseProgress;
        if (start <= end) {
            phaseProgress = (hour - start) / (end - start);
        } else {
            if (hour >= start) {
                phaseProgress = (hour - start) / (24 - start + end);
            } else {
                phaseProgress = (hour + 24 - start) / (24 - start + end);
            }
        }

        phaseProgress = Math.max(0, Math.min(1, phaseProgress));

        // 阶段内插值（0-0.5 渐入，0.5-1 渐出）
        let transitionProgress;
        if (phaseProgress < 0.2) {
            // 渐入
            transitionProgress = phaseProgress / 0.2;
        } else if (phaseProgress > 0.8) {
            // 渐出
            transitionProgress = (1 - phaseProgress) / 0.2;
        } else {
            transitionProgress = 1;
        }

        return {
            phase,
            progress: phaseProgress,
            transitionProgress,
            ...phaseConfig
        };
    }

    /**
     * 获取天空颜色
     */
    getSkyColor() {
        const effects = this.getInterpolatedEffects();
        return effects.skyColor;
    }

    /**
     * 获取光照强度
     */
    getLightIntensity() {
        const effects = this.getInterpolatedEffects();
        return effects.lightIntensity * effects.transitionProgress;
    }

    /**
     * 获取状态
     */
    getState() {
        const hour = Math.floor(this.gameTime / 60);
        const minute = Math.floor(this.gameTime % 60);

        return {
            enabled: this.enabled,
            time: {
                hour,
                minute,
                formatted: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            },
            phase: this.getCurrentPhase(),
            effects: this.getInterpolatedEffects(),
            cycleSpeed: this.cycleSpeed
        };
    }

    /**
     * 是否是白天
     */
    isDay() {
        const phase = this.getCurrentPhase();
        return phase === 'day';
    }

    /**
     * 是否是夜晚
     */
    isNight() {
        const phase = this.getCurrentPhase();
        return phase === 'night';
    }

    /**
     * 设置时间
     */
    setTime(hour, minute = 0) {
        this.gameTime = (hour % 24) * 60 + (minute || 0);
    }

    /**
     * 启用/禁用
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

module.exports = DayNightSystem;
