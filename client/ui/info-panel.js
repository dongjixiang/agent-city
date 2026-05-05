/**
 * Info Panel - 在线智能体列表
 * 位置: 右上角，右下角悬浮按钮，点击后在右上角展开面板
 */
class InfoPanel {
  constructor() {
    this.collapsed = true;  // 默认收起
    this.agents = [];
    this.selectedAgent = null;
    this.container = null;
    this.detailPanel = null;
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;
    this._initialized = true;
    this.createPanel();
    this.createDetailPanel();
    this.bindEvents();
    this.setupWorldWindowListener();
  }

  createPanel() {
    // --- 右上角悬浮按钮 ---
    const toggleBtn = document.createElement('div');
    toggleBtn.id = 'info-toggle-btn';
    toggleBtn.innerHTML = '🦐';
    toggleBtn.title = '查看在线智能体';
    toggleBtn.style.cssText = `
      position: fixed; top: 60px; right: 20px;
      width: 48px; height: 48px; border-radius: 50%;
      background: rgba(26, 26, 46, 0.95);
      border: 2px solid rgba(78, 205, 196, 0.4);
      color: #4ecdc4; font-size: 22px;
      cursor: pointer; z-index: 101;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      transition: all 0.3s ease;
    `;
    toggleBtn.onclick = () => this.toggle();
    document.body.appendChild(toggleBtn);

    // --- 智能体列表面板 ---
    this.container = document.createElement('div');
    this.container.id = 'info-panel';
    window.infoPanel = this;

    this.container.innerHTML = `
      <style>
        #info-toggle-btn:hover {
          background: rgba(78, 205, 196, 0.15);
          border-color: #4ecdc4;
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(78, 205, 196, 0.25);
        }
        #info-toggle-btn .agent-badge {
          position: absolute; top: -6px; right: -6px;
          min-width: 20px; height: 20px; border-radius: 10px;
          background: #ff6b6b; color: white; font-size: 11px;
          display: flex; align-items: center; justify-content: center;
          padding: 0 4px; font-weight: bold;
        }
        #info-panel {
          position: fixed; top: 60px; right: 80px; width: 0; height: 0;
          background: rgba(26, 26, 46, 0.97); border-radius: 12px;
          color: #fff; z-index: 100; overflow: hidden;
          transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                      height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                      opacity 0.3s ease;
          font-family: 'Microsoft YaHei', sans-serif;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          border: 1px solid rgba(78, 205, 196, 0.25);
          opacity: 0;
        }
        #info-panel.visible {
          width: 300px; height: auto; max-height: calc(100vh - 120px);
          padding: 15px; opacity: 1;
          overflow-y: auto;
        }
        #info-panel::-webkit-scrollbar { width: 4px; }
        #info-panel::-webkit-scrollbar-thumb {
          background: rgba(78, 205, 196, 0.3); border-radius: 2px;
        }
        .info-panel-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px; padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .info-panel-title {
          font-size: 15px; color: #4ecdc4; font-weight: bold; margin: 0;
        }
        .info-panel-close {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(255,255,255,0.08); border: none;
          color: #888; font-size: 16px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .info-panel-close:hover {
          background: rgba(255,107,107,0.2); color: #ff6b6b;
        }
        .agent-count {
          font-size: 12px; color: #666; margin-bottom: 10px;
          padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .agent-item {
          background: rgba(255,255,255,0.04); border-radius: 8px;
          padding: 10px 12px; margin-bottom: 8px; cursor: pointer;
          transition: all 0.2s; border-left: 3px solid transparent;
          display: flex; align-items: center; gap: 10px;
        }
        .agent-item:hover {
          background: rgba(255,255,255,0.09);
          border-left-color: #4ecdc4;
        }
        .agent-item .avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #ff6b6b, #ffa500);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .agent-item .info { flex: 1; min-width: 0; }
        .agent-item .name {
          font-weight: bold; color: #ff6b6b; font-size: 13px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .agent-item .status {
          font-size: 11px; color: #888; margin-top: 2px;
          display: flex; align-items: center; gap: 5px;
        }
        .agent-item .status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #4ecdc4;
        }
        @keyframes infoPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .agent-item .status-dot { animation: infoPulse 2s infinite; }
      </style>
      <div class="info-panel-header">
        <div class="info-panel-title">🦐 在线智能体</div>
        <button class="info-panel-close" onclick="window.infoPanel && window.infoPanel.hide()">✕</button>
      </div>
      <div class="agent-count">共 <span id="agent-total">0</span> 个智能体</div>
      <div id="agent-list"></div>
    `;
    document.body.appendChild(this.container);

    // 更新按钮角标
    this._updateButtonBadge();
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
        #agent-detail .think-interval {
          margin-top: 15px; padding-top: 15px;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: space-between;
        }
        #agent-detail .think-interval label {
          font-size: 13px; color: #aaa;
        }
        #agent-detail .think-interval select {
          background: rgba(78, 205, 196, 0.15); border: 1px solid rgba(78, 205, 196, 0.3);
          color: #4ecdc4; padding: 5px 10px; border-radius: 6px; font-size: 12px;
          cursor: pointer;
        }
        #agent-detail .think-interval select:focus {
          outline: none; border-color: #4ecdc4;
        }
        #agent-detail .explore-cooldown {
          margin-top: 12px; padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px;
        }
        #agent-detail .explore-cooldown label {
          font-size: 13px; color: #aaa; flex-shrink: 0;
        }
        #agent-detail .explore-cooldown input[type="range"] {
          flex: 1; height: 4px; -webkit-appearance: none;
          background: rgba(78, 205, 196, 0.3); border-radius: 2px; cursor: pointer;
        }
        #agent-detail .explore-cooldown input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 14px; height: 14px;
          background: #4ecdc4; border-radius: 50%; cursor: pointer;
        }
        #agent-detail .explore-cooldown .cooldown-value {
          font-size: 12px; color: #4ecdc4; min-width: 40px; text-align: right;
        }
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
      <div class="think-interval">
        <label>思考间隔</label>
        <select id="detail-think-interval" onchange="window.infoPanel && window.infoPanel.onThinkIntervalChange(this.value)">
          <option value="60000">1分钟</option>
          <option value="120000">2分钟</option>
          <option value="300000" selected>5分钟</option>
          <option value="600000">10分钟</option>
          <option value="900000">15分钟</option>
        </select>
      </div>
      <div class="explore-cooldown">
        <label>探索冷却时间</label>
        <input type="range" id="detail-explore-cooldown" min="1" max="300" value="30"
          oninput="window.infoPanel && window.infoPanel.onExploreCooldownChange(this.value)">
        <span class="cooldown-value" id="detail-cooldown-value">30秒</span>
      </div>
    `;
    document.body.appendChild(this.detailPanel);

    this.detailPanel.addEventListener('click', (e) => {
      if (e.target === this.detailPanel) this.closeDetail();
    });
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeDetail();
    });
  }

  setupWorldWindowListener() {
    const originalUpdate = window.worldWindow?.updateAgentList?.bind(window.worldWindow);
    if (window.worldWindow) {
      window.worldWindow.updateAgentList = (agents) => {
        this.updateAgents(agents);
        if (originalUpdate) originalUpdate(agents);
      };
    }
    if (!window.worldWindow) {
      setTimeout(() => this.setupWorldWindowListener(), 1000);
    }
  }

  toggle() {
    if (this.collapsed) {
      this.show();
    } else {
      this.hide();
    }
  }

  show() {
    this.collapsed = false;
    this.container.classList.add('visible');
  }

  hide() {
    this.collapsed = true;
    this.container.classList.remove('visible');
  }

  updateAgents(agents) {
    this.agents = agents || [];
    this.render();
    this._updateButtonBadge();
  }

  _updateButtonBadge() {
    const btn = document.getElementById('info-toggle-btn');
    if (!btn) return;
    const count = this.agents.length;
    let badge = btn.querySelector('.agent-badge');
    if (count === 0) {
      if (badge) badge.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'agent-badge';
      btn.style.position = 'relative';
      btn.appendChild(badge);
    }
    badge.textContent = count > 99 ? '99+' : count;
  }

  render() {
    const listEl = document.getElementById('agent-list');
    const totalEl = document.getElementById('agent-total');

    if (totalEl) totalEl.textContent = this.agents.length;
    if (!listEl) return;

    if (this.agents.length === 0) {
      listEl.innerHTML = '<div style="color:#666;text-align:center;padding:20px;font-size:13px;">暂无在线智能体</div>';
      return;
    }

    listEl.innerHTML = this.agents.map(agent => {
      const name = agent.name || agent.agentName || '未知';
      const status = agent.status || '在线';
      const id = agent.agentId || '';
      const emoji = agent.emoji || '🦐';
      return `
        <div class="agent-item" onclick="window.infoPanel && window.infoPanel.showDetail('${id}')">
          <div class="avatar">${emoji}</div>
          <div class="info">
            <div class="name">${name}</div>
            <div class="status">
              <span class="status-dot"></span>
              ${status}
            </div>
          </div>
        </div>
      `;
    }).join('');
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

    const tagsEl = document.getElementById('detail-tags');
    const tags = agent.tags || [];
    tagsEl.innerHTML = tags.length > 0
      ? tags.map(t => `<span class="tag">${t}</span>`).join('')
      : '<span class="tag">智能体</span>';

    document.getElementById('detail-avatar').textContent = agent.emoji || '🦐';
    
    // 加载保存的思考间隔设置
    const savedInterval = localStorage.getItem(`agent_think_interval_${id}`);
    const intervalSelect = document.getElementById('detail-think-interval');
    if (intervalSelect) {
      intervalSelect.value = savedInterval || '300000'; // 默认5分钟
    }
    
    // 加载保存的探索冷却时间设置
    const savedCooldown = localStorage.getItem(`agent_explore_cooldown_${id}`);
    const cooldownInput = document.getElementById('detail-explore-cooldown');
    const cooldownValue = document.getElementById('detail-cooldown-value');
    if (cooldownInput) {
      cooldownInput.value = savedCooldown || '30'; // 默认30秒
      if (cooldownValue) cooldownValue.textContent = (savedCooldown || '30') + '秒';
    }
    
    this.detailPanel.classList.add('show');
  }

  /**
   * 更新智能体思考间隔
   */
  updateThinkInterval(agentId, intervalMs) {
    localStorage.setItem(`agent_think_interval_${agentId}`, String(intervalMs));
    console.log(`[InfoPanel] ${agentId} 思考间隔已更新为 ${intervalMs}ms`);
    
    // 发送到服务器
    if (window.worldWindow?.ws) {
      window.worldWindow.ws.send(JSON.stringify({
        type: 'UPDATE_AGENT_CONFIG',
        agentId: agentId,
        config: { thinkInterval: parseInt(intervalMs, 10) }
      }));
    }
    
    // 显示提示
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
      background: rgba(78, 205, 196, 0.95); color: #1a1a2e;
      padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: bold;
      z-index: 1000; animation: slideUp 0.3s ease;
    `;
    toast.textContent = `✅ 思考间隔已更新为 ${intervalMs / 1000}秒`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
  
  /**
   * 处理思考间隔下拉框变化
   */
  onThinkIntervalChange(intervalMs) {
    const agentId = document.getElementById('detail-id')?.textContent;
    if (agentId) {
      this.updateThinkInterval(agentId, parseInt(intervalMs, 10));
    }
  }
  
  /**
   * 更新探索冷却时间
   */
  updateExploreCooldown(agentId, cooldownSec) {
    localStorage.setItem(`agent_explore_cooldown_${agentId}`, String(cooldownSec));
    console.log(`[InfoPanel] ${agentId} 探索冷却时间已更新为 ${cooldownSec}秒`);
    
    // 发送到服务器
    if (window.worldWindow?.ws) {
      window.worldWindow.ws.send(JSON.stringify({
        type: 'UPDATE_AGENT_CONFIG',
        agentId: agentId,
        config: { exploreCooldown: parseInt(cooldownSec, 10) }
      }));
    }
    
    // 显示提示
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
      background: rgba(78, 205, 196, 0.95); color: #1a1a2e;
      padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: bold;
      z-index: 1000; animation: slideUp 0.3s ease;
    `;
    toast.textContent = `✅ 探索冷却时间已更新为 ${cooldownSec}秒`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
  
  /**
   * 处理探索冷却时间滑块变化
   */
  onExploreCooldownChange(cooldownSec) {
    const agentId = document.getElementById('detail-id')?.textContent;
    const cooldownValue = document.getElementById('detail-cooldown-value');
    if (cooldownValue) cooldownValue.textContent = cooldownSec + '秒';
    if (agentId) {
      this.updateExploreCooldown(agentId, parseInt(cooldownSec, 10));
    }
  }

  closeDetail() {
    this.detailPanel.classList.remove('show');
  }
}

// 创建全局实例
if (!window.infoPanel) {
  window.infoPanel = new InfoPanel();
  window.infoPanel.init();
}

export { InfoPanel };
