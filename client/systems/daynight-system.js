/**
 * DayNightSystem - 昼夜系统
 * 
 * 控制游戏内时间流逝和日夜循环
 * 对应 DESIGN.md Section 5.4 日夜系统
 */

import * as THREE from 'three';
import { eventBus, Events } from '../core/event-bus.js';

class DayNightSystem {
    constructor() {
        this.timeScale = 60; // 1秒 = 1分钟游戏时间
        this.currentHour = 6; // 6:00 开始
        this.dayNumber = 1;
        
        this.phases = {
            night: { start: 21, end: 6, color: 0x0a0a20, intensity: 0.1 },
            dawn: { start: 6, end: 8, color: 0xff9966, intensity: 0.4 },
            morning: { start: 8, end: 12, color: 0xffffee, intensity: 0.7 },
            noon: { start: 12, end: 14, color: 0xffffcc, intensity: 1.0 },
            afternoon: { start: 14, end: 18, color: 0xffffee, intensity: 0.8 },
            evening: { start: 18, end: 21, color: 0xff6633, intensity: 0.4 }
        };

        this.lighting = null;
        this.sky = null;
        this.isRunning = false;
    }

    /**
     * 初始化
     */
    init(scene, lighting) {
        this.scene = scene;
        this.lighting = lighting;
        this.createSky();
        this.updateForHour(this.currentHour);
        return this;
    }

    /**
     * 创建天空
     */
    createSky() {
        // 简单天空球
        const skyGeo = new THREE.SphereGeometry(500, 32, 32);
        const skyMat = new THREE.MeshBasicMaterial({
            color: this.getPhaseColor('morning'),
            side: THREE.BackSide
        });
        this.sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(this.sky);
    }

    /**
     * 更新（每帧）
     */
    update(deltaTime) {
        if (!this.isRunning) return;

        // 增加游戏时间
        this.currentHour += (deltaTime * this.timeScale) / 3600;
        
        // 超过24小时
        if (this.currentHour >= 24) {
            this.currentHour -= 24;
            this.dayNumber++;
            eventBus.emit('day:new', { dayNumber: this.dayNumber });
        }

        // 检查阶段变化
        const newPhase = this.getCurrentPhase();
        if (this._lastPhase !== newPhase) {
            this._lastPhase = newPhase;
            eventBus.emit(Events.DAY_NIGHT_CHANGE, { phase: newPhase, hour: this.currentHour });
            this.updateForPhase(newPhase);
        }
    }

    /**
     * 获取当前阶段
     */
    getCurrentPhase() {
        if (this.currentHour >= 21 || this.currentHour < 6) return 'night';
        if (this.currentHour >= 6 && this.currentHour < 8) return 'dawn';
        if (this.currentHour >= 8 && this.currentHour < 12) return 'morning';
        if (this.currentHour >= 12 && this.currentHour < 14) return 'noon';
        if (this.currentHour >= 14 && this.currentHour < 18) return 'afternoon';
        if (this.currentHour >= 18 && this.currentHour < 21) return 'evening';
        return 'morning';
    }

    /**
     * 获取阶段颜色
     */
    getPhaseColor(phase) {
        const colors = {
            night: 0x0a0a20,
            dawn: 0xff9966,
            morning: 0xffffee,
            noon: 0xffffcc,
            afternoon: 0xffffee,
            evening: 0xff6633
        };
        return colors[phase] || colors.morning;
    }

    /**
     * 更新阶段
     */
    updateForPhase(phase) {
        const phaseConfig = this.phases[phase];
        const color = new THREE.Color(phaseConfig.color);

        // 更新天空
        if (this.sky) {
            this.sky.material.color.copy(color);
        }

        // 更新灯光
        if (this.lighting) {
            this.lighting.setAmbientIntensity(phaseConfig.intensity * 0.4);
            this.lighting.setSunIntensity(phaseConfig.intensity);
        }

        console.log(`[DayNight] Phase changed to ${phase} (${this.currentHour.toFixed(1)}h)`);
    }

    /**
     * 更新到指定小时
     */
    updateForHour(hour) {
        this.currentHour = hour;
        const phase = this.getCurrentPhase();
        this.updateForPhase(phase);
    }

    /**
     * 获取时间字符串
     */
    getTimeString() {
        const hour = Math.floor(this.currentHour);
        const minute = Math.floor((this.currentHour % 1) * 60);
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }

    /**
     * 获取昼夜描述
     */
    getPhaseDescription() {
        const phase = this.getCurrentPhase();
        const descriptions = {
            night: '🌙 夜晚 - 万家灯火',
            dawn: '🌅 黎明 - 朝霞满天',
            morning: '☀️ 上午 - 精神饱满',
            noon: '☀️ 正午 - 阳光明媚',
            afternoon: '🌤️ 下午 - 慵懒时光',
            evening: '🌆 傍晚 - 华灯初上'
        };
        return descriptions[phase] || descriptions.morning;
    }

    /**
     * 开始
     */
    start() {
        this.isRunning = true;
    }

    /**
     * 暂停
     */
    pause() {
        this.isRunning = false;
    }

    /**
     * 设置时间倍率
     */
    setTimeScale(scale) {
        this.timeScale = scale;
    }

    /**
     * 设置具体时间
     */
    setTime(hour) {
        this.currentHour = hour;
        const phase = this.getCurrentPhase();
        this.updateForPhase(phase);
    }

    /**
     * 获取状态
     */
    getStatus() {
        return {
            hour: this.currentHour,
            timeString: this.getTimeString(),
            phase: this.getCurrentPhase(),
            description: this.getPhaseDescription(),
            dayNumber: this.dayNumber
        };
    }

    /**
     * 销毁
     */
    dispose() {
        if (this.sky) {
            this.scene.remove(this.sky);
            this.sky.geometry.dispose();
            this.sky.material.dispose();
        }
    }
}

const dayNightSystem = new DayNightSystem();

export { DayNightSystem, dayNightSystem };
