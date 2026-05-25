$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\_helpers.ps1"

Write-Step 'Resetting smoke test ID state'
Reset-SmokeState

& "$PSScriptRoot\00-health.ps1"
& "$PSScriptRoot\00-auth.ps1"
& "$PSScriptRoot\01-business-setup.ps1"
& "$PSScriptRoot\02-customer-profile.ps1"
& "$PSScriptRoot\03-queue-flow.ps1"
& "$PSScriptRoot\04-appointment-flow.ps1"
& "$PSScriptRoot\05-delay-notification-flow.ps1"

Write-Host "`nAll API smoke scripts passed." -ForegroundColor Green
Write-Host "IDs saved at: $Script:IdsPath" -ForegroundColor DarkGray