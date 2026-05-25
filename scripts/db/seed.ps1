param(
  [string]$Database = "queue_management_db",
  [string]$User = "postgres",
  [string]$Service = "postgres"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $root

$seeds = @(
  "database/seeds/dev_sample_data.sql",
  "database/seeds/dev_auth_users.sql"
)

foreach ($seed in $seeds) {
  if (-not (Test-Path $seed)) {
    throw "Missing seed file: $seed"
  }

  Write-Host "[db:seed] Running $seed"
  Get-Content -Path $seed -Raw | docker compose exec -T $Service psql -v ON_ERROR_STOP=1 -U $User -d $Database
}

Write-Host "[db:seed] Complete"