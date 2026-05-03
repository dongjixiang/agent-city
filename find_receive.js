const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js', 'utf8');
const lines = c.split('\n');
console.log('Lines with receiveDecision:');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('receiveDecision')) {
        console.log('Line', i + 1, ':', lines[i].trim().substring(0, 100));
    }
}

console.log('\nLines with onDecisionReceived:');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('onDecisionReceived')) {
        console.log('Line', i + 1, ':', lines[i].trim().substring(0, 100));
    }
}