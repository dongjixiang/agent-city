const fs = require('fs');

const correctIsInWater = `    isInWater(x, z) {
        // 湖泊（椭圆，中心 10,-75，半径 55x22）
        const ldx = (x - 10) / 55;
        const ldz = (z - (-75)) / 22;
        if (ldx * ldx + ldz * ldz <= 1) return true;
        // 河流（折线，宽度 8）
        const rp = [[-45,-55],[-40,-50],[-35,-40],[-30,-30],[-25,-20],[-20,-10],[-15,0],[-10,10],[-5,20],[0,30],[5,40],[10,50],[15,60],[20,70],[25,80]];
        for (let i = 0; i < rp.length - 1; i++) {
            const p1 = rp[i], p2 = rp[i+1];
            const dx = p2[0]-p1[0], dz = p2[1]-p1[1], len2 = dx*dx+dz*dz;
            const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x-p1[0])*dx + (z-p1[1])*dz) / len2));
            const d = Math.sqrt((x-(p1[0]+t*dx))**2 + (z-(p1[1]+t*dz))**2);
            if (d < 4) return true;
        }
        // 海洋 (z > 85)
        if (z > 85) return true;
        return false;
    }`;

// Fix cow.js
let cow = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/ecology/cow.js', 'utf8');
const oldCowIsInWater = cow.match(/    isInWater\(x, z\) \{[^}]+\n        \/\/ 海洋[^\n]+\n        if \(x >= -100[^\}]+\}/s)?.[0];
if (oldCowIsInWater) {
    cow = cow.replace(oldCowIsInWater, correctIsInWater);
    fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/ecology/cow.js', cow);
    console.log('1. Fixed cow.js');
} else {
    // Try simpler replacement
    cow = cow.replace(
        /    isInWater\(x, z\) \{\s*\/\/ 湖泊.*?return false;\s*\}/s,
        correctIsInWater
    );
    fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/ecology/cow.js', cow);
    console.log('1. Fixed cow.js (simpler)');
}

// Create dog.js
let dog = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/ecology/cow.js', 'utf8');
// Change class Cow to Dog (but not the method names/variables that contain 'cow')
dog = dog.replace(/class Cow extends Animal/, 'class Dog extends Animal');
fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/systems/ecology/dog.js', dog);
console.log('2. Created dog.js');

console.log('Done');
