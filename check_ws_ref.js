const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/ui/info-panel.js', 'utf8');
const idx = c.indexOf('worldWindow?.ws');
console.log('worldWindow?.ws at:', idx);
if (idx > 0) {
    console.log(c.substring(idx - 100, idx + 200));
}