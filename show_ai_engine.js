const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/ai/ai-engine.js', 'utf8');
const lines = c.split('\n');
console.log('Lines 140-200:');
for (let i = 139; i < 200; i++) {
    console.log(String(i + 1).padStart(3, ' ') + ': ' + lines[i]);
}