/**
 * Agent City Message Bridge - Fixed Version
 * Properly routes replies back to sender
 */

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const AGENT_CITY_WS = 'ws://localhost:9876';
const BRIDGE_PORT = 9878;
const BRIDGE_WS_PORT = 9879;
const DATA_DIR = path.join(__dirname, 'bridge-data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const pendingMessages = new Map();
const connectedAgents = new Map();
let agentCityWs = null;

// HTTP server for replies
const httpServer = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/reply') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const reply = JSON.parse(body);
        handleAgentReply(reply);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  } else if (req.method === 'GET' && req.url.startsWith('/pending')) {
    const url = new URL(req.url, `http://localhost:${BRIDGE_PORT}`);
    const agentId = url.searchParams.get('agentId');
    const messages = [];
    pendingMessages.forEach((msg, id) => {
      if (msg.to === agentId) {
        messages.push({ id, ...msg });
      }
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(messages));
  } else {
    res.writeHead(404);
    res.end();
  }
});

httpServer.listen(BRIDGE_PORT, () => {
  console.log(`🌉 Bridge HTTP server listening on port ${BRIDGE_PORT}`);
});

// Connect to Agent City
function connectToAgentCity() {
  console.log('🔌 Connecting to Agent City...');
  
  agentCityWs = new WebSocket(AGENT_CITY_WS);
  
  agentCityWs.on('open', () => {
    console.log('✅ Connected to Agent City');
    agentCityWs.send(JSON.stringify({
      type: 'REGISTER',
      agentId: 'message-bridge',
      name: '🌉 消息桥接',
      tags: ['system', 'bridge'],
      description: 'Message bridge between Agent City and AI assistants'
    }));
  });
  
  agentCityWs.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleAgentCityMessage(msg);
    } catch (e) {
      console.error('Error parsing message:', e.message);
    }
  });
  
  agentCityWs.on('close', () => {
    console.log('🔌 Disconnected from Agent City, reconnecting...');
    setTimeout(connectToAgentCity, 3000);
  });
  
  agentCityWs.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
}

function handleAgentCityMessage(msg) {
  console.log('📩 From Agent City:', msg.type);
  
  switch (msg.type) {
    case 'REGISTERED':
      console.log('✅ Bridge registered:', msg.agentId);
      break;
      
    case 'MESSAGE':
      // Store the message for reply routing
      console.log(`📬 Storing message ${msg.messageId} from ${msg.from}`);
      pendingMessages.set(msg.messageId, {
        from: msg.from,
        fromName: msg.fromName,
        to: msg.to,
        content: msg.content,
        timestamp: msg.timestamp || Date.now()
      });
      
      // Also forward if agent is connected to bridge
      const targetAgent = connectedAgents.get(msg.to);
      if (targetAgent && targetAgent.ws && targetAgent.ws.readyState === WebSocket.OPEN) {
        targetAgent.ws.send(JSON.stringify({
          type: 'INCOMING_MESSAGE',
          from: msg.from,
          fromName: msg.fromName,
          to: msg.to,
          content: msg.content,
          messageId: msg.messageId,
          timestamp: msg.timestamp || Date.now()
        }));
        console.log(`📤 Forwarded to connected agent: ${msg.to}`);
      }
      break;
      
    case 'BROADCAST':
      handleBroadcast(msg);
      break;
      
    case 'AGENT_ONLINE':
      console.log('🦐 Agent online:', msg.agentId, msg.profile?.name);
      break;
      
    case 'AGENT_OFFLINE':
      console.log('👋 Agent offline:', msg.agentId);
      connectedAgents.delete(msg.agentId);
      break;
  }
}

