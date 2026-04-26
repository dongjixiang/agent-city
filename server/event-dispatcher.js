"use strict";

const WebSocket = require('ws');
const http = require('http');

const AGENT_CITY_WS_URL = process.env.AGENT_CITY_WS_URL || 'ws://47.77.238.56:9876';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || '3ba441cbf71cb5119c5049a2fa5ce79df170baf2355e44b3';
const GATEWAY_HTTP = process.env.GATEWAY_HTTP || 'http://127.0.0.1:18789';

let channelConfig = {};
let wsClient = null;
let currentAgentId = null;
let currentAccount = null;
let reconnectTimer = null;
let heartbeatTimer = null;
let isConnected = false;
let messageQueue = [];
let aiPendingQueue = new Map();
let requestId = 0;
let isShuttingDown = false;
let agentList = [];

// Locations
const LOCATIONS = {
  TASK_CENTER: { x: -25, z: -25 },
  REPUTATION_HALL: { x: 25, z: -25 },
  TRADE_CENTER: { x: -25, z: 25 },
  ARCHIVE: { x: 25, z: 25 },
  MESSAGE_STATION: { x: 0, z: -35 },
  DATA_CENTER: { x: -35, z: 0 },
  WORKSHOP: { x: 35, z: 0 },
  SOCIAL_SQUARE: { x: 0, z: 0 }
};

const BUILDINGS = [
  ['Task Center', LOCATIONS.TASK_CENTER],
  ['Reputation Hall', LOCATIONS.REPUTATION_HALL],
  ['Trade Center', LOCATIONS.TRADE_CENTER],
  ['Archive', LOCATIONS.ARCHIVE],
  ['Message Station', LOCATIONS.MESSAGE_STATION],
  ['Data Center', LOCATIONS.DATA_CENTER],
  ['Workshop', LOCATIONS.WORKSHOP],
  ['Social Square', LOCATIONS.SOCIAL_SQUARE]
];

// Pending replies map - for routing AI responses
let pendingReplies = new Map(); // serverMessageId -> { from, fromName, timestamp }

let isThinking = false;
let lastThoughtTime = 0;
let autonomousLoop = null;
const THOUGHT_INTERVAL = 2 * 60 * 1000; // 2 minutes

function sendToAI(content, msgId) {
  return new Promise((resolve) => {
    console.log('[EventDispatcher] Sending to AI:', content.substring(0, 100));
    try {
      const model = channelConfig?.model || channelConfig?.agentModel || 'minimax-cn/MiniMax-M2.7';
      const body = JSON.stringify({ model: model, input: content });
      const options = {
        hostname: '127.0.0.1',
        port: channelConfig?.aiPort || 18789,
        path: channelConfig?.aiPath || '/v1/responses',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + GATEWAY_TOKEN,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      };
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const r = JSON.parse(data);
            if (r.error) {
              console.error('[EventDispatcher] AI error:', r.error.message);
              resolve('');
            } else if (r.output && r.output[0] && r.output[0].content && r.output[0].content[0]) {
              resolve(r.output[0].content[0].text || '');
            } else if (r.output && r.output[0] && r.output[0].text) {
              resolve(r.output[0].text || '');
            } else {
              resolve('');
            }
          } catch (e) {
            console.error('[EventDispatcher] AI parse error:', e.message);
            resolve('');
          }
        });
      });
      req.on('error', (e) => {
        console.error('[EventDispatcher] HTTP request error:', e.message);
        resolve('');
      });
      req.setTimeout(60000, () => {
        console.error('[EventDispatcher] AI request timeout');
        req.destroy();
        resolve('');
      });
      req.write(body);
      req.end();
    } catch (e) {
      console.error('[EventDispatcher] sendToAI sync error:', e.message);
      resolve('');
    }
  });
}

function parseAIResponse(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('[EventDispatcher] Parse AI response error:', e.message);
  }
  return null;
}

