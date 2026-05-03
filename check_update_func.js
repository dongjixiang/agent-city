const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/ui/info-panel.js', 'utf8');
const idx = c.indexOf('updateExploreCooldown(agentId, cooldownSec)');
console.log('updateExploreCooldown at:', idx);
if (idx > 0) {
    console.log(c.substring(idx, idx + 500));
}