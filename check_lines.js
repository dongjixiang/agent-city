const fs = require('fs');
const content = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/city-world/city-world-full.js', 'utf8');
const lines = content.split('\n');

// Find line with 龙虾动画
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('龙虾动画')) {
        console.log(`Found at line ${i+1}`);
        for (let j = Math.max(0, i-3); j <= Math.min(lines.length-1, i+3); j++) {
            console.log(`${j+1}: ${lines[j]}`);
        }
        break;
    }
}

// If not found, show lines around 3500
console.log('\nLines around 3500:');
for (let i = 3498; i < 3510; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}