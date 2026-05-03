const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/index.js', 'utf8');
const lines = c.split('\n');
// Show the end of initialization (around line 270+)
console.log('Lines 265-285:');
for (let i = 264; i < 285; i++) {
    console.log(i + 1, ':', lines[i]);
}