const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');
const lines = c.split('\n');
console.log('pendingDecision lines:');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('pendingDecision')) {
        console.log('Line', i + 1, ':', lines[i].trim().substring(0, 100));
    }
}