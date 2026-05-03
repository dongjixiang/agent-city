const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js', 'utf8');

console.log('handleAIDecisionResponse at:', c.indexOf('async handleAIDecisionResponse('));

// Find where context is used
const lines = c.split('\n');
console.log('\nLines with context:');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('context')) {
        console.log('Line', i + 1, ':', lines[i].trim().substring(0, 100));
    }
}