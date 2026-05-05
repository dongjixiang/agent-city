$base = "C:\Users\swede\.openclaw\workspace-arch\agent-city"

# Fix dog.js isInWater
$dogPath = Join-Path $base "client\systems\ecology\dog.js"
$dog = [System.IO.File]::ReadAllText($dogPath)

$wrongPattern = "    isInWater\(x, z\) \{`n        \/\/ 湖泊：x=-45 to 65, z=53 to 97`n        if \(x >= -45 && x <= 65 && z >= 53 && z <= 97\) return true;`n        \/\/ 河流：x=-25 to 0, z=-55 to 91`n        if \(x >= -25 && x <= 0 && z >= -55 && z <= 91\) return true;`n        \/\/ 海洋：x=-100 to 100, z=-105 to -95`n        if \(x >= -100 && x <= 100 && z >= -105 && z <= -95\) return true;`n        return false;`n    \}"

$correctIsInWater = "    isInWater(x, z) {
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
    }"

if ($dog.Contains("z >= 53")) {
    $dog = $dog -replace $wrongPattern, $correctIsInWater
    [System.IO.File]::WriteAllText($dogPath, $dog, [System.Text.Encoding]::UTF8)
    Write-Host "Fixed dog.js isInWater"
} else {
    Write-Host "dog.js isInWater: pattern not matched, checking..."
    # Try simpler detection
    if ($dog.Contains("z=53")) { Write-Host "  Still has wrong z=53" }
}

# Fix cow.js isInWater (same fix)
$cowPath = Join-Path $base "client\systems\ecology\cow.js"
$cow = [System.IO.File]::ReadAllText($cowPath)
if ($cow.Contains("z >= 53")) {
    $cow = $cow -replace $wrongPattern, $correctIsInWater
    [System.IO.File]::WriteAllText($cowPath, $cow, [System.Text.Encoding]::UTF8)
    Write-Host "Fixed cow.js isInWater"
} else {
    Write-Host "cow.js isInWater: pattern not matched"
    if ($cow.Contains("z=53")) { Write-Host "  Still has wrong z=53" }
}

# Check tank-transformer-controller blocking logic
$tankPath = Join-Path $base "client\systems\interaction\tank-transformer-controller.js"
$tank = [System.IO.File]::ReadAllText($tankPath)
if ($tank.Contains("dx = 0; dz = 0")) {
    Write-Host "Tank controller: has blocking (dx=0, dz=0)"
} else {
    Write-Host "Tank controller: NO blocking"
}

Write-Host "Done"
