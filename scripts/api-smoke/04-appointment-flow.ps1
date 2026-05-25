. "$PSScriptRoot\_helpers.ps1"
Initialize-SmokeState

$businessId = Require-SmokeId 'businessId'
$branchId = Require-SmokeId 'branchId'
$serviceId = Require-SmokeId 'serviceId'
$customerId = Require-SmokeId 'customerId'
$clientProfileId = Require-SmokeId 'clientProfileId'

Write-Step 'Requesting appointment'
$appointmentResponse = Invoke-SmokeRequest -Method POST -Path "/businesses/$businessId/appointments/request" -Body @{
  branchId = $branchId
  serviceId = $serviceId
  customerId = $customerId
  clientProfileId = $clientProfileId
  requestedStartTime = '2026-06-01T09:00:00+05:30'
  requestedEndTime = '2026-06-01T09:15:00+05:30'
}
$appointment = Get-ResponseData $appointmentResponse
Set-SmokeId -Name appointmentId -Value $appointment.id

Write-Step 'Approving appointment'
Invoke-SmokeRequest -Method PATCH -Path "/businesses/$businessId/appointments/$($appointment.id)/approve" -Body @{
  approvedStartTime = '2026-06-01T09:00:00+05:30'
  approvedEndTime = '2026-06-01T09:15:00+05:30'
  source = 'OPERATOR'
} | ConvertTo-Json -Depth 10

Write-Step 'Proposing reschedule'
Invoke-SmokeRequest -Method PATCH -Path "/businesses/$businessId/appointments/$($appointment.id)/propose-reschedule" -Body @{
  newStartTime = '2026-06-01T09:30:00+05:30'
  newEndTime = '2026-06-01T09:45:00+05:30'
  reason = 'Doctor requested a later slot'
} | ConvertTo-Json -Depth 10

Write-Step 'Accepting reschedule'
Invoke-SmokeRequest -Method PATCH -Path "/businesses/$businessId/appointments/$($appointment.id)/accept-reschedule" -Body @{} | ConvertTo-Json -Depth 10

Write-Host "Appointment flow smoke step passed." -ForegroundColor Green