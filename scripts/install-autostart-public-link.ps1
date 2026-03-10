param(
  [string]$Username = "ana",
  [int]$Port = 3001,
  [bool]$StartNow = $true
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$startupDir = [Environment]::GetFolderPath("Startup")
if ([string]::IsNullOrWhiteSpace($startupDir)) {
  $startupDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup"
}
if (-not (Test-Path $startupDir)) {
  New-Item -ItemType Directory -Path $startupDir -Force | Out-Null
}

$launcherPath = Join-Path $startupDir "AnimoCerca-PublicLink.cmd"
$projectPathPortable = "%USERPROFILE%\projects\mensajes-positivos"
$startScriptPathPortable = "$projectPathPortable\scripts\start-public-link.ps1"
$startScriptReal = Join-Path $root "scripts\start-public-link.ps1"

$cmd = @"
@echo off
cd /d "$projectPathPortable"
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "$startScriptPathPortable" -Port $Port -Username "$Username" -CopyToClipboard `$false > public-autostart.out.log 2> public-autostart.err.log
"@

Set-Content -Path $launcherPath -Value $cmd -Encoding Ascii

Write-Host "Autostart instalado: $launcherPath"
Write-Host "Al iniciar sesion en Windows se levantara el enlace automaticamente."

if ($StartNow) {
  & powershell -ExecutionPolicy Bypass -File $startScriptReal -Port $Port -Username $Username
}
