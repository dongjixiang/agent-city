$base = "C:\Users\swede\.openclaw\workspace-arch\agent-city"
$files = @(
    "client\core\entity-validator.js",
    "client\systems\interaction\tank-transformer-controller.js",
    "client\systems\interaction\transformer-controller.js",
    "client\systems\ecology\dog.js",
    "client\systems\ecology\cow.js",
    "client\systems\camera-system.js"
)
foreach ($f in $files) {
    $p = Join-Path $base $f
    $exists = Test-Path $p
    if ($exists) {
        $c = Get-Content $p -Raw
        $hasValid = $c.Contains("isValidWalkPosition")
        $hasWater = $c.Contains("isInWater")
        Write-Host "$f OK (isValidWalkPosition=$hasValid, isInWater=$hasWater)"
    } else {
        Write-Host "$f MISSING"
    }
}
