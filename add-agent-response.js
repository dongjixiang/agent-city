const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/server-fixed.js';
let c = fs.readFileSync(path, 'utf8');

// Add pendingMessages map after the agents declaration
if (!c.includes('pendingMessages')) {
    c = c.replace(
        'const agents = new Map();',
        `const agents = new Map();\nconst pendingMessages = new Map(); // messageId -> { ws, from, originalFrom }`
    );
    console.log('Added pendingMessages map');
}

// Add handleAgentResponse function before handleMessageP2P
const handleAgentResponseFunc = `

// 处理来自AI智能体的消息回复 - 正确路由回原始发送者
function handleAgentResponse(ws, msg) {
  const { from, to, content, contentType, messageId } = msg;
  const fromName = AgentStore.getAgent(from)?.name || from;
  
  console.log(\`💬 AI回复 [\$%{fromName} → \$%{to}]: \$%{content?.substring(0, 50)}\`);
  
  // 查找原始消息的发送者
  if (messageId && pendingMessages.has(messageId)) {
    const pending = pendingMessages.get(messageId);
    if (pending.ws && pending.ws.readyState === WebSocket.OPEN) {
      pending.ws.send(JSON.stringify({
        type: 'MESSAGE',
        from: from,
        fromName: fromName,
        content: content,
        contentType: contentType || 'text',
        timestamp: Date.now()
      }));
      console.log(\`💬 AI回复已路由到原始发送者 (messageId: \$%{messageId})\`);
      pendingMessages.delete(messageId);
      return;
    }
    pendingMessages.delete(messageId);
  }
  
  // 如果找不到原始发送者，尝试广播给所有客户端
  console.log(\`💬 未找到原始发送者，广播AI回复\`);
  broadcast({
    type: 'MESSAGE',
    from: from,
    fromName: fromName,
    content: content,
    contentType: contentType || 'text',
    timestamp: Date.now()
  }, null);
}
`;

if (!c.includes('handleAgentResponse')) {
    c = c.replace(
        'function handleMessageP2P(ws, msg) {',
        handleAgentResponseFunc + '\nfunction handleMessageP2P(ws, msg) {'
    );
    console.log('Added handleAgentResponse function');
}

// Modify handleMessageP2P to save pending message and generate messageId
const oldTargetSend = `target.ws.send(JSON.stringify({
      type: 'MESSAGE',
      from: from,
      fromName: fromName,
      content: content,
      contentType: contentType || 'text',
      timestamp: Date.now()
    }));`;

const newTargetSend = `// 保存待处理消息用于路由回复
    const msgId = uuidv4();
    pendingMessages.set(msgId, { ws: senderWs, from: to, originalFrom: from });
    
    target.ws.send(JSON.stringify({
      type: 'MESSAGE',
      messageId: msgId,
      from: from,
      fromName: fromName,
      content: content,
      contentType: contentType || 'text',
      timestamp: Date.now()
    }));`;

if (c.includes(oldTargetSend) && !c.includes('pendingMessages.set')) {
    c = c.replace(oldTargetSend, newTargetSend);
    console.log('Updated handleMessageP2P to save pending messages');
}

// Modify the message handler to call handleAgentResponse for AI messages
const oldMessageHandler = `} else if (msg.type === 'MESSAGE') {
      handleMessageP2P(ws, msg);`;

const newMessageHandler = `} else if (msg.type === 'MESSAGE') {
      // 检查是否是AI智能体发送的回复
      if (from && (from.includes('openclaw') || from.includes('assistant'))) {
        handleAgentResponse(ws, msg);
      } else {
        handleMessageP2P(ws, msg);
      }`;

if (c.includes(oldMessageHandler) && !c.includes('handleAgentResponse(ws, msg)')) {
    c = c.replace(oldMessageHandler, newMessageHandler);
    console.log('Updated message handler to route AI responses');
}

fs.writeFileSync(path, c);
console.log('Server update applied!');
