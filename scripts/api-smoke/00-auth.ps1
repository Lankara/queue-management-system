$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\_helpers.ps1"

Write-Step 'Logging in development business owner'
$response = Invoke-SmokeRequest -Method POST -Path '/auth/login' -Public -Body @{
  identifier = 'owner@example.com'
  password = 'Owner@123456'
}
$data = Get-ResponseData -Response $response

if (-not $data.accessToken) {
  throw 'Login succeeded but no access token was returned.'
}

Set-SmokeId -Name 'accessToken' -Value $data.accessToken
Set-SmokeId -Name 'authUserId' -Value $data.user.id
Write-Host "Access token acquired for $($data.user.email)." -ForegroundColor Green
