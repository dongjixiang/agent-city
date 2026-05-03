const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js';

try {
    const content = fs.readFileSync(path, 'utf8');
    console.log('File size:', content.length);
    
    // Find speechBubbles.set line
    const lines = content.split('\n');
    console.log('Total lines:', lines.length);
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('this.speechBubbles.set(agentId, bubble);')) {
            console.log('Found at line', i+1, ':', lines[i].substring(0,60));
            
            // Check next line for TTS
            if (i+1 < lines.length && lines[i+1].includes('voiceSystem.speak')) {
                console.log('TTS already there');
            } else {
                // Insert TTS after this line
                const ttsCode = '        // TTS\n        if (this.voiceSystem && content) {\n            this.voiceSystem.speak(agentId, content);\n        }\n';
                lines.splice(i+1, 0, ttsCode);
                fs.writeFileSync(path, lines.join('\n'), 'utf8');
                console.log('TTS inserted after line', i+1);
            }
            break;
        }
    }
} catch (e) {
    console.error('Error:', e.message);
}