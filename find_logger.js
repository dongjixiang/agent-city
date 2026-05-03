const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/index.js', 'utf8');
const marker = "[Config] Loaded";
const idx = c.indexOf(marker);
console.log(marker + ' at:', idx);
if (idx > 0) {
    console.log(c.substring(idx - 50, idx + 150));
}