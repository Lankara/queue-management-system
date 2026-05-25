$ErrorActionPreference = 'Stop'
function Get-ProjectRoot {
  return Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
}
Set-Location (Get-ProjectRoot)

docker compose down