function handleMessageForAgent(msg) {
  const { from, to, content, messageId, fromName } = msg;
  console.log(`💬 Message for ${to}:`, content);
  console.log(`   From: ${fromName || from}`);
  
  // Store as pending - include all info for reply routing
  pendingMessages.set(messageId, { 
    from, 
    fromName,
    to, 
    content, 
    timestamp: Date.now() 
  });
  
  // Try to deliver via WebSocket if agent is connected
  const agent = connectedAgents.get(to);
  if (agent && agent.ws && agent.ws.readyState === WebSocket.OPEN) {
    agent.ws.send(JSON.stringify({ 
      type: 'INCOMING_MESSAGE', 
      from,
      fromName,
      to, 
      content, 
      messageId, 
      timestamp: Date.now() 
    }));
    console.log(`📤 Forwarded to connected agent: ${to}`);
  } else {
    console.log(`📬 Message queued for agent: ${to}`);
  }
  
  // Save to file for persistence
  const msgFile = path.join(DATA_DIR, `${messageId}.json`);
  fs.writeFileSync(msgFile, JSON.stringify(msg, null, 2));
}

function handleBroadcast(msg) {
  console.log(`📢 Broadcast from ${msg.from}:`, msg.content);
  
  connectedAgents.forEach((agent, agentId) => {
    if (agent.ws && agent.ws.readyState === WebSocket.OPEN) {
      agent.ws.send(JSON.stringify({
        type: 'BROADCAST',
        from: msg.from,
        content: msg.content,
        timestamp: Date.now()
      }));
    }
  });
}

function handleAgentReply(reply) {
  const { messageId, agentId, content, targetId } = reply;
  
  console.log(`📨 Reply from ${agentId}:`, content);
  
  // Use explicit target if provided
  let finalTargetId = targetId;
  
  if (!finalTargetId) {
    // Find original message
    const originalMsg = pendingMessages.get(messageId);
    
    if (originalMsg && originalMsg.from) {
      finalTargetId = originalMsg.from;
      console.log(`   Routing reply to original sender: ${finalTargetId}`);
    } else {
      // Try to find any pending message for this agent
      pendingMessages.forEach((msg, id) => {
        if (msg.to === agentId && msg.from) {
          finalTargetId = msg.from;
          console.log(`   Found pending message sender: ${finalTargetId}`);
        }
      });
    }
  } else {
    console.log(`   Using explicit target: ${finalTargetId}`);
  }
  
  if (!finalTargetId) {
    console.warn('⚠️ No target found for reply');
    return;
  }
  
  // Send reply back to Agent City
  if (agentCityWs && agentCityWs.readyState === WebSocket.OPEN) {
    agentCityWs.send(JSON.stringify({
      type: 'MESSAGE',
      from: agentId,
      to: finalTargetId,
      content: content,
      contentType: 'text',
      replyTo: messageId
    }));
    
    console.log(`📤 Reply sent to Agent City (to: ${finalTargetId})`);
  }
  
  // Clean up pending message
  pendingMessages.delete(messageId);
  
  // Delete message file
  const msgFile = path.join(DATA_DIR, `${messageId}.json`);
  if (fs.existsSync(msgFile)) {
    fs.unlinkSync(msgFile);
  }
}

// WebSocket server for agents to connect
const agentWss = new WebSocket.Server({ port: BRIDGE_WS_PORT });
console.log(`🔌 Agent WebSocket server on port ${BRIDGE_WS_PORT}`);

agentWss.on('connection', (ws) => {
  let currentAgentId = null;
  
  console.log('📱 Agent connected to bridge');
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      
      if (msg.type === 'REGISTER') {
        currentAgentId = msg.agentId;
        connectedAgents.set(currentAgentId, { ws });
        console.log(`✅ Agent bridge connected: ${currentAgentId}`);
        
        ws.send(JSON.stringify({ type: 'REGISTERED', agentId: currentAgentId }));
        
        // Send any pending messages
        pendingMessages.forEach((pending, id) => {
          if (pending.to === currentAgentId) {
            ws.send(JSON.stringify({
              type: 'INCOMING_MESSAGE',
              ...pending,
              messageId: id
            }));
          }
        });
      } else if (msg.type === 'REPLY') {
        handleAgentReply({
          messageId: msg.messageId,
          agentId: currentAgentId,
          content: msg.content
        });
      }
    } catch (e) {
      console.error('Error handling agent message:', e.message);
    }
  });
  
  ws.on('close', () => {
    if (currentAgentId) {
      connectedAgents.delete(currentAgentId);
      console.log(`👋 Agent bridge disconnected: ${currentAgentId}`);
    }
  });
});

// Start
connectToAgentCity();

console.log('');
console.log('🌉 Message Bridge Started!');
