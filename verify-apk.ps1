$ErrorActionPreference = 'Stop'
$taskApk = Join-Path $PSScriptRoot 'Atelier-Perdele-test.apk'
$taskTools = Join-Path $PSScriptRoot '.tools'
$env:JAVA_HOME = (Get-Content -LiteralPath (Join-Path $taskTools 'jdk-path.txt') -Raw).Trim()
$env:Path = (Join-Path $env:JAVA_HOME 'bin') + ';' + $env:Path
$taskBuildTools = Join-Path $taskTools 'android-sdk\build-tools\36.0.0'
$ErrorActionPreference = 'Continue'
& (Join-Path $taskBuildTools 'apksigner.bat') verify --verbose $taskApk
$taskSignatureExit = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
if ($taskSignatureExit -ne 0) { throw 'APK signature verification failed' }
& (Join-Path $taskBuildTools 'aapt.exe') dump badging $taskApk | Select-String 'package:|sdkVersion:|targetSdkVersion:|application-label:|native-code:'
if ($LASTEXITCODE -ne 0) { throw 'APK metadata validation failed' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskZip = [System.IO.Compression.ZipFile]::OpenRead($taskApk)
try {
    $taskBundle = $taskZip.GetEntry('assets/index.android.bundle')
    if ($null -eq $taskBundle -or $taskBundle.Length -lt 100000) { throw 'Embedded JavaScript bundle is missing' }
    foreach ($taskAbi in @('arm64-v8a', 'armeabi-v7a')) {
        if ($null -eq $taskZip.GetEntry("lib/$taskAbi/libhermes.so")) { throw "Hermes runtime missing: $taskAbi" }
    }
    Write-Output "Embedded JS bundle: $($taskBundle.Length) bytes"
} finally { $taskZip.Dispose() }
$taskSize = [math]::Round((Get-Item -LiteralPath $taskApk).Length / 1MB, 1)
Write-Output "APK size: $taskSize MB"
(Get-FileHash -LiteralPath $taskApk -Algorithm SHA256).Hash | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'Atelier-Perdele-test.sha256') -Encoding Ascii
Write-Output 'APK verification passed.'
