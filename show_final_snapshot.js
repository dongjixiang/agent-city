const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');
const idx = c.indexOf('async sendPeriodicSnapshot(agentId)');
if (idx > 0) {
    const lines = c.substring(idx).split('\n');
    for (let i = 0; i < 70; i++) {
        console.log(String(i + 1).padStart(3, ' ') + ': ' + lines[i]);
    }
}