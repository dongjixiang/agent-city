const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js', 'utf8');
// Check where handleAIDecision is called in the switch
const idx = c.indexOf("case 'AI_DECISION'");
console.log("case 'AI_DECISION' at:", idx);
if (idx > 0) {
    console.log(c.substring(idx, idx + 80));
}

// Check for any timer that calls handleAIDecision
const c2 = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/index.js', 'utf8');
console.log('\nmakeDecision count in index.js:', (c2.match(/makeDecision/g) || []).length);
const lines = c2.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('makeDecision') || lines[i].includes('AI_DECISION')) {
        console.log('Line', i + 1, ':', lines[i].trim().substring(0, 80));
    }
}