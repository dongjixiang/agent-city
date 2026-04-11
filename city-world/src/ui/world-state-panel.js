/**
 * WorldStatePanel - 世界状态面板
 * 
 * 显示世界状态信息（天气、时间、在线人数等）
 * 对应 DESIGN.md Section 8.3 Dashboard
 */

import { worldState } from '../world/world-state.js';

class WorldStatePanel {
    constructor() {
        this.container = null;
        this.elements = {};
        this.isVisible = false;
        this.updateInterval = null;
    }

    /**
     * 初始化
     */
    init() {
        this.createPanel();
        this.bindEvents();
        this.startUpdates();
        return this;
    }

    /**
     * 创建面板
     */
    createPanel() {
        // 创建面板容器
        this.container = document.createElement('div');
        this.container.id = 'world-state-panel';
        this.container.style.cssText = `
            position: fixed;
            top: 60px;
            left: 10px;
            background: rgba(26, 26, 46, 0.95);
            border-radius: 10px;
            padding: 15px;
            color: #fff;
            z-index: 100;
            min-width: 200px;
            font-family: 'Microsoft YaHei', sans-serif;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: opacity 0.3s, transform 0.3s;
        `;

        // 标题
        const title = document.createElement('h3');
        title.textContent = '🌍 世界状态';
        title.style.cssText = 'margin: 0 0 12px 0; color: #4ecdc4; font-size: 14px;';
        this.container.appendChild(title);

        // 状态项容器
        this.elements.content = document.createElement('div');
        this.elements.content.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
        this.container.appendChild(this.elements.content);

        // 添加到 body
        document.body.appendChild(this.container);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 监听世界状态变化
        worldState.addChangeListener((summary) => {
            this.updateDisplay(summary);
        });
    }

    /**
     * 开始更新
     */
    startUpdates() {
        // 初始显示
        this.updateDisplay(worldState.getSummary());

        // 定时更新
        this.updateInterval = setInterval(() => {
            this.updateDisplay(worldState.getSummary());
        }, 1000);
    }

    /**
     * 更新显示
     */
    updateDisplay(summary) {
        if (!this.elements.content) return;

        const timeStatus = this.getTimeStatus();
        const weatherStatus = this.getWeatherStatus();

        this.elements.content.innerHTML = `
            <div class="status-item" style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #888;">🕐 时间</span>
                <span style="color: #4ecdc4; font-weight: bold;">${timeStatus}</span>
            </div>
            <div class="status-item" style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #888;">📅 天数</span>
                <span style="color: #fff;">第 ${summary.dayNumber || 1} 天</span>
            </div>
            <div class="status-item" style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #888;">${weatherStatus.icon}</span>
                <span style="color: #fff;">${weatherStatus.text}</span>
            </div>
            <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 8px 0;"></div>
            <div class="status-item" style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #888;">🦐 智能体</span>
                <span style="color: #ff6b6b; font-weight: bold;">${summary.agentCount || 0}</span>
            </div>
            <div class="status-item" style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #888;">🏠 建筑</span>
                <span style="color: #fff;">${summary.buildingCount || 0}</span>
            </div>
            <div class="status-item" style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #888;">🌳 装饰</span>
                <span style="color: #fff;">${summary.decorationCount || 0}</span>
            </div>
        `;
    }

    /**
     * 获取时间状态
     */
    getTimeStatus() {
        const hours = worldState.getGameHours();
        const hour = Math.floor(hours);
        const minute = Math.floor((hours % 1) * 60);
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        const phase = worldState.getDayNightPhase();
        const icons = {
            night: '🌙',
            dawn: '🌅',
            morning: '☀️',
            noon: '🌞',
            afternoon: '🌤️',
            evening: '🌆'
        };

        return `${icons[phase] || '☀️'} ${timeStr}`;
    }

    /**
     * 获取天气状态
     */
    getWeatherStatus() {
        const weather = worldState.weather;
        const statuses = {
            clear: { icon: '☀️', text: '晴朗' },
            cloudy: { icon: '☁️', text: '多云' },
            rainy: { icon: '🌧️', text: '下雨' },
            stormy: { icon: '⛈️', text: '暴风雨' },
            snowy: { icon: '❄️', text: '下雪' },
            foggy: { icon: '🌫️', text: '有雾' }
        };
        return statuses[weather] || statuses.clear;
    }

    /**
     * 显示
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
            this.isVisible = true;
        }
    }

    /**
     * 隐藏
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.isVisible = false;
        }
    }

    /**
     * 切换显示
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * 销毁
     */
    dispose() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

const worldStatePanel = new WorldStatePanel();

export { WorldStatePanel, worldStatePanel };
