$ErrorActionPreference = 'Stop'

$Script:SmokeRoot = Split-Path -Parent $PSCommandPath
$Script:TmpDir = Join-Path $Script:SmokeRoot '.tmp'
$Script:IdsPath = Join-Path $Script:TmpDir 'ids.json'
$Script:BaseUrl = if ($env:API_BASE_URL) { $env:API_BASE_URL.TrimEnd('/') } else { 'http://localhost:4000/api' }

function Write-Step {
  param([string]$Message)
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Initialize-SmokeState {
  New-Item -ItemType Directory -Path $Script:TmpDir -Force | Out-Null
  if (-not (Test-Path -LiteralPath $Script:IdsPath)) {
    '{}' | Set-Content -LiteralPath $Script:IdsPath -Encoding UTF8
  }
}

function Reset-SmokeState {
  New-Item -ItemType Directory -Path $Script:TmpDir -Force | Out-Null
  '{}' | Set-Content -LiteralPath $Script:IdsPath -Encoding UTF8
}

function Get-SmokeIds {
  Initialize-SmokeState
  $raw = Get-Content -LiteralPath $Script:IdsPath -Raw
  if ([string]::IsNullOrWhiteSpace($raw)) { $raw = '{}' }
  return $raw | ConvertFrom-Json -AsHashtable
}

function Save-SmokeIds {
  param([hashtable]$Ids)
  Initialize-SmokeState
  $Ids | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $Script:IdsPath -Encoding UTF8
}

function Set-SmokeId {
  param([string]$Name, [object]$Value)
  $ids = Get-SmokeIds
  $ids[$Name] = $Value
  Save-SmokeIds -Ids $ids
}

function Require-SmokeId {
  param([string]$Name)
  $ids = Get-SmokeIds
  if (-not $ids.ContainsKey($Name) -or [string]::IsNullOrWhiteSpace([string]$ids[$Name])) {
    throw "Missing smoke test ID '$Name'. Run the earlier smoke script first or use run-all.ps1."
  }
  return [string]$ids[$Name]
}

function Get-SmokeAccessToken {
  $ids = Get-SmokeIds
  if ($ids.ContainsKey('accessToken') -and -not [string]::IsNullOrWhiteSpace([string]$ids['accessToken'])) {
    return [string]$ids['accessToken']
  }
  return $null
}

function Invoke-SmokeRequest {
  param(
    [string]$Method,
    [string]$Path,
    [object]$Body = $null,
    [switch]$Public
  )

  $uri = if ($Path.StartsWith('http')) { $Path } else { "$Script:BaseUrl$Path" }
  Write-Host "$Method $uri" -ForegroundColor DarkGray

  $params = @{
    Method = $Method
    Uri = $uri
    Headers = @{ Accept = 'application/json' }
    TimeoutSec = 30
  }

  if (-not $Public) {
    $accessToken = Get-SmokeAccessToken
    if ($accessToken) {
      $params.Headers.Authorization = "Bearer $accessToken"
    }
  }

  if ($null -ne $Body) {
    $params.ContentType = 'application/json'
    $params.Body = ($Body | ConvertTo-Json -Depth 20)
  }

  try {
    return Invoke-RestMethod @params
  } catch {
    Write-Host "Request failed: $Method $uri" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
      Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    } else {
      Write-Host $_.Exception.Message -ForegroundColor Red
    }
    throw
  }
}

function Get-ResponseData {
  param([object]$Response)
  if ($null -ne $Response.data) { return $Response.data }
  return $Response
}