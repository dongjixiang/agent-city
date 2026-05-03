const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/client/main.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import for TransformerBehaviors
const importLine = "import { AnimalBehaviors } from './systems/interaction/animal-behaviors.js';";
const newImport = `import { AnimalBehaviors } from './systems/interaction/animal-behaviors.js';
import { TransformerBehaviors } from './systems/interaction/transformer-behaviors.js';`;

if (content.includes(importLine) && !content.includes('TransformerBehaviors')) {
    content = content.replace(importLine, newImport);
    console.log('✓ Import added');
} else if (content.includes('TransformerBehaviors')) {
    console.log('✓ Import already exists');
}

// 2. Add TransformerBehaviors instantiation after AnimalBehaviors
const animalInitLine = 'this.systems.animals = new AnimalBehaviors();';
const newInitLine = `this.systems.animals = new AnimalBehaviors();
        this.systems.transformer = new TransformerBehaviors();`;

if (content.includes(animalInitLine) && !content.includes('TransformerBehaviors()')) {
    content = content.replace(animalInitLine, newInitLine);
    console.log('✓ TransformerBehaviors instantiation added');
}

// 3. Add update call in animate loop after animals.update
const animalsUpdateLine = 'this.systems.animals?.update(deltaTime);';
const newUpdateLine = `this.systems.animals?.update(deltaTime);
            this.systems.transformer?.update(deltaTime);`;

if (content.includes(animalsUpdateLine)) {
    content = content.replace(animalsUpdateLine, newUpdateLine);
    console.log('✓ Update call added');
}

// 4. Add init call in initEcologicalSystems or after animal behaviors init
// Find where animalBehaviors is initialized and add transformer init after
const initMarker = 'this.systems.animals = new AnimalBehaviors();';
if (content.includes(initMarker)) {
    const initReplacement = `this.systems.animals = new AnimalBehaviors();
        this.systems.transformer.init(this.scene);`;
    // Only replace once and only if transformer.init is not already there
    if (!content.includes('this.systems.transformer.init')) {
        content = content.replace(initMarker, initReplacement);
        console.log('✓ Init call added after AnimalBehaviors');
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done!');