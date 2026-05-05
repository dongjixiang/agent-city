/**
 * AgentPanel - 智能体详情面板
 *
 * 显示选中智能体的详细信息
 *
 * @module ui/panels/agent-panel
 */

import { eventBus, Events } from '../../core/event-bus.js';

class AgentPanel {
    constructor() {
        this.panel = null;
        this.currentAgent = null;
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
        this.panel.id = 'agent-panel';
        this.panel.className = 'panel';
        this.panel.innerHTML = `
            <div class="panel-header">
                <h3>智能体详情</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="panel-content">
                <div class="avatar">🦐</div>
                <div class="name">-</div>
                <div class="stats">
                    <div class="stat"><span>能量:</span><span class="energy">-</span></div>
                    <div class="stat"><span>心情:</span><span class="emotion">-</span></div>
                    <div class="stat"><span>声誉:</span><span class="reputation">-</span></div>
                </div>
                <div class="actions">
                    <button data-action="follow">跟随</button>
                    <button data-action="talk">交谈</button>
                </div>
            </div>
        `;
        this.panel.style.display = 'none';
        this.container.appendChild(this.panel);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        eventBus.on(Events.AGENT_SELECTED, ({ agent }) => {
            this.show(agent);
        });

        eventBus.on(Events.AGENT_DESELECTED, () => {
            this.hide();
        });

        this.panel.querySelector('.close-btn').addEventListener('click', () => {
            this.hide();
        });
    }

    /**
     * 显示
     */
    show(agent) {
        this.currentAgent = agent;
        this.panel.querySelector('.name').textContent = agent.name || agent.id;
        this.panel.querySelector('.energy').textContent = agent.needs?.energy ?? '-';
        this.panel.querySelector('.emotion').textContent = agent.emotion || 'neutral';
        this.panel.querySelector('.reputation').textContent = agent.reputation ?? '-';
        this.panel.style.display = 'block';
    }

    /**
     * 隐藏
     */
    hide() {
        this.currentAgent = null;
        this.panel.style.display = 'none';
    }
}

export { AgentPanel };
