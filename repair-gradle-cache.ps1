$ErrorActionPreference = 'Stop'
$taskCacheRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '.tools\gradle\caches\8.14.3\transforms'))
foreach ($taskHash in @('19c4a7e5db7750419bcfd64d0a0fbd96', '19343859a9f0a6124130280eb42316af')) {
    $taskTarget = [System.IO.Path]::GetFullPath((Join-Path $taskCacheRoot $taskHash))
    if (Test-Path -LiteralPath $taskTarget) { continue }
    $taskSource = Get-ChildItem -LiteralPath $taskCacheRoot -Directory | Where-Object { $_.Name -match "^$taskHash-[0-9a-f-]{36}$" -and (Test-Path -LiteralPath (Join-Path $_.FullName 'metadata.bin')) -and (Test-Path -LiteralPath (Join-Path $_.FullName 'results.bin')) } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($null -eq $taskSource) { continue }
    $taskSourcePath = [System.IO.Path]::GetFullPath($taskSource.FullName)
    if (-not $taskTarget.StartsWith($taskCacheRoot + '\') -or -not $taskSourcePath.StartsWith($taskCacheRoot + '\')) { throw 'Cache path is outside intended directory' }
    Move-Item -LiteralPath $taskSourcePath -Destination $taskTarget
    Write-Output "Recovered completed Gradle cache artifact: $taskHash"
}
