const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');

// Check the full sendPeriodicSnapshot
const idx = c.indexOf('async sendPeriodicSnapshot(agentId) {');
console.log('sendPeriodicSnapshot at:', idx);
if (idx > 0) {
    // Get 80 lines from the function start
    const lines = c.substring(idx).split('\n');
    for (let i = 0; i < 80 && i < lines.length; i++) {
        console.log(i + 1, ':', lines[i]);
    }
}