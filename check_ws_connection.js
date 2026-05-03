const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/websocket/connection.js', 'utf8');
console.log('File size:', c.length);
console.log('UPDATE_AGENT_CONFIG found:', c.includes('UPDATE_AGENT_CONFIG'));
const idx = c.indexOf('type:');
console.log('type: at:', idx);
if (idx > 0) {
    console.log(c.substring(idx - 20, idx + 100));
}