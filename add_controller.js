const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import for TransformerController
const importLine = "import { TransformerBehaviors } from './systems/interaction/transformer-behaviors.js';";
const newImport = `import { TransformerBehaviors } from './systems/interaction/transformer-behaviors.js';
import { TransformerController } from './systems/interaction/transformer-controller.js';`;

if (content.includes(importLine) && !content.includes('TransformerController')) {
    content = content.replace(importLine, newImport);
    console.log('✓ Import added');
} else if (content.includes('TransformerController')) {
    console.log('✓ Import already exists');
}

// 2. Add TransformerController instantiation after TransformerBehaviors init
const marker = 'this.systems.transformer = new TransformerBehaviors();';
if (content.includes(marker) && !content.includes('new TransformerController')) {
    const replacement = `this.systems.transformer = new TransformerBehaviors();
        this.systems.transformer.init(this.scene);
        this.transformerController = new TransformerController(this.systems.transformer);`;
    content = content.replace(marker, replacement);
    console.log('✓ TransformerController instantiated');
}

// 3. Update camera-system to activate controller when transformer clicked
// In _handleTransformerClick, add this.activate() call after showing control bar
const handleClickMarker = "this.showControlBar('🤖 变形金刚');";
if (content.includes(handleClickMarker) && !content.includes('transformerController.activate')) {
    // Find and replace the _handleTransformerClick function to add controller activation
    const oldPattern = `// 如果当前是 orbit 模式，切换到 follow 模式
        if (this.mode === 'orbit') {
            this.setMode('follow');
        }
    }`;
    
    const newPattern = `// 如果当前是 orbit 模式，切换到 follow 模式
        if (this.mode === 'orbit') {
            this.setMode('follow');
        }
        
        // 激活变形金刚控制模式
        this.app.transformerController?.activate();
    }`;
    
    if (content.includes(oldPattern)) {
        content = content.replace(oldPattern, newPattern);
        console.log('✓ Controller activation added');
    }
}

// 4. Add controller update in animate loop (after transformer.update)
const transformerUpdateMarker = 'this.systems.transformer?.update(deltaTime);';
if (content.includes(transformerUpdateMarker) && !content.includes('transformerController.update')) {
    const replacement = `this.systems.transformer?.update(deltaTime);
            this.transformerController?.update(deltaTime);`;
    content = content.replace(transformerUpdateMarker, replacement);
    console.log('✓ Controller update added');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done!');