const fs = require('fs');
try {
    const content = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js', 'utf8');
    // Simple syntax check by trying to require it
    console.log('File loaded, size:', content.length);
    console.log('Contains TTS code:', content.includes('[App] Before TTS'));
    console.log('Total lines:', content.split('\n').length);
} catch (e) {
    console.log('Error:', e.message);
}