const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/server/event-dispatcher.js';
try {
    const c = fs.readFileSync(path, 'utf8');
    console.log('File size:', c.length);
    console.log('exploreTimeout count:', (c.match(/exploreTimeout/g)||[]).length);
    console.log('setExploreCooldown found:', c.includes('setExploreCooldown'));
    console.log('cooldown found:', c.includes('cooldown'));
    console.log('triggerDefaultExplore found:', c.includes('triggerDefaultExplore'));
    
    // Find the setExploreCooldown function
    const idx = c.indexOf('setExploreCooldown');
    if (idx > 0) {
        console.log('setExploreCooldown at:', idx);
        console.log(c.substring(idx, idx+200));
    }
} catch(e) {
    console.log('Error:', e.message);
}