const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js';
let content = fs.readFileSync(path, 'utf8');

// Fix order: instantiation should come before init
const wrongOrder = `this.systems.transformer.init(this.scene);
        this.systems.transformer = new TransformerBehaviors();`;

const correctOrder = `this.systems.transformer = new TransformerBehaviors();
        this.systems.transformer.init(this.scene);`;

if (content.includes(wrongOrder)) {
    content = content.replace(wrongOrder, correctOrder);
    console.log('✓ Fixed order');
} else if (content.includes(correctOrder)) {
    console.log('✓ Order already correct');
} else {
    console.log('⚠ Pattern not found, trying alternative');
    // Find and fix individually
    content = content.replace(
        /this\.systems\.transformer = new TransformerBehaviors\(\);[\s\S]{0,50}this\.systems\.transformer\.init\(this\.scene\);/,
        correctOrder
    );
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done!');