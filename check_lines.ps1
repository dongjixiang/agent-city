$content = Get-Content 'C:/Users/swede/.openclaw/workspace-arch/agent-city/city-world/city-world-full.js' -Raw -Encoding UTF8
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
if ($text -match '(?s).{0,50}龙虾动画.{0,50}') {
    $match = $Matches[0]
    Write-Host "Found: $match"
} else {
    Write-Host "Pattern not found"
    # Try finding "动画" only
    if ($text -match '(?s).{0,30}动画.{0,30}') {
        Write-Host "Found animation: $($Matches[0])"
    }
}