const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');

// Check if config is set anywhere
console.log('this.config found:', c.includes('this.config ='));
console.log('this.config?. found:', c.includes('this.config?.'));
console.log('config = found:', c.includes('config ='));

// Check what happens with config in the constructor
const idx = c.indexOf('constructor()');
console.log('\nconstructor at:', idx);
if (idx > 0) {
    const lines = c.substring(idx).split('\n');
    for (let i = 0; i < 40 && i < lines.length; i++) {
        console.log(i + 1, ':', lines[i]);
    }
}