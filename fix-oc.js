const fs = require('fs');
let content = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/core/entity-validator.js', 'utf8');
// Fix the debug log - show raw z value
content = content.replace(
  '    console.log("[EntityValidator] isValidWalk(" + x.toFixed(1) + "," + z.toFixed(1) + ") OCEAN_Z_MIN=" + OCEAN_Z_MIN);',
  '    console.log("[EntityValidator] OCEAN_Z_MIN=" + OCEAN_Z_MIN + " lake_z=" + LAKE_NORTH.position.z);'
);
content = content.replace(
  '    console.log("[EntityValidator] called: x=" + x + " z=" + z);',
  '    console.log("[EntityValidator] checking x=" + x + " z=" + z + " (z>85?" + (z > 85) + ")");'
);
fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/client/core/entity-validator.js', content);
console.log('Updated debug');
