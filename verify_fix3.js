const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');
const idx = c.indexOf('检查是否在冷却中');
if (idx > 0) {
    console.log(c.substring(idx - 10, idx + 500));
}