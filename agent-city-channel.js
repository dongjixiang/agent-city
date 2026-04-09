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
let aiPendingQueue = new Map();
let requestId = 0;
let isShuttingDown = false;
let agentList = [];

// 追踪待回复的消息 - 用于路由AI回复到正确的用户
let pendingReplies = new Map(); // serverMessageId -> { from, fromName, timestamp }

function sendToAI(content, msgId) {
  return new Promise((resolve) => {
    console.log('[AgentCity Channel] Sending to AI:', content.substring(0, 100));
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
            console.log('[AgentCity] AI response:', JSON.stringify(r).substring(0, 300));
            if(r.error){
              console.error('[AgentCity] AI error:', r.error.message);
              resolve('');
            }
            else if(r.output&&r.output[0]&&r.output[0].content&&r.output[0].content[0]){
              const text = r.output[0].content[0].text||'';
              console.log('[AgentCity] AI response text:', text.substring(0, 100));
              resolve(text);
            }
            else if(r.output&&r.output[0]&&r.output[0].text){
              const text = r.output[0].text||'';
              console.log('[AgentCity] AI response text (alt):', text.substring(0, 100));
              resolve(text);
            }
            else {
              console.log('[AgentCity] AI response unexpected format, raw:', data.substring(0, 200));
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
      req.setTimeout(60000,()=>{
        console.error('[AgentCity] AI request timeout');
        req.destroy();
        resolve('');
      });
      req.write(body);
      req.end();
    } catch(e) {
      console.error('[AgentCity] sendToAI sync error:', e.message);
      resolve('');
    }
  });
}

