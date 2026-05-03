const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');
const idx = c.indexOf('正在探索中，跳过');
if (idx > 0) {
    console.log('Found! Context:');
    console.log(c.substring(idx - 100, idx + 300));
} else {
    console.log('Not found!');
}