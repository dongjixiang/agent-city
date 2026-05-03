const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');
// Find sendPeriodicSnapshot and the cooldown check
const idx = c.indexOf('检查是否在冷却中');
console.log('冷却中 at:', idx);
if (idx > 0) {
    console.log(c.substring(idx - 20, idx + 400));
}

// Check if there's any issue with the condition
const c2 = c.substring(idx - 20, idx + 400);
console.log('\n---Full section---');
console.log(c2);

// Check the full context of sendPeriodicSnapshot
const idx2 = c.indexOf('sendPeriodicSnapshot called');
console.log('\nsendPeriodicSnapshot called at:', idx2);
const lines = c.split('\n');
// Find the line number
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('sendPeriodicSnapshot called')) {
        console.log('Line:', i + 1);
        // Print 30 lines after
        for (let j = i; j < i + 35 && j < lines.length; j++) {
            console.log(j + 1, ':', lines[j]);
        }
        break;
    }
}