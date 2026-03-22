/**
 * World Window - Bridge between external world and Agent City
 * Enhanced with agent reply display above head
 */
class WorldWindow {
  constructor() {
    this.messages = [];
    this.maxMessages = 100;
    this.container = null;
    this.ws = null;
    this.targetAgent = null;
    this.init();
  }
  
  init() {
    this.container = document.createElement('div');
    this.container.id = 'world-window';
    
    var styles = document.createElement('style');
    styles.textContent = `
      #world-window {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 550px;
        max-width: 90vw;
        background: rgba(26, 26, 46, 0.92);
        border-radius: 15px;
        border: 1px solid rgba(78, 205, 196, 0.3);
        box-shadow: 0 5px 30px rgba(0, 0, 0, 0.5);
        z-index: 1000;
        font-family: 'Microsoft YaHei', sans-serif;
      }
      .ww-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 15px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        cursor: pointer;
      }
      .ww-title {
        color: #4ecdc4;
        font-size: 14px;
        font-weight: bold;
      }
      .ww-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #4ecdc4;
      }
      .ww-status-dot.offline {
        background: #ff6b6b;
      }
      .ww-content {
        height: 180px;
        overflow-y: auto;
        padding: 10px;
      }
      .ww-content::-webkit-scrollbar {
        width: 6px;
      }
      .ww-content::-webkit-scrollbar-thumb {
        background: rgba(78, 205, 196, 0.3);
        border-radius: 3px;
      }
      .ww-item {
        padding: 8px 10px;
        border-radius: 8px;
        margin-bottom: 6px;
        background: rgba(255,255,255,0.03);
        border-left: 3px solid #4ecdc4;
      }
      .ww-item.event {
        border-left-color: #ffc107;
      }
      .ww-item.task {
        border-left-color: #ff6b6b;
      }
      .ww-item.reply {
        border-left-color: #9c27b0;
        background: rgba(156, 39, 176, 0.1);
      }
      .ww-item-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
      }
      .ww-item-from {
        color: #ff6b6b;
        font-weight: bold;
        font-size: 13px;
      }
      .ww-item-time {
        color: #666;
        font-size: 11px;
      }
      .ww-item-content {
        color: #ccc;
        font-size: 13px;
        line-height: 1.4;
      }
      .ww-input-area {
        padding: 10px;
        border-top: 1px solid rgba(255,255,255,0.1);
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .ww-input {
        flex: 1;
        min-width: 150px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 10px;
        color: #fff;
        font-size: 13px;
        outline: none;
      }
      .ww-input:focus {
        border-color: #4ecdc4;
      }
      .ww-btn {
        padding: 10px 15px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-size: 13px;
        font-weight: bold;
        background: linear-gradient(135deg, #4ecdc4, #2196f3);
        color: #fff;
      }
      .ww-btn:hover {
        opacity: 0.9;
      }
      .ww-btn-task {
        background: linear-gradient(135deg, #ff6b6b, #ff8a65);
      }
      .ww-btn-agent {
        background: linear-gradient(135deg, #9c27b0, #673ab7);
      }
      .ww-agent-select {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 8px;
        color: #fff;
        font-size: 12px;
        outline: none;
        max-width: 150px;
      }
      .ww-collapsed .ww-content,
      .ww-collapsed .ww-input-area {
        display: none;
      }
      .ww-target-info {
        padding: 5px 10px;
        font-size: 12px;
        color: #9c27b0;
        background: rgba(156, 39, 176, 0.1);
        border-radius: 4px;
        margin: 0 10px 5px;
      }
    `;
    document.head.appendChild(styles);
    
    this.container.innerHTML = `
      <div class="ww-header" onclick="window.worldWindow.toggle()">
        <div class="ww-title">🌐 世界之窗 - 与智体城沟通</div>
        <div class="ww-status-dot" id="ww-dot"></div>
      </div>
      <div class="ww-content" id="ww-content">
        <div style="color:#666;text-align:center;padding:20px;">正在连接智体城...</div>
      </div>
      <div class="ww-target-info" id="ww-target-info" style="display:none;">
        目标: <span id="ww-target-name">全部</span>
      </div>
      <div class="ww-input-area">
        <select class="ww-agent-select" id="ww-agent-select" onchange="window.worldWindow.selectAgent()">
          <option value="">全部智能体</option>
        </select>
        <input type="text" class="ww-input" id="ww-input" placeholder="输入消息发送给智体城...">
        <button class="ww-btn" onclick="window.worldWindow.send()">发送</button>
        <button class="ww-btn ww-btn-task" onclick="window.worldWindow.showTask()">任务</button>
      </div>
    `;
    
    document.body.appendChild(this.container);
    
    document.getElementById('ww-input').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') window.worldWindow.send();
    });
    
    this.connect();
  }
  
  connect() {
    var host = window.location.hostname || 'localhost';
    var wsUrl = 'ws://' + host + ':9876';
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = function() {
        document.getElementById('ww-dot').classList.remove('offline');
        window.worldWindow.addEvent('已连接智体城', '系统');
        // 世界之窗只是一个查看工具，不注册为智能体
        // 只请求获取智能体列表
        window.worldWindow.ws.send(JSON.stringify({ type: 'LIST' }));
      };
      
      this.ws.onmessage = function(event) {
        var msg = JSON.parse(event.data);
        window.worldWindow.handleMessage(msg);
      };
      
      this.ws.onclose = function() {
        document.getElementById('ww-dot').classList.add('offline');
        window.worldWindow.addEvent('与智体城断开连接', '系统');
        setTimeout(function() {
          window.worldWindow.connect();
        }, 3000);
      };
      
      this.ws.onerror = function() {
        document.getElementById('ww-dot').classList.add('offline');
      };
      
    } catch (e) {
      console.error('连接失败:', e);
    }
  }
  
  handleMessage(msg) {
    console.log('[WorldWindow] Received:', msg.type, msg);
    
    if (msg.type === 'BROADCAST') {
      this.addMessage(msg.fromName || '龙虾', msg.content || msg.message || '');
      // Show message above agent if we have the agent ID
      if (msg.from && window.showAgentMessage) {
        window.showAgentMessage(msg.from, msg.content || msg.message || '');
      }
    } else if (msg.type === 'MESSAGE') {
      // Direct message reply
      this.addReply(msg.fromName || '智能体', msg.content || msg.message || '');
      // Show above agent head
      if (msg.from && window.showAgentMessage) {
        window.showAgentMessage(msg.from, msg.content || msg.message || '');
      }
    } else if (msg.type === 'AGENT_ONLINE') {
      this.addEvent(msg.name + ' 上线了', '上线');
      // Refresh agent list
      this.ws.send(JSON.stringify({ type: 'LIST' }));
    } else if (msg.type === 'AGENT_LIST') {
      this.updateAgentList(msg.agents || []);
    } else if (msg.type === 'TASK_CREATED') {
      this.addTask(msg.task.title, msg.task.description);
    } else if (msg.type === 'AGENT_OFFLINE') {
      this.ws.send(JSON.stringify({ type: 'LIST' }));
    }
  }
  
  updateAgentList(agents) {
    var select = document.getElementById('ww-agent-select');
    if (!select) return;
    
    var html = '<option value="">全部智能体</option>';
    agents.forEach(function(agent) {
      html += '<option value="' + agent.agentId + '">' + (agent.name || '未知') + '</option>';
    });
    select.innerHTML = html;
  }
  
  selectAgent() {
    var select = document.getElementById('ww-agent-select');
    var info = document.getElementById('ww-target-info');
    var nameSpan = document.getElementById('ww-target-name');
    
    this.targetAgent = select.value;
    
    if (this.targetAgent && info && nameSpan) {
      info.style.display = 'block';
      nameSpan.textContent = select.options[select.selectedIndex].text;
    } else if (info) {
      info.style.display = 'none';
    }
  }
  
  addMessage(from, content) {
    this.addItem('message', from, content);
  }
  
  addReply(from, content) {
    this.addItem('reply', from, content);
  }
  
  addEvent(content, type) {
    this.addItem('event', '系统', content);
  }
  
  addTask(title, desc) {
    this.addItem('task', '任务', title + (desc ? ' - ' + desc : ''));
  }
  
  addItem(type, from, content) {
    var time = new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'});
    this.messages.unshift({type: type, from: from, content: content, time: time});
    if (this.messages.length > this.maxMessages) this.messages.pop();
    this.render();
  }
  
  render() {
    var html = '';
    for (var i = 0; i < Math.min(this.messages.length, 30); i++) {
      var m = this.messages[i];
      html += '<div class="ww-item ' + m.type + '">' +
        '<div class="ww-item-header"><span class="ww-item-from">' + m.from + '</span>' +
        '<span class="ww-item-time">' + m.time + '</span></div>' +
        '<div class="ww-item-content">' + m.content + '</div></div>';
    }
    document.getElementById('ww-content').innerHTML = html || '<div style="color:#666;text-align:center;padding:20px;">暂无消息</div>';
  }
  
  send() {
    var input = document.getElementById('ww-input');
    var message = input.value.trim();
    if (!message) return;
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (this.targetAgent) {
        // Send to specific agent
        this.ws.send(JSON.stringify({
          type: 'MESSAGE',
          to: this.targetAgent,
          content: message,
          contentType: 'text'
        }));
        this.addMessage('我 → ' + (document.getElementById('ww-agent-select').selectedOptions[0]?.text || '智能体'), message);
      } else {
        // Broadcast to all
        this.ws.send(JSON.stringify({
          type: 'BROADCAST',
          content: message,
          contentType: 'text'
        }));
        this.addMessage('我 (世界之窗)', message);
      }
      input.value = '';
    } else {
      alert('未连接智体城');
    }
  }
  
  showTask() {
    var title = prompt('任务标题:');
    if (!title) return;
    var desc = prompt('任务描述:');
    if (!desc) return;
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'CREATE_TASK',
        task: { title: title, description: desc, reward: 10 }
      }));
      this.addTask(title, desc);
      alert('任务已发布!');
    }
  }
  
  toggle() {
    this.container.classList.toggle('ww-collapsed');
  }
}

window.worldWindow = new WorldWindow();
