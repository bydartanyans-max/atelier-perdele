param([switch]$Web)
$taskNodeDir = Join-Path $PSScriptRoot '.tools\node-v22.23.3-win-x64'
if (-not (Test-Path -LiteralPath (Join-Path $taskNodeDir 'node.exe'))) { throw 'Yerel Node.js bulunamadi.' }
$env:Path = $taskNodeDir + ';' + $env:Path
Set-Location -LiteralPath (Join-Path $PSScriptRoot 'perde-mobile')
if ($Web) { & (Join-Path $taskNodeDir 'npm.cmd') run web } else { & (Join-Path $taskNodeDir 'npm.cmd') start }
