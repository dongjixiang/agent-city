const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js', 'utf8');
const idx = c.indexOf('handleAIDecisionResponse');
console.log('handleAIDecisionResponse at:', idx);
if (idx > 0) {
    console.log(c.substring(idx, idx + 100));
}

// Check if eventDispatcher is available
const idx2 = c.indexOf('this.eventDispatcher');
console.log('\nthis.eventDispatcher count:', (c.match(/this\.eventDispatcher/g) || []).length);
if (idx2 > 0) {
    console.log('\nFirst occurrence:', c.substring(idx2 - 30, idx2 + 50));
}

// Check how handleAIDecisionResponse accesses eventDispatcher
const idx3 = c.indexOf('eventDispatcher?.');
console.log('\neventDispatcher?. count:', (c.match(/eventDispatcher\?\./g) || []).length);