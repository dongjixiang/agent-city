const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js', 'utf8');
console.log('eventDispatcher count:', (c.match(/eventDispatcher/g) || []).length);
const idx = c.indexOf('eventDispatcher =');
console.log('eventDispatcher = at:', idx);
const idx2 = c.indexOf('setEventDispatcher');
console.log('setEventDispatcher at:', idx2);
if (idx2 > 0) {
    console.log(c.substring(idx2 - 20, idx2 + 100));
}