const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js', 'utf8');
const idx = c.indexOf('AI_DECISION');
console.log('AI_DECISION at:', idx);
if (idx > 0) {
    console.log(c.substring(idx, idx + 300));
}