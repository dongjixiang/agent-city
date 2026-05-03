const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js', 'utf8');
console.log('AI_DECISION_RESULT found:', c.includes('AI_DECISION_RESULT'));
console.log('AI Decision from found:', c.includes('AI Decision from'));

const lines = c.split('\n');
console.log('\nLines with AI_DECISION or AI Decision:');
for (let i = 0; i < lines.length; i++) {
    if ((lines[i].includes('AI_DECISION') || lines[i].includes('AI Decision')) && !lines[i].includes('//')) {
        console.log('Line', i + 1, ':', lines[i].trim().substring(0, 100));
    }
}