const fs = require('fs');
let content = fs.readFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/data/world-data.js', 'utf8');

// Fix zone_plaza coords: convert from 0-200 to -100~100
// minZ=20 → -80, maxZ=50 → -50
// minX=25 → -75, maxX=55 → -45
content = content.replace(
  '"id":"zone_plaza","name":"中央广场","type":"plaza","bounds":{"minX":25,"maxX":55,"minZ":20,"maxZ":50}',
  '"id":"zone_plaza","name":"中央广场","type":"plaza","bounds":{"minX":-75,"maxX":-45,"minZ":-80,"maxZ":-50}'
);

// Fix zone_ocean: in 0-200 system z=200=south. In -100~100: z=-100=south
// zone_ocean minZ=200 → -100, maxZ=210 → -90 (but -100 to -90 is the VERY south edge)
// Since the world boundary is z=-100, there's no "ocean" beyond the map
// For practical purposes, ocean = z > 85 in -100~100 coords (15 units from south edge)
// Set ocean zone as z > 85
content = content.replace(
  '"id":"zone_ocean","name":"海洋","type":"water","bounds":{"minX":85,"maxX":95,"minZ":200,"maxZ":210}',
  '"id":"zone_ocean","name":"海洋","type":"water","bounds":{"minX":-100,"maxX":100,"minZ":85,"maxZ":100}'
);

fs.writeFileSync('C:/Users/swede/.openclaw/workspace-arch/agent-city/server/data/world-data.js', content);
console.log('Fixed zone coords in WorldData');
