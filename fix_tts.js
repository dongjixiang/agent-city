const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js';
let content = fs.readFileSync(path, 'utf8');

// Find the problematic code and fix it
// The issue is that the TTS call is after the return statement

const wrongCode = `if (agentProxy) {
      // 更新现有气泡
      const bubble = this.speechBubbles.get(agentId);
      if (bubble) {
        console.log('[App] Updating existing speech bubble for agent:', agentId);
        bubble.setText(content);
        bubble.show();
      }
      return;  // ← 提前返回，TTS 永远不会被调用！
    }
    
    // 创建新的 speech 气泡
    else {`;

const correctCode = `if (agentProxy) {
      // 更新现有气泡
      const bubble = this.speechBubbles.get(agentId);
      if (bubble) {
        console.log('[App] Updating existing speech bubble for agent:', agentId);
        bubble.setText(content);
        bubble.show();
      } else {
        // 创建新的 speech 气泡
        console.log('[App] Creating new speech bubble for agent:', agentId);
        const bubble = new SpeechBubble(this.scene, this.camera, agentProxy.mesh);
        bubble.setText(content);
        this.speechBubbles.set(agentId, bubble);
      }
      
      // 同时触发 TTS 语音播报
      if (this.voiceSystem && content) {
        const speakerId = agentId || 'default';
        this.voiceSystem.speak(speakerId, content);
        console.log('[App] TTS speak called for:', speakerId);
      } else if (!this.voiceSystem) {
        console.log('[App] TTS skipped - voiceSystem not initialized');
      }
      
      return;
    }`;

if (content.includes(wrongCode)) {
    content = content.replace(wrongCode, correctCode);
    console.log('✓ Fixed the TTS issue');
} else if (content.includes('TTS speak called for:')) {
    console.log('✓ TTS call already fixed');
} else {
    console.log('⚠ Pattern not found, checking current state...');
    // Let's find what's actually there
    const lines = content.split('\n');
    for (let i = 540; i < 580; i++) {
        console.log(i+1, ':', lines[i]);
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done');