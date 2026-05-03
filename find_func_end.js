const fs = require('fs');
const c = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/camera-system.js', 'utf8');

// Find the end of _handleTransformerClick function
// It should end before the next method or before 'highlightAgent'
const funcEnd = c.indexOf('/**\n     * 高亮智能体', c.indexOf('_handleTransformerClick'));
if (funcEnd > 0) {
    console.log('Function ends at:', funcEnd);
    console.log('Content between function and next comment:');
    console.log(c.substring(funcEnd - 200, funcEnd + 100));
}