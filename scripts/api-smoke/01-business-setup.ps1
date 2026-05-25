. "$PSScriptRoot\_helpers.ps1"
Initialize-SmokeState

$businessId = '00000000-0000-0000-0000-000000000101'
$branchId = '00000000-0000-0000-0000-000000000102'
$serviceId = '00000000-0000-0000-0000-000000000103'

Write-Step 'Loading fixed development business IDs'
Set-SmokeId -Name businessId -Value $businessId
Set-SmokeId -Name branchId -Value $branchId
Set-SmokeId -Name serviceId -Value $serviceId

Write-Step 'Checking sample business access'
Invoke-SmokeRequest -Method GET -Path "/businesses/$businessId" | ConvertTo-Json -Depth 10

Write-Step 'Checking sample branch list'
Invoke-SmokeRequest -Method GET -Path "/businesses/$businessId/branches" | ConvertTo-Json -Depth 10

Write-Step 'Checking sample service list'
Invoke-SmokeRequest -Method GET -Path "/businesses/$businessId/services" | ConvertTo-Json -Depth 10

Write-Step 'Getting business profile settings'
Invoke-SmokeRequest -Method GET -Path "/businesses/$businessId/profile-settings" | ConvertTo-Json -Depth 10

Write-Host "Business setup smoke step passed using dev sample IDs." -ForegroundColor Green
