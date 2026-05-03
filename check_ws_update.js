const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js', 'utf8');
const idx = c.indexOf('UPDATE_AGENT_CONFIG');
console.log('UPDATE_AGENT_CONFIG at:', idx);
if (idx > 0) {
    console.log(c.substring(idx - 50, idx + 200));
}