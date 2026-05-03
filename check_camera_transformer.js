const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/camera-system.js', 'utf8');
const idx = c.indexOf('_handleTransformerClick');
console.log('_handleTransformerClick at:', idx);
if (idx > 0) {
    console.log(c.substring(idx, idx + 500));
}