const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js';
let content = fs.readFileSync(path, 'utf8');

// Find the pattern and add TTS call right after bubble.setText
const oldPattern = `this.speechBubbles.set(agentId, bubble);
    }`;
const newPattern = `this.speechBubbles.set(agentId, bubble);
    }
    
    // 直接在这里调用 TTS（确保每次都执行）
    if (this.voiceSystem && content) {
      console.log('[App] TTS trigger - agentId:', agentId, 'content:', content.substring(0, 30));
      this.voiceSystem.speak(agentId || 'default', content);
    } else {
      console.log('[App] TTS skipped - voiceSystem:', !!this.voiceSystem);
    }`;

if (content.includes(oldPattern)) {
    content = content.replace(oldPattern, newPattern);
    console.log('✓ TTS call added after bubble.setText');
} else {
    console.log('⚠ Pattern not found, checking...');
    // Let's find what we have around line 600
    const lines = content.split('\n');
    for (let i = 595; i < 615; i++) {
        console.log(i+1, ':', lines[i]);
    }
}

fs.writeFileSync(path, content, 'utf8');