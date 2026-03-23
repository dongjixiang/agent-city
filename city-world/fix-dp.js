const fs = require('fs');

const content = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/city-world/dashboard-panel.js', 'utf8');

// 找到构造函数并清理
const fixedContent = content.replace(
  /this\.startDayNightCycle\(\);[\s\S]*?Dashboard init sync[\s\S]*?console\.log\("Dashboard init sync:[\s\S]*?\}[\s\S]*?ͬ[\s\S]*?\}/,
  `this.startDayNightCycle();
 // Dashboard init sync - fix timing issue
 if (window.agentList && window.agentList.length > 0) {
 this.update(window.agentList, window.taskCount || 0, window.messageCount || 0);
 console.log("Dashboard init sync:", window.agentList.length, "agents");
 }
 }`
);

fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/city-world/dashboard-panel.js', fixedContent);
console.log('Fixed!');
