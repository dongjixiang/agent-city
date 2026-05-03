const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/camera-system.js', 'utf8');
const lines = c.split('\n');
// Find line 56 and context
for (let i = 54; i < 70; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}