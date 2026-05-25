. "$PSScriptRoot\_helpers.ps1"
Initialize-SmokeState

$businessId = Require-SmokeId 'businessId'
$branchId = Require-SmokeId 'branchId'
$serviceId = Require-SmokeId 'serviceId'
$customerId = Require-SmokeId 'customerId'
$clientProfileId = Require-SmokeId 'clientProfileId'

Write-Step 'Joining queue as draft'
$entryResponse = Invoke-SmokeRequest -Method POST -Path "/businesses/$businessId/queues/join-draft" -Body @{
  branchId = $branchId
  serviceId = $serviceId
  customerId = $customerId
  clientProfileId = $clientProfileId
  source = 'QR'
}
$entry = Get-ResponseData $entryResponse
Set-SmokeId -Name queueEntryId -Value $entry.id
Set-SmokeId -Name queueId -Value $entry.queueId

Write-Step 'Confirming queue entry'
Invoke-SmokeRequest -Method PATCH -Path "/businesses/$businessId/queue-entries/$($entry.id)/confirm" -Body @{} | ConvertTo-Json -Depth 10

Write-Step 'Getting queue position with notification log'
Invoke-SmokeRequest -Method GET -Path "/businesses/$businessId/queue-entries/$($entry.id)/position?logNotification=true" | ConvertTo-Json -Depth 10

Write-Step 'Calling next queue entry'
Invoke-SmokeRequest -Method PATCH -Path "/businesses/$businessId/queues/$($entry.queueId)/call-next" -Body @{} | ConvertTo-Json -Depth 10

Write-Step 'Starting service'
Invoke-SmokeRequest -Method PATCH -Path "/businesses/$businessId/queue-entries/$($entry.id)/start-service" | ConvertTo-Json -Depth 10

Write-Step 'Completing service'
Invoke-SmokeRequest -Method PATCH -Path "/businesses/$businessId/queue-entries/$($entry.id)/complete" | ConvertTo-Json -Depth 10

Write-Host "Queue flow smoke step passed." -ForegroundColor Green