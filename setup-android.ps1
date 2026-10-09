$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$taskTools = Join-Path $PSScriptRoot '.tools'
$taskSdk = Join-Path $taskTools 'android-sdk'
$taskJdkMarker = Join-Path $taskTools 'jdk-path.txt'
New-Item -ItemType Directory -Force -Path $taskSdk | Out-Null
if (-not (Test-Path -LiteralPath $taskJdkMarker)) {
    Write-Output 'Downloading Temurin JDK 17...'
    $taskAssets = Invoke-RestMethod -Uri 'https://api.adoptium.net/v3/assets/latest/17/hotspot?architecture=x64&image_type=jdk&os=windows'
    $taskPackage = $taskAssets[0].binary.package
    $taskJdkZip = Join-Path $taskTools $taskPackage.name
    Invoke-WebRequest -Uri $taskPackage.link -OutFile $taskJdkZip
    if ((Get-FileHash -LiteralPath $taskJdkZip -Algorithm SHA256).Hash.ToLower() -ne $taskPackage.checksum) { throw 'JDK checksum mismatch' }
    $taskJdkExtract = Join-Path $taskTools 'java17'
    Expand-Archive -LiteralPath $taskJdkZip -DestinationPath $taskJdkExtract -Force
    $taskJdkDir = (Get-ChildItem -LiteralPath $taskJdkExtract -Directory | Select-Object -First 1).FullName
    Set-Content -LiteralPath $taskJdkMarker -Value $taskJdkDir -Encoding Ascii
}
if (-not (Test-Path -LiteralPath (Join-Path $taskSdk 'cmdline-tools\latest\bin\sdkmanager.bat'))) {
    Write-Output 'Downloading Android command-line tools...'
    $taskSdkZip = Join-Path $taskTools 'commandlinetools-win-15859902_latest.zip'
    Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip' -OutFile $taskSdkZip
    if ((Get-FileHash -LiteralPath $taskSdkZip -Algorithm SHA256).Hash.ToLower() -ne '90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a') { throw 'Android command-line tools checksum mismatch' }
    $taskSdkExtract = Join-Path $taskTools 'android-commandline-extract'
    Expand-Archive -LiteralPath $taskSdkZip -DestinationPath $taskSdkExtract -Force
    New-Item -ItemType Directory -Force -Path (Join-Path $taskSdk 'cmdline-tools') | Out-Null
    Copy-Item -LiteralPath (Join-Path $taskSdkExtract 'cmdline-tools') -Destination (Join-Path $taskSdk 'cmdline-tools\latest') -Recurse
}
$env:JAVA_HOME = (Get-Content -LiteralPath $taskJdkMarker -Raw).Trim()
$env:ANDROID_HOME = $taskSdk
$env:ANDROID_SDK_ROOT = $taskSdk
$env:Path = (Join-Path $env:JAVA_HOME 'bin') + ';' + $env:Path
& (Join-Path $env:JAVA_HOME 'bin\java.exe') -version
Write-Output 'Android build tools are ready to install.'
