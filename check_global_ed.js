const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js', 'utf8');
const lines = c.split('\n');
// Find where eventDispatcher is declared/used as global
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('eventDispatcher') && !line.includes('this.eventDispatcher')) {
        console.log('Line', i + 1, ':', line.trim().substring(0, 100));
    }
}