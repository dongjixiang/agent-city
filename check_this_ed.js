const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js', 'utf8');
console.log('this.eventDispatcher count:', (c.match(/this\.eventDispatcher/g) || []).length);
const idx = c.indexOf('this.eventDispatcher =');
console.log('this.eventDispatcher = at:', idx);
if (idx > 0) {
    console.log(c.substring(idx, idx + 100));
}
const idx2 = c.indexOf('this.eventDispatcher?.handleUpdateAgentConfig');
console.log('handleUpdateAgentConfig call at:', idx2);
if (idx2 > 0) {
    console.log(c.substring(idx2 - 50, idx2 + 150));
}