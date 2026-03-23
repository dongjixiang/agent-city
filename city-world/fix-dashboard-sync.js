const fs = require('fs');
let content = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/city-world/dashboard-panel.js', 'utf8');

// Find the constructor pattern and replace it
const oldCtor = `constructor() {
 this.panel = null;
 this.stats = { agents: 0, tasks: 0, messages: 0, ideas: 0 };
 this.collapsed = false;
 this.dayPhase = 'day';
 this.createPanel();
 }`;

const newCtor = `constructor() {
 this.panel = null;
 this.stats = { agents: 0, tasks: 0, messages: 0, ideas: 0 };
 this.collapsed = false;
 this.dayPhase = 'day';
 this.createPanel();
 this.startDayNightCycle();
 
 // Sync with any data that arrived before this panel was created
 if (window.agentList && window.agentList.length > 0) {
 console.log('[Dashboard] Syncing saved data:', window.agentList.length);
 this.update(window.agentList, window.taskCount || 0, window.messageCount || 0);
 }
 }`;

if (content.includes(oldCtor)) {
    content = content.replace(oldCtor, newCtor);
    fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/city-world/dashboard-panel.js', content);
    console.log('Fixed!');
} else {
    console.log('Pattern not found, trying alternative...');
    // Try to find and add after createPanel();
    if (content.includes('this.createPanel();') && !content.includes('Syncing saved data')) {
        const altNew = `this.createPanel();
 this.startDayNightCycle();
 
 // Sync with any data that arrived before this panel was created
 if (window.agentList && window.agentList.length > 0) {
 console.log('[Dashboard] Syncing saved data:', window.agentList.length);
 this.update(window.agentList, window.taskCount || 0, window.messageCount || 0);
 }
 }`;
        content = content.replace('this.createPanel();\n }', altNew);
        fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/city-world/dashboard-panel.js', content);
        console.log('Fixed with alternative!');
    }
}
