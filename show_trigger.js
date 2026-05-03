const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');

console.log('=== triggerDefaultExplore ===');
const idx = c.indexOf('async triggerDefaultExplore(agentId)');
if (idx > 0) {
    const lines = c.substring(idx).split('\n');
    for (let i = 0; i < 80 && i < lines.length; i++) {
        console.log(String(i + 1).padStart(3, ' ') + ': ' + lines[i]);
    }
}

console.log('\n=== startSnapshotTimer ===');
const idx2 = c.indexOf('startSnapshotTimer(agentId)');
if (idx2 > 0) {
    const lines = c.substring(idx2).split('\n');
    for (let i = 0; i < 25 && i < lines.length; i++) {
        console.log(String(i + 1).padStart(3, ' ') + ': ' + lines[i]);
    }
}