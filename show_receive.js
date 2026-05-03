const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js', 'utf8');
const lines = c.split('\n');
console.log('Lines 795-815:');
for (let i = 794; i < 815; i++) {
    console.log(String(i + 1).padStart(3, ' ') + ': ' + lines[i]);
}