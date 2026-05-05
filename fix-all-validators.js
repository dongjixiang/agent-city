const fs = require('fs');

// ========== 1. Fix dog.js isInWater with CORRECT water zone coordinates ==========
let dogContent = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/ecology/dog.js', 'utf8');
// Replace the entire isInWater method
dogContent = dogContent.replace(
    /    isInWater\(x, z\) \{\s*\/\/ 湖泊.*?return false;\s*\}[\s]*\}/gs,
    `    isInWater(x, z) {
        // 湖泊（椭圆，中心 10,-75，半径 55x22）
        const ldx = (x - 10) / 55;
        const ldz = (z - (-75)) / 22;
        if (ldx * ldx + ldz * ldz <= 1) return true;

        // 河流（折线，宽度 8）
        const riverPoints = [
            [-45, -55], [-40, -50], [-35, -40], [-30, -30], [-25, -20],
            [-20, -10], [-15, 0], [-10, 10], [-5, 20], [0, 30],
            [5, 40], [10, 50], [15, 60], [20, 70], [25, 80]
        ];
        for (let i = 0; i < riverPoints.length - 1; i++) {
            const p1 = riverPoints[i], p2 = riverPoints[i + 1];
            const dist = this._pointToSegmentDistance(x, z, p1[0], p1[1], p2[0], p2[1]);
            if (dist < 8 / 2) return true;
        }

        // 海洋 (z > 85)
        if (z > 85) return true;

        return false;
    }`
);

// Also replace _pointToSegmentDistance if it exists, or add it
if (!dogContent.includes('_pointToSegmentDistance')) {
    // Find the getAwayFromWaterAngle method and add the helper before it
    dogContent = dogContent.replace(
        '    getAwayFromWaterAngle(x, z) {',
        `    _pointToSegmentDistance(px, pz, x1, y1, x2, y2) {
        const dx = x2 - x1, dz = y2 - y1;
        const len2 = dx * dx + dz * dz;
        if (len2 === 0) return Math.sqrt((px - x1) ** 2 + (pz - y1) ** 2);
        let t = ((px - x1) * dx + (pz - y1) * dz) / len2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt((px - (x1 + t * dx)) ** 2 + (pz - (y1 + t * dz)) ** 2);
    }

    getAwayFromWaterAngle(x, z) {`
    );
}

fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/ecology/dog.js', dogContent);
console.log('1. Fixed dog.js isInWater');

// ========== 2. Fix cow.js isInWater - same problem ==========
let cowContent = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/ecology/cow.js', 'utf8');
cowContent = cowContent.replace(
    /    isInWater\(x, z\) \{\s*\/\/ 湖泊.*?return false;\s*\}[\s]*\}/gs,
    `    isInWater(x, z) {
        // 湖泊（椭圆，中心 10,-75，半径 55x22）
        const ldx = (x - 10) / 55;
        const ldz = (z - (-75)) / 22;
        if (ldx * ldx + ldz * ldz <= 1) return true;

        // 河流（折线，宽度 8）
        const riverPoints = [
            [-45, -55], [-40, -50], [-35, -40], [-30, -30], [-25, -20],
            [-20, -10], [-15, 0], [-10, 10], [-5, 20], [0, 30],
            [5, 40], [10, 50], [15, 60], [20, 70], [25, 80]
        ];
        for (let i = 0; i < riverPoints.length - 1; i++) {
            const p1 = riverPoints[i], p2 = riverPoints[i + 1];
            const dist = this._pointToSegmentDistance(x, z, p1[0], p1[1], p2[0], p2[1]);
            if (dist < 8 / 2) return true;
        }

        // 海洋 (z > 85)
        if (z > 85) return true;

        return false;
    }`
);

if (!cowContent.includes('_pointToSegmentDistance')) {
    cowContent = cowContent.replace(
        '    getAwayFromWaterAngle(x, z) {',
        `    _pointToSegmentDistance(px, pz, x1, y1, x2, y2) {
        const dx = x2 - x1, dz = y2 - y1;
        const len2 = dx * dx + dz * dz;
        if (len2 === 0) return Math.sqrt((px - x1) ** 2 + (pz - y1) ** 2);
        let t = ((px - x1) * dx + (pz - y1) * dz) / len2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt((px - (x1 + t * dx)) ** 2 + (pz - (y1 + t * dz)) ** 2);
    }

    getAwayFromWaterAngle(x, z) {`
    );
}

fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/ecology/cow.js', cowContent);
console.log('2. Fixed cow.js isInWater');

// ========== 3. Add version + debug to entity-validator ==========
let validatorContent = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/core/entity-validator.js', 'utf8');
// Add version marker and debug flag
validatorContent = validatorContent.replace(
    'const OCEAN_Z_MIN = 85;',
    `// 版本标识（用于检测浏览器缓存）
const VALIDATOR_VERSION = 'v3-20260505';
console.log('[EntityValidator] Loaded:', VALIDATOR_VERSION, 'OCEAN_Z_MIN=85, WORLD_MAX=100');

const OCEAN_Z_MIN = 85;`
);

fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/core/entity-validator.js', validatorContent);
console.log('3. Added version to entity-validator');

// ========== 4. Add debug logging to transformer-controller validation ==========
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
console.log('4. Added debug to transformer-controller');

console.log('\nAll fixes applied.');
