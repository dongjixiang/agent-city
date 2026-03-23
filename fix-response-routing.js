const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/server-fixed.js';
let c = fs.readFileSync(path, 'utf8');

// Add browserConnections map after agents declaration
if (!c.includes('browserConnections')) {
    c = c.replace(
        'const agents = new Map();',
        `const agents = new Map();\nconst browserConnections = new Map(); // sessionId -> ws, for routing AI responses back to browser`
    );
    console.log('Added browserConnections map');
}

// Modify handleMessageP2P to save browser's ws when receiving from browser
const oldFromUserCheck = `function handleMessageP2P(ws, msg) {
  const { from, to, content, contentType } = msg;`;

const newFromUserCheck = `function handleMessageP2P(ws, msg) {
  const { from, to, content, contentType } = msg;
  
  // If message is from browser (from 'user'), save the ws for response routing
  if (from === 'user' || from === 'browser') {
    browserConnections.set('browser', ws);
    console.log('💬 Saved browser WebSocket connection for response routing');
  }`;

if (c.includes(oldFromUserCheck) && !c.includes('browserConnections.set')) {
    c = c.replace(oldFromUserCheck, newFromUserCheck);
    console.log('Added browser ws saving logic');
}

// Modify the else branch (target not found) to handle AI responses to browser
const oldTargetNotFound = `  } else {
    console.log(\`💬 目标未找到: ${to} (尝试解析为: ${targetAgentId})\`);
  }`;

const newTargetNotFound = `  } else {
    // Check if this is an AI agent sending a response back to the browser
    if ((from.includes('openclaw') || from.includes('assistant')) && (to === 'user' || to === 'browser')) {
      // Route AI response back to browser
      const browserWs = browserConnections.get('browser');
      if (browserWs && browserWs.readyState === WebSocket.OPEN) {
        const fromName = AgentStore.getAgent(from)?.name || from;
        browserWs.send(JSON.stringify({
          type: 'MESSAGE',
          from: from,
          fromName: fromName,
          content: content,
          contentType: contentType || 'text',
          timestamp: Date.now()
        }));
        console.log('💬 AI response routed back to browser');
        return;
      }
    }
    console.log('💬 目标未找到: ' + to + ' (尝试解析为: ' + targetAgentId + ')');
  }`;

if (c.includes(oldTargetNotFound) && !c.includes('AI response routed back to browser')) {
    c = c.replace(oldTargetNotFound, newTargetNotFound);
    console.log('Added AI response routing to browser');
}

fs.writeFileSync(path, c);
console.log('Fix applied!');
