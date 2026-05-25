param(
  [string]$Database = "queue_management_db",
  [string]$User = "postgres",
  [string]$Service = "postgres"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
Set-Location $root

$migrations = @(
  "database/migrations/001_init_extensions.sql",
  "database/migrations/002_core_enums.sql",
  "database/migrations/003_core_tables.sql",
  "database/migrations/004_indexes_constraints.sql",
  "database/migrations/005_seed_master_data.sql"
)

foreach ($migration in $migrations) {
  if (-not (Test-Path $migration)) {
    throw "Missing migration file: $migration"
  }

  Write-Host "[db:migrate] Running $migration"
  Get-Content -Path $migration -Raw | docker compose exec -T $Service psql -v ON_ERROR_STOP=1 -U $User -d $Database
}

Write-Host "[db:migrate] Complete"