const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/ai/ai-engine.js', 'utf8');
const lines = c.split('\n');
console.log('Lines 85-95:');
for (let i = 84; i < 95; i++) {
    console.log(String(i + 1).padStart(3, ' ') + ': ' + lines[i]);
}

console.log('\nLines 128-135:');
for (let i = 127; i < 135; i++) {
    console.log(String(i + 1).padStart(3, ' ') + ': ' + lines[i]);
}