const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js';
let content = fs.readFileSync(path, 'utf8');

// Find the exact location of showSpeechBubble and rewrite that section
// Looking for the section where we create speech bubble and add TTS

// Find the handleAgentSpeak function
const handleAgentSpeakIdx = content.indexOf('handleAgentSpeak');
if (handleAgentSpeakIdx < 0) {
    console.log('ERROR: handleAgentSpeak not found');
    process.exit(1);
}

console.log('Found handleAgentSpeak at position', handleAgentSpeakIdx);

// Find showSpeechBubble within handleAgentSpeak
const showSpeechIdx = content.indexOf('showSpeechBubble', handleAgentSpeakIdx);
console.log('Found showSpeechBubble at position', showSpeechIdx);

// Find the closing brace of the function
let braceCount = 0;
let inFunction = false;
let functionEnd = showSpeechIdx;

for (let i = showSpeechIdx; i < content.length; i++) {
    if (content[i] === '{') {
        braceCount++;
        inFunction = true;
    }
    if (content[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
            functionEnd = i;
            break;
        }
    }
}

console.log('Function ends at position', functionEnd);

// Get the content of showSpeechBubble
const showSpeechContent = content.substring(showSpeechIdx, functionEnd + 1);
console.log('showSpeechBubble content length:', showSpeechContent.length);

// Check if TTS is already in there
if (showSpeechContent.includes('this.voiceSystem.speak')) {
    console.log('TTS already in showSpeechBubble');
} else {
    console.log('TTS NOT found in showSpeechBubble, need to add it');
}

// Now let's add TTS call right after bubble.setText
const oldSection = `bubble.setText(content);
        this.speechBubbles.set(agentId, bubble);`;

const newSection = `bubble.setText(content);
        this.speechBubbles.set(agentId, bubble);
        
        // TTS
        if (this.voiceSystem) {
          console.log('[App] TTS for', agentId);
          this.voiceSystem.speak(agentId, content);
        }`;

if (content.includes(oldSection)) {
    content = content.replace(oldSection, newSection);
    console.log('✓ TTS added');
} else {
    console.log('⚠ Old section not found');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done');