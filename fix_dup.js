const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js';
let content = fs.readFileSync(path, 'utf8');

// Fix duplicate init line
const duplicate = `this.systems.transformer = new TransformerBehaviors();
        this.systems.transformer.init(this.scene);
        this.transformerController = new TransformerController(this.systems.transformer);
        this.systems.transformer.init(this.scene);`;

const fixed = `this.systems.transformer = new TransformerBehaviors();
        this.systems.transformer.init(this.scene);
        this.transformerController = new TransformerController(this.systems.transformer);`;

if (content.includes(duplicate)) {
    content = content.replace(duplicate, fixed);
    console.log('✓ Fixed duplicate init line');
} else {
    console.log('⚠ Duplicate not found, checking current state...');
}

fs.writeFileSync(path, content, 'utf8');