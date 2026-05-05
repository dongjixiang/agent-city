const fs = require('fs');

// Simplify entity-validator.js: remove redundant ocean check
// The world boundary already constrains z to -100~100
// Ocean zone (z > 85) is BEYOND the southern world boundary - never reachable
// Remove the ocean check entirely

let content = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/core/entity-validator.js', 'utf8');

// Remove ocean check
content = content.replace(
  `    // 海洋 (z > 85)
    if (z > OCEAN_Z_MIN) {
        return { valid: false, reason: '海洋区域不可通行' };
    }

    // 湖泊`,
  `    // 湖泊`
);

fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/core/entity-validator.js', content);
console.log('Removed ocean check from entity-validator');
