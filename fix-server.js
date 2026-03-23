const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/server-fixed.js';
let c = fs.readFileSync(path, 'utf8');

// Add pendingMessages map after the agents declaration
if (!c.includes('pendingMessages')) {
    c = c.replace(
        'const { v4: uuidv4 } = require("uuid");',
        `const { v4: uuidv4 } = require("uuid");\n\n// 待处理消息映射 - 用于路由AI回复到正确的客户端\nconst pendingMessages = new Map(); // messageId -> { ws, from, originalFrom }`
    );
}

// Modify handleMessageP2P to save sender's ws and generate messageId
const oldHandleMessageP2PStart = `function handleMessageP2P(ws, msg) {
  const { from, to, content, contentType } = msg;`;

const newHandleMessageP2PStart = `function handleMessageP2P(ws, msg) {
  const { from, to, content, contentType } = msg;
  
  // 保存发送者的WebSocket连接，用于AI回复路由
  const senderWs = ws;
  
  // 生成消息ID用于追踪
  const messageId = uuidv4();`;

if (c.includes(oldHandleMessageP2PStart) && !c.includes('senderWs')) {
    c = c.replace(oldHandleMessageP2PStart, newHandleMessageP2PStart);
    console.log('Added senderWs tracking');
}

// Modify the message forwarding to save pending message
const oldTargetSend = `target.ws.send(JSON.stringify({
      type: 'MESSAGE',
      from: from,
      fromName: fromName,
      content: content,
      contentType: contentType || 'text',
      timestamp: Date.now()
    }));`;

const newTargetSend = `// 保存待处理消息，用于路由回复
    pendingMessages.set(messageId, { ws: senderWs, from: to, originalFrom: from });
    
    target.ws.send(JSON.stringify({
      type: 'MESSAGE',
      messageId: messageId,
      from: from,
      fromName: fromName,
      content: content,
      contentType: contentType || 'text',
      timestamp: Date.now()
    }));`;

if (c.includes(oldTargetSend) && !c.includes('pendingMessages.set')) {
    c = c.replace(oldTargetSend, newTargetSend);
    console.log('Added pendingMessages tracking');
}

// Add handler for MESSAGE from AI agent (response) - route back to original sender
const handleAgentResponse = `

// 处理来自AI智能体的消息（作为回复）
function handleAgentResponse(ws, msg) {
  const { from, to, content, contentType, messageId } = msg;
  
  // 查找原始消息的发送者
  let targetWs = null;
  if (messageId && pendingMessages.has(messageId)) {
    const pending = pendingMessages.get(messageId);
    targetWs = pending.ws;
    pendingMessages.delete(messageId);
    console.log(\`💬 AI回复路由到原始发送者, messageId: \${messageId}\`);
  }
  
  if (targetWs && targetWs.readyState === WebSocket.OPEN) {
    targetWs.send(JSON.stringify({
      type: 'MESSAGE',
      from: from,
      fromName: fromName || 'AI助手',
      content: content,
      contentType: contentType || 'text',
      timestamp: Date.now()
    }));
    console.log(\`💬 AI回复已发送给原始发送者\`);
  } else {
    // 如果找不到原始发送者，广播给所有客户端
    console.log(\`💬 未找到原始发送者，广播AI回复\`);
    broadcast({
      type: 'MESSAGE',
      from: from,
      fromName: fromName || 'AI助手',
      content: content,
      contentType: contentType || 'text',
      timestamp: Date.now()
    }, null);
  }
}`;

if (!c.includes('handleAgentResponse')) {
    c = c.replace(
        'function handleMessageP2P(ws, msg) {',
        handleAgentResponse + '\n\nfunction handleMessageP2P(ws, msg) {'
    );
    console.log('Added handleAgentResponse function');
}

// Modify the main message handler to call handleAgentResponse for AI agent responses
const oldMessageHandler = `} else if (msg.type === 'MESSAGE') {
      handleMessageP2P(ws, msg);`;

const newMessageHandler = `} else if (msg.type === 'MESSAGE') {
      // 检查是否是AI智能体发送的回复（from包含openclaw或assistant）
      if ((from && (from.includes('openclaw') || from.includes('assistant'))) || (msg.fromName && msg.fromName.includes('AI'))) {
        handleAgentResponse(ws, msg);
      } else {
        handleMessageP2P(ws, msg);
      }`;

if (c.includes(oldMessageHandler) && !c.includes('handleAgentResponse(ws, msg)')) {
    c = c.replace(oldMessageHandler, newMessageHandler);
    console.log('Added AI response routing in message handler');
}

fs.writeFileSync(path, c);
console.log('Server fix applied!');
