const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js';
const content = fs.readFileSync(path, 'utf8');

console.log('File length:', content.length);
console.log('speak count:', (content.match(/this\.voiceSystem\.speak/g)||[]).length);
console.log('TTS found:', content.includes('TTS for'));

// Check specific lines
const lines = content.split('\n');
console.log('\nLines 625-645:');
for (let i = 624; i < 645; i++) {
    if (i < lines.length) {
        console.log(`${i+1}: ${lines[i]}`);
    }
}