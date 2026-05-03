const fs = require('fs');
const path = 'C:/Users/swede/.openclaw/workspace-arch/agent-city/city-world/city-world-full.js';
let content = fs.readFileSync(path, 'utf8');

// Find the main animate loop - look for `function animate()` that's the render loop
// Not the animateAction function
let foundAnimate = false;
let inCorrectAnimate = false;
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Found the main animate function (the one with requestAnimationFrame)
    if (line.includes('function animate()') || line.includes('const animate =')) {
        foundAnimate = true;
        continue;
    }
    
    // Skip the animateAction function
    if (foundAnimate && line.includes('function animateAction')) {
        inCorrectAnimate = false;
    }
    
    if (foundAnimate && !inCorrectAnimate) {
        // We're in the main animate function
        // Look for dt calculation
        if (line.includes('dt') && !line.includes('//')) {
            console.log(`Line ${i+1} (dt calc): ${line.substring(0, 80)}`);
        }
        
        // Look for 龙虾动画 comment
        if (line.includes('龙虾动画')) {
            console.log(`Line ${i+1} (龙虾动画): ${line}`);
            // This should be the one inside animate
            // Insert updateTransformer before it
            lines[i] = '        updateTransformer(dt);\n' + line;
            fs.writeFileSync(path, lines.join('\n'), 'utf8');
            console.log('Done! updateTransformer added at line', i+1);
            process.exit(0);
        }
    }
}

console.log('Could not find the right location in animate loop');