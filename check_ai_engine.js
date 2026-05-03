const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/ai/ai-engine.js', 'utf8');

console.log('File size:', c.length);
console.log('\nLines with makeDecision:');
const lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('makeDecision') || lines[i].includes('context')) {
        console.log('Line', i + 1, ':', lines[i].trim().substring(0, 100));
    }
}