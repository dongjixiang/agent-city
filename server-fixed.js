/**
 * 智体城 WebSocket 服务器 - 修复版
 * 确保广播消息包含发送者名称
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const AgentStore = require('./agent-store');

const PORT = process.env.PORT || 9876;
const agents = new Map();
const agentNames = new Map(); // name -> agentId mapping

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
      console.log('📋 收到 LIST 请求');
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
  agentNames.set(profile.name, id); // Add name -> id mapping
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

  // 如果是AI智能体发送的广播，也触发思考和回复完成事件
  if (from && (from.includes('openclaw') || from.includes('assistant'))) {
    // 先广播思考事件（移动到喷泉）
    broadcast({
      type: 'AGENT_THINKING',
      agentId: from,
      agentName: fromName,
      from: from,
      timestamp: Date.now()
    }, from);
    
    // 短暂延迟后广播回复完成
    setTimeout(() => {
      broadcast({
        type: 'AGENT_RESPONSE_COMPLETE',
        agentId: from,
        agentName: fromName,
        to: null,
        timestamp: Date.now()
      }, from);
    }, 500);
  }

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

  // Resolve 'to' to agentId if it's a name instead of ID
  let targetAgentId = to;
  
  // Check if 'to' is actually a name (not an ID)
  if (!agents.has(to)) {
    // Try to find agent by name using the name->id mapping
    if (agentNames.has(to)) {
      targetAgentId = agentNames.get(to);
    }
  }
  
  const target = agents.get(targetAgentId);
  if (target && target.ws.readyState === WebSocket.OPEN) {
    target.ws.send(JSON.stringify({
      type: 'MESSAGE',
      from: from,
      fromName: fromName,
      content: content,
      contentType: contentType || 'text',
      timestamp: Date.now()
    }));
    console.log(`💬 消息已转发到 ${targetAgentId}`);
    
    // AI智能体接收消息，开始思考 - 广播思考事件
    if (targetAgentId.includes('openclaw') || targetAgentId.includes('assistant') || agentNames.has(targetAgentId)) {
      const targetProfile = AgentStore.getAgent(targetAgentId);
      const targetName = targetProfile?.name || targetAgentId;
      
      // 广播给所有客户端
      broadcast({
        type: 'AGENT_THINKING',
        agentId: targetAgentId,
        agentName: targetName,
        from: from,
        timestamp: Date.now()
      }, null);
      console.log(`🤔 ${targetName} 开始思考...`);
    }
  } else {
    console.log(`💬 目标未找到: ${to} (尝试解析为: ${targetAgentId})`);
  }
  
  // 如果是AI智能体发送的回复（从AI到用户），广播回复完成事件
  if ((from.includes('openclaw') || from.includes('assistant'))) {
    const targetProfile = AgentStore.getAgent(from);
    const fromNameActual = targetProfile?.name || from;
    
    // 先广播思考事件（移动到喷泉），再广播回复完成
    broadcast({
      type: 'AGENT_THINKING',
      agentId: from,
      agentName: fromNameActual,
      from: from,
      timestamp: Date.now()
    }, null);
    
    // 短暂延迟后广播回复完成（携带消息内容）
    setTimeout(() => {
      broadcast({
        type: 'AGENT_RESPONSE_COMPLETE',
        agentId: from,
        agentName: fromNameActual,
        to: to,
        content: content,  // 携带消息内容
        timestamp: Date.now()
      }, null);
    }, 500);
    
    console.log(`✅ ${fromNameActual} 回复已发送`);
  }
}

function handleListAgents(ws) {
  const agentList = [];
  agents.forEach((data, id) => {
    // 只返回 OpenClaw 智能体（ID 包含 openclaw）
    if (!id.includes('openclaw') && !id.includes('OpenClaw')) {
      return; // 跳过非 OpenClaw 智能体
    }
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
