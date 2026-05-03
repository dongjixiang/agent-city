const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');

// Find the setInterval that calls sendPeriodicSnapshot
const idx = c.indexOf('const timer = setInterval(() => {');
console.log('setInterval at:', idx);
if (idx > 0) {
    const lines = c.substring(idx).split('\n');
    for (let i = 0; i < 20; i++) {
        console.log(i + 1, ':', lines[i]);
    }
}

// Also show the lines around line 408
const lines = c.split('\n');
console.log('\nLines 395-420:');
for (let i = 394; i < 420; i++) {
    console.log(i + 1, ':', lines[i]);
}