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
  
  console.log('[AgentCity Channel] MESSAGE - From:', msg.fromName || msg.from, 'Content:', msg.content);
  if(msg.type==='MESSAGE'&&msg.content){
    const msgId = ++requestId;
    const senderId = msg.from;
    aiPendingQueue.set(msgId, {from: msg.from, content: msg.content, timestamp: Date.now()});
    
    sendToAI(msg.content, msgId)
      .then((resp)=>{
        console.log('[AgentCity] AI resp:', resp?resp.substring(0,100):'empty');
        if(resp&&resp.trim()){
          aiPendingQueue.delete(msgId);
          // Send as VOICE_MESSAGE to trigger voice bubble in 3D world
          const voiceType = channelConfig?.voiceType || 'female_1';
          sendVoiceMessage(resp, voiceType);
          console.log('[AgentCity] Voice response sent!');
        } else {
          console.log('[AgentCity] AI response empty, not sending');
          aiPendingQueue.delete(msgId);
        }
      })
      .catch((e)=>{
        console.error('[AgentCity] Error:',e.message);
        aiPendingQueue.delete(msgId);
      });
  }
}

function sendMessage(to,content){
  if(!wsClient||wsClient.readyState!==WebSocket.OPEN){
    console.log('[AgentCity] WS not ready, queueing message');
    messageQueue.push({type:'MESSAGE',to,from:currentAgentId,content,contentType:'text',timestamp:Date.now()});
    return;
  }
  try {
    wsClient.send(JSON.stringify({type:'MESSAGE',to,from:currentAgentId,content,contentType:'text',timestamp:Date.now()}));
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

function sendVoiceMessage(content, voiceType){
  const msg = {type:'VOICE_MESSAGE',from:currentAgentId,content,voice:voiceType,timestamp:Date.now()};
  if(!wsClient||wsClient.readyState!==WebSocket.OPEN){
    console.log('[AgentCity] WS not ready, queueing voice message');
    messageQueue.push(msg);
    return;
  }
  try {
    wsClient.send(JSON.stringify(msg));
  } catch(e) {
    console.error('[AgentCity] sendVoiceMessage error:', e.message);
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

module.exports={startChannel,stopChannel,getAgentId,getConnectionStatus,getAgentList};