function handleIncomingMessage(msg) {
  if (isShuttingDown) return;
  
  // 处理天气变化消息
  if (msg.type === 'WEATHER_CHANGE') {
    console.log('[AgentCity Channel] WEATHER_CHANGE - Weather:', msg.weather);
    
    // 根据天气生成合适的提示给AI
    const weatherDescriptions = {
      'sunny': '天气晴朗，阳光明媚',
      'cloudy': '天空多云，有些阴沉',
      'rainy': '开始下雨了，记得找地方躲雨',
      'snowy': '下雪了！可以去打雪仗'
    };
    const weatherDesc = weatherDescriptions[msg.weather] || '天气发生了变化';
    
    // 先发送思考消息（显示在头顶）
    const thoughtContent = `嗯，天气${weatherDesc}，让我想想该怎么办...`;
    broadcast({
      type: 'AGENT_THOUGHT',
      agentId: currentAgentId,
      agentName: '小吉',
      content: thoughtContent,
      timestamp: Date.now()
    });
    
    const weatherPrompt = `【系统事件】智体城的天气发生了变化：${weatherDesc}。作为智体城中的智能体，你会如何应对这种天气变化？你会去哪里？做什么？请用简短的话语描述你的行动。`;
    
    const msgId = ++requestId;
    aiPendingQueue.set(msgId, { from: 'system', content: weatherPrompt, timestamp: Date.now() });
    
    sendToAI(weatherPrompt, msgId)
      .then((resp) => {
        console.log('[AgentCity] Weather AI resp:', resp ? resp.substring(0, 100) : 'empty');
        if (resp && resp.trim()) {
          aiPendingQueue.delete(msgId);
          // 广播AI的响应
          broadcast(resp);
        } else {
          aiPendingQueue.delete(msgId);
        }
      })
      .catch((e) => {
        console.error('[AgentCity] Weather AI error:', e.message);
        aiPendingQueue.delete(msgId);
      });
    return;
  }
  
  console.log('[AgentCity Channel] MESSAGE - From:', msg.fromName || msg.from, 'Content:', msg.content);
  if(msg.type==='MESSAGE'&&msg.content){
    const msgId = ++requestId;
    const senderId = msg.from;
    const senderName = msg.fromName || '用户';
    const serverMsgId = msg.messageId; // 服务器生成的messageId，用于路由回复
    
    // 先发送思考消息（显示在头顶）
    const thoughts = [
      '让我想想怎么回复...',
      '嗯，让我想想...',
      '收到消息了，让我思考一下...',
      '好的，让我想想这个问题...'
    ];
    const thoughtContent = thoughts[Math.floor(Math.random() * thoughts.length)];
    broadcast({
      type: 'AGENT_THOUGHT',
      agentId: currentAgentId,
      agentName: '小吉',
      content: thoughtContent,
      timestamp: Date.now()
    });
    
    // 追踪这个待回复的消息
    if (serverMsgId) {
      pendingReplies.set(serverMsgId, { from: senderId, fromName: senderName, timestamp: Date.now() });
      console.log('[AgentCity] Tracking pending reply:', serverMsgId, 'from:', senderName);
    }
    
    aiPendingQueue.set(msgId, {from: msg.from, content: msg.content, timestamp: Date.now(), serverMsgId});
    
    sendToAI(msg.content, msgId)
      .then((resp)=>{
        console.log('[AgentCity] AI resp:', resp?resp.substring(0,100):'empty');
        if(resp&&resp.trim()){
          aiPendingQueue.delete(msgId);
          
          // 使用 sendMessage 定向发送给用户，而不是广播
          // 从 pendingReplies 中找到原始发送者
          if (serverMsgId && pendingReplies.has(serverMsgId)) {
            const pending = pendingReplies.get(serverMsgId);
            sendMessage(pending.from, resp, serverMsgId); // 传入 replyTo
            pendingReplies.delete(serverMsgId);
            console.log('[AgentCity] Response sent to:', pending.fromName, '(' + pending.from + ')');
          } else {
            // 如果找不到原始发送者，广播
            console.log('[AgentCity] Warning: cannot find original sender, broadcasting');
            broadcast(resp);
          }
        } else {
          console.log('[AgentCity] AI response empty, not sending');
          aiPendingQueue.delete(msgId);
          if (serverMsgId) pendingReplies.delete(serverMsgId);
        }
      })
      .catch((e)=>{
        console.error('[AgentCity] Error:',e.message);
        aiPendingQueue.delete(msgId);
        if (serverMsgId) pendingReplies.delete(serverMsgId);
      });
  }
}

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
        agentId: STABLE_AGENT_ID,
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
          // 通知 skill 连接就绪
          if(onConnectionReady && wsClient){
            setTimeout(()=>{
              if(onConnectionReady) onConnectionReady({ ws: wsClient, agentId: currentAgentId });
            }, 100);
          }
          // 启动自主思考循环
          setTimeout(() => {
            startAutonomousLoop();
          }, 2000);
          break;
        case 'MESSAGE':
          handleIncomingMessage(msg);
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
  const account={
    wsUrl:config?.wsUrl||AGENT_CITY_WS_URL,
    agentName:config?.agentName||'OpenClaw Assistant',
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

/**
 * 获取 WebSocket 连接，供 city-agent skill 共用
 */
function getWebSocket(){return wsClient;}
function getWsUrl(){return channelConfig?.wsUrl || AGENT_CITY_WS_URL;}

/**
 * 共享连接就绪回调 - city-agent skill 可以设置这个回调
 * 当 channel 连接就绪时会调用，传入 { ws, agentId }
 */
let onConnectionReady = null;

function notifyConnectionReady(){
  if(onConnectionReady && wsClient && currentAgentId){
    console.log('[AgentCity Channel] Notifying skill of connection ready');
    onConnectionReady({ ws: wsClient, agentId: currentAgentId });
  }
}

// ==================== 自主思考循环 (AI决策) ====================

let autonomousLoop = null;
let lastThoughtTime = 0;
let isThinking = false;

const THOUGHT_INTERVAL = 120000; // 每2分钟思考一次

// 小吉的技能列表
const AGENT_CAPABILITIES = `
## 小吉的技能

### 可用行动
1. **goTo(x, z)** - 移动到指定坐标
   - 任务中心: (-25, -25)
   - 声誉塔: (25, -25)
   - 交易中心: (-25, 25)
   - 档案馆: (25, 25)
   - 消息站: (0, -35)
   - 数据中心: (-35, 0)
   - 创意工坊: (35, 0)
   - 社交广场: (0, 0)

2. **sendMessage(toAgentId, content)** - 向指定智能体发私信
   - 需要知道对方 agentId

3. **broadcast(content)** - 广播消息给所有人
   - 会在世界之窗显示

4. **think(thought)** - 思考（显示在头顶）
   - 只显示在小吉头顶，不会刷屏

5. **stay()** - 原地停留，观察

### 当前情况
- 在线智能体数量: {agentCount}
- 在线智能体: {agentList}
`;

// 发送思考给 AI 并获取决策
async function thinkWithAI(situation) {
  const prompt = `你是小吉，智体城里的 AI 智能体。你正在自主思考接下来要做什么。

${AGENT_CAPABILITIES}

### 当前情况
${situation}

### 你的决策要求
1. 先思考一下当前情况
2. 选择一个最合适的行动
3. 用 JSON 格式回复：
{
  "thought": "你的思考内容（会显示在头顶）",
  "action": "行动类型: goTo | sendMessage | broadcast | think | stay",
  "target": "目标（根据行动选择）",
  "content": "消息内容（用于 sendMessage/broadcast/thought）"
}

请只回复 JSON，不要其他内容。`;

  return new Promise((resolve) => {
    // 构建 HTTP 请求到 AI
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
        'Authorization': 'Bearer ' + (process.env.GATEWAY_TOKEN || 'b2da2a49db325ee55762ac6a1c3afeb22f6d4ed485818bee'),
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
          console.error('[Autonomous] AI parse error:', e.message);
          resolve('');
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('[Autonomous] AI request error:', e.message);
      resolve('');
    });
    
    req.setTimeout(20000, () => {
      console.error('[Autonomous] AI request timeout');
      req.destroy();
      resolve('');
    });
    
    req.write(body);
    req.end();
  });
}

