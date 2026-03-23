const fs = require('fs');

// 修改 dashboard-panel.js
let content = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/city-world/dashboard-panel.js', 'utf8');

if (content.indexOf('Dashboard init sync') === -1) {
    const newCode = `this.startDayNightCycle();
 // Dashboard init sync - fix timing issue
 if (window.agentList && window.agentList.length > 0) {
 this.update(window.agentList, window.taskCount || 0, window.messageCount || 0);
 console.log("Dashboard init sync:", window.agentList.length, "agents");
 }`;
    content = content.replace('this.startDayNightCycle();', newCode);
    fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/city-world/dashboard-panel.js', content);
    console.log('dashboard-panel.js updated');
} else {
    console.log('already updated');
}

// 修改 city-world-full.js
let content2 = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/city-world/city-world-full.js', 'utf8');

if (content2.indexOf('window.agentList = agentList') === -1) {
    const newCode2 = `function updateAgentList(agentList) {
 // Save to global for Dashboard init sync
 window.agentList = agentList;
 window.taskCount = taskCount;
 window.messageCount = messageCount;`;
    content2 = content2.replace('function updateAgentList(agentList) {', newCode2);
    fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/city-world/city-world-full.js', content2);
    console.log('city-world-full.js updated');
} else {
    console.log('city-world-full.js already updated');
}
