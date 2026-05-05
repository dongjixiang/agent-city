const fs = require('fs');

// Fix world-data.js: zone_plaza and zone_ocean use 0-200 coords but server uses -100~100
// zone_plaza in 0-200: minZ=20, maxZ=50, minX=25, maxX=55
//   In -100~100: subtract 100 from each → minZ=-80, maxZ=-50, minX=-75, maxX=-45
// zone_ocean in 0-200: minZ=200, maxZ=210, minX=85, maxX=95
//   In -100~100: subtract 100 from Z → minZ=100, maxZ=110 (but world max z is 100!)
//   So ocean in -100~100 is z > 85 (southern edge area)

let content = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/data/world-data.js', 'utf8');

// Fix zone_plaza coords
const plazaOld = '"id":"zone_plaza","name":"中央广场","type":"plaza","bounds":{"minX":25,"maxX":55,"minZ":20,"maxZ":50}';
const plazaNew = '"id":"zone_plaza","name":"中央广场","type":"plaza","bounds":{"minX":-75,"maxX":-45,"minZ":-80,"maxZ":-50}';
content = content.replace(plazaOld, plazaNew);
console.log('Replaced plaza:', content.includes(plazaNew));

// Fix zone_ocean - it's z > 85 in -100~100 coords (southern area)
// Set ocean zone to z > 85
const oceanOld = '"id":"zone_ocean","name":"海洋","type":"water","bounds":{"minX":85,"maxX":95,"minZ":200,"maxZ":210}';
const oceanNew = '"id":"zone_ocean","name":"海洋","type":"water","bounds":{"minX":-100,"maxX":100,"minZ":85,"maxZ":100}';
content = content.replace(oceanOld, oceanNew);
console.log('Replaced ocean:', content.includes(oceanNew));

fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/data/world-data.js', content);
console.log('Done');
