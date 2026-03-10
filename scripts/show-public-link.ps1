$root = Split-Path -Parent $PSScriptRoot
$statePath = Join-Path $root ".public-link.json"
$sharePath = Join-Path $root "public-link.txt"

if (Test-Path $statePath) {
  $state = Get-Content -Path $statePath -Raw | ConvertFrom-Json
  Write-Host "URL_PUBLICA: $($state.publicUrl)"
  Write-Host "ENLACE_COMPANERO: $($state.shareLink)"
  Write-Host "ENVIO_DIRECTO: $($state.directLink)"
  Write-Host "CREADO: $($state.createdAt)"
  return
}

if (Test-Path $sharePath) {
  Get-Content -Path $sharePath
  return
}

Write-Host "No hay enlace activo. Ejecuta scripts/start-public-link.ps1"
