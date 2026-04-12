# Agent City - Upload to Server Script
# Run this in PowerShell

param(
    [string]$Server = "root@47.77.238.56",
    [string]$DestPath = "/root/agent-city",
    [string]$LocalPath = $PSScriptRoot
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Agent City - Upload to Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check for SSH tools
$scpAvailable = $false
$scpTool = $null

# Try different SSH tools
if (Get-Command scp -ErrorAction SilentlyContinue) {
    $scpTool = "scp"
    $scpAvailable = $true
} elseif (Get-Command pscp -ErrorAction SilentlyContinue) {
    $scpTool = "pscp"
    $scpAvailable = $true
} else {
    Write-Host "[ERROR] No SSH tool found (scp or pscp)." -ForegroundColor Red
    Write-Host "Please install OpenSSH or PuTTY." -ForegroundColor Yellow
    exit 1
}

Write-Host "[INFO] Using: $scpTool" -ForegroundColor Green

# Exclude patterns
$excludeDirs = @("node_modules", ".git", "tmp", "logs", ".DS_Store")

# Create exclude string for scp
$excludeStr = ""
foreach ($dir in $excludeDirs) {
    $excludeStr += " --exclude '$dir'"
}

Write-Host "[1/4] Checking server connection..." -ForegroundColor Yellow
try {
    Test-Connection -ComputerName "47.77.238.56" -Count 1 -ErrorAction Stop | Out-Null
    Write-Host "[OK] Server reachable" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Server not reachable" -ForegroundColor Red
    exit 1
}

Write-Host "[2/4] Creating remote directory..." -ForegroundColor Yellow
$cmd = "ssh $Server ""mkdir -p $DestPath"""
    Invoke-Expression $cmd

Write-Host "[3/4] Uploading files..." -ForegroundColor Yellow
Write-Host "    This may take a while for large files..."

if ($scpTool -eq "scp") {
    $uploadCmd = "scp -r -o StrictHostKeyChecking=no ""$LocalPath\*"" ""$Server`:$DestPath/"""
} else {
    $uploadCmd = "pscp -r ""$LocalPath\*"" ""$Server`:$DestPath/"""
}

Write-Host "[DEBUG] $uploadCmd"
Invoke-Expression $uploadCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Upload failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

Write-Host "[4/4] Upload complete!" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps on Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. SSH to server:"
Write-Host "   ssh $Server"
Write-Host ""
Write-Host "2. Install dependencies:"
Write-Host "   cd $DestPath"
Write-Host "   npm install"
Write-Host ""
Write-Host "3. Configure environment:"
Write-Host "   export MINIMAX_API_KEY=your_key"
Write-Host "   export MINIMAX_GROUP_ID=your_group"
Write-Host ""
Write-Host "4. Start server:"
Write-Host "   node server/index.js"
Write-Host ""
Write-Host "Or use the remote-deploy script:"
Write-Host "   chmod +x remote-deploy.sh"
Write-Host "   ./remote-deploy.sh your_api_key your_group_id"
Write-Host ""
