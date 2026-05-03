const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js', 'utf8');

// Check handleAIDecisionResponse - how is it triggered?
const idx = c.indexOf('async handleAIDecisionResponse(');
console.log('handleAIDecisionResponse at:', idx);
if (idx > 0) {
    const lines = c.substring(idx).split('\n');
    for (let i = 0; i < 150 && i < lines.length; i++) {
        console.log(i + 1, ':', lines[i]);
    }
}