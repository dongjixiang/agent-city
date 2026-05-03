const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js', 'utf8');

console.log('=== Verifying code ===');
console.log('setConfig found:', c.includes('setConfig(config)'));
console.log('agentCooldowns.get found:', c.includes('agentCooldowns.get(agentId)'));
console.log('inCooldown found:', c.includes('inCooldown'));
console.log('冷却中 found:', c.includes('冷却中'));
console.log('探索冷却开始 found:', c.includes('探索冷却开始'));
console.log('handleUpdateAgentConfig found:', c.includes('handleUpdateAgentConfig'));

console.log('\n=== Cooldown check code ===');
const idx = c.indexOf('const inCooldown =');
if (idx > 0) {
    console.log(c.substring(idx - 30, idx + 300));
}