const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js', 'utf8');
// Find handleAIDecision
const idx = c.indexOf('async handleAIDecision(');
console.log('handleAIDecision at:', idx);
if (idx > 0) {
    console.log(c.substring(idx, idx + 500));
}

// Also find handleAIDecisionResponse
const idx2 = c.indexOf('async handleAIDecisionResponse(');
console.log('\nhandleAIDecisionResponse at:', idx2);
if (idx2 > 0) {
    console.log(c.substring(idx2, idx2 + 100));
}