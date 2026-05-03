const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/index.js', 'utf8');

// Find where eventDispatcher is created and where config is loaded
const lines = c.split('\n');
console.log('Config loading and eventDispatcher setup:');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('config.load') || line.includes('eventDispatcher') || line.includes('config.get')) {
        console.log('Line', i + 1, ':', line.trim().substring(0, 100));
    }
}

// Check if config is passed to eventDispatcher
const idx = c.indexOf('eventDispatcher.setStores');
console.log('\neventDispatcher.setStores at:', idx);
if (idx > 0) {
    console.log(c.substring(idx - 20, idx + 200));
}

// Check if eventDispatcher has config set anywhere
const c2 = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');
console.log('\neventDispatcher setConfig found:', c2.includes('setConfig'));
console.log('eventDispatcher config assignment found:', c2.includes('this.config ='));

const idx2 = c2.indexOf('setConfig');
console.log('setConfig at:', idx2);
if (idx2 > 0) {
    console.log(c2.substring(idx2 - 20, idx2 + 100));
}