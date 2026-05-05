const fs = require('fs');
let content = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/interaction/transformer-controller.js', 'utf8');

// Find the exact text block to replace (lines 248-260)
const oldBlock = `        // 边界验证已禁用
        // 边界验证：暂时禁用本地验证（浏览器缓存问题），依赖服务器端验证
        // TODO: 添加服务器验证（需要先在服务器创建 transformer 实体）
        if (moveX !== 0 || moveZ !== 0) {
            // 允许移动，待后续添加服务器验证
        }
        // 立即应用移动
        group.position.x += moveX;
        group.position.z += moveZ;

        // === 原有旋转控制（保留）===`;

const newBlock = `        // 边界验证已禁用（依赖服务器验证）
        // 立即应用移动
        group.position.x += moveX;
        group.position.z += moveZ;

        // === 原有旋转控制（保留）===`;

if (!content.includes(oldBlock)) {
    console.log('ERROR: Could not find oldBlock');
    process.exit(1);
}

content = content.replace(oldBlock, newBlock);
fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/interaction/transformer-controller.js', content);
console.log('Done');
