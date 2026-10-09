$ErrorActionPreference = 'Stop'
$taskTools = Join-Path $PSScriptRoot '.tools'
$taskSdk = Join-Path $taskTools 'android-sdk'
$env:JAVA_HOME = (Get-Content -LiteralPath (Join-Path $taskTools 'jdk-path.txt') -Raw).Trim()
$env:Path = (Join-Path $env:JAVA_HOME 'bin') + ';' + $env:Path
$taskManager = Join-Path $taskSdk 'cmdline-tools\latest\bin\sdkmanager.bat'
$taskLicenseLog = Join-Path $taskTools 'android-licenses.log'
$ErrorActionPreference = 'Continue'
1..100 | ForEach-Object { 'y' } | & $taskManager "--sdk_root=$taskSdk" --licenses *> $taskLicenseLog
if ($LASTEXITCODE -ne 0) { throw "SDK license setup failed. See $taskLicenseLog" }
Write-Output 'Installing platform, build-tools, NDK and CMake...'
& $taskManager "--sdk_root=$taskSdk" 'platform-tools' 'platforms;android-36' 'build-tools;36.0.0' 'ndk;27.1.12297006' 'cmake;3.22.1' *> (Join-Path $taskTools 'android-sdk-install.log')
if ($LASTEXITCODE -ne 0) { throw 'Android SDK package installation failed. See .tools/android-sdk-install.log' }
$ErrorActionPreference = 'Stop'
Write-Output 'Android SDK package installation complete.'
