const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/camera-system.js', 'utf8');

// Find where _handleTransformerClick is called
const idx = c.indexOf('if (clickedMesh.userData.isTransformer)');
console.log('isTransformer check at:', idx);
if (idx > 0) {
    console.log(c.substring(idx - 50, idx + 200));
}

console.log('\n---\n');

// Find where _handleTransformerClick is called
const idx2 = c.indexOf('_handleTransformerClick()');
console.log('_handleTransformerClick call at:', idx2);
if (idx2 > 0) {
    console.log(c.substring(idx2 - 100, idx2 + 100));
}