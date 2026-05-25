param(
  [switch]$Detached
)

$ErrorActionPreference = 'Stop'
function Get-ProjectRoot {
  return Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
}
Set-Location (Get-ProjectRoot)

if ($Detached) {
  docker compose up --build -d
} else {
  docker compose up --build
}
