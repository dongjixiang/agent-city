const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js';
let content = fs.readFileSync(path, 'utf8');

// Find the showSpeechBubble function and add TTS before the return at the end
// The pattern is: function ends, we need to add TTS before the closing brace

// Find handleAgentSpeak first
const handleIdx = content.indexOf('handleAgentSpeak');
if (handleIdx < 0) {
    console.log('handleAgentSpeak not found');
    process.exit(1);
}

// Find showSpeechBubble within handleAgentSpeak
const showIdx = content.indexOf('showSpeechBubble', handleIdx);
if (showIdx < 0) {
    console.log('showSpeechBubble not found');
    process.exit(1);
}

// Find the closing of showSpeechBubble function - look for the pattern
// where we have the closing braces after setting speechBubbles

// Let's find the LAST return statement in showSpeechBubble and add TTS before it
let braceCount = 0;
let inFunction = false;
let lineNum = 0;
let lastReturnIdx = -1;

for (let i = showIdx; i < content.length; i++) {
    if (content[i] === '{') {
        braceCount++;
        inFunction = true;
    }
    if (content[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
            break;
        }
    }
    // Look for 'return;' as a standalone statement
    if (content.substring(i, i+7) === 'return;') {
        // Make sure it's not in a comment
        const before = content.substring(Math.max(0, i-50), i);
        if (!before.includes('//') && !before.includes('*')) {
            lastReturnIdx = i;
        }
    }
}

console.log('Last return at position:', lastReturnIdx);

if (lastReturnIdx > 0) {
    const TTS_CODE = `
    
        // TTS - speak when agent says something  
        if (this.voiceSystem && content) {
          this.voiceSystem.speak(agentId, content);
        }
    `;
    
    content = content.substring(0, lastReturnIdx) + TTS_CODE + content.substring(lastReturnIdx);
    console.log('TTS code added before return');
} else {
    console.log('Could not find return statement');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done');