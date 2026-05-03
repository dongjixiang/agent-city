const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js';
let content = fs.readFileSync(path, 'utf8');

// Find the exact line where we set speech bubble text and add TTS call right after
const lines = content.split('\n');

// Find the line that has "this.speechBubbles.set(agentId, bubble);" 
let found = false;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('this.speechBubbles.set(agentId, bubble);')) {
        console.log(`Found at line ${i+1}: ${line}`);
        
        // Check if TTS is already added after this line
        const nextLine = lines[i+1];
        if (nextLine && nextLine.includes('this.voiceSystem.speak')) {
            console.log('TTS already added');
        } else {
            // Insert TTS call
            lines[i] = line;
            lines.splice(i+1, 0, '        // TTS', '        if (this.voiceSystem && content) {', '          this.voiceSystem.speak(agentId, content);', '        }');
            found = true;
            console.log('TTS added after bubble.setText');
        }
        break;
    }
}

if (found) {
    fs.writeFileSync(path, lines.join('\n'), 'utf8');
    console.log('File saved');
} else {
    console.log('Pattern not found - file may be corrupted or structure changed');
    console.log('Searching for speechBubbles.set...');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('speechBubbles.set')) {
            console.log(`Line ${i+1}: ${lines[i]}`);
        }
    }
}