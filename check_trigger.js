const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');

// Check what triggers sendPeriodicSnapshot
// Look for where it says sendPeriodicSnapshot
const lines = c.split('\n');
console.log('Lines calling sendPeriodicSnapshot:');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('sendPeriodicSnapshot') && !lines[i].includes('async sendPeriodicSnapshot')) {
        console.log('Line', i + 1, ':', lines[i].trim().substring(0, 100));
    }
}

// Check the timer setup
const idx = c.indexOf('startSnapshotTimer');
console.log('\nstartSnapshotTimer definition:');
const lines2 = c.substring(idx).split('\n');
for (let i = 0; i < 15; i++) {
    console.log(i + 1, ':', lines2[i]);
}