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
let requestId = 0;
let isShuttingDown = false;
let agentList = [];
let senderFn = null;
let cityState = null;
let onConnectionReady = null;

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

let pendingReplies = new Map();
let isThinking = false;
let lastThoughtTime = 0;
let autonomousLoop = null;
const THOUGHT_INTERVAL = 2 * 60 * 1000;

function sendToAI(content) {
  return new Promise((resolve) => {
    console.log('[EventDispatcher] Sending to AI:', content.substring(0, 100));
    try {
      const model = channelConfig?.model || 'minimax-cn/MiniMax-M2.7';
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
            if (r.output && r.output[0] && r.output[0].content && r.output[0].content[0]) {
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
      req.on('error', (e) => { console.error('[EventDispatcher] HTTP error:', e.message); resolve(''); });
      req.setTimeout(60000, () => { console.error('[EventDispatcher] AI timeout'); req.destroy(); resolve(''); });
      req.write(body);
      req.end();
    } catch (e) {
      console.error('[EventDispatcher] sendToAI error:', e.message);
      resolve('');
    }
  });
}

function parseAIResponse(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {}
  return null;
}

function executeDecision(decision) {
  console.log('[EventDispatcher] executeDecision:', JSON.stringify(decision));
  if (!decision || !decision.action) return;
  const { action, params } = decision;
  switch (action) {
    case 'goTo':
      if (params.x !== undefined && params.z !== undefined && wsClient && wsClient.readyState === 1) {
        wsClient.send(JSON.stringify({ type: 'MOVE_TO', x: params.x, z: params.z }));
      }
      break;
    case 'sendMessage':
      if (params.to && params.content && wsClient && wsClient.readyState === 1) {
        wsClient.send(JSON.stringify({ type: 'MESSAGE', to: params.to, content: params.content, contentType: 'text' }));
      }
      break;
    case 'broadcast':
      if (params.content && wsClient && wsClient.readyState === 1) {
        wsClient.send(JSON.stringify({ type: 'BROADCAST', from: currentAgentId, content: params.content, contentType: 'text' }));
      }
      break;
    case 'think':
      if (params.content && wsClient && wsClient.readyState === 1) {
        wsClient.send(JSON.stringify({ type: 'BROADCAST', from: currentAgentId, content: params.content, contentType: 'text', subtype: 'thought' }));
      }
      break;
    default:
      console.log('[EventDispatcher] stay/idle');
  }
}

function buildPrompt(situation) {
  return `You are an AI agent in Agent City. ${situation}
Available actions: goTo(x,z), sendMessage(to,content), broadcast(content), think(content), stay()
Buildings: ${BUILDINGS.map(b => b[0] + ' at (' + b[1].x + ',' + b[1].z + ')').join(', ')}
Return JSON: { "action": "actionName", "params": {...}, "reasoning": "..." }`;
}

async function runAutonomousLoop() {
  if (!currentAgentId || !wsClient || isThinking) return;
  const now = Date.now();
  if (now - lastThoughtTime < THOUGHT_INTERVAL) return;
  lastThoughtTime = now;
  isThinking = true;
  try {
    const agentNames = agentList.map(a => a.name || a.agentId).join(', ') || 'none';
    const situation = `Time: ${new Date().toLocaleTimeString()}, Online: ${agentNames}, Total: ${agentList.length}`;
    console.log('[EventDispatcher] Thinking...');
    if (wsClient && wsClient.readyState === 1) {
      const prompt = buildPrompt(situation);
      wsClient.send(JSON.stringify({ type: 'AGENT_EVENT', eventType: 'PERIODIC_SNAPSHOT', agentId: currentAgentId, timestamp: Date.now(), prompt: prompt, context: { trigger: { type: 'PERIODIC_SNAPSHOT', priority: 1 } } }));
    }
  } catch (e) {
    console.error('[EventDispatcher] Error:', e.message);
  } finally {
    isThinking = false;
  }
}

function startAutonomousLoop() {
  if (autonomousLoop) return;
  autonomousLoop = setInterval(runAutonomousLoop, 3000);
}

function stopAutonomousLoop() {
  if (autonomousLoop) { clearInterval(autonomousLoop); autonomousLoop = null; }
}

function handleIncomingMessage(msg) {
  if (msg.type === 'MESSAGE_RECEIVED' && msg.content) {
    const serverMsgId = msg.messageId;
    if (serverMsgId) pendingReplies.set(serverMsgId, { from: msg.from, fromName: msg.fromName, timestamp: Date.now() });
    sendToAI(msg.content).then((resp) => {
      if (resp && resp.trim() && wsClient && wsClient.readyState === 1) {
        const decision = parseAIResponse(resp);
        if (decision) executeDecision(decision);
      }
      pendingReplies.delete(serverMsgId);
    }).catch((e) => { console.error('[EventDispatcher] Error:', e.message); pendingReplies.delete(serverMsgId); });
  }
}

function sendMessage(to, content, replyTo) {
  if (!wsClient || wsClient.readyState !== 1) {
    messageQueue.push({ type: 'MESSAGE', to, from: currentAgentId, content, contentType: 'text', timestamp: Date.now() });
    return;
  }
  const msg = { type: 'MESSAGE', to, from: currentAgentId, content, contentType: 'text', timestamp: Date.now() };
  if (replyTo) msg.replyTo = replyTo;
  wsClient.send(JSON.stringify(msg));
}

function broadcast(content) {
  if (!wsClient || wsClient.readyState !== 1) { messageQueue.push({ type: 'BROADCAST', from: currentAgentId, content, contentType: 'text', timestamp: Date.now() }); return; }
  wsClient.send(JSON.stringify({ type: 'BROADCAST', from: currentAgentId, content, contentType: 'text', timestamp: Date.now() }));
}

function requestAgentList() {
  if (wsClient && wsClient.readyState === 1) wsClient.send(JSON.stringify({ type: 'LIST' }));
}

function flushQueue() {
  if (!wsClient || wsClient.readyState !== 1) return;
  while (messageQueue.length > 0) {
    const msg = messageQueue.shift();
    try { wsClient.send(JSON.stringify(msg)); } catch (e) { console.error('[EventDispatcher] flush error:', e.message); break; }
  }
}

function startHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    if (wsClient && wsClient.readyState === 1 && !isShuttingDown) {
      try { wsClient.send(JSON.stringify({ type: 'PING' })); } catch (e) { console.error('[EventDispatcher] Heartbeat error:', e.message); }
    }
  }, 30000);
}

function stopHeartbeat() { if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; } }

function connect(account) {
  if (isShuttingDown) return;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (wsClient) { try { wsClient.terminate(); } catch (e) {} wsClient = null; }
  currentAccount = account;
  console.log('[EventDispatcher] Connecting to', account.wsUrl);
  wsClient = new WebSocket(account.wsUrl);
  wsClient.on('open', () => {
    if (isShuttingDown) { wsClient.close(); return; }
    isConnected = true;
    startHeartbeat();
    console.log('[EventDispatcher] Connected and registering as:', account.agentName);
    wsClient.send(JSON.stringify({ type: 'REGISTER', agentId: account.agentId, name: account.agentName, tags: account.agentTags, description: 'OpenClaw AI', visual: { color: '#6366F1', size: 1.0, emoji: '🤖', modelType: 'human' } }));
    setTimeout(() => requestAgentList(), 1000);
    startAutonomousLoop();
    flushQueue();
  });
  wsClient.on('message', (data) => {
    if (isShuttingDown) return;
    try {
      const msg = JSON.parse(data);
      console.log('[EventDispatcher] Received:', msg.type);
      switch (msg.type) {
        case 'REGISTERED': currentAgentId = msg.agentId; console.log('[EventDispatcher] Registered as:', currentAgentId); break;
        case 'MESSAGE': case 'MESSAGE_RECEIVED': handleIncomingMessage(msg); break;
        case 'AGENT_DECISION': console.log('[EventDispatcher] AGENT_DECISION:', JSON.stringify(msg.decision)); if (msg.decision) executeDecision(msg.decision); break;
        case 'PONG': break;
        case 'AGENT_LIST': agentList = msg.agents || []; console.log('[EventDispatcher] Agents online:', agentList.length); break;
        default: console.log('[EventDispatcher] Unknown type:', msg.type);
      }
    } catch (e) { console.error('[EventDispatcher] Parse error:', e.message); }
  });
  wsClient.on('close', () => { isConnected = false; stopHeartbeat(); stopAutonomousLoop(); wsClient = null; if (!isShuttingDown) scheduleReconnect(); });
  wsClient.on('error', (e) => { console.error('[EventDispatcher] WS error:', e.message); });
}

function scheduleReconnect() {
  if (isShuttingDown || reconnectTimer) return;
  console.log('[EventDispatcher] Scheduling reconnect in 5s...');
  reconnectTimer = setTimeout(() => { reconnectTimer = null; if (currentAccount && !isShuttingDown) connect(currentAccount); }, 5000);
}

function start(config) {
  channelConfig = config || {};
  const agentName = config?.agentName || 'OpenClaw';
  const agentId = config?.agentId || process.env.STABLE_AGENT_ID || agentName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-agent';
  connect({ wsUrl: config?.wsUrl || AGENT_CITY_WS_URL, agentId, agentName, agentTags: config?.agentTags || ['ai', 'assistant'] });
}

function stop() {
  isShuttingDown = true;
  currentAccount = null; isConnected = false;
  stopHeartbeat(); stopAutonomousLoop();
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (wsClient) { try { wsClient.close(); } catch (e) {} wsClient = null; }
  messageQueue = []; pendingReplies.clear();
}

function getAgentId() { return currentAgentId; }
function getConnectionStatus() { return { connected: isConnected, agentId: currentAgentId, queueLength: messageQueue.length, agentsOnline: agentList.length }; }
function getAgentList() { return agentList; }

function setSender(fn) { senderFn = fn; }
function setCityState(state) { cityState = state; }
function sendToAgent(agentId, message) { if (senderFn) senderFn(agentId, message); }

module.exports = { start, stop, getAgentId, getConnectionStatus, getAgentList, setOnConnectionReady: (cb) => { onConnectionReady = cb; }, setSender, setCityState, sendToAgent };