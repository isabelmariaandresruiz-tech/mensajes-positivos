$startupDir = [Environment]::GetFolderPath("Startup")
if ([string]::IsNullOrWhiteSpace($startupDir)) {
  $startupDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup"
}
$launcherPath = Join-Path $startupDir "AnimoCerca-PublicLink.cmd"

if (Test-Path $launcherPath) {
  Remove-Item -Path $launcherPath -Force
  Write-Host "Autostart eliminado: $launcherPath"
} else {
  Write-Host "No habia autostart instalado."
}
