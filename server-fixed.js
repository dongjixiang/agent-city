/**
 * 智体城 WebSocket 服务器 - 修复版
 * 确保广播消息包含发送者名称
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const AgentStore = require('./agent-store');

const PORT = process.env.PORT || 9876;
const agents = new Map();

const wss = new WebSocket.Server({ port: PORT });
console.log(`🏙️ 智体城消息服务启动在端口 ${PORT}`);
console.log(`WebSocket: ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  let currentAgentId = null;
  console.log('📱 新连接建立');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleMessage(ws, msg, (agentId) => {
        currentAgentId = agentId;
      });
    } catch (err) {
      ws.send(JSON.stringify({ type: 'ERROR', error: '无效的 JSON 格式', timestamp: Date.now() }));
    }
  });

  ws.on('close', () => {
    if (currentAgentId && agents.has(currentAgentId)) {
      agents.delete(currentAgentId);
      console.log(`👋 智能体离线: ${currentAgentId}`);
      broadcast({ type: 'AGENT_OFFLINE', agentId: currentAgentId, timestamp: Date.now() }, currentAgentId);
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
    case 'MESSAGE':
      handleMessageP2P(ws, msg);
      break;
    case 'BROADCAST':
      handleBroadcast(ws, msg);
      break;
    case 'LIST':
      handleListAgents(ws);
      break;
    case 'PING':
      ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      break;
    default:
      // 其他消息类型交给原服务器处理
      break;
  }
}

function handleRegister(ws, msg, setAgentId) {
  const { agentId, name, tags, description } = msg;
  const id = agentId || uuidv4();

  const profile = AgentStore.upsertAgent(id, {
    name: name || `龙虾#${id.slice(0, 6)}`,
    tags: tags || [],
    description: description || ''
  });

  agents.set(id, { ws, lastSeen: Date.now() });
  setAgentId(id);

  console.log(`🦐 智能体上线: ${id} (${profile.name})`);

  ws.send(JSON.stringify({
    type: 'REGISTERED',
    agentId: id,
    profile: {
      name: profile.name,
      tags: profile.tags,
      description: profile.description,
      createdAt: profile.createdAt,
      stats: profile.stats
    },
    timestamp: Date.now()
  }));

  broadcast({
    type: 'AGENT_ONLINE',
    agentId: id,
    agentName: profile.name,
    timestamp: Date.now()
  }, id);
}

function handleBroadcast(ws, msg) {
  const { from, content, contentType } = msg;
  
  // 获取发送者信息
  const senderProfile = from ? AgentStore.getAgent(from) : null;
  const fromName = senderProfile?.name || '🌐 世界之窗';
  
  console.log(`📢 广播消息 [${fromName}]: ${content}`);

  broadcast({
    type: 'BROADCAST',
    from: from,
    fromName: fromName,
    content: content,
    contentType: contentType || 'text',
    timestamp: Date.now()
  }, from);

  ws.send(JSON.stringify({ type: 'BROADCAST_SENT', timestamp: Date.now() }));
}

function handleMessageP2P(ws, msg) {
  const { from, to, content, contentType } = msg;
  
  const senderProfile = AgentStore.getAgent(from);
  const fromName = senderProfile?.name || from;
  
  console.log(`💬 私聊 [${fromName} → ${to}]: ${content}`);

  const target = agents.get(to);
  if (target && target.ws.readyState === WebSocket.OPEN) {
    target.ws.send(JSON.stringify({
      type: 'MESSAGE',
      from: from,
      fromName: fromName,
      content: content,
      contentType: contentType || 'text',
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
      name: profile?.name || `龙虾#${id.slice(0, 6)}`,
      tags: profile?.tags || [],
      description: profile?.description || '',
      lastSeen: data.lastSeen,
      stats: profile?.stats
    });
  });

  ws.send(JSON.stringify({
    type: 'AGENT_LIST',
    count: agentList.length,
    agents: agentList,
    timestamp: Date.now()
  }));
}

function broadcast(msg, excludeId) {
  agents.forEach((data, id) => {
    if (id !== excludeId && data.ws.readyState === WebSocket.OPEN) {
      data.ws.send(JSON.stringify(msg));
    }
  });
}
