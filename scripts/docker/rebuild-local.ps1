param(
  [switch]$NoCache
)

$ErrorActionPreference = 'Stop'
function Get-ProjectRoot {
  return Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
}
Set-Location (Get-ProjectRoot)

if ($NoCache) {
  docker compose build --no-cache
} else {
  docker compose build
}
