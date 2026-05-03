const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/camera-system.js', 'utf8');
const idx = c.indexOf('/**\n     * 处理变形金刚点击');
console.log('Function start at:', idx);
if (idx > 0) {
    console.log(c.substring(idx, idx + 500));
}