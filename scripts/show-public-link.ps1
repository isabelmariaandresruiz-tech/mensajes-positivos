$root = Split-Path -Parent $PSScriptRoot
$statePath = Join-Path $root ".public-link.json"
$sharePath = Join-Path $root "public-link.txt"
$tunnelOutPath = Join-Path $root "public-tunnel.out.log"

function Get-LatestPublicUrlFromLog {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    return $null
  }

  $raw = Get-Content -Path $Path -Raw -ErrorAction SilentlyContinue
  if ([string]::IsNullOrWhiteSpace($raw)) {
    return $null
  }

  $lhrMatches = [regex]::Matches($raw, "https://[a-z0-9-]+\.lhr\.life")
  if ($lhrMatches.Count -gt 0) {
    return $lhrMatches[$lhrMatches.Count - 1].Value
  }

  $allMatches = [regex]::Matches($raw, "https://[a-z0-9.-]+")
  if ($allMatches.Count -eq 0) {
    return $null
  }

  $usable = @()
  foreach ($m in $allMatches) {
    $value = $m.Value
    if ($value -like "https://localhost.run*") {
      continue
    }
    $usable += $value
  }

  if ($usable.Count -eq 0) {
    return $null
  }

  return $usable[$usable.Count - 1]
}

function Write-ShareFile {
  param(
    [string]$PublicUrl,
    [string]$Username
  )

  $safeUsername = if ([string]::IsNullOrWhiteSpace($Username)) { "ana" } else { $Username.Trim() }
  $shareLink = "$PublicUrl/u/$safeUsername"
  $directLink = "$PublicUrl/u/${safeUsername}?open=1"

  @(
    "URL_PUBLICA: $PublicUrl",
    "ENLACE_COMPANERO: $shareLink",
    "ENVIO_DIRECTO: $directLink",
    "ACTUALIZADO: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))"
  ) | Set-Content -Path $sharePath -Encoding Ascii

  Write-Host "URL_PUBLICA: $PublicUrl"
  Write-Host "ENLACE_COMPANERO: $shareLink"
  Write-Host "ENVIO_DIRECTO: $directLink"
}

$state = $null
if (Test-Path $statePath) {
  try {
    $state = Get-Content -Path $statePath -Raw | ConvertFrom-Json
  } catch {
    $state = $null
  }
}

$latestUrl = Get-LatestPublicUrlFromLog -Path $tunnelOutPath

if ($latestUrl) {
  $username = if ($state -and $state.username) { $state.username } else { "ana" }

  if ($state) {
    $updatedState = [pscustomobject]@{
      createdAt    = $state.createdAt
      port         = $state.port
      username     = $username
      publicUrl    = $latestUrl
      shareLink    = "$latestUrl/u/$username"
      directLink   = "$latestUrl/u/${username}?open=1"
      serverCmdPid = $state.serverCmdPid
      tunnelCmdPid = $state.tunnelCmdPid
    }
    $updatedState | ConvertTo-Json -Depth 4 | Set-Content -Path $statePath -Encoding Ascii
  }

  Write-ShareFile -PublicUrl $latestUrl -Username $username
  if ($state) {
    Write-Host "CREADO: $($state.createdAt)"
  }
  return
}

if ($state) {
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
