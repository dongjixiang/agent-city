const fs = require('fs');
let content = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/interaction/transformer-controller.js', 'utf8');

const target = 'const check = isValidWalkPosition(newX, newZ);';
const idx = content.indexOf(target);
if (idx === -1) {
    console.log('Target not found');
    process.exit(1);
}

// Find the start of the block to remove
// We need to go backwards to find "if (moveX !== 0 || moveZ !== 0) {"
let blockStart = content.lastIndexOf('if (moveX !== 0 || moveZ !== 0)', idx);
if (blockStart === -1) {
    console.log('Could not find moveX if block start');
    process.exit(1);
}

// Find the end: "group.position.x +=" after the check
let blockEnd = content.indexOf('group.position.x += moveX', idx);
if (blockEnd === -1) {
    console.log('Could not find group.position');
    process.exit(1);
}

// Extend end to include the full line
blockEnd += 'group.position.x += moveX'.length;

// The old block
const oldBlock = content.substring(blockStart, blockEnd);
console.log('Old block (' + oldBlock.length + ' chars):');
console.log(oldBlock);

// New block: just the position application, validation removed
const newBlock = 'if (moveX !== 0 || moveZ !== 0) {\n            // 允许移动，验证已禁用\n        }\n\n        group.position.x += moveX';

content = content.replace(oldBlock, newBlock);
fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/interaction/transformer-controller.js', content);
console.log('\nDone');

// Verify
const verify = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/interaction/transformer-controller.js', 'utf8');
console.log('Has isValidWalkPosition:', verify.includes('isValidWalkPosition'));
