. "$PSScriptRoot\_helpers.ps1"
Initialize-SmokeState

Write-Step 'Checking API health'
Invoke-SmokeRequest -Method GET -Path '/health' | ConvertTo-Json -Depth 10

Write-Step 'Checking database health'
Invoke-SmokeRequest -Method GET -Path '/health/db' | ConvertTo-Json -Depth 10

Write-Host "Health smoke checks passed." -ForegroundColor Green