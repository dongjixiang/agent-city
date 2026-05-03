const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/interaction/transformer-behaviors.js', 'utf8');
const lines = c.split('\n');

// Find all position.set lines for car wheel positions
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('wheelPositions')) {
        console.log(`Line ${i+1}: ${line}`);
        // Show next few lines
        for (let j = i; j < Math.min(i + 5, lines.length); j++) {
            console.log(`  ${j+1}: ${lines[j]}`);
        }
    }
}