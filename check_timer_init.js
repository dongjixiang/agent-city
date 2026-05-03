const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');

// Check startSnapshotTimer
const idx = c.indexOf('startSnapshotTimer(agentId)');
console.log('startSnapshotTimer at:', idx);
if (idx > 0) {
    const lines = c.substring(idx).split('\n');
    for (let i = 0; i < 20 && i < lines.length; i++) {
        console.log(i + 1, ':', lines[i]);
    }
}

// Check snapshotInterval initialization
const idx2 = c.indexOf('this.snapshotInterval =');
console.log('\nsnapshotInterval init at:', idx2);
if (idx2 > 0) {
    console.log(c.substring(idx2, idx2 + 100));
}

// Check exploreCooldown initialization
const idx3 = c.indexOf('this.exploreCooldown =');
console.log('\nexploreCooldown init at:', idx3);
if (idx3 > 0) {
    console.log(c.substring(idx3, idx3 + 100));
}

// Check agentCooldowns initialization
const idx4 = c.indexOf('this.agentCooldowns =');
console.log('\nagentCooldowns init at:', idx4);
if (idx4 > 0) {
    console.log(c.substring(idx4, idx4 + 100));
}