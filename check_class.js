const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js', 'utf8');
const lines = c.split('\n');
// Find class definition and methods
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('class ') || line.startsWith('async handle') || line.startsWith('handle')) {
        console.log('Line', i + 1, ':', line.substring(0, 80));
    }
}