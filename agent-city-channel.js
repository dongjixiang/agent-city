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

function callAI(prompt, timeoutMs) {
  return new Promise(function(resolve) {
    console.log('[AgentCity] Calling AI...');
    timeoutMs = timeoutMs || 60000;
    try {
      var body = JSON.stringify({
        model: channelConfig && channelConfig.model || 'minimax-cn/MiniMax-M2.7',
        input: prompt
      });
      var options = {
        hostname: '127.0.0.1',
        port: channelConfig && channelConfig.aiPort || 18789,
        path: channelConfig && channelConfig.aiPath || '/v1/responses',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + GATEWAY_TOKEN,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      };
      var req = http.request(options, function(res) {
        var data = '';
        res.on('data', function(chunk) { data += chunk; });
        res.on('end', function() {
          try {
            var r = JSON.parse(data);
            if (r.output && r.output[0] && r.output[0].content && r.output[0].content[0] && r.output[0].content[0].text) {
              resolve(r.output[0].content[0].text);
            } else if (r.output && r.output[0] && r.output[0].text) {
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
      req.on('error', function(e) {
        console.error('[AgentCity] HTTP error:', e.message);
        resolve('');
      });
      req.setTimeout(timeoutMs, function() {
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

function parseDecision(text) {
  try {
    var jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('[AgentCity] Parse error:', e.message);
  }
  return null;
}

function handleAgentEvent(msg) {
  if (isShuttingDown) return;
  if (isThinking) {
    console.log('[AgentCity] Already thinking, skip');
    return;
  }

  console.log('[AgentCity] AGENT_EVENT:', msg.eventType);
  isThinking = true;

  var prompt = msg.prompt;
  if (!prompt) {
    console.log('[AgentCity] No prompt in event, skip');
    isThinking = false;
    return;
  }

  callAI(prompt).then(function(aiResponse) {
    if (!aiResponse || !aiResponse.trim()) {
      console.log('[AgentCity] AI response empty');
      isThinking = false;
      return;
    }

    console.log('[AgentCity] AI response:', aiResponse.substring(0, 200));

    var decision = parseDecision(aiResponse);
    if (!decision || !decision.action) {
      console.log('[AgentCity] Could not parse decision');
      isThinking = false;
      return;
    }

    sendDecision(decision, msg);
    isThinking = false;
  }).catch(function(e) {
    console.error('[AgentCity] handleAgentEvent error:', e.message);
    isThinking = false;
  });
}

function sendDecision(decision, event) {
  if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
    console.log('[AgentCity] WS not ready, queue decision');
    messageQueue.push({ type: 'AGENT_DECISION', agentId: currentAgentId, timestamp: Date.now(), decision: decision });
    return;
  }

  var payload = {
    type: 'AGENT_DECISION',
    agentId: currentAgentId,
    timestamp: Date.now(),
    decision: {
      action: decision.action,
      params: decision.params || {},
      reasoning: decision.reasoning || ''
    }
  };

  if (event && event.context && event.context.trigger && event.context.trigger.message && event.context.trigger.message.replyTo) {
    payload.decision.replyTo = event.context.trigger.message.replyTo;
  }

  try {
    wsClient.send(JSON.stringify(payload));
    console.log('[AgentCity] Sent AGENT_DECISION:', decision.action);
  } catch (e) {
    console.error('[AgentCity] Send error:', e.message);
  }
}

function handleIncomingMessage(msg) {
  console.log('[AgentCity] MESSAGE from:', msg.fromName || msg.from);
}

function flushQueue() {
  if (!wsClient || wsClient.readyState !== WebSocket.OPEN) return;
  while (messageQueue.length > 0) {
    var msg = messageQueue.shift();
    try {
      wsClient.send(JSON.stringify(msg));
    } catch (e) {
      console.error('[AgentCity] flush error:', e.message);
      break;
    }
  }
}

function connect(account) {
  if (isShuttingDown) return;

  var oldWs = wsClient;
  if (oldWs) {
    try { oldWs.terminate(); } catch (e) {}
  }
  wsClient = null;

  console.log('[AgentCity] Connecting to', account.wsUrl);
  var ws = new WebSocket(account.wsUrl);

  ws.on('open', function() {
    if (isShuttingDown) { try { ws.close(); } catch(e) {} return; }

    console.log('[AgentCity] Connected!');
    isConnected = true;
    wsClient = ws;

    try {
      ws.send(JSON.stringify({
        type: 'REGISTER',
        agentId: account.agentId,
        name: account.agentName,
        tags: account.agentTags || ['ai', 'assistant'],
        description: 'OpenClaw AI Assistant',
        visual: { color: '#6366F1', size: 1.0, emoji: '🤖', modelType: 'human' }
      }));
    } catch (e) {
      console.error('[AgentCity] Register error:', e.message);
    }

    setTimeout(function() {
      if (wsClient === ws && !isShuttingDown) {
        try { ws.send(JSON.stringify({ type: 'LIST' })); } catch(e) {}
      }
    }, 500);

    setTimeout(function() { flushQueue(); }, 100);
  });

  ws.on('message', function(data) {
    if (isShuttingDown) return;
    try {
      var msg = JSON.parse(data);
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

  ws.on('close', function() {
    console.log('[AgentCity] Closed');
    isConnected = false;
    if (wsClient === ws) wsClient = null;
    if (!isShuttingDown) {
      setTimeout(function() { connect(account); }, 5000);
    }
  });

  ws.on('error', function(e) {
    console.error('[AgentCity] WS error:', e.message);
  });
}

function startChannel(config) {
  channelConfig = config || {};
  var agentName = channelConfig.agentName || 'OpenClaw Assistant';
  var agentId = channelConfig.agentId || process.env.STABLE_AGENT_ID || 'openclaw-agent';

  connect({
    wsUrl: channelConfig.wsUrl || AGENT_CITY_WS_URL,
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
  startChannel: startChannel,
  stopChannel: stopChannel,
  getAgentId: getAgentId,
  getConnectionStatus: getConnectionStatus,
  getAgentList: getAgentList
};
