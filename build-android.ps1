param([switch]$SkipPrebuild)
$ErrorActionPreference = 'Stop'
$taskTools = Join-Path $PSScriptRoot '.tools'
$taskNode = Join-Path $taskTools 'node-v22.23.3-win-x64'
$env:JAVA_HOME = (Get-Content -LiteralPath (Join-Path $taskTools 'jdk-path.txt') -Raw).Trim()
$env:ANDROID_HOME = Join-Path $taskTools 'android-sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:GRADLE_USER_HOME = Join-Path $taskTools 'gradle'
$env:Path = $taskNode + ';' + (Join-Path $env:JAVA_HOME 'bin') + ';' + (Join-Path $env:ANDROID_HOME 'platform-tools') + ';' + $env:Path
$env:CI = '1'
$env:NODE_ENV = 'production'
Push-Location -LiteralPath (Join-Path $PSScriptRoot 'perde-mobile')
try {
    if (-not $SkipPrebuild) {
        & (Join-Path $taskNode 'npx.cmd') expo prebuild --platform android --no-install
        if ($LASTEXITCODE -ne 0) { throw 'Android native project generation failed' }
    }
    Push-Location -LiteralPath 'android'
    try {
        $ErrorActionPreference = 'Continue'
        & .\gradlew.bat assembleRelease '-PreactNativeArchitectures=arm64-v8a,armeabi-v7a' --max-workers=1 --console=plain --no-daemon --no-watch-fs '-Dorg.gradle.parallel=false'
        $ErrorActionPreference = 'Stop'
        if ($LASTEXITCODE -ne 0) { throw 'APK build failed' }
    } finally { Pop-Location }
    $taskOutput = Join-Path $PSScriptRoot 'Atelier-Perdele-test.apk'
    Copy-Item -LiteralPath 'android\app\build\outputs\apk\release\app-release.apk' -Destination $taskOutput -Force
    Write-Output "APK: $taskOutput"
} finally { Pop-Location }
