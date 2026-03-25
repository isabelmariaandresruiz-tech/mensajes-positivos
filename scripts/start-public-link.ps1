param(
  [int]$Port = 3001,
  [string]$Username = "ana",
  [string]$TunnelAlias = "",
  [int]$WaitSeconds = 35,
  [bool]$CopyToClipboard = $true
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$statePath = Join-Path $root ".public-link.json"
$sharePath = Join-Path $root "public-link.txt"
$tunnelOut = Join-Path $root "public-tunnel.out.log"
$tunnelErr = Join-Path $root "public-tunnel.err.log"

function Get-SafeAliasBase {
  param([string]$RawValue)

  if ([string]::IsNullOrWhiteSpace($RawValue)) {
    return "animo"
  }

  $value = $RawValue.ToLowerInvariant()
  $value = [regex]::Replace($value, "[^a-z0-9-]", "")
  $value = [regex]::Replace($value, "-{2,}", "-").Trim("-")

  if ([string]::IsNullOrWhiteSpace($value)) {
    return "animo"
  }

  if ($value.Length -gt 24) {
    return $value.Substring(0, 24)
  }

  return $value
}

function Stop-MatchingProcesses {
  param([int]$TargetPort)

  $targets = @()
  $targets += Get-CimInstance Win32_Process -Filter "name = 'ssh.exe'" |
    Where-Object {
      $_.CommandLine -like "*localhost.run*" -and (
        $_.CommandLine -like "*-R 80:*:$TargetPort*" -or
        $_.CommandLine -like "*-R *:80:*:$TargetPort*"
      )
    }
  $targets += Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
    Where-Object {
      $_.CommandLine -like "*next*start*--port $TargetPort*" -or
      $_.CommandLine -like "*npm-cli.js*run start*--port $TargetPort*"
    }
  $targets += Get-CimInstance Win32_Process -Filter "name = 'cmd.exe'" |
    Where-Object {
      $_.CommandLine -like "*npm run start*--port $TargetPort*" -or
      $_.CommandLine -like "*localhost.run*:localhost:$TargetPort*" -or
      $_.CommandLine -like "*localhost.run*:$TargetPort*"
    }

  $uniqueIds = $targets | Select-Object -ExpandProperty ProcessId -Unique
  foreach ($id in $uniqueIds) {
    Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
  }
}

function Test-PublicUrl {
  param([string]$Url)

  $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
  if (-not $curl) {
    return $false
  }

  try {
    $statusCode = & $curl.Source "--http1.1" "--silent" "--show-error" "--output" "NUL" "--write-out" "%{http_code}" "--max-time" "15" $Url
    return $statusCode -match "^[1-5][0-9][0-9]$"
  } catch {
    return $false
  }
}

$finalAlias = $null
if (-not [string]::IsNullOrWhiteSpace($TunnelAlias)) {
  $aliasBase = Get-SafeAliasBase -RawValue $TunnelAlias
  $aliasStamp = (Get-Date).ToString("MMddHHmm")
  $finalAlias = "$aliasBase-$aliasStamp"
}

Write-Host "[1/4] Limpiando procesos previos en puerto $Port..."
Stop-MatchingProcesses -TargetPort $Port

if (-not (Test-Path (Join-Path $root ".next\\BUILD_ID"))) {
  Write-Host "[2/4] No hay build de produccion. Ejecutando npm run build..."
  npm run build
} else {
  Write-Host "[2/4] Build detectada."
}

Write-Host "[3/4] Iniciando servidor de produccion en http://127.0.0.1:$Port ..."
$serverProc = Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/c", "npm run start -- --hostname 127.0.0.1 --port $Port > public-server.out.log 2> public-server.err.log" `
  -WorkingDirectory $root `
  -PassThru

$serverReady = $false
$serverDeadline = (Get-Date).AddSeconds($WaitSeconds)
while ((Get-Date) -lt $serverDeadline) {
  Start-Sleep -Milliseconds 800
  try {
    $status = (Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$Port").StatusCode
    if ($status -ge 200 -and $status -lt 500) {
      $serverReady = $true
      break
    }
  } catch {
    # waiting
  }
}

if (-not $serverReady) {
  throw "El servidor no arranco a tiempo. Revisa public-server.err.log"
}

Write-Host "[4/4] Abriendo tunel HTTPS temporal..."
if (Test-Path $tunnelOut) {
  Clear-Content -Path $tunnelOut -ErrorAction SilentlyContinue
}
if (Test-Path $tunnelErr) {
  Clear-Content -Path $tunnelErr -ErrorAction SilentlyContinue
}

$remoteSpec = if ($finalAlias) { "${finalAlias}:80:127.0.0.1:$Port" } else { "80:127.0.0.1:$Port" }
$tunnelCmd = "ssh -o StrictHostKeyChecking=no -R $remoteSpec nokey@localhost.run > public-tunnel.out.log 2> public-tunnel.err.log"

$tunnelProc = Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/c", $tunnelCmd `
  -WorkingDirectory $root `
  -PassThru

$publicUrl = $null
$tunnelDeadline = (Get-Date).AddSeconds($WaitSeconds)
while ((Get-Date) -lt $tunnelDeadline) {
  Start-Sleep -Milliseconds 800
  if (-not (Test-Path $tunnelOut)) {
    continue
  }

  $raw = Get-Content -Path $tunnelOut -Raw -ErrorAction SilentlyContinue
  if ([string]::IsNullOrWhiteSpace($raw)) {
    continue
  }

  $lhrMatches = [regex]::Matches($raw, "https://[a-z0-9-]+\.lhr\.life")
  if ($lhrMatches.Count -gt 0) {
    $publicUrl = $lhrMatches[$lhrMatches.Count - 1].Value
    break
  }
}

if (-not $publicUrl) {
  throw "No se pudo obtener la URL publica. Revisa public-tunnel.out.log y public-tunnel.err.log"
}

$publicReady = $false
$publicDeadline = (Get-Date).AddSeconds($WaitSeconds)
while ((Get-Date) -lt $publicDeadline) {
  Start-Sleep -Milliseconds 1000
  if (Test-PublicUrl -Url $publicUrl) {
    $publicReady = $true
    break
  }
}

if (-not $publicReady) {
  throw "El tunel se abrio, pero la URL publica no responde correctamente. Revisa public-tunnel.out.log"
}

$shareLink = "$publicUrl/u/${Username}"
$directLink = "$publicUrl/u/${Username}?open=1"

$state = [pscustomobject]@{
  createdAt    = (Get-Date).ToString("o")
  port         = $Port
  username     = $Username
  tunnelAlias  = $finalAlias
  publicUrl    = $publicUrl
  shareLink    = $shareLink
  directLink   = $directLink
  serverCmdPid = $serverProc.Id
  tunnelCmdPid = $tunnelProc.Id
}
$state | ConvertTo-Json -Depth 4 | Set-Content -Path $statePath -Encoding Ascii

@(
  "URL_PUBLICA: $publicUrl",
  "ENLACE_COMPANERO: $shareLink",
  "ENVIO_DIRECTO: $directLink",
  "ACTUALIZADO: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))"
) | Set-Content -Path $sharePath -Encoding Ascii

if ($CopyToClipboard) {
  $setClipboard = Get-Command Set-Clipboard -ErrorAction SilentlyContinue
  if ($setClipboard) {
    Set-Clipboard -Value $shareLink
  }
}

Write-Host ""
Write-Host "URL_PUBLICA: $publicUrl"
Write-Host "ENLACE_COMPANERO: $shareLink"
Write-Host "ENVIO_DIRECTO: $directLink"
Write-Host ""
if ($finalAlias) {
  Write-Host "ALIAS_TUNEL: $finalAlias"
}
Write-Host "Archivo generado: $sharePath"
if ($CopyToClipboard) {
  Write-Host "Enlace de companero copiado al portapapeles."
}
Write-Host "Manten esta maquina encendida para que el enlace siga activo."
Write-Host "Para apagarlo: powershell -ExecutionPolicy Bypass -File scripts/stop-public-link.ps1 -Port $Port"
