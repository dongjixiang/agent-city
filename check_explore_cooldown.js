const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');

console.log('=== exploreCooldown initialization ===');
const idx = c.indexOf('this.exploreCooldown =');
if (idx > 0) {
    console.log(c.substring(idx, idx + 150));
}

console.log('\n=== setConfig ===');
const idx2 = c.indexOf('setConfig(config)');
if (idx2 > 0) {
    console.log(c.substring(idx2, idx2 + 300));
}

console.log('\n=== config loading in index.js ===');
const c2 = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/index.js', 'utf8');
const idx3 = c2.indexOf('eventDispatcher.setConfig');
if (idx3 > 0) {
    console.log(c2.substring(idx3 - 50, idx3 + 150));
} else {
    console.log('setConfig NOT FOUND in index.js');
}