param(
  [string]$Database = "queue_management_db",
  [string]$User = "postgres",
  [string]$Service = "postgres"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $root

$validationFile = "database/docs/validate_database.sql"
if (-not (Test-Path $validationFile)) {
  throw "Missing validation file: $validationFile"
}

Write-Host "[db:validate] Running $validationFile"
Get-Content -Path $validationFile -Raw | docker compose exec -T $Service psql -v ON_ERROR_STOP=1 -U $User -d $Database
Write-Host "[db:validate] Complete"