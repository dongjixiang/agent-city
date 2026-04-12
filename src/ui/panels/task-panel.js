/**
 * TaskPanel - 任务面板
 *
 * 显示可用任务和已领取任务
 *
 * @module ui/panels/task-panel
 */

import { eventBus, Events } from '../../core/event-bus.js';

class TaskPanel {
    constructor() {
        this.panel = null;
        this.tasks = [];
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
        this.panel.id = 'task-panel';
        this.panel.className = 'panel';
        this.panel.innerHTML = `
            <div class="panel-header">
                <h3>📋 任务</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="panel-content">
                <div class="section">
                    <h4>可用任务</h4>
                    <div class="task-list" id="available-tasks">
                        <div class="empty">暂无任务</div>
                    </div>
                </div>
                <div class="section">
                    <h4>进行中</h4>
                    <div class="task-list" id="active-tasks">
                        <div class="empty">暂无任务</div>
                    </div>
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
        eventBus.on(Events.AGENT_MESSAGE, ({ type, task }) => {
            if (type === 'task-added') {
                this.addTask(task);
            }
        });
    }

    /**
     * 添加任务
     */
    addTask(task) {
        this.tasks.push(task);
        this.render();
    }

    /**
     * 渲染任务列表
     */
    render() {
        const available = this.tasks.filter(t => t.status === 'available');
        const active = this.tasks.filter(t => t.status === 'accepted');

        const availableEl = this.panel.querySelector('#available-tasks');
        const activeEl = this.panel.querySelector('#active-tasks');

        availableEl.innerHTML = available.length === 0
            ? '<div class="empty">暂无任务</div>'
            : available.map(t => this._renderTaskItem(t)).join('');

        activeEl.innerHTML = active.length === 0
            ? '<div class="empty">暂无任务</div>'
            : active.map(t => this._renderTaskItem(t)).join('');
    }

    _renderTaskItem(task) {
        return `
            <div class="task-item" data-id="${task.id}">
                <div class="task-title">${task.title}</div>
                <div class="task-reward">💰 ${task.reward}</div>
            </div>
        `;
    }

    /**
     * 显示
     */
    show() {
        this.panel.style.display = 'block';
        this.render();
    }

    /**
     * 隐藏
     */
    hide() {
        this.panel.style.display = 'none';
    }
}

export { TaskPanel };
