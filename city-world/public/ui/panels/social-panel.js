/**
 * SocialPanel - 社交面板
 *
 * 显示排行榜、关系、消息
 *
 * @module ui/panels/social-panel
 */

import { eventBus, Events } from '../../core/event-bus.js';

class SocialPanel {
    constructor() {
        this.panel = null;
        this.agents = [];
        this.relationships = [];
    }

    /**
     * 初始化
     */
    init(container) {
        this.container = container || document.body;
        this.createPanel();
        this.bindEvents();
    }

    /**
     * 创建面板
     */
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'social-panel';
        this.panel.className = 'panel';
        this.panel.innerHTML = `
            <div class="panel-header">
                <h3>🌐 社交</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="panel-content">
                <div class="tabs">
                    <button class="tab active" data-tab="leaderboard">排行榜</button>
                    <button class="tab" data-tab="relations">关系</button>
                    <button class="tab" data-tab="messages">消息</button>
                </div>
                <div class="tab-content" id="leaderboard">
                    <div class="list"></div>
                </div>
                <div class="tab-content" id="relations" style="display:none">
                    <div class="list"></div>
                </div>
                <div class="tab-content" id="messages" style="display:none">
                    <div class="list"></div>
                </div>
            </div>
        `;

        // Tab 切换
        this.panel.querySelectorAll('.tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.showTab(tab);
            });
        });

        this.panel.style.display = 'none';
        this.container.appendChild(this.panel);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        eventBus.on(Events.AGENT_ADDED, ({ agent }) => {
            this.agents.push(agent);
            this.renderLeaderboard();
        });

        eventBus.on(Events.AGENT_REMOVED, ({ agentId }) => {
            this.agents = this.agents.filter(a => a.id !== agentId);
            this.renderLeaderboard();
        });
    }

    /**
     * 显示 Tab
     */
    showTab(tabId) {
        this.panel.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.panel.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

        this.panel.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        this.panel.querySelector(`#${tabId}`).style.display = 'block';
    }

    /**
     * 渲染排行榜
     */
    renderLeaderboard() {
        const sorted = [...this.agents]
            .sort((a, b) => (b.reputation || 0) - (a.reputation || 0))
            .slice(0, 10);

        const list = this.panel.querySelector('#leaderboard .list');
        list.innerHTML = sorted.map((a, i) => `
            <div class="rank-item">
                <span class="rank">#${i + 1}</span>
                <span class="name">${a.name}</span>
                <span class="rep">${a.reputation || 0}</span>
            </div>
        `).join('');
    }

    /**
     * 显示
     */
    show() {
        this.panel.style.display = 'block';
        this.renderLeaderboard();
    }

    /**
     * 隐藏
     */
    hide() {
        this.panel.style.display = 'none';
    }
}

export { SocialPanel };
