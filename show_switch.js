const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js', 'utf8');
const lines = c.split('\n');
console.log('All case statements in handleMessage switch:');
for (let i = 158; i < 220; i++) {
    console.log(String(i + 1).padStart(3, ' ') + ': ' + lines[i]);
}