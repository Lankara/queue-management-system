param(
  [switch]$Force,
  [string]$Database = "queue_management_db",
  [string]$User = "postgres",
  [string]$Service = "postgres"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $root

if (-not $Force) {
  throw "Refusing to reset database without -Force. This command is for local development only."
}

if ($env:NODE_ENV -eq "production") {
  throw "Refusing to reset database when NODE_ENV=production."
}

Write-Host "[db:reset] Dropping and recreating public schema in $Database"
"DROP SCHEMA public CASCADE; CREATE SCHEMA public;" | docker compose exec -T $Service psql -v ON_ERROR_STOP=1 -U $User -d $Database

& "$PSScriptRoot/migrate.ps1" -Database $Database -User $User -Service $Service
& "$PSScriptRoot/seed.ps1" -Database $Database -User $User -Service $Service
& "$PSScriptRoot/validate.ps1" -Database $Database -User $User -Service $Service

Write-Host "[db:reset] Complete"