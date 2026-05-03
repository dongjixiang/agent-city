const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');
const lines = c.split('\n');
console.log('Lines 485-555:');
for (let i = 484; i < 555; i++) {
    console.log(String(i + 1).padStart(3, ' ') + ': ' + lines[i]);
}