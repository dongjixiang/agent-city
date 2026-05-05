$ErrorActionPreference = "Stop"
$Server = "root@47.77.238.56"
$DestPath = "/root/agent-city/city-world"
$LocalPath = "C:\Users\swede\.openclaw\workspace-arch\agent-city\city-world"

Write-Host "[INFO] Testing SSH connection..." -ForegroundColor Cyan
try {
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $Server "echo OK" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "SSH failed" }
    Write-Host "[OK] SSH connection OK" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] SSH connection failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Creating remote directory..." -ForegroundColor Cyan
ssh $Server "mkdir -p $DestPath"

Write-Host "[INFO] Uploading city-world files via tar..." -ForegroundColor Cyan
$tarCmd = "tar -czf - -C '$LocalPath' --exclude='node_modules' --exclude='.git' --exclude='*.log' --exclude='tmp' ."
$sshCmd = "ssh $Server ""tar -xzf - -C $DestPath --strip-components=1"""

Invoke-Expression "$tarCmd | $sshCmd"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Upload failed" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Upload complete!" -ForegroundColor Green