function executeDecision(decision) {
  console.log('[EventDispatcher] executeDecision:', JSON.stringify(decision));
  if (!decision || !decision.action) return;

  const { action, params, reasoning } = decision;

  switch (action) {
    case 'goTo':
      if (params.x !== undefined && params.z !== undefined) {
        console.log('[EventDispatcher] Moving to:', params.x, params.z);
        if (wsClient && wsClient.readyState === 1) {
          wsClient.send(JSON.stringify({ type: 'MOVE_TO', x: params.x, z: params.z }));
        }
      }
      break;
    case 'sendMessage':
      if (params.to && params.content) {
        console.log('[EventDispatcher] Sending message to:', params.to);
        if (wsClient && wsClient.readyState === 1) {
          wsClient.send(JSON.stringify({ type: 'MESSAGE', to: params.to, content: params.content, contentType: 'text' }));
        }
      }
      break;
    case 'broadcast':
      if (params.content) {
        console.log('[EventDispatcher] Broadcasting:', params.content);
        if (wsClient && wsClient.readyState === 1) {
          wsClient.send(JSON.stringify({ type: 'BROADCAST', from: currentAgentId, content: params.content, contentType: 'text' }));
        }
      }
      break;
    case 'think':
      if (params.content) {
        console.log('[EventDispatcher] Thinking:', params.content);
        if (wsClient && wsClient.readyState === 1) {
          wsClient.send(JSON.stringify({ type: 'BROADCAST', from: currentAgentId, content: params.content, contentType: 'text', subtype: 'thought' }));
        }
      }
      break;
    case 'stay':
    default:
      console.log('[EventDispatcher] Staying idle');
      break;
  }
}

function buildPrompt(situation) {
  return `You are an AI agent in Agent City. ${situation}

Available actions:
- goTo(x, z) - Move to coordinate
- sendMessage(to, content) - Send private message
- broadcast(content) - Broadcast to everyone
- think(content) - Show thought bubble
- stay() - Stay idle

Buildings in the city:
${BUILDINGS.map(b => `- ${b[0]} at (${b[1].x}, ${b[1].z})`).join('\n')}

Return JSON: { "action": "actionName", "params": {...}, "reasoning": "..." }`;
}

async function runAutonomousLoop() {
  if (!currentAgentId || !wsClient || isThinking) return;

  const now = Date.now();
  if (now - lastThoughtTime < THOUGHT_INTERVAL) return;
  lastThoughtTime = now;

  isThinking = true;

  try {
    const agentNames = agentList.map(a => `${a.name || a.agentId}`).join(', ') || 'none';
    const situation = `
Current time: ${new Date().toLocaleTimeString()}
Online agents: ${agentNames}
Total: ${agentList.length} agents
`;

    console.log('[EventDispatcher] Thinking...');

    // Send AGENT_EVENT to agent instead of calling AI directly
    if (wsClient && wsClient.readyState === 1) {
      const prompt = buildPrompt(situation);
      wsClient.send(JSON.stringify({
        type: 'AGENT_EVENT',
        eventType: 'PERIODIC_SNAPSHOT',
        agentId: currentAgentId,
        timestamp: Date.now(),
        prompt: prompt,
        context: {
          trigger: { type: 'PERIODIC_SNAPSHOT', priority: 1 }
        }
      }));
      console.log('[EventDispatcher] AGENT_EVENT sent');
    }

  } catch (e) {
    console.error('[EventDispatcher] Error:', e.message);
  } finally {
    isThinking = false;
  }
}

function startAutonomousLoop() {
  if (autonomousLoop) return;
  console.log('[EventDispatcher] Starting autonomous loop (2min interval)...');
  autonomousLoop = setInterval(runAutonomousLoop, 3000); // Check every 3 seconds
}

function stopAutonomousLoop() {
  if (autonomousLoop) {
    clearInterval(autonomousLoop);
    autonomousLoop = null;
    console.log('[EventDispatcher] Autonomous loop stopped');
  }
}

