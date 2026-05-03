/**
 * ThoughtPanel - 显示选中智能体的思考内容
 *
 * @module ui/thought-panel
 */

class ThoughtPanel {
    constructor() {
        this.isVisible = true;
        this.thoughts = [];
        this.maxThoughts = 50;
        this.selectedAgentId = null;
        this.createToggleButton();
        this.createPanel();
        this.bindEvents();
    }

    createToggleButton() {
        const existing = document.getElementById('thought-toggle-btn');
        if (existing) existing.remove();

        const btn = document.createElement('div');
        btn.id = 'thought-toggle-btn';
        btn.innerHTML = `
            <style>
                #thought-toggle-btn {
                    position: fixed;
                    top: 10px;
                    right: 180px;
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: rgba(26, 26, 46, 0.92);
                    border: 1px solid rgba(156, 39, 176, 0.4);
                    color: #9c27b0;
                    z-index: 998;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 20px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    transition: all 0.3s;
                    font-family: 'Microsoft YaHei', sans-serif;
                }
                #thought-toggle-btn:hover {
                    background: rgba(156, 39, 176, 0.2);
                    transform: scale(1.1);
                }
                #thought-toggle-btn.panel-open {
                    opacity: 0.5;
                }
            </style>
            <span id="thought-toggle-icon">💭</span>
        `;
        btn.addEventListener('click', () => this.toggle());
        document.body.appendChild(btn);
        console.log('[ThoughtPanel] Toggle button created');
    }

    createPanel() {
        const existing = document.getElementById('thought-panel');
        if (existing) existing.remove();

        this.element = document.createElement('div');
        this.element.id = 'thought-panel';
        this.element.innerHTML = `
            <style>
                #thought-panel {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    width: 280px;
                    max-height: 60vh;
                    background: rgba(26, 26, 46, 0.92);
                    border-radius: 12px;
                    padding: 12px;
                    color: white;
                    z-index: 999;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                    border: 1px solid rgba(156, 39, 176, 0.25);
                    font-family: 'Microsoft YaHei', sans-serif;
                    animation: slideLeft 0.3s ease;
                }
                #thought-panel.hidden {
                    display: none;
                }
                @keyframes slideLeft {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                #thought-panel .panel-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding-bottom: 8px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                #thought-panel .panel-title {
                    font-size: 13px;
                    color: #9c27b0;
                    font-weight: bold;
                }
                #thought-panel .panel-agent {
                    font-size: 11px;
                    color: #aaa;
                }
                #thought-panel .thoughts-container {
                    flex: 1;
                    overflow-y: auto;
                    max-height: 40vh;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                #thought-panel .thoughts-container::-webkit-scrollbar {
                    width: 5px;
                }
                #thought-panel .thoughts-container::-webkit-scrollbar-thumb {
                    background: rgba(156, 39, 176, 0.3);
                    border-radius: 3px;
                }
                #thought-panel .thought-item {
                    padding: 8px 10px;
                    border-radius: 8px;
                    background: rgba(156, 39, 176, 0.1);
                    border-left: 3px solid #9c27b0;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #ddd;
                }
                #thought-panel .thought-time {
                    font-size: 10px;
                    color: #666;
                    margin-top: 4px;
                }
                #thought-panel .empty-hint {
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                    padding: 20px;
                }
                #thought-panel .clear-btn {
                    padding: 6px 10px;
                    border-radius: 6px;
                    border: none;
                    background: rgba(156, 39, 176, 0.2);
                    color: #9c27b0;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                #thought-panel .clear-btn:hover {
                    background: rgba(156, 39, 176, 0.4);
                }
            </style>
            <div class="panel-header">
                <span class="panel-title">💭 思想体现框</span>
                <button class="clear-btn" onclick="window.thoughtPanel?.clearThoughts()">清空</button>
            </div>
            <div class="panel-agent" id="thought-panel-agent">未选中智能体</div>
            <div class="thoughts-container" id="thoughts-container">
                <div class="empty-hint">点击智能体查看其思考</div>
            </div>
        `;
        document.body.appendChild(this.element);
        window.thoughtPanel = this;
        console.log('[ThoughtPanel] Panel created');
    }

    bindEvents() {
        // 监听智能体选中事件
        if (window.eventBus) {
            window.eventBus.on('agent:selected', (data) => {
                this.setSelectedAgent(data.agentId);
            });
        }

        // 监听思考消息
        window.addEventListener('showThoughtMessage', (e) => {
            this.addThought(e.detail.agentId, e.detail.content);
        });
    }

    setSelectedAgent(agentId) {
        this.selectedAgentId = agentId;
        const agentName = this.getAgentName(agentId);
        const agentEl = document.getElementById('thought-panel-agent');
        if (agentEl) {
            agentEl.textContent = agentName ? `当前选中: ${agentName}` : '未选中智能体';
        }
        // 选中的智能体会高亮显示
    }

    getAgentName(agentId) {
        if (window.app?.systems?.agent) {
            const agent = window.app.systems.agent.getAgent(agentId);
            return agent?.name || null;
        }
        return null;
    }

    toggle() {
        this.isVisible = !this.isVisible;
        const panel = document.getElementById('thought-panel');
        const toggleBtn = document.getElementById('thought-toggle-btn');
        const icon = document.getElementById('thought-toggle-icon');

        if (panel) panel.classList.toggle('hidden', !this.isVisible);
        if (toggleBtn) toggleBtn.classList.toggle('panel-open', !this.isVisible);
        if (icon) icon.textContent = this.isVisible ? '💭' : '💭';
    }

    addThought(agentId, content) {
        if (!content) return;

        // 不再过滤 - 只要有思考就显示
        const timestamp = new Date().toLocaleTimeString();
        const agentName = this.getAgentName(agentId) || agentId;
        const thought = { agentId, agentName, content, timestamp };
        this.thoughts.unshift(thought);

        // 限制数量
        if (this.thoughts.length > this.maxThoughts) {
            this.thoughts.pop();
        }

        this.render();
    }

    render() {
        const container = document.getElementById('thoughts-container');
        if (!container) return;

        if (this.thoughts.length === 0) {
            container.innerHTML = '<div class="empty-hint">点击智能体查看其思考</div>';
            return;
        }

        container.innerHTML = this.thoughts.map(t => `
            <div class="thought-item">
                <div style="color:#9c27b0;font-size:10px;margin-bottom:4px;">${this.escapeHtml(t.agentName || '智能体')}</div>
                ${this.escapeHtml(t.content)}
                <div class="thought-time">${t.timestamp}</div>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    clearThoughts() {
        this.thoughts = [];
        this.render();
    }
}

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ThoughtPanel());
} else {
    new ThoughtPanel();
}

export { ThoughtPanel };
