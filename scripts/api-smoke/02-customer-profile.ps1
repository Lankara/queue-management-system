. "$PSScriptRoot\_helpers.ps1"
Initialize-SmokeState

$businessId = Require-SmokeId 'businessId'
$suffix = Get-Date -Format 'HHmmss'

Write-Step 'Creating customer'
$customerResponse = Invoke-SmokeRequest -Method POST -Path "/businesses/$businessId/customers" -Body @{
  primaryPhone = "+9477$suffix"
  preferredLanguage = 'en'
}
$customer = Get-ResponseData $customerResponse
Set-SmokeId -Name customerId -Value $customer.id

Write-Step 'Creating client profile'
$clientProfileResponse = Invoke-SmokeRequest -Method POST -Path "/businesses/$businessId/customers/$($customer.id)/client-profiles" -Body @{
  fullName = 'Test Patient'
  relationshipToContact = 'SELF'
  gender = 'NOT_SPECIFIED'
  ageYears = 35
  address = 'Colombo'
  notes = 'PowerShell smoke test profile'
}
$clientProfile = Get-ResponseData $clientProfileResponse
Set-SmokeId -Name clientProfileId -Value $clientProfile.id

Write-Step 'Creating medical profile'
$medicalProfileResponse = Invoke-SmokeRequest -Method POST -Path "/businesses/$businessId/client-profiles/$($clientProfile.id)/medical-profile" -Body @{
  bloodGroup = 'O+'
  allergies = 'None known'
  medicalHistory = 'No major history'
  currentSymptoms = 'Fever'
  previousVisitNotes = 'First visit'
  emergencyContactName = 'Test Contact'
  emergencyContactPhone = '+94770000000'
}
$medicalProfile = Get-ResponseData $medicalProfileResponse
Set-SmokeId -Name medicalProfileId -Value $medicalProfile.id

Write-Host "Customer/profile smoke step passed." -ForegroundColor Green