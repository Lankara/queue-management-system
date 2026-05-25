. "$PSScriptRoot\_helpers.ps1"
Initialize-SmokeState

$businessId = Require-SmokeId 'businessId'
$branchId = Require-SmokeId 'branchId'
$serviceId = Require-SmokeId 'serviceId'

Write-Step 'Creating delay event'
Invoke-SmokeRequest -Method POST -Path "/businesses/$businessId/delays" -Body @{
  branchId = $branchId
  serviceId = $serviceId
  delayMinutes = 20
  affectedFromTime = '2026-06-01T09:00:00+05:30'
  reason = 'Doctor delayed'
} | ConvertTo-Json -Depth 20

Write-Step 'Listing notification logs'
Invoke-SmokeRequest -Method GET -Path "/businesses/$businessId/notifications" | ConvertTo-Json -Depth 20

Write-Host "Delay/notification flow smoke step passed." -ForegroundColor Green