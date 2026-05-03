const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');

// Find all places that call startSnapshotTimer
const lines = c.split('\n');
console.log('Places calling startSnapshotTimer:');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('startSnapshotTimer(') && !lines[i].includes('async startSnapshotTimer')) {
        console.log('Line', i + 1, ':', lines[i].trim().substring(0, 100));
    }
}

// Find where the timer gets its interval value at runtime
const idx = c.indexOf('snapshotInterval *');
console.log('\nsnapshotInterval multiplication at:', idx);
if (idx > 0) {
    console.log(c.substring(idx - 50, idx + 100));
}

// Check if snapshotInterval is modified anywhere
console.log('\nAll lines that set snapshotInterval:');
for (let i = 0; i < lines.length; i++) {
    if ((lines[i].includes('snapshotInterval =') || lines[i].includes('snapshotInterval=')) && !lines[i].includes('//')) {
        console.log('Line', i + 1, ':', lines[i].trim().substring(0, 100));
    }
}