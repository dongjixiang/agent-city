const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/index.js', 'utf8');
const lines = c.split('\n');
// Find where initAI is and show surrounding lines
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('initAI')) {
        console.log('Line', i + 1, ':', lines[i].trim().substring(0, 100));
    }
    if (lines[i].includes('eventDispatcher.setStores')) {
        console.log('Line', i + 1, ':', lines[i].trim().substring(0, 100));
    }
}

// Find the end of initialization
const idx = c.indexOf('initAI()');
console.log('\ninitAI at:', idx);
if (idx > 0) {
    console.log(c.substring(idx, idx + 300));
}