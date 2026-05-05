const fs = require('fs');

// ========== Fix transformer-controller: add debug logging ==========
let tfContent = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/interaction/transformer-controller.js', 'utf8');
tfContent = tfContent.replace(
    `            if (typeof isValidWalkPosition === 'function') {
                const check = isValidWalkPosition(newX, newZ);
                if (!check.valid) {
                    console.log('[TransformerController] 阻止移动:', check.reason);
                    moveX = 0; moveZ = 0;
                }
            }`,
    `            if (typeof isValidWalkPosition === 'function') {
                const check = isValidWalkPosition(newX, newZ);
                if (!check.valid) {
                    console.log('[TransformerController] 阻止移动:', check.reason, '@(' + newX.toFixed(1) + ',' + newZ.toFixed(1) + ')');
                    moveX = 0; moveZ = 0;
                }
            } else {
                console.warn('[TransformerController] isValidWalkPosition not loaded!');
            }`
);
fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/interaction/transformer-controller.js', tfContent);
console.log('1. Fixed transformer-controller debug');

// ========== Fix entity-validator: add version marker ==========
let vContent = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/core/entity-validator.js', 'utf8');
if (!vContent.includes('VALIDATOR_VERSION')) {
    vContent = vContent.replace(
        'const OCEAN_Z_MIN = 85;',
        `// 版本标识（用于检测浏览器缓存）
const VALIDATOR_VERSION = 'v3-20260505';

const OCEAN_Z_MIN = 85;`
    );
    fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/core/entity-validator.js', vContent);
    console.log('2. Added version to entity-validator');
} else {
    console.log('2. entity-validator already has version');
}

console.log('Done');
