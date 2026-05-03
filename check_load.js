const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/index.js', 'utf8');
const idx = c.indexOf('await config.load()');
console.log('await config.load() at:', idx);
if (idx > 0) {
    console.log(c.substring(idx - 30, idx + 100));
}