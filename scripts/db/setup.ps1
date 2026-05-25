param(
  [switch]$SkipSeed,
  [string]$Database = "queue_management_db",
  [string]$User = "postgres",
  [string]$Service = "postgres"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $root

& "$PSScriptRoot/migrate.ps1" -Database $Database -User $User -Service $Service
if (-not $SkipSeed) {
  & "$PSScriptRoot/seed.ps1" -Database $Database -User $User -Service $Service
}
& "$PSScriptRoot/validate.ps1" -Database $Database -User $User -Service $Service

Write-Host "[db:setup] Complete"