const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/handlers/ws-handler.js', 'utf8');
console.log('handleAIDecision at:', c.indexOf('async handleAIDecision('));
console.log('handleAIDecisionResponse at:', c.indexOf('async handleAIDecisionResponse('));

// Check which case calls which
const lines = c.split('\n');
console.log('\nAI_DECISION vs AI_DECISION_RESULT cases:');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes("case 'AI_DECISION'") || line.includes("case 'AI_DECISION_RESULT'")) {
        console.log('Line', i + 1, ':', line);
        // Show next few lines
        for (let j = i; j < i + 3 && j < lines.length; j++) {
            console.log('  ', j + 1, ':', lines[j].trim());
        }
    }
}