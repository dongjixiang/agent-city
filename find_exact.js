const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/camera-system.js', 'utf8');

// Find the exact content around the highlight function
const idx = c.indexOf('/**\n     * 高亮智能体');
if (idx > 0) {
    console.log('Found at:', idx);
    console.log('Content 200 chars before:');
    console.log(JSON.stringify(c.substring(idx - 200, idx)));
    console.log('\nContent at:');
    console.log(JSON.stringify(c.substring(idx, idx + 100)));
}