function handleIncomingMessage(msg) {
  if (isShuttingDown) return;

  console.log('[EventDispatcher] MESSAGE - From:', msg.fromName || msg.from, 'Content:', msg.content);

  if (msg.type === 'MESSAGE_RECEIVED' && msg.content) {
    const msgId = ++requestId;
    const senderId = msg.from;
    const senderName = msg.fromName || 'User';
    const serverMsgId = msg.messageId;

    if (serverMsgId) {
      pendingReplies.set(serverMsgId, { from: senderId, fromName: senderName, timestamp: Date.now() });
    }

    aiPendingQueue.set(msgId, { from: msg.from, content: msg.content, timestamp: Date.now(), serverMsgId });

    sendToAI(msg.content, msgId)
      .then((resp) => {
        console.log('[EventDispatcher] AI resp:', resp ? resp.substring(0, 100) : 'empty');
        if (resp && resp.trim()) {
          aiPendingQueue.delete(msgId);

          // Send AGENT_EVENT to agent for response
          if (wsClient && wsClient.readyState === 1) {
            const prompt = `User says: ${msg.content}\n\nPlease respond. Return JSON: { "action": "sendMessage", "params": { "content": "your response" }, "reasoning": "..." }`;
            wsClient.send(JSON.stringify({
              type: 'AGENT_EVENT',
              eventType: 'USER_MESSAGE',
              agentId: currentAgentId,
              timestamp: Date.now(),
              prompt: prompt,
              context: {
                trigger: {
                  type: 'USER_MESSAGE',
                  priority: 0,
                  message: { from: senderId, fromName: senderName, content: msg.content, replyTo: serverMsgId }
                }
              }
            }));
          }
        } else {
          aiPendingQueue.delete(msgId);
          if (serverMsgId) pendingReplies.delete(serverMsgId);
        }
      })
      .catch((e) => {
        console.error('[EventDispatcher] Error:', e.message);
        aiPendingQueue.delete(msgId);
        if (serverMsgId) pendingReplies.delete(serverMsgId);
      });
  }
}

function sendMessage(to, content, replyTo) {
  if (!wsClient || wsClient.readyState !== 1) {
    console.log('[EventDispatcher] WS not ready, queueing message');
    const msg = { type: 'MESSAGE', to, from: currentAgentId, content, contentType: 'text', timestamp: Date.now() };
    if (replyTo) msg.replyTo = replyTo;
    messageQueue.push(msg);
    return;
  }
  try {
    const msg = { type: 'MESSAGE', to, from: currentAgentId, content, contentType: 'text', timestamp: Date.now() };
    if (replyTo) msg.replyTo = replyTo;
    wsClient.send(JSON.stringify(msg));
  } catch (e) {
    console.error('[EventDispatcher] sendMessage error:', e.message);
  }
}

function broadcast(content) {
  if (!wsClient || wsClient.readyState !== 1) {
    console.log('[EventDispatcher] WS not ready, queueing broadcast');
    messageQueue.push({ type: 'BROADCAST', from: currentAgentId, content, contentType: 'text', timestamp: Date.now() });
    return;
  }
  try {
    wsClient.send(JSON.stringify({ type: 'BROADCAST', from: currentAgentId, content, contentType: 'text', timestamp: Date.now() }));
  } catch (e) {
    console.error('[EventDispatcher] broadcast error:', e.message);
  }
}

function requestAgentList() {
  if (!wsClient || wsClient.readyState !== 1) return;
  try {
    wsClient.send(JSON.stringify({ type: 'LIST' }));
  } catch (e) {
    console.error('[EventDispatcher] LIST request error:', e.message);
  }
}

function flushQueue() {
  if (!wsClient || wsClient.readyState !== 1) return;
  while (messageQueue.length > 0) {
    const msg = messageQueue.shift();
    try {
      wsClient.send(JSON.stringify(msg));
    } catch (e) {
      console.error('[EventDispatcher] flush queue error:', e.message);
      break;
    }
  }
}

function startHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    if (wsClient && wsClient.readyState === 1 && !isShuttingDown) {
      try {
        wsClient.send(JSON.stringify({ type: 'PING' }));
      } catch (e) {
        console.error('[EventDispatcher] Heartbeat error:', e.message);
      }
    }
  }, 30000);
}

function stopHeartbeat() {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
}

function connect(account) {
  if (isShuttingDown) return;

  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;

  if (wsClient) {
    try { wsClient.terminate(); } catch (e) {}
    wsClient = null;
  }

  currentAccount = account;
  console.log('[EventDispatcher] Connecting to', account.wsUrl);

  let ws = null;
  try {
    ws = new WebSocket(account.wsUrl);
  } catch (e) {
    console.error('[EventDispatcher] WS create error:', e.message);
    scheduleReconnect();
    return;
  }

  wsClient = ws;

  ws.on('open', () => {
    if (isShuttingDown) { ws.close(); return; }
    console.log('[EventDispatcher] Connected!');
    isConnected = true;
    startHeartbeat();

    console.log('[EventDispatcher] Registering as:', account.agentName);
    try {
      ws.send(JSON.stringify({
        type: 'REGISTER',
        agentId: account.agentId,
        name: account.agentName,
        tags: account.agentTags,
        description: 'OpenClaw AI Assistant',
        visual: { color: '#6366F1', size: 1.0, emoji: '🤖', modelType: 'human' }
      }));
    } catch (e) {
      console.error('[EventDispatcher] Register error:', e.message);
    }

    setTimeout(() => requestAgentList(), 1000);

    // Start autonomous thinking loop
    startAutonomousLoop();

    flushQueue();
  });

  ws.on('message', (data) => {
    if (isShuttingDown) return;
    try {
      const msg = JSON.parse(data);
      console.log('[EventDispatcher] Received message type:', msg.type);

      switch (msg.type) {
        case 'REGISTERED':
          currentAgentId = msg.agentId;
          console.log('[EventDispatcher] Registered as:', currentAgentId);
          setTimeout(() => requestAgentList(), 500);
          if (onConnectionReady && wsClient) {
            setTimeout(() => {
              if (onConnectionReady) onConnectionReady({ ws: wsClient, agentId: currentAgentId });
            }, 100);
          }
          break;
        case 'MESSAGE':
        case 'MESSAGE_RECEIVED':
          handleIncomingMessage(msg);
          break;
        case 'AGENT_DECISION':
          // Handle agent's decision
          console.log('[EventDispatcher] AGENT_DECISION from', msg.agentId, ':', JSON.stringify(msg.decision));
          if (msg.decision) {
            executeDecision(msg.decision);
          }
          break;
        case 'PONG':
          console.log('[EventDispatcher] PONG received');
          break;
        case 'AGENT_LIST':
          agentList = msg.agents || [];
          console.log('[EventDispatcher] Agent list updated,', agentList.length, 'agents online');
          break;
        case 'AGENT_ONLINE':
          console.log('[EventDispatcher] Agent online:', msg.agentId, msg.name);
          break;
        case 'AGENT_OFFLINE':
          console.log('[EventDispatcher] Agent offline:', msg.agentId);
          break;
        default:
          console.log('[EventDispatcher] Unknown message type:', msg.type);
      }
    } catch (e) {
      console.error('[EventDispatcher] Message parse error:', e.message);
    }
  });

  ws.on('close', () => {
    console.log('[EventDispatcher] Closed');
    isConnected = false;
    stopHeartbeat();
    stopAutonomousLoop();
    wsClient = null;
    if (!isShuttingDown) {
      scheduleReconnect();
    }
  });

  ws.on('error', (e) => {
    console.error('[EventDispatcher] WS error:', e.message);
  });
}

function scheduleReconnect() {
  if (isShuttingDown) return;
  if (reconnectTimer) return;
  console.log('[EventDispatcher] Scheduling reconnect in 5s...');
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (currentAccount && !isShuttingDown) connect(currentAccount);
  }, 5000);
}

function start(config) {
  channelConfig = config || {};
  const agentName = config?.agentName || 'OpenClaw Assistant';
  const agentIdFromName = agentName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-agent';

  const account = {
    wsUrl: config?.wsUrl || AGENT_CITY_WS_URL,
    agentId: config?.agentId || process.env.STABLE_AGENT_ID || agentIdFromName,
    agentName: agentName,
    agentTags: config?.agentTags || ['ai', 'assistant']
  };
  console.log('[EventDispatcher] Starting...');
  connect(account);
}

function stop() {
  console.log('[EventDispatcher] Stopping...');
  isShuttingDown = true;
  currentAccount = null;
  isConnected = false;
  stopHeartbeat();
  stopAutonomousLoop();
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (wsClient) {
    try { wsClient.close(); } catch (e) {}
    wsClient = null;
  }
  messageQueue = [];
  aiPendingQueue.clear();
  pendingReplies.clear();
  console.log('[EventDispatcher] Stopped');
}

function getAgentId() { return currentAgentId; }
function getConnectionStatus() { return { connected: isConnected, agentId: currentAgentId, queueLength: messageQueue.length, agentsOnline: agentList.length }; }
function getAgentList() { return agentList; }

let onConnectionReady = null;

module.exports = {
  start,
  stop,
  getAgentId,
  getConnectionStatus,
  getAgentList,
  setOnConnectionReady: (cb) => { onConnectionReady = cb; }
};