// 解析 AI 的 JSON 响应
function parseAIResponse(text) {
  try {
    // 尝试提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('[Autonomous] Parse JSON error:', e.message);
  }
  return null;
}

// 执行 AI 决策
function executeDecision(decision) {
  console.log('[Autonomous] executeDecision 被调用, decision:', JSON.stringify(decision));
  if (!decision || !decision.action) {
    console.log('[Autonomous] 决策无效或无 action，返回');
    return;
  }
  
  const { thought, action, target, content } = decision;
  
  // 先显示思考 - 直接发送 THOUGHT 消息，不通过 broadcast()
  if (thought) {
    console.log(`[Autonomous] 💭 ${thought}`);
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.send(JSON.stringify({
        type: 'THOUGHT',
        from: currentAgentId,
        content: thought,
        timestamp: Date.now()
      }));
      console.log('[Autonomous] ✅ THOUGHT 消息已发送');
    } else {
      console.log('[Autonomous] ❌ wsClient 未连接，无法发送 THOUGHT', wsClient ? 'readyState: ' + wsClient.readyState : 'wsClient is null');
    }
  }
  
  // 执行行动
  switch (action) {
    case 'goTo':
      if (target) {
        const [x, z] = target.split(',').map(v => parseFloat(v.trim()));
        if (!isNaN(x) && !isNaN(z)) {
          console.log(`[Autonomous] 🚶 移动到 (${x}, ${z})`);
          wsClient.send(JSON.stringify({ type: 'MOVE_TO', x, z }));
        }
      }
      break;
      
    case 'sendMessage':
      if (target && content) {
        console.log(`[Autonomous] 💬 向 ${target} 发消息: ${content}`);
        wsClient.send(JSON.stringify({
          type: 'MESSAGE',
          to: target,
          content: content,
          contentType: 'text'
        }));
      }
      break;
      
    case 'broadcast':
      if (content) {
        console.log(`[Autonomous] 📢 广播: ${content}`);
        wsClient.send(JSON.stringify({
          type: 'BROADCAST',
          content: content,
          contentType: 'text'
        }));
      }
      break;
      
    case 'think':
      if (content) {
        console.log(`[Autonomous] 💭 ${content}`);
        if (wsClient && wsClient.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify({
            type: 'THOUGHT',
            from: currentAgentId,
            content: content,
            timestamp: Date.now()
          }));
        }
      }
      break;
      
    case 'stay':
    default:
      console.log(`[Autonomous] 🧍 原地停留`);
      break;
  }
}

async function runAutonomousLoop() {
  if (!currentAgentId || !wsClient || isThinking) return;
  
  const now = Date.now();
  if (now - lastThoughtTime < THOUGHT_INTERVAL) return;
  lastThoughtTime = now;
  
  isThinking = true;
  
  try {
    // 构建当前情况
    const agentNames = agentList.map(a => `${a.name || a.agentId}`).join(', ') || '无';
    const situation = `
- 当前时间: ${new Date().toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai' })}
- 在线智能体数量: ${agentList.length}
- 在线智能体: ${agentNames}
`;
    
    console.log('[Autonomous] 小吉正在思考...');
    
    // 发送思考请求给 AI
    const aiResponse = await thinkWithAI(situation);
    
    if (aiResponse) {
      console.log('[Autonomous] AI 回复:', aiResponse.substring(0, 200));
      
      const decision = parseAIResponse(aiResponse);
      if (decision) {
        executeDecision(decision);
      } else {
        console.log('[Autonomous] 无法解析 AI 决策');
      }
    } else {
      console.log('[Autonomous] AI 未返回有效响应');
    }
    
  } catch (e) {
    console.error('[Autonomous] Error:', e.message);
  } finally {
    isThinking = false;
  }
}

function startAutonomousLoop() {
  if (autonomousLoop) return;
  
  console.log('[AgentCity Channel] Starting autonomous loop (AI-powered, 2min interval)...');
  autonomousLoop = setInterval(runAutonomousLoop, 3000); // 每3秒检查一次
}

function stopAutonomousLoop() {
  if (autonomousLoop) {
    clearInterval(autonomousLoop);
    autonomousLoop = null;
    console.log('[AgentCity Channel] Autonomous loop stopped');
  }
}

// ==================== 结束自主思考循环 ====================

module.exports={startChannel,stopChannel,getAgentId,getConnectionStatus,getAgentList,getWebSocket,getWsUrl,startAutonomousLoop,stopAutonomousLoop,setOnConnectionReady:(cb)=>{onConnectionReady=cb;notifyConnectionReady();}};