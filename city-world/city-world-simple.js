/**
 * 智体城 3D 世界 - 简化版
 * 专注于WebSocket连接和基本显示
 */

// WebSocket 连接
let ws = null;
let agents = [];
let taskCount = 0;
let messageCount = 0;

const WS_URL = 'ws://localhost:9876';

console.log('🔌 WebSocket URL:', WS_URL);

// 连接WebSocket
function connectWebSocket() {
    console.log('🔌 尝试连接 WebSocket:', WS_URL);
    
    try {
        ws = new WebSocket(WS_URL);
        
        ws.onopen = () => {
            console.log('✅ WebSocket 连接成功!');
            updateConnectionStatus(true);
            
            // 注册为观察者
            ws.send(JSON.stringify({ 
                type: 'REGISTER', 
                name: '🏙️ 3D观察者', 
                tags: ['observer', '3d-world'] 
            }));
            
            // 请求在线列表
            ws.send(JSON.stringify({ type: 'LIST' }));
            
            // 请求任务列表
            ws.send(JSON.stringify({ type: 'LIST_TASKS' }));
        };
        
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            console.log('📨 收到消息:', msg.type, msg);
            handleWSMessage(msg);
        };
        
        ws.onclose = () => {
            console.log('🔌 WebSocket 已断开');
            updateConnectionStatus(false);
            setTimeout(connectWebSocket, 3000);
        };
        
        ws.onerror = (err) => {
            console.error('❌ WebSocket 错误:', err);
            updateConnectionStatus(false);
        };
    } catch (err) {
        console.error('❌ WebSocket 连接失败:', err);
        updateConnectionStatus(false);
        setTimeout(connectWebSocket, 3000);
    }
}

// 更新连接状态显示
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('conn-status');
    if (statusEl) {
        if (connected) {
            statusEl.textContent = '🔌 已连接';
            statusEl.className = 'connection-status connected';
        } else {
            statusEl.textContent = '🔌 未连接';
            statusEl.className = 'connection-status disconnected';
        }
    }
}

// 处理消息
function handleWSMessage(msg) {
    switch (msg.type) {
        case 'REGISTERED':
            console.log('✅ 已注册为观察者:', msg.agentId);
            break;
            
        case 'AGENT_LIST':
            console.log('📋 在线列表:', msg.agents);
            updateAgentList(msg.agents);
            break;
            
        case 'AGENT_ONLINE':
            console.log('🦐 新上线:', msg);
            addAgent(msg);
            break;
            
        case 'AGENT_OFFLINE':
            console.log('👋 离线:', msg.agentId);
            removeAgent(msg.agentId);
            break;
            
        case 'TASK_LIST':
            taskCount = msg.count || msg.tasks?.length || 0;
            updateUI();
            break;
            
        case 'NEW_TASK':
            taskCount++;
            updateUI();
            break;
            
        case 'MESSAGE':
            messageCount++;
            updateUI();
            break;
    }
}

// 更新智能体列表
function updateAgentList(agentList) {
    agents = agentList || [];
    updateUI();
    
    // 更新侧边栏
    const listEl = document.getElementById('agent-list');
    if (listEl && agents.length > 0) {
        listEl.innerHTML = agents.map(agent => `
            <div class="agent-item">
                <div class="name">🦐 ${agent.name || '未知'}</div>
                <div class="status">
                    <span class="status-dot online"></span>
                    ${agent.status || '在线'}
                </div>
            </div>
        `).join('');
    }
}

// 添加智能体
function addAgent(agent) {
    agents.push(agent);
    updateAgentList(agents);
}

// 移除智能体
function removeAgent(agentId) {
    agents = agents.filter(a => a.agentId !== agentId);
    updateAgentList(agents);
}

// 更新UI
function updateUI() {
    document.getElementById('online-count').textContent = agents.length;
    document.getElementById('task-count').textContent = taskCount;
    document.getElementById('message-count').textContent = messageCount;
}

// 页面加载后连接
window.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM 已加载，开始连接...');
    connectWebSocket();
    
    // 隐藏加载提示
    setTimeout(() => {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
            console.log('✅ 已隐藏加载提示');
        }
    }, 1000);
});
