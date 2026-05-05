/**
 * World Window - Bridge between external world and Agent City
 * Each instance creates its own WebSocket connection and registers as a visitor
 */
class WorldWindow {
    constructor() {
        this.messages = [];
        this.maxMessages = 100;
        this.container = null;
        this.ws = null;
        this.targetAgent = null;
        this.visitorId = null;
        this._initialized = false;
        this._appReady = false;
        this.init();
    }
    
    init() {
        if (this._initialized) return;
        this._initialized = true;
        window.worldWindow = this;

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
            .ww-title { color: #4ecdc4; font-size: 14px; font-weight: bold; }
            .ww-status-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ecdc4; }
            .ww-status-dot.offline { background: #ff6b6b; }
            .ww-content { height: 180px; overflow-y: auto; padding: 10px; }
            .ww-content::-webkit-scrollbar { width: 6px; }
            .ww-content::-webkit-scrollbar-thumb { background: rgba(78, 205, 196, 0.3); border-radius: 3px; }
            .ww-item { padding: 8px 10px; border-radius: 8px; margin-bottom: 6px; background: rgba(255,255,255,0.03); border-left: 3px solid #4ecdc4; }
            .ww-item.event { border-left-color: #ffc107; }
            .ww-item.task { border-left-color: #ff6b6b; }
            .ww-item.reply { border-left-color: #9c27b0; background: rgba(156, 39, 176, 0.1); }
            .ww-item.thought { border-left-color: #9c27b0; background: rgba(156, 39, 176, 0.15); }
            .ww-item-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .ww-item-from { color: #ff6b6b; font-weight: bold; font-size: 13px; }
            .ww-item-time { color: #666; font-size: 11px; }
            .ww-item-content { color: #ccc; font-size: 13px; line-height: 1.4; }
            .ww-input-area { padding: 10px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 8px; flex-wrap: wrap; }
            .ww-input { flex: 1; min-width: 150px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; outline: none; }
            .ww-input:focus { border-color: #4ecdc4; }
            .ww-btn { padding: 10px 15px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: bold; background: linear-gradient(135deg, #4ecdc4, #2196f3); color: #fff; }
            .ww-btn:hover { opacity: 0.9; }
            .ww-btn-task { background: linear-gradient(135deg, #ff6b6b, #ff8a65); }
            .ww-agent-select { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px; color: #fff; font-size: 12px; outline: none; max-width: 150px; }
            .ww-collapsed .ww-content, .ww-collapsed .ww-input-area { display: none; }
            .ww-target-info { padding: 5px 10px; font-size: 12px; color: #9c27b0; background: rgba(156, 39, 176, 0.1); border-radius: 4px; margin: 0 10px 5px; }
        `;
        document.head.appendChild(styles);
        
        this.container.innerHTML = `
            <div class="ww-header" onclick="window.worldWindow.toggle()">
                <div class="ww-title">🌐 世界之窗 - 与智体城沟通</div>
                <div class="ww-status-dot" id="ww-dot"></div>
            </div>
            <div class="ww-content" id="ww-content"><div style="color:#666;text-align:center;padding:20px;">正在连接智体城...</div></div>
            <div class="ww-target-info" id="ww-target-info" style="display:none;">目标: <span id="ww-target-name">全部</span></div>
            <div class="ww-input-area">
                <select class="ww-agent-select" id="ww-agent-select" onchange="window.worldWindow.selectAgent()"><option value="">全部智能体</option></select>
                <input type="text" class="ww-input" id="ww-input" placeholder="输入消息发送给智体城...">
                <button class="ww-btn" onclick="window.worldWindow.send()">发送</button>
                <button class="ww-btn ww-btn-task" onclick="window.worldWindow.showTask()">任务</button>
            </div>
        `;
        document.body.appendChild(this.container);
        document.getElementById('ww-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') window.worldWindow.send(); });
        
        this._waitForApp();
        this.connect();
    }
    
    _waitForApp(callback) {
        const startTime = Date.now();
        const maxWait = 15000;
        const check = () => {
            if (window.app?.systems?.agent) {
                this._appReady = true;
                console.log('[WorldWindow] App ready');
            } else if (Date.now() - startTime < maxWait) {
                setTimeout(check, 300);
            }
        };
        check();
    }
    
    connect() {
        // Generate unique visitor ID
        this.visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        
        var wsUrl = 'ws://' + window.location.hostname + ':9876';
        console.log('[WorldWindow] Connecting to:', wsUrl, 'with visitorId:', this.visitorId);
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('[WorldWindow] WebSocket connected');
                document.getElementById('ww-dot').classList.remove('offline');
                this.addEvent('已连接智体城', '系统');
                
                // Register as a visitor (hidden agent)
                this.ws.send(JSON.stringify({ 
                    type: 'REGISTER', 
                    agentId: this.visitorId,
                    name: '访客_' + this.visitorId.substr(-4),
                    tags: ['visitor', 'hidden'],
                    visual: { color: '#888', emoji: '👤', modelType: 'visitor' }
                }));
                
                // Wait for registration to complete, then request agent list
                setTimeout(() => {
                    this.ws.send(JSON.stringify({ type: 'LIST' }));
                }, 500);
            };

            this.ws.onmessage = (event) => {
                var msg = JSON.parse(event.data);
                this.handleMessage(msg);
            };

            this.ws.onclose = () => {
                console.log('[WorldWindow] WebSocket disconnected');
                document.getElementById('ww-dot').classList.add('offline');
                this.addEvent('与智体城断开连接', '系统');
                setTimeout(() => { this.connect(); }, 3000);
            };
            
            this.ws.onerror = function(e) {
                console.error('[WorldWindow] WebSocket error:', e);
                document.getElementById('ww-dot').classList.add('offline');
            };
        } catch (e) {
            console.error('[WorldWindow] Connection failed:', e);
        }
    }
  
    handleMessage(msg) {
        console.log('[WorldWindow] Received:', msg.type, msg);
        
        switch (msg.type) {
            case 'CONNECTED':
                console.log('[WorldWindow] Server connected, connectionId:', msg.connectionId);
                break;
                
            case 'REGISTERED':
                console.log('[WorldWindow] Registered as:', msg.agent?.agentId);
                break;
                
            case 'ERROR':
                console.error('[WorldWindow] Server error:', msg.message);
                break;
                
            case 'AGENT_LIST':
                this.updateAgentList(msg.agents || []);
                break;
                
            case 'BROADCAST':
            case 'AGENT_SPEAK':
            case 'AGENT_THOUGHT':
                // 检查是否是思考消息
                if (msg.type === 'AGENT_THOUGHT' || (msg.data && msg.data.type === 'AGENT_THOUGHT')) {
                    // 思考消息 - 添加到世界之窗显示
                    const thoughtContent = msg.content;
                    const thoughtFrom = msg.agentName || msg.fromName || msg.from || '智能体';
                    console.log('[WorldWindow] AGENT_THOUGHT received:', { content: thoughtContent, from: thoughtFrom });
                    if (thoughtContent) {
                        // 在世界之窗中显示思考内容
                        this.addThought(thoughtFrom, thoughtContent);
                    }
                    if (thoughtContent && window.showThoughtMessage) {
                        window.showThoughtMessage(msg.from, thoughtContent);
                    }
                } else {
                    // 普通广播消息
                    var bContent = (typeof msg.content === 'string') ? msg.content : (msg.message ? String(msg.message) : '');
                    if (bContent) {
                        this.addMessage(msg.name || msg.fromName || msg.from || '龙虾', bContent);
                    }
                    if (msg.from && window.showAgentMessage) {
                        window.showAgentMessage(msg.from, bContent);
                    }
                }
                break;

            case 'PRIVATE_MESSAGE':
                var privContent = (typeof msg.content === 'string') ? msg.content : (msg.message ? String(msg.message) : '');
                this.addMessage(msg.name || msg.fromName || msg.from || '智能体', privContent);
                if (msg.from && window.showAgentMessage) {
                    window.showAgentMessage(msg.from, privContent);
                }
                break;
                
            case 'MESSAGE_RECEIVED':
                // 也处理 MESSAGE_RECEIVED 类型（某些客户端用这个）
                var msgContent = (typeof msg.content === 'string') ? msg.content : (msg.message ? String(msg.message) : '');
                this.addMessage(msg.name || msg.fromName || msg.from || '智能体', msgContent);
                if (msg.from && window.showAgentMessage) {
                    window.showAgentMessage(msg.from, msgContent);
                }
                break;
                
            case 'AGENT_RESPONSE_COMPLETE':
                var respContent = (typeof msg.content === 'string') ? msg.content : (msg.message ? String(msg.message) : '');
                this.addReply(msg.name || msg.agentName || '智能体', respContent);
                if (msg.agentId && window.showAgentMessage) {
                    window.showAgentMessage(msg.agentId, respContent);
                }
                break;
                
            case 'AGENT_THINKING':
                this.addEvent((msg.name || msg.agentName) + ' 正在思考...', '思考');
                break;
                
            case 'AGENT_ONLINE':
                this.addEvent(msg.name + ' 上线了', '上线');
                this.ws.send(JSON.stringify({ type: 'LIST' }));
                break;
                
            default:
                console.log('[WorldWindow] Unknown message type:', msg.type);
        }
    }
  
    updateAgentList(agents) {
        // Filter out hidden agents (visitor type) from the list
        var visibleAgents = agents.filter(function(agent) {
            return !agent.tags || !agent.tags.includes('hidden');
        });
        
        var select = document.getElementById('ww-agent-select');
        if (select) {
            var html = '<option value="">全部智能体</option>';
            visibleAgents.forEach(function(agent) {
                html += '<option value="' + agent.agentId + '">' + (agent.name || '未知') + '</option>';
            });
            select.innerHTML = html;
        }

        if (window.app && window.app.systems && window.app.systems.agent) {
            var existingIds = Array.from(window.app.systems.agent.agents.keys());
            var newIds = visibleAgents.map(function(a) { return a.agentId; });

            existingIds.forEach(function(id) {
                if (newIds.indexOf(id) === -1) {
                    window.app.systems.agent.removeAgent(id);
                }
            });

            visibleAgents.forEach(function(agent) {
                var existing = window.app.systems.agent.getAgent(agent.agentId);
                if (existing) {
                    existing.name = agent.name || agent.agentId;
                    existing.tags = agent.tags || [];
                } else {
                    window.app.systems.agent.addAgent({
                        id: agent.agentId,
                        name: agent.name || agent.agentId,
                        tags: agent.tags || [],
                        visual: agent.visual || null,
                        agentType: agent.visual?.modelType || 'lobster'
                    });
                }
            });
        }

        window.agentList = visibleAgents;
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
        
        // 通知相机系统设置跟随目标
        if (window.app && window.app.systems && window.app.systems.camera) {
            window.app.systems.camera.setTarget(this.targetAgent);
        }
    }
  
    addMessage(from, content) { this.addItem('message', from, content); }
    addReply(from, content) { this.addItem('reply', from, content); }
    addThought(from, content) { this.addItem('thought', from, content); }
    addEvent(content, type) { this.addItem('event', '系统', content); }
    addTask(title, desc) { this.addItem('task', '任务', title + (desc ? ' - ' + desc : '')); }
  
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
            console.log('[WorldWindow] Sending message, visitorId:', this.visitorId);
            
            if (this.targetAgent) {
                // Send to specific agent
                this.ws.send(JSON.stringify({
                    type: 'MESSAGE',
                    from: this.visitorId,
                    to: this.targetAgent,
                    content: message,
                    contentType: 'text'
                }));
                this.addMessage('我 → ' + (document.getElementById('ww-agent-select').selectedOptions[0]?.text || '智能体'), message);
            } else {
                // Broadcast to all
                this.ws.send(JSON.stringify({
                    type: 'BROADCAST',
                    from: this.visitorId,
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

if (!window.worldWindow) {
    window.worldWindow = new WorldWindow();
}

export { WorldWindow };