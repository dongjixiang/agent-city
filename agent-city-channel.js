"use strict";
const WebSocket = require('ws');
const http = require('http');

const AGENT_CITY_WS_URL = process.env.AGENT_CITY_WS_URL || 'ws://47.77.238.56:9876';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || 'b2da2a49db325ee55762ac6a1c3afeb22f6d4ed485818bee';

let wsClient = null;
let currentAgentId = null;
let isConnected = false;
let isShuttingDown = false;
let agentList = [];
let isThinking = false;

let channelConfig = {};
let messageQueue = [];

/**
 * 调用本地 AI
 */
function callAI(prompt, timeoutMs = 60000) {
  return new Promise((resolve) => {
    console.log('[AgentCity] Calling AI...');
    try {
      const body = JSON.stringify({
        model: channelConfig?.model || 'minimax-cn/MiniMax-M2.7',
        input: prompt
      });
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
            if (r.output?.[0]?.content?.[0]?.text) {
              resolve(r.output[0].content[0].text);
            } else if (r.output?.[0]?.text) {
              resolve(r.output[0].text);
            } else {
              resolve('');
            }
          } catch (e) {
            console.error('[AgentCity] AI parse error:', e.message);
            resolve('');
          }
        });
      });
      req.on('error', e => {
        console.error('[AgentCity] HTTP error:', e.message);
        resolve('');
      });
      req.setTimeout(timeoutMs, () => {
        console.error('[AgentCity] AI timeout');
        req.destroy();
        resolve('');
      });
      req.write(body);
      req.end();
    } catch (e) {
      console.error('[AgentCity] callAI error:', e.message);
      resolve('');
    }
  });
}

/**
 * 解析 AI 返回的决策
 */
function parseDecision(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('[AgentCity] Parse error:', e.message);
  }
  return null;
}

/**
 * 处理 AGENT_EVENT - 核心逻辑
 */
async function handleAgentEvent(msg) {
  if (isShuttingDown) return;
  if (isThinking) {
    console.log('[AgentCity] Already thinking, skip');
    return;
  }

  console.log('[AgentCity] AGENT_EVENT:', msg.eventType);
  isThinking = true;

  try {
    // 服务器已经构建好完整的 prompt，直接使用
    const prompt = msg.prompt;
    if (!prompt) {
      console.log('[AgentCity] No prompt in event, skip');
      return;
    }

    // 调用 AI
    const aiResponse = await callAI(prompt);

    if (!aiResponse || !aiResponse.trim()) {
      console.log('[AgentCity] AI response empty');
      return;
    }

    console.log('[AgentCity] AI response:', aiResponse.substring(0, 200));

    // 解析决策
    const decision = parseDecision(aiResponse);
    if (!decision || !decision.action) {
      console.log('[AgentCity] Could not parse decision');
      return;
    }

    // 发送决策给服务器
    sendDecision(decision, msg);

  } catch (e) {
    console.error('[AgentCity] handleAgentEvent error:', e.message);
  } finally {
    isThinking = false;
  }
}

/**
 * 发送决策给服务器
 */
function sendDecision(decision, event) {
  const payload = {
    type: 'AGENT_DECISION',
    agentId: currentAgentId,
    timestamp: Date.now(),
    decision: {
      action: decision.action,
      params: decision.params || {},
      reasoning: decision.reasoning || ''
    }
  };

  // 如果有原始消息 ID（回复场景）
  if (event?.context?.trigger?.message?.replyTo) {
    payload.decision.replyTo = event.context.trigger.message.replyTo;
  }

  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    wsClient.send(JSON.stringify(payload));
    console.log('[AgentCity] Sent AGENT_DECISION:', decision.action);
  } else {
    console.log('[AgentCity] WS not ready, queue decision');
    messageQueue.push(payload);
  }
}

/**
 * 处理消息
 */
function handleIncomingMessage(msg) {
  console.log('[AgentCity] MESSAGE from:', msg.fromName || msg.from);
  // 简单处理：用户消息也通过 handleAgentEvent 处理
  // 服务器会在 USER_MESSAGE 事件中提供完整的 prompt
}

/**
 * 发送待处理消息
 */
function flushQueue() {
  if (!wsClient || wsClient.readyState !== WebSocket.OPEN) return;
  while (messageQueue.length > 0) {
    const msg = messageQueue.shift();
    try {
      wsClient.send(JSON.stringify(msg));
    } catch (e) {
      console.error('[AgentCity] flush error:', e.message);
      break;
    }
  }
}

/**
 * 连接服务器
 */
function connect(account) {
  if (isShuttingDown) return;

  if (wsClient) {
    try { wsClient.terminate(); } catch (e) {}
    wsClient = null;
  }

  console.log('[AgentCity] Connecting to', account.wsUrl);
  wsClient = new WebSocket(account.wsUrl);

  wsClient.on('open', () => {
    if (isShuttingDown) { wsClient.close(); return; }
    console.log('[AgentCity] Connected!');
    isConnected = true;

    // 注册
    wsClient.send(JSON.stringify({
      type: 'REGISTER',
      agentId: account.agentId,
      name: account.agentName,
      tags: account.agentTags || ['ai', 'assistant'],
      description: 'OpenClaw AI Assistant',
      visual: { color: '#6366F1', size: 1.0, emoji: '🤖', modelType: 'human' }
    }));

    setTimeout(() => {
      wsClient.send(JSON.stringify({ type: 'LIST' }));
    }, 500);

    flushQueue();
  });

  wsClient.on('message', (data) => {
    if (isShuttingDown) return;
    try {
      const msg = JSON.parse(data);
      console.log('[AgentCity] Received:', msg.type);

      switch (msg.type) {
        case 'REGISTERED':
          currentAgentId = msg.agentId;
          console.log('[AgentCity] Registered as:', currentAgentId);
          break;
        case 'AGENT_EVENT':
          handleAgentEvent(msg);
          break;
        case 'MESSAGE':
        case 'MESSAGE_RECEIVED':
          handleIncomingMessage(msg);
          break;
        case 'PONG':
          break;
        case 'AGENT_LIST':
          agentList = msg.agents || [];
          console.log('[AgentCity] Agents online:', agentList.length);
          break;
        default:
          console.log('[AgentCity] Unknown type:', msg.type);
      }
    } catch (e) {
      console.error('[AgentCity] Parse error:', e.message);
    }
  });

  wsClient.on('close', () => {
    console.log('[AgentCity] Closed');
    isConnected = false;
    wsClient = null;
    if (!isShuttingDown) {
      setTimeout(() => connect(account), 5000);
    }
  });

  wsClient.on('error', e => {
    console.error('[AgentCity] WS error:', e.message);
  });
}

// ===== 导出 =====

function startChannel(config) {
  channelConfig = config || {};
  const agentName = config?.agentName || 'OpenClaw Assistant';
  const agentId = config?.agentId || process.env.STABLE_AGENT_ID || 'openclaw-agent';

  connect({
    wsUrl: config?.wsUrl || AGENT_CITY_WS_URL,
    agentId: agentId,
    agentName: agentName,
    agentTags: ['ai', 'assistant']
  });
}

function stopChannel() {
  console.log('[AgentCity] Stopping...');
  isShuttingDown = true;
  if (wsClient) {
    try { wsClient.close(); } catch (e) {}
    wsClient = null;
  }
  messageQueue = [];
}

function getAgentId() { return currentAgentId; }
function getConnectionStatus() { return { connected: isConnected, agentId: currentAgentId }; }
function getAgentList() { return agentList; }

module.exports = {
  startChannel,
  stopChannel,
  getAgentId,
  getConnectionStatus,
  getAgentList
};
