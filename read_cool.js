const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');
const idx = c.indexOf('// 无论如何都要检查冷却');
console.log('冷却检查 at:', idx);
if (idx > 0) {
    console.log(c.substring(idx - 10, idx + 600));
}