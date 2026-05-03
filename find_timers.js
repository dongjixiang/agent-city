const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');

// Check all setInterval and setTimeout
const lines = c.split('\n');
console.log('All setInterval/setTimeout calls:');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('setInterval') || lines[i].includes('setTimeout')) {
        console.log('Line', i + 1, ':', lines[i].trim().substring(0, 100));
    }
}

// Check for snapshotInterval usage
console.log('\nsnapshotInterval usages:');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('snapshotInterval') && !lines[i].includes('//')) {
        console.log('Line', i + 1, ':', lines[i].trim().substring(0, 100));
    }
}

// Check for eventEmitter or similar periodic triggers
console.log('\nLooking for periodic triggers...');
const idx = c.indexOf('periodic');
console.log('periodic found at:', idx);
const idx2 = c.indexOf('Interval');
console.log('Interval found at:', idx2);