const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Change function signature: createSpeechBubble(mesh) -> createSpeechBubble(mesh, agentId)
if (content.includes('createSpeechBubble(mesh)')) {
    content = content.replace('createSpeechBubble(mesh)', 'createSpeechBubble(mesh, agentId)');
    console.log('✓ Function signature updated');
} else {
    console.log('⚠ Function signature not found');
}

// 2. Fix TTS call in set text() - use window.app.voiceSystem and proper agentId
// The old code has: if (this.voiceSystem && content) { this.voiceSystem.speak(agentId, content); }
const oldTTS = `// TTS for agent speech
      if (this.voiceSystem && content) {
        this.voiceSystem.speak(agentId, content);
      }`;
const newTTS = `// TTS for agent speech
      if (window.app?.voiceSystem && text) {
        window.app.voiceSystem.speak(agentId, text);
      }`;

if (content.includes(oldTTS)) {
    content = content.replace(oldTTS, newTTS);
    console.log('✓ TTS call fixed');
} else {
    // Try to find and fix the broken TTS code
    if (content.includes('this.voiceSystem.speak(agentId, content)')) {
        content = content.replace(
            'if (this.voiceSystem && content) {\n        this.voiceSystem.speak(agentId, content);',
            'if (window.app?.voiceSystem && text) {\n        window.app.voiceSystem.speak(agentId, text);'
        );
        console.log('✓ TTS call fixed (alternative)');
    } else {
        console.log('⚠ TTS code pattern not found, searching...');
        // Search for the problematic line
        const idx = content.indexOf('this.voiceSystem.speak');
        if (idx > 0) {
            console.log('Found at:', idx);
            console.log(content.substring(idx - 100, idx + 150));
        }
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done');