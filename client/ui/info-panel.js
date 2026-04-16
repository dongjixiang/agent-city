/**
 * Info Panel - 在线智能体列表 (从旧版 city-world 移植)
 * 位置: 右上角，可收缩，显示所有在线智能体
 */
class InfoPanel {
  constructor() {
    this.collapsed = false;
    this.agents = [];
    this.selectedAgent = null;
    this.container = null;
    this.detailPanel = null;
  }

  init() {
    this.createPanel();
    this.createDetailPanel();
    this.bindEvents();
    // 监听 WorldWindow 的消息来更新列表
    this.setupWorldWindowListener();
  }

  createPanel() {
    this.container = document.createElement('div');
    this.container.id = 'info-panel';
    this.container.innerHTML = `
      <style>
        #info-panel {
          position: fixed; top: 60px; right: 10px; width: 280px;
          background: rgba(26, 26, 46, 0.95); border-radius: 10px;
          padding: 15px; color: #fff; z-index: 100;
          max-height: calc(100vh - 80px); overflow-y: auto;
          transition: width 0.3s ease, padding 0.3s ease, opacity 0.3s ease;
          font-family: 'Microsoft YaHei', sans-serif;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(78, 205, 196, 0.2);
        }
        #info-panel.collapsed {
          width: 0; padding: 0; overflow: hidden; opacity: 0;
        }
        #info-panel h3 {
          color: #4ecdc4; margin-bottom: 10px; font-size: 14px;
          cursor: pointer; user-select: none; display: flex;
          align-items: center; justify-content: space-between;
        }
        #info-panel h3:hover { color: #7ef0e5; }
        #info-panel h3 .collapse-icon {
          margin-right: 8px; transition: transform 0.3s;
          display: inline-block; font-size: 12px;
        }
        #info-panel.collapsed h3 { opacity: 0; }
        #info-panel h3.collapsed .collapse-icon { transform: rotate(-90deg); }
        .agent-item {
          background: rgba(255,255,255,0.05); border-radius: 8px;
          padding: 10px; margin-bottom: 8px; cursor: pointer;
          transition: all 0.2s; border-left: 3px solid transparent;
        }
        .agent-item:hover {
          background: rgba(255,255,255,0.1);
          border-left-color: #4ecdc4;
        }
        .agent-item .name {
          font-weight: bold; color: #ff6b6b; font-size: 14px;
        }
        .agent-item .status {
          font-size: 12px; color: #888; margin-top: 3px;
          display: flex; align-items: center; gap: 5px;
        }
        .agent-item .status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #4ecdc4; animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .agent-count {
          font-size: 12px; color: #666; margin-bottom: 10px;
          padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        #info-panel::-webkit-scrollbar { width: 4px; }
        #info-panel::-webkit-scrollbar-thumb {
          background: rgba(78, 205, 196, 0.3); border-radius: 2px;
        }
      </style>
      <h3 onclick="window.infoPanel && window.infoPanel.toggle()">
        <span>
          <span class="collapse-icon">▼</span>
          🦐 智能体在线
        </span>
        <span id="agent-count-badge" style="font-size:12px;color:#888;">0</span>
      </h3>
      <div id="agent-list-container">
        <div class="agent-count">共 <span id="agent-total">0</span> 个智能体在线</div>
        <div id="agent-list"></div>
      </div>
    `;
    document.body.appendChild(this.container);
    window.infoPanel = this;
  }

  createDetailPanel() {
    this.detailPanel = document.createElement('div');
    this.detailPanel.id = 'agent-detail';
    this.detailPanel.innerHTML = `
      <style>
        #agent-detail {
          position: fixed; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(26, 26, 46, 0.98); border-radius: 15px;
          padding: 25px; min-width: 350px; color: #fff; z-index: 200;
          display: none; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          font-family: 'Microsoft YaHei', sans-serif;
          border: 1px solid rgba(78, 205, 196, 0.3);
        }
        #agent-detail.show { display: block; animation: fadeIn 0.3s; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        #agent-detail .close-btn {
          position: absolute; top: 10px; right: 15px; font-size: 20px;
          cursor: pointer; color: #888;
        }
        #agent-detail .close-btn:hover { color: #fff; }
        #agent-detail .avatar {
          width: 80px; height: 80px; background: linear-gradient(135deg, #ff6b6b, #ffa500);
          border-radius: 50%; display: flex; align-items: center;
          justify-content: center; font-size: 40px; margin: 0 auto 15px;
        }
        #agent-detail .name { text-align: center; font-size: 22px; font-weight: bold; color: #ff6b6b; margin-bottom: 5px; }
        #agent-detail .agent-id { text-align: center; font-size: 11px; color: #666; margin-bottom: 15px; }
        #agent-detail .tags { display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; margin-bottom: 15px; }
        #agent-detail .tag {
          background: rgba(78, 205, 196, 0.2); color: #4ecdc4;
          padding: 3px 10px; border-radius: 12px; font-size: 12px;
        }
        #agent-detail .stats-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
          margin-top: 15px; padding-top: 15px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        #agent-detail .stat-item { text-align: center; }
        #agent-detail .stat-value { font-size: 20px; font-weight: bold; color: #4ecdc4; }
        #agent-detail .stat-label { font-size: 11px; color: #888; }
      </style>
      <div class="close-btn" onclick="window.infoPanel && window.infoPanel.closeDetail()">×</div>
      <div class="avatar" id="detail-avatar">🦐</div>
      <div class="name" id="detail-name">未知</div>
      <div class="agent-id" id="detail-id">-</div>
      <div class="tags" id="detail-tags"></div>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value" id="detail-energy">-</div>
          <div class="stat-label">精力</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" id="detail-reputation">-</div>
          <div class="stat-label">声誉</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" id="detail-tasks">-</div>
          <div class="stat-label">任务</div>
        </div>
      </div>
    `;
    document.body.appendChild(this.detailPanel);

    // 点击背景关闭
    this.detailPanel.addEventListener('click', (e) => {
      if (e.target === this.detailPanel) this.closeDetail();
    });
  }

  bindEvents() {
    // ESC 关闭详情
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeDetail();
    });
  }

  setupWorldWindowListener() {
    // 监听 WorldWindow 的消息来获取智能体列表更新
    const originalUpdate = window.worldWindow?.updateAgentList.bind(window.worldWindow);
    if (window.worldWindow) {
      window.worldWindow.updateAgentList = (agents) => {
        this.updateAgents(agents);
        if (originalUpdate) originalUpdate(agents);
      };
    }
    // 如果 WorldWindow 还没加载，等待一下
    if (!window.worldWindow) {
      setTimeout(() => this.setupWorldWindowListener(), 1000);
    }
  }

  toggle() {
    this.collapsed = !this.collapsed;
    const h3 = this.container.querySelector('h3');
    if (this.collapsed) {
      this.container.classList.add('collapsed');
      h3.classList.add('collapsed');
    } else {
      this.container.classList.remove('collapsed');
      h3.classList.remove('collapsed');
    }
  }

  updateAgents(agents) {
    this.agents = agents || [];
    this.render();
  }

  render() {
    const listEl = document.getElementById('agent-list');
    const totalEl = document.getElementById('agent-total');
    const badgeEl = document.getElementById('agent-count-badge');

    if (totalEl) totalEl.textContent = this.agents.length;
    if (badgeEl) badgeEl.textContent = this.agents.length;

    if (!listEl) return;

    if (this.agents.length === 0) {
      listEl.innerHTML = '<div style="color:#666;text-align:center;padding:20px;font-size:13px;">暂无在线智能体</div>';
      return;
    }

    let html = '';
    this.agents.forEach(agent => {
      const name = agent.name || agent.agentName || '未知';
      const status = agent.status || '在线';
      const id = agent.agentId || '';
      html += `
        <div class="agent-item" onclick="window.infoPanel && window.infoPanel.showDetail('${id}')">
          <div class="name">${name}</div>
          <div class="status">
            <span class="status-dot"></span>
            ${status}
          </div>
        </div>
      `;
    });
    listEl.innerHTML = html;
  }

  showDetail(agentId) {
    const agent = this.agents.find(a => (a.agentId || '') === agentId);
    if (!agent) return;

    const name = agent.name || agent.agentName || '未知';
    const id = agent.agentId || '';

    document.getElementById('detail-name').textContent = name;
    document.getElementById('detail-id').textContent = id;
    document.getElementById('detail-energy').textContent = agent.energy || agent.needs?.energy || '-';
    document.getElementById('detail-reputation').textContent = agent.reputation || '-';
    document.getElementById('detail-tasks').textContent = agent.tasksCompleted || agent.tasks || '0';

    // 标签
    const tagsEl = document.getElementById('detail-tags');
    const tags = agent.tags || [];
    if (tags.length > 0) {
      tagsEl.innerHTML = tags.map(t => `<span class="tag">${t}</span>`).join('');
    } else {
      tagsEl.innerHTML = '<span class="tag">智能体</span>';
    }

    // 头像 emoji
    const avatarEl = document.getElementById('detail-avatar');
    avatarEl.textContent = agent.emoji || '🦐';

    this.detailPanel.classList.add('show');
  }

  closeDetail() {
    this.detailPanel.classList.remove('show');
  }
}

// 创建全局实例
window.infoPanel = new InfoPanel();

export { InfoPanel };
