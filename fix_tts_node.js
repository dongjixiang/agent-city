const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js';
let content = fs.readFileSync(path, 'utf8');

// Look for the specific pattern where we set speechBubbles and add TTS
const target = 'this.speechBubbles.set(agentId, bubble);\n    }';
const replacement = `this.speechBubbles.set(agentId, bubble);
        
        // TTS - speak when agent says something
        if (this.voiceSystem && content) {
          this.voiceSystem.speak(agentId, content);
        }
    }`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log('TTS added');
} else {
    // Try alternative pattern
    const target2 = 'this.speechBubbles.set(agentId, bubble);';
    if (content.includes(target2)) {
        const newContent = content.replace(target2, target2 + '\n        \n        // TTS\n        if (this.voiceSystem && content) {\n          this.voiceSystem.speak(agentId, content);\n        }');
        content = newContent;
        console.log('TTS added (alt pattern)');
    } else {
        console.log('Target not found');
        // Find where speechBubbles.set is
        const idx = content.indexOf('speechBubbles.set');
        console.log('speechBubbles.set at:', idx);
        if (idx > 0) {
            console.log(content.substring(idx-50, idx+200));
        }
    }
}

fs.writeFileSync(path, content, 'utf8');