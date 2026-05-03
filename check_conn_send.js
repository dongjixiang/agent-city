const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js', 'utf8');
// Check how connection.send is called
const idx = c.indexOf('connection.send');
console.log('connection.send at:', idx);
if (idx > 0) {
    console.log(c.substring(idx - 50, idx + 200));
}

// Also check if app.connection is exposed
console.log('app.connection exists:', c.includes('app.connection'));
console.log('this.connection exists:', c.includes('this.connection'));