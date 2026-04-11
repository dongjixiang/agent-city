/**
 * ClockManager - 时钟管理器
 * 
 * 负责游戏时间和 deltaTime 管理
 */

import * as THREE from 'three';

class ClockManager {
    constructor() {
        this.clock = null;
        this.initialized = false;

        // 游戏时间
        this.gameTime = {
            hour: 8,      // 8:00 AM
            minute: 0,
            speed: 60     // 1现实秒 = 1游戏分钟
        };

        // 日夜阶段
        this.phases = {
            dawn: { start: 6, end: 8, name: '黎明' },
            morning: { start: 8, end: 12, name: '上午' },
            noon: { start: 12, end: 14, name: '中午' },
            afternoon: { start: 14, end: 18, name: '下午' },
            evening: { start: 18, end: 21, name: '傍晚' },
            night: { start: 21, end: 6, name: '夜晚' }
        };

        // 回调函数
        this.onTimeUpdate = null;
        this.onPhaseChange = null;

        // 上次阶段
        this.lastPhase = 'morning';
    }

    /**
     * 初始化时钟
     */
    init() {
        if (this.initialized) {
            console.warn('[Clock] Already initialized');
            return;
        }

        this.clock = new THREE.Clock();
        this.initialized = true;
        console.log('[Clock] Initialized');

        return this.clock;
    }

    /**
     * 获取时钟
     */
    getClock() {
        if (!this.initialized) {
            this.init();
        }
        return this.clock;
    }

    /**
     * 获取 deltaTime（秒）
     */
    getDelta() {
        if (!this.clock) return 0;
        return this.clock.getDelta();
    }

    /**
     * 获取 elapsedTime（秒）
     */
    getElapsed() {
        if (!this.clock) return 0;
        return this.clock.getElapsedTime();
    }

    /**
     * 更新游戏时间
     */
    update(deltaTime) {
        if (!this.clock) return;

        // deltaTime 是秒，转换为游戏分钟
        const gameMinutesElapsed = deltaTime * this.gameTime.speed;

        // 更新分钟
        this.gameTime.minute += gameMinutesElapsed;

        // 进位到小时
        while (this.gameTime.minute >= 60) {
            this.gameTime.minute -= 60;
            this.gameTime.hour++;
        }

        // 进位到天
        while (this.gameTime.hour >= 24) {
            this.gameTime.hour -= 24;
        }

        // 检查阶段变化
        const currentPhase = this.getCurrentPhase();
        if (currentPhase !== this.lastPhase) {
            this.lastPhase = currentPhase;
            if (this.onPhaseChange) {
                this.onPhaseChange(currentPhase);
            }
        }

        // 触发时间更新回调
        if (this.onTimeUpdate) {
            this.onTimeUpdate(this.getFormattedTime());
        }
    }

    /**
     * 获取格式化时间
     */
    getFormattedTime() {
        const hour = String(Math.floor(this.gameTime.hour)).padStart(2, '0');
        const minute = String(Math.floor(this.gameTime.minute)).padStart(2, '0');
        return `${hour}:${minute}`;
    }

    /**
     * 获取当前日夜阶段
     */
    getCurrentPhase() {
        const hour = this.gameTime.hour;

        for (const [phase, config] of Object.entries(this.phases)) {
            const { start, end } = config;

            if (start <= end) {
                // 同一天内
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

        return 'morning';
    }

    /**
     * 是否是白天
     */
    isDay() {
        const phase = this.getCurrentPhase();
        return ['dawn', 'morning', 'noon', 'afternoon'].includes(phase);
    }

    /**
     * 是否是夜晚
     */
    isNight() {
        return this.getCurrentPhase() === 'night';
    }

    /**
     * 获取昼夜百分比（0-1，0=正午，1=午夜）
     */
    getDayNightRatio() {
        const hour = this.gameTime.hour;
        const minute = this.gameTime.minute;
        const totalMinutes = hour * 60 + minute;

        // 计算距离午夜的分分钟数
        if (hour >= 12) {
            return (totalMinutes - 720) / 720; // 下午到午夜
        } else {
            return (totalMinutes + 720) / 720; // 午夜到中午
        }
    }

    /**
     * 设置游戏时间
     */
    setTime(hour, minute = 0) {
        this.gameTime.hour = hour % 24;
        this.gameTime.minute = minute % 60;
    }

    /**
     * 设置时间流逝速度
     */
    setSpeed(speed) {
        this.gameTime.speed = speed;
    }

    /**
     * 获取时间速度
     */
    getSpeed() {
        return this.gameTime.speed;
    }

    /**
     * 获取完整时间信息
     */
    getTimeInfo() {
        return {
            hour: this.gameTime.hour,
            minute: this.gameTime.minute,
            formatted: this.getFormattedTime(),
            phase: this.getCurrentPhase(),
            phaseName: this.phases[this.getCurrentPhase()]?.name || '',
            speed: this.gameTime.speed,
            isDay: this.isDay(),
            isNight: this.isNight()
        };
    }

    /**
     * 设置时间更新回调
     */
    setOnTimeUpdate(callback) {
        this.onTimeUpdate = callback;
    }

    /**
     * 设置阶段变化回调
     */
    setOnPhaseChange(callback) {
        this.onPhaseChange = callback;
    }

    /**
     * 重置时钟
     */
    reset() {
        if (this.clock) {
            this.clock.stop();
            this.clock.start();
        }
        this.gameTime.hour = 8;
        this.gameTime.minute = 0;
    }

    /**
     * 销毁
     */
    dispose() {
        if (this.clock) {
            this.clock.stop();
            this.clock = null;
        }
        this.initialized = false;
    }
}

// 导出单例
const clockManager = new ClockManager();

export default clockManager;
export { ClockManager };
