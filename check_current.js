const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');

console.log('=== Verifying cooldown code ===');
console.log('不在冷却中，执行探索:', c.includes('不在冷却中，执行探索'));
console.log('探索冷却开始:', c.includes('探索冷却开始'));
console.log('探索冷却中，跳过:', c.includes('探索冷却中，跳过'));
console.log('agentCooldowns.get:', c.includes('agentCooldowns.get'));

const idx = c.indexOf('不在冷却中，执行探索');
if (idx > 0) {
    console.log('\n=== Context around the fix ===');
    console.log(c.substring(idx - 50, idx + 500));
}