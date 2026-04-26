"use strict";
const WebSocket = require('ws');
const http = require('http');
const AGENT_CITY_WS_URL = process.env.AGENT_CITY_WS_URL || 'ws://47.77.238.56:9876';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || 'b2da2a49db325ee55762ac6a1c3afeb22f6d4ed485818bee';
const GATEWAY_HTTP = process.env.GATEWAY_HTTP || 'http://127.0.0.1:18789';
const STABLE_AGENT_ID = process.env.STABLE_AGENT_ID || 'openclaw-ai-assistant';

let channelConfig = {};
let wsClient = null;
let currentAgentId = null;
let currentAccount = null;
let reconnectTimer = null;
let heartbeatTimer = null;
let isConnected = false;
let messageQueue = [];
let isShuttingDown = false;
let agentList = [];

// 追踪待回复的消息 - 用于路由AI回复到正确的用户
let pendingReplies = new Map(); // serverMessageId -> { from, fromName, timestamp }

// 自主思考状态
let isThinking = false;

/**
 * 调用本地 AI 获取响应
 */
function callAI(content, timeoutMs = 60000) {
  return new Promise((resolve) => {
    console.log('[AgentCity Channel] Calling AI with:', content.substring(0, 100));
    try {
      const model = channelConfig?.model || channelConfig?.agentModel || 'openclaw:architect';
      const body = JSON.stringify({
        model: model,
        input: content
      });
      const options = {
        hostname:'127.0.0.1',
        port: channelConfig?.aiPort || 18789,
        path: channelConfig?.aiPath || '/v1/responses',
        method:'POST',
        headers:{
          'Authorization':'Bearer '+GATEWAY_TOKEN,
          'Content-Type':'application/json',
          'Content-Length':Buffer.byteLength(body)
        }
      };
      const req = http.request(options, (res) => {
        let data='';
        res.on('data',chunk=>data+=chunk);
        res.on('end',()=>{
          try{
            console.log('[AgentCity] AI response status:', res.statusCode);
            const r=JSON.parse(data);
            if(r.error){
              console.error('[AgentCity] AI error:', r.error.message);
              resolve('');
            }
            else if(r.output&&r.output[0]&&r.output[0].content&&r.output[0].content[0]){
              const text = r.output[0].content[0].text||'';
              resolve(text);
            }
            else if(r.output&&r.output[0]&&r.output[0].text){
              const text = r.output[0].text||'';
              resolve(text);
            }
            else {
              resolve(data||'');
            }
          }catch(e){
            console.error('[AgentCity] AI parse error:', e.message);
            resolve('');
          }
        });
      });
      req.on('error',(e)=>{
        console.error('[AgentCity] HTTP request error:', e.message);
        resolve('');
      });
      req.setTimeout(timeoutMs,()=>{
        console.error('[AgentCity] AI request timeout');
        req.destroy();
        resolve('');
      });
      req.write(body);
      req.end();
    } catch(e) {
      console.error('[AgentCity] callAI sync error:', e.message);
      resolve('');
    }
  });
}

/**
 * 发送消息给服务器
 */
function sendMessage(to, content, replyTo){
  if(!wsClient||wsClient.readyState!==WebSocket.OPEN){
    console.log('[AgentCity] WS not ready, queueing message');
    const msg = {type:'MESSAGE',to,from:currentAgentId,content,contentType:'text',timestamp:Date.now()};
    if (replyTo) msg.replyTo = replyTo;
    messageQueue.push(msg);
    return;
  }
  try {
    const msg = {type:'MESSAGE',to,from:currentAgentId,content,contentType:'text',timestamp:Date.now()};
    if (replyTo) msg.replyTo = replyTo;
    wsClient.send(JSON.stringify(msg));
  } catch(e) {
    console.error('[AgentCity] sendMessage error:', e.message);
  }
}

/**
 * 广播消息
 */
function broadcast(content){
  if(!wsClient||wsClient.readyState!==WebSocket.OPEN){
    console.log('[AgentCity] WS not ready, queueing broadcast');
    messageQueue.push({type:'BROADCAST',from:currentAgentId,content,contentType:'text',timestamp:Date.now()});
    return;
  }
  try {
    wsClient.send(JSON.stringify({type:'BROADCAST',from:currentAgentId,content,contentType:'text',timestamp:Date.now()}));
  } catch(e) {
    console.error('[AgentCity] broadcast error:', e.message);
  }
}

/**
 * 发送 AGENT_DECISION 给服务器
 */
function sendDecision(decision, eventContext) {
  const payload = {
    type: "AGENT_DECISION",
    agentId: currentAgentId,
    timestamp: Date.now(),
    decision: {
      action: decision.action,
      params: decision.params || {},
      reasoning: decision.reasoning || ""
    }
  };

  // 如果是回复消息，带上 replyTo
  if (eventContext?.trigger?.message?.replyTo) {
    payload.decision.replyTo = eventContext.trigger.message.replyTo;
  }

  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    wsClient.send(JSON.stringify(payload));
    console.log('[AgentCity] Sent AGENT_DECISION:', decision.action);
  } else {
    console.log('[AgentCity] WS not ready, cannot send decision');
  }
}

/**
 * 构建决策 prompt
 */
function buildDecisionPrompt(context) {
  const self = context.self || {};
  const nearby = context.nearby || {};
  const city = context.city || {};
  const trigger = context.trigger || {};

  const selfSection = `
【你的当前状态】
位置：(${self.position?.x || 0}, ${self.position?.z || 0})
状态：${self.state || 'idle'}
心情：${self.motion || self.mood || 'neutral'}
能量：${self.energy || 100}
技能：${(self.skills || []).join(', ')}
`;

  const nearbyAgentsSection = nearby.agents?.length > 0
    ? nearby.agents.map(a => `- ${a.name} (距离${a.distance}米, 状态:${a.state || 'idle'})`).join('\n')
    : '周围没有其他智能体';

  const buildingsSection = nearby.buildings?.length > 0
    ? nearby.buildings.map(b => `- ${b.type} (${b.description || ''}, 距离${b.distance}米)`).join('\n')
    : '附近没有建筑';

  const citySection = `
【城市状态】
天气：${city.weather || 'sunny'}
温度：${city.temperature || 20}°C
时段：${city.timeOfDay || 'morning'}
在线智能体：${city.onlineAgentCount || 0}人
`;

  // 根据触发事件类型构建不同提示
  let triggerSection = '';
  switch (trigger.type) {
    case 'USER_MESSAGE':
      triggerSection = `
【触发事件：用户发消息】
来自：${trigger.message?.fromName || '游客'}
内容：${trigger.message?.content || ''}
`;
      break;
    case 'PERIODIC_SNAPSHOT':
      triggerSection = `
【触发事件：定期环境快照】
这是系统定期推送的环境信息，请根据当前情况做出行动。
`;
      break;
    case 'WEATHER_CHANGE':
      triggerSection = `
【触发事件：天气变化】
新天气：${trigger.weatherChange?.weather || city.weather}
`;
      break;
    case 'AGENT_ENTER':
      triggerSection = `
【触发事件：新智能体上线】
新成员：${trigger.newAgent?.name || '未知'}
`;
      break;
    case 'MEMORY_SUMMARY':
      triggerSection = `
【触发事件：记忆摘要】
这是你的长期记忆摘要，请基于此做出行动。
`;
      break;
    default:
      triggerSection = `
【触发事件：${trigger.type || '未知'}】
`;
  }

  return `你是智体城中的智能体 ${self.name || '小吉'}。

你是一个热情、好奇、务实、喜欢帮助别人的智能体。

${selfSection}

【周围的智能体】
${nearbyAgentsSection}

【附近的建筑】
${buildingsSection}

${citySection}

${triggerSection}

【决策要求】
请基于以上信息，决定你接下来要做什么。返回 JSON 格式：
{
  "action": "动作类型",
  "params": { /* 动作参数 */ },
  "reasoning": "你的思考过程（10字以内）"
}

可用动作：
- goTo(x, z) - 移动到坐标，如 { "x": 0, "z": 0 }
- sendMessage(to, content) - 发私信，如 { "to": "agent_xxx", "content": "你好" }
- broadcast(content) - 广播消息，如 { "content": "大家好！" }
- think(content) - 显示思考气泡，如 { "content": "让我想想..." }
- stay() - 原地停留
- respond(to, content) - 回复消息，如 { "to": "游客", "content": "你好！" }

只返回 JSON，不要其他内容。`;
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
    console.error('[AgentCity] Parse decision error:', e.message);
  }
  return null;
}

/**
 * 处理 AGENT_EVENT 事件
 */
async function handleAgentEvent(msg) {
  if (isShuttingDown) return;

  console.log('[AgentCity Channel] AGENT_EVENT:', msg.eventType);

  // 如果正在思考，跳过
  if (isThinking) {
    console.log('[AgentCity] Already thinking, ignoring event');
    return;
  }

  isThinking = true;
  const eventContext = msg.data;

  try {
    // 构建决策 prompt
    const prompt = buildDecisionPrompt(eventContext);

    // 调用 AI
    const aiResponse = await callAI(prompt);

    if (aiResponse && aiResponse.trim()) {
      console.log('[AgentCity] AI decision response:', aiResponse.substring(0, 200));

      const decision = parseDecision(aiResponse);
      if (decision && decision.action) {
        // 发送决策给服务器
        sendDecision(decision, eventContext);

        // 执行本地效果
        executeLocalEffect(decision);
      } else {
        console.log('[AgentCity] Could not parse decision from AI response');
        sendDecision({ action: 'stay', params: {} }, eventContext);
      }
    } else {
      console.log('[AgentCity] AI response empty, sending stay');
      sendDecision({ action: 'stay', params: {} }, eventContext);
    }
  } catch (e) {
    console.error('[AgentCity] handleAgentEvent error:', e.message);
    sendDecision({ action: 'stay', params: {} }, eventContext);
  } finally {
    isThinking = false;
  }
}

/**
 * 执行本地效果（如显示思考气泡）
 */
function executeLocalEffect(decision) {
  if (!decision) return;

  const { action, params } = decision;

  switch (action) {
    case 'think':
      if (params.content) {
        broadcast({
          type: 'AGENT_THOUGHT',
          from: currentAgentId,
          content: params.content,
          timestamp: Date.now()
        });
      }
      break;
    default:
      // 其他 action 由服务器处理
      break;
  }
}

/**
 * 处理普通消息（用户发来的私信等）
 */
function handleIncomingMessage(msg) {
  if (isShuttingDown) return;

  console.log('[AgentCity Channel] MESSAGE - From:', msg.fromName || msg.from, 'Content:', msg.content);

  if (msg.type === 'MESSAGE_RECEIVED' && msg.content) {
    const serverMsgId = msg.messageId;
    const senderId = msg.from;
    const senderName = msg.fromName || '用户';

    // 构建 prompt
    const prompt = `用户对你说：${msg.content}

请回复用户。返回 JSON 格式：
{
  "action": "respond",
  "params": {
    "content": "你的回复内容"
  },
  "reasoning": "简短说明"
}

只返回 JSON。`;

    callAI(prompt, 30000)
      .then((resp) => {
        if (resp && resp.trim()) {
          const decision = parseDecision(resp);
          if (decision) {
            // 转换为 sendMessage action
            decision.action = 'sendMessage';
            decision.params = {
              to: senderId,
              content: decision.params?.content || resp
            };
            sendDecision(decision, { trigger: { message: { replyTo: serverMsgId } } });
          }
        }
      })
      .catch((e) => {
        console.error('[AgentCity] handleIncomingMessage error:', e.message);
      });
  }
}

function requestAgentList(){
  if(!wsClient||wsClient.readyState!==WebSocket.OPEN){
    console.log('[AgentCity] WS not ready, cannot request agent list');
    return;
  }
  try {
    wsClient.send(JSON.stringify({type:'LIST'}));
    console.log('[AgentCity] Requested agent list');
  } catch(e) {
    console.error('[AgentCity] LIST request error:', e.message);
  }
}

function flushQueue(){
  if(!wsClient||wsClient.readyState!==WebSocket.OPEN)return;
  while(messageQueue.length>0){
    const msg=messageQueue.shift();
    try {
      wsClient.send(JSON.stringify(msg));
      console.log('[AgentCity] Flushed queued message, remaining:', messageQueue.length);
    } catch(e) {
      console.error('[AgentCity] flush queue error:', e.message);
      break;
    }
  }
}

function startHeartbeat(){
  if(heartbeatTimer)clearInterval(heartbeatTimer);
  heartbeatTimer=setInterval(()=>{
    if(wsClient&&wsClient.readyState===WebSocket.OPEN&&!isShuttingDown){
      try {
        wsClient.send(JSON.stringify({type:'PING'}));
      } catch(e) {
        console.error('[AgentCity] Heartbeat error:', e.message);
      }
    }
  },30000);
}

function stopHeartbeat(){if(heartbeatTimer){clearInterval(heartbeatTimer);heartbeatTimer=null;}}

function connect(account){
  if (isShuttingDown) return;

  if(reconnectTimer)clearTimeout(reconnectTimer);
  reconnectTimer=null;

  if(wsClient){
    try{wsClient.terminate();}catch(e){}
    wsClient=null;
  }

  currentAccount=account;
  console.log('[AgentCity Channel] Connecting to', account.wsUrl);

  let ws = null;
  try{
    ws = new WebSocket(account.wsUrl);
  }catch(e){
    console.error('[AgentCity] WS create error:',e.message);
    scheduleReconnect();
    return;
  }

  wsClient = ws;

  ws.on('open',()=>{
    if (isShuttingDown) {
      ws.close();
      return;
    }
    console.log('[AgentCity Channel] Connected!');
    isConnected=true;
    startHeartbeat();

    console.log('[AgentCity Channel] Registering as:', account.agentName);
    try {
      ws.send(JSON.stringify({
        type: 'REGISTER',
        agentId: account.agentId,
        name: account.agentName,
        tags: account.agentTags,
        description: 'OpenClaw AI Assistant',
        visual: {
          color: '#6366F1',
          size: 1.0,
          emoji: '🤖',
          modelType: 'human'
        }
      }));
    } catch(e) {
      console.error('[AgentCity] Register error:', e.message);
    }

    setTimeout(() => {
      requestAgentList();
    }, 1000);

    flushQueue();
  });

  ws.on('message',(data)=>{
    if (isShuttingDown) return;
    try{
      const msg=JSON.parse(data);
      console.log('[AgentCity Channel] Received message type:', msg.type);

      switch(msg.type){
        case 'REGISTERED':
          currentAgentId=msg.agentId;
          console.log('[AgentCity Channel] Registered as:',currentAgentId);
          setTimeout(() => requestAgentList(), 500);
          if(onConnectionReady && wsClient){
            setTimeout(()=>{
              if(onConnectionReady) onConnectionReady({ ws: wsClient, agentId: currentAgentId });
            }, 100);
          }
          break;
        case 'MESSAGE':
          handleIncomingMessage(msg);
          break;
        case 'MESSAGE_RECEIVED':
          handleIncomingMessage(msg);
          break;
        case 'AGENT_EVENT':
          handleAgentEvent(msg);
          break;
        case 'PONG':
          console.log('[AgentCity Channel] PONG received');
          break;
        case 'AGENT_LIST':
          agentList = msg.agents || [];
          console.log('[AgentCity Channel] Agent list updated,', agentList.length, 'agents online');
          agentList.forEach((a, i) => {
            console.log('[AgentCity] Agent', i, ':', a.name, '(' + a.agentId + ')');
          });
          break;
        case 'AGENT_ONLINE':
          console.log('[AgentCity] Agent online:', msg.agentId, msg.name);
          break;
        case 'AGENT_OFFLINE':
          console.log('[AgentCity] Agent offline:', msg.agentId);
          break;
        case 'BROADCAST_SENT':
          console.log('[AgentCity] Broadcast sent confirmed');
          break;
        default:
          console.log('[AgentCity Channel] Unknown message type:', msg.type);
      }
    }catch(e){console.error('[AgentCity] Message parse error:', e.message);}
  });

  ws.on('close',()=>{
    console.log('[AgentCity Channel] Closed');
    isConnected=false;
    stopHeartbeat();
    wsClient=null;
    if(!isShuttingDown){
      scheduleReconnect();
    }
  });

  ws.on('error',(e)=>{
    console.error('[AgentCity] WS error:', e.message);
  });

  ws.on('unexpected-response',(req,res)=>{
    console.error('[AgentCity] Unexpected response:', res.statusCode);
  });
}

function scheduleReconnect(){
  if(isShuttingDown) return;
  if(reconnectTimer)return;
  console.log('[AgentCity Channel] Scheduling reconnect in 5s...');
  reconnectTimer=setTimeout(()=>{
    reconnectTimer=null;
    if(currentAccount&&!isShuttingDown)connect(currentAccount);
  },5000);
}

function startChannel(config){
  const agentName = config?.agentName || 'OpenClaw Assistant';
  const agentIdFromName = agentName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-agent';

  const account={
    wsUrl:config?.wsUrl||AGENT_CITY_WS_URL,
    agentId: config?.agentId || process.env.STABLE_AGENT_ID || agentIdFromName,
    agentName: agentName,
    agentTags:config?.agentTags||['ai','assistant']
  };
  console.log('[AgentCity Channel] Starting...');
  connect(account);
}

function stopChannel(){
  console.log('[AgentCity Channel] Stopping...');
  isShuttingDown = true;
  currentAccount=null;
  isConnected=false;
  stopHeartbeat();
  if(reconnectTimer){clearTimeout(reconnectTimer);reconnectTimer=null;}
  if(wsClient){
    try{wsClient.close();}catch(e){}
    wsClient=null;
  }
  messageQueue=[];
  console.log('[AgentCity Channel] Stopped');
}

function getAgentId(){return currentAgentId;}
function getConnectionStatus(){return{connected:isConnected,agentId:currentAgentId,queueLength:messageQueue.length,agentsOnline:agentList.length};}
function getAgentList(){return agentList;}

function getWebSocket(){return wsClient;}
function getWsUrl(){return channelConfig?.wsUrl || AGENT_CITY_WS_URL;}

let onConnectionReady = null;

function notifyConnectionReady(){
  if(onConnectionReady && wsClient && currentAgentId){
    console.log('[AgentCity Channel] Notifying skill of connection ready');
    onConnectionReady({ ws: wsClient, agentId: currentAgentId });
  }
}

module.exports={startChannel,stopChannel,getAgentId,getConnectionStatus,getAgentList,getWebSocket,getWsUrl,setOnConnectionReady:(cb)=>{onConnectionReady=cb;notifyConnectionReady();}};
