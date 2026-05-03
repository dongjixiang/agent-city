const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js';
let content = fs.readFileSync(path, 'utf8');

// Check current state
console.log('File size:', content.length);
console.log('createSpeechBubble with agentId:', content.includes('createSpeechBubble(mesh, agentId)'));
console.log('window.app TTS:', content.includes('window.app?.voiceSystem'));
console.log('Old TTS pattern:', content.includes('this.voiceSystem.speak(agentId, content)'));

// Find the exact pattern we need to fix
const badPattern = 'this.voiceSystem.speak(agentId, content)';
const idx = content.indexOf(badPattern);
if (idx > 0) {
    console.log('Found bad TTS pattern at:', idx);
    console.log('Context:', content.substring(idx - 50, idx + 100));
    
    // Replace just the problematic part
    content = content.replace(badPattern, 'window.app?.voiceSystem?.speak(agentId, content)');
    console.log('Fixed!');
} else {
    console.log('Bad pattern not found - might already be fixed');
}

fs.writeFileSync(path, content, 'utf8');