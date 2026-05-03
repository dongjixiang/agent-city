const fs = require('fs');
const content = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js', 'utf8');

// Find showSpeechBubble call
const lines = content.split('\n');
console.log('showSpeechBubble call:');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('showSpeechBubble called')) {
        console.log(`${i+1}: ${lines[i]}`);
        break;
    }
}

console.log('\nLines 560-580:');
for (let i = 559; i < 580; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}

// Find the function definition
console.log('\n\nSearching for showSpeechBubble function definition...');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('showSpeechBubble')) {
        console.log(`${i+1}: ${lines[i]}`);
    }
}