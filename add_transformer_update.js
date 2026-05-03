const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js';
let content = fs.readFileSync(path, 'utf8');

// Add transformer update after movableObjects update
const marker = 'this.systems.movableObjects?.update(deltaTime);';
const newLine = `this.systems.movableObjects?.update(deltaTime);
            
            // 更新变形金刚
            this.systems.transformer?.update(deltaTime);`;

if (content.includes(marker) && !content.includes('this.systems.transformer?.update')) {
    content = content.replace(marker, newLine);
    console.log('✓ transformer update added');
} else if (content.includes('this.systems.transformer?.update')) {
    console.log('✓ transformer update already exists');
} else {
    console.log('⚠ marker not found');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done!');