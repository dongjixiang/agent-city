const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/extensions/agent-city/agent-city-channel.js';
let c = fs.readFileSync(path, 'utf8');

// Find and replace the sendMessage function
const oldCode = "function sendMessage(to,content){if(!wsClient||wsClient.readyState!==WebSocket.OPEN)return;wsClient.send(JSON.stringify({type:'MESSAGE',to,content,contentType:'text',timestamp:Date.now()}));}";

const newCode = "function sendMessage(to,content){if(!wsClient||wsClient.readyState!==WebSocket.OPEN)return;wsClient.send(JSON.stringify({type:'MESSAGE',to,from:currentAgentId,content,contentType:'text',timestamp:Date.now()}));}";

if (c.includes(oldCode)) {
    c = c.replace(oldCode, newCode);
    fs.writeFileSync(path, c);
    console.log('Fixed sendMessage function!');
} else {
    console.log('Old code not found, checking current...');
    const idx = c.indexOf('function sendMessage');
    if (idx !== -1) {
        console.log('Found sendMessage at:', idx);
        console.log('Current code:', c.substring(idx, idx + 300));
    }
}
