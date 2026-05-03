const fs = require('fs');

// Search for AIEngine
const dir = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/server';
const files = fs.readdirSync(dir, { recursive: true });
for (const f of files) {
    if (typeof f === 'string' && (f.includes('ai') || f.includes('AI'))) {
        console.log(f);
    }
}