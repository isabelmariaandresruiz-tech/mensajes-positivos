param(
  [int]$Port = 3001
)

$ErrorActionPreference = "SilentlyContinue"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$targets = @()
$targets += Get-CimInstance Win32_Process -Filter "name = 'ssh.exe'" |
  Where-Object { $_.CommandLine -like "*localhost.run*" -and $_.CommandLine -like "*-R 80:127.0.0.1:$Port*" }
$targets += Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
  Where-Object {
    $_.CommandLine -like "*next*start*--port $Port*" -or
    $_.CommandLine -like "*npm-cli.js*run start*--port $Port*"
  }
$targets += Get-CimInstance Win32_Process -Filter "name = 'cmd.exe'" |
  Where-Object {
    $_.CommandLine -like "*npm run start*--port $Port*" -or
    $_.CommandLine -like "*localhost.run*127.0.0.1:$Port*"
  }

$ids = $targets | Select-Object -ExpandProperty ProcessId -Unique
foreach ($id in $ids) {
  Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
}

$statePath = Join-Path $root ".public-link.json"
$sharePath = Join-Path $root "public-link.txt"
if (Test-Path $statePath) {
  Remove-Item -Path $statePath -Force
}
if (Test-Path $sharePath) {
  Remove-Item -Path $sharePath -Force
}

Write-Host "Procesos detenidos para puerto $Port."
