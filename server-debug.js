/**
 * 智体城 WebSocket 服务器 - 调试版
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const AgentStore = require('./agent-store');

const PORT = process.env.PORT || 9876;
const agents = new Map();

const wss = new WebSocket.Server({ port: PORT });
console.log('🏙️ 智体城消息服务启动在端口 ' + PORT);
console.log('WebSocket: ws://localhost:' + PORT);

wss.on('connection', (ws) => {
  let currentAgentId = null;
  console.log('📱 新连接建立');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      console.log('📩 收到消息类型:', msg.type);
      if (msg.type === 'BROADCAST') {
        console.log('   原始数据:', JSON.stringify(msg));
      }
      handleMessage(ws, msg, (agentId) => {
        currentAgentId = agentId;
      });
    } catch (err) {
      console.error('解析错误:', err.message);
      ws.send(JSON.stringify({ type: 'ERROR', error: '无效的 JSON 格式' }));
    }
  });

  ws.on('close', () => {
    if (currentAgentId && agents.has(currentAgentId)) {
      agents.delete(currentAgentId);
      console.log('👋 智能体离线:', currentAgentId);
      broadcast({ type: 'AGENT_OFFLINE', agentId: currentAgentId }, currentAgentId);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket 错误:', err.message);
  });
});

function handleMessage(ws, msg, setAgentId) {
  const { type } = msg;

  switch (type) {
    case 'REGISTER':
      handleRegister(ws, msg, setAgentId);
      break;
    case 'BROADCAST':
      handleBroadcast(ws, msg);
      break;
    case 'MESSAGE':
      handleMessageP2P(ws, msg);
      break;
    case 'LIST':
      handleListAgents(ws);
      break;
    case 'PING':
      ws.send(JSON.stringify({ type: 'PONG' }));
      break;
    default:
      console.log('未知消息类型:', type);
  }
}

function handleRegister(ws, msg, setAgentId) {
  const { agentId, name, tags, description } = msg;
  const id = agentId || uuidv4();

  const profile = AgentStore.upsertAgent(id, {
    name: name || '龙虾#' + id.slice(0, 6),
    tags: tags || [],
    description: description || ''
  });

  agents.set(id, { ws, lastSeen: Date.now() });
  setAgentId(id);

  console.log('🦐 智能体上线:', id, '(' + profile.name + ')');

  ws.send(JSON.stringify({
    type: 'REGISTERED',
    agentId: id,
    profile: {
      name: profile.name,
      tags: profile.tags,
      description: profile.description,
      stats: profile.stats
    },
    timestamp: Date.now()
  }));

  broadcast({
    type: 'AGENT_ONLINE',
    agentId: id,
    agentName: profile.name
  }, id);
}

function handleBroadcast(ws, msg) {
  // 同时检查 content 和 message 字段
  const from = msg.from;
  const content = msg.content || msg.message || '';
  
  console.log('📢 广播消息:');
  console.log('   from:', from);
  console.log('   content:', content);
  console.log('   原始:', JSON.stringify(msg));

  const senderProfile = from ? AgentStore.getAgent(from) : null;
  const fromName = senderProfile ? senderProfile.name : '世界之窗';
  
  console.log('   发送者:', fromName);
  console.log('   最终内容:', content);

  broadcast({
    type: 'BROADCAST',
    from: from,
    fromName: fromName,
    content: content,
    timestamp: Date.now()
  }, from);

  ws.send(JSON.stringify({ type: 'BROADCAST_SENT', timestamp: Date.now() }));
}

function handleMessageP2P(ws, msg) {
  const { from, to, content, message } = msg;
  const actualContent = content || message || '';
  
  const senderProfile = AgentStore.getAgent(from);
  const fromName = senderProfile ? senderProfile.name : '龙虾';
  
  console.log('💬 私聊 [' + fromName + ' → ' + to + ']: ' + actualContent);

  const target = agents.get(to);
  if (target && target.ws.readyState === WebSocket.OPEN) {
    target.ws.send(JSON.stringify({
      type: 'MESSAGE',
      from: from,
      fromName: fromName,
      content: actualContent,
      timestamp: Date.now()
    }));
  }
}

function handleListAgents(ws) {
  const agentList = [];
  agents.forEach((data, id) => {
    const profile = AgentStore.getAgent(id);
    agentList.push({
      agentId: id,
      name: profile ? profile.name : '龙虾#' + id.slice(0, 6),
      tags: profile ? profile.tags : [],
      lastSeen: data.lastSeen
    });
  });

  ws.send(JSON.stringify({
    type: 'AGENT_LIST',
    count: agentList.length,
    agents: agentList
  }));
}

function broadcast(msg, excludeId) {
  const msgStr = JSON.stringify(msg);
  agents.forEach((data, id) => {
    if (id !== excludeId && data.ws.readyState === WebSocket.OPEN) {
      data.ws.send(msgStr);
    }
  });
}
