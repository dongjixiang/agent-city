const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/interaction/transformer-controller.js';
let content = fs.readFileSync(path, 'utf8');

// Count occurrences
let n = 0, i = 0;
while ((i = content.indexOf('isValidWalkPosition', i)) !== -1) { n++; i++; }
console.log('isValidWalkPosition count:', n);

n = 0; i = 0;
while ((i = content.indexOf('group.position.x += moveX', i)) !== -1) { n++; i++; }
console.log('group.position.x count:', n);

// The file should now have:
// - isValidWalkPosition: only in import (1 occurrence)
// - group.position.x: 1 occurrence

// If more than 1 of either, need to fix
if (n > 1 || content.includes('isValidWalkPosition(newX')) {
    console.log('WARNING: file still has issues');
} else {
    console.log('File looks correct');
}
