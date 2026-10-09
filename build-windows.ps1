$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$env:PATH = "$(Join-Path $taskRoot '.tools/node-v22.23.3-win-x64');$env:PATH"
$env:ELECTRON_CACHE = Join-Path $taskRoot '.tools/electron-cache'
$env:ELECTRON_BUILDER_CACHE = Join-Path $taskRoot '.tools/electron-builder-cache'
$env:CI = '1'
$env:CSC_IDENTITY_AUTO_DISCOVERY = 'false'
Push-Location (Join-Path $taskRoot 'perde-mobile')
try {
  $ErrorActionPreference = 'Continue'
  npm.cmd run typecheck
  if ($LASTEXITCODE -ne 0) {throw 'TypeScript kontrolu basarisiz.'}
  node node_modules/expo/bin/cli export --platform web --output-dir ../perde-windows/web
  if ($LASTEXITCODE -ne 0) {throw 'Windows arayuzu olusturulamadi.'}
} finally {Pop-Location; $ErrorActionPreference = 'Stop'}
Push-Location (Join-Path $taskRoot 'perde-windows')
try {
  $ErrorActionPreference = 'Continue'
  npm.cmd ci --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) {throw 'Paketler kurulamadi.'}
  npm.cmd run build
  if ($LASTEXITCODE -ne 0) {throw 'Windows derlemesi basarisiz.'}
} finally {Pop-Location; $ErrorActionPreference = 'Stop'}
Copy-Item -LiteralPath (Join-Path $taskRoot 'perde-windows/release/Atelier-Perdele-Windows-Kurulum.exe') -Destination (Join-Path $taskRoot 'Atelier-Perdele-Windows-Kurulum.exe')
Write-Host 'Windows kurulum dosyasi hazir.'
