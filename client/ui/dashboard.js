/**
 * Dashboard Panel - 实时监控面板
 * 右下角按钮，点击后在屏幕中央弹出
 */
class DashboardPanel {
  constructor() {
    this.panel = null;
    this.overlay = null;
    this.stats = { agents: 0, tasks: 0, messages: 0, ideas: 0 };
    this.visible = false;
    this.createPanel();
  }
  
  init() {
    // Panel already created in constructor
  }
  
  createPanel() {
    // --- 遮罩层 ---
    this.overlay = document.createElement('div');
    this.overlay.id = 'dashboard-overlay';
    this.overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      z-index: 9998; display: none; opacity: 0;
      transition: opacity 0.3s ease;
    `;
    this.overlay.addEventListener('click', () => this.hide());
    document.body.appendChild(this.overlay);

    // --- 面板主体 ---
    this.panel = document.createElement('div');
    this.panel.id = 'dashboard-panel';
    window.dashboardPanel = this;

    const statsHTML = `
      <style>
        #dashboard-overlay.show {
          display: block !important;
          opacity: 1 !important;
        }
        #dashboard-panel {
          position: fixed; top: 50%; left: 50%;
          transform: translate(-50%, -50%) scale(0.9);
          width: 360px; max-height: 80vh; overflow-y: auto;
          background: rgba(26, 26, 46, 0.98); border-radius: 15px;
          padding: 20px; color: white;
          font-family: 'Microsoft YaHei', sans-serif;
          z-index: 9999; display: none;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(78, 205, 196, 0.3);
          transition: transform 0.3s ease, opacity 0.3s ease;
          opacity: 0;
        }
        #dashboard-panel.visible {
          display: block !important;
          opacity: 1 !important;
          transform: translate(-50%, -50%) scale(1) !important;
        }
        #dashboard-panel .panel-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 15px; padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        #dashboard-panel .panel-title {
          font-size: 18px; color: #4ecdc4; font-weight: bold; margin: 0;
        }
        #dashboard-panel .close-btn {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,0.1); border: none;
          color: #aaa; font-size: 18px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        #dashboard-panel .close-btn:hover {
          background: rgba(255,107,107,0.2); color: #ff6b6b;
        }
        .stat-row {
          display: flex; justify-content: space-between; align-items: center;
          margin: 12px 0; padding: 12px;
          background: rgba(255, 255, 255, 0.05); border-radius: 10px;
          transition: background 0.2s;
        }
        .stat-row:hover { background: rgba(255,255,255,0.08); }
        .stat-label { font-size: 14px; color: #aaa; }
        .stat-value { font-size: 28px; font-weight: bold; color: #4ecdc4; }
        .activity-indicator {
          display: flex; align-items: center; gap: 8px;
          margin-top: 15px; padding-top: 15px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .pulse-dot {
          width: 10px; height: 10px; background: #4ecdc4; border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        .recent-activity { font-size: 12px; color: #888; margin-top: 5px; }
        .mini-chart { margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); }
        .bar-container { display: flex; align-items: center; gap: 10px; margin: 8px 0; }
        .bar-label { width: 70px; font-size: 12px; color: #888; }
        .bar-track { flex: 1; height: 18px; background: rgba(255,255,255,0.1); border-radius: 9px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 9px; transition: width 0.5s ease; }

        /* --- 右下角悬浮按钮 --- */
        #dashboard-toggle-btn {
          position: fixed; bottom: 20px; right: 20px;
          width: 56px; height: 56px; border-radius: 50%;
          background: rgba(26, 26, 46, 0.95);
          border: 2px solid rgba(78, 205, 196, 0.5);
          color: #4ecdc4; font-size: 24px;
          cursor: pointer; z-index: 100;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          transition: all 0.3s ease;
        }
        #dashboard-toggle-btn:hover {
          background: rgba(78, 205, 196, 0.15);
          border-color: #4ecdc4;
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(78, 205, 196, 0.3);
        }
        #dashboard-toggle-btn .badge {
          position: absolute; top: -4px; right: -4px;
          min-width: 20px; height: 20px; border-radius: 10px;
          background: #ff6b6b; color: white; font-size: 11px;
          display: flex; align-items: center; justify-content: center;
          padding: 0 4px;
        }
      </style>
      <div class="panel-header">
        <div class="panel-title">📊 智体城实时监控</div>
        <button class="close-btn" onclick="if(window.dashboardPanel){window.dashboardPanel.hide();}">✕</button>
      </div>
      <div class="stat-row">
        <span class="stat-label">🦐 在线智能体</span>
        <span class="stat-value" id="stat-agents">0</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">📋 进行中任务</span>
        <span class="stat-value" id="stat-tasks">0</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">💬 消息数量</span>
        <span class="stat-value" id="stat-messages">0</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">💡 创意数量</span>
        <span class="stat-value" id="stat-ideas">0</span>
      </div>
      <div class="activity-indicator">
        <div class="pulse-dot"></div>
        <span>系统运行正常</span>
      </div>
      <div class="recent-activity" id="recent-activity">最后更新: 刚刚</div>
      <div class="mini-chart">
        <div class="bar-container">
          <span class="bar-label">AI助手</span>
          <div class="bar-track">
            <div class="bar-fill" id="bar-ai" style="width: 0%; background: #6366f1;"></div>
          </div>
        </div>
        <div class="bar-container">
          <span class="bar-label">专业团队</span>
          <div class="bar-track">
            <div class="bar-fill" id="bar-pro" style="width: 0%; background: #f97316;"></div>
          </div>
        </div>
        <div class="bar-container">
          <span class="bar-label">观察者</span>
          <div class="bar-track">
            <div class="bar-fill" id="bar-observer" style="width: 0%; background: #06b6d4;"></div>
          </div>
        </div>
      </div>
    `;

    this.panel.innerHTML = statsHTML;
    document.body.appendChild(this.panel);

    // --- 右下角悬浮按钮 ---
    const toggleBtn = document.createElement('div');
    toggleBtn.id = 'dashboard-toggle-btn';
    toggleBtn.innerHTML = '📊';
    toggleBtn.title = '打开智体城监控面板';
    toggleBtn.onclick = () => this.toggle();
    document.body.appendChild(toggleBtn);

    window.dashboardPanel.update(window.agentList, window.taskCount, window.messageCount);
  }
  
  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    this.visible = true;
    this.panel.classList.add('visible');
    this.overlay.classList.add('show');
  }

  hide() {
    this.visible = false;
    this.panel.classList.remove('visible');
    this.overlay.classList.remove('show');
  }

  update(agents, tasks, messages) {
    const totalAgents = agents ? agents.length : 0;
    this.animateNumber('stat-agents', totalAgents);
    this.animateNumber('stat-tasks', tasks || 0);
    this.animateNumber('stat-messages', messages || 0);
    
    if (agents) {
      const aiCount = agents.filter(a => a.tags && (a.tags.includes('ai') || a.tags.includes('assistant'))).length;
      const proCount = agents.filter(a => a.tags && (a.tags.includes('analyst') || a.tags.includes('coordinator') || a.tags.includes('creative') || a.tags.includes('guardian'))).length;
      const observerCount = agents.filter(a => a.tags && a.tags.includes('observer')).length;
      const maxAgents = Math.max(totalAgents, 1);
      this.updateBar('bar-ai', (aiCount / maxAgents) * 100);
      this.updateBar('bar-pro', (proCount / maxAgents) * 100);
      this.updateBar('bar-observer', (observerCount / maxAgents) * 100);
    }
    
    const recentEl = document.getElementById('recent-activity');
    if (recentEl) {
      recentEl.textContent = `最后更新: ${new Date().toLocaleTimeString('zh-CN')}`;
    }

    // 更新按钮角标
    const btn = document.getElementById('dashboard-toggle-btn');
    if (btn && totalAgents > 0) {
      let badge = btn.querySelector('.badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'badge';
        btn.style.position = 'relative';
        btn.appendChild(badge);
      }
      badge.textContent = totalAgents > 99 ? '99+' : totalAgents;
    }
  }
  
  animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const currentValue = parseInt(element.textContent) || 0;
    const diff = targetValue - currentValue;
    const steps = 20;
    const stepValue = diff / steps;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      element.textContent = Math.round(currentValue + stepValue * step);
      if (step >= steps) {
        clearInterval(interval);
        element.textContent = targetValue;
      }
    }, 30);
  }
  
  updateBar(barId, percentage) {
    const bar = document.getElementById(barId);
    if (bar) {
      bar.style.width = Math.min(percentage, 100) + '%';
    }
  }
}

window.DashboardPanel = DashboardPanel;

// Auto-create instance when script loads
setTimeout(function() {
  if (!window.dashboardPanel) {
    window.dashboardPanel = new DashboardPanel();
  }
}, 1500);

// Export alias for ES modules
export { DashboardPanel as Dashboard };
