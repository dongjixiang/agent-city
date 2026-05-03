const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js', 'utf8');
const idx = c.indexOf('handleAIDecisionResponse');
console.log('handleAIDecisionResponse at:', idx);
if (idx > 0) {
    console.log(c.substring(idx, idx + 800));
}