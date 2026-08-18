$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectDir = Split-Path -Parent $scriptDir
$binDir = Join-Path $projectDir "bin"
$tempDir = Join-Path $projectDir "temp"

if (-not (Test-Path $binDir)) { New-Item -ItemType Directory -Force -Path $binDir | Out-Null }
if (-not (Test-Path $tempDir)) { New-Item -ItemType Directory -Force -Path $tempDir | Out-Null }

if (-not (Test-Path "$binDir\cwebp.exe")) {
    Write-Host "Downloading cwebp..."
    curl.exe -L -s -o "$tempDir\webp.zip" "https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.4.0-windows-x64.zip"
    Expand-Archive -Path "$tempDir\webp.zip" -DestinationPath "$tempDir\webp" -Force
    $file = Get-ChildItem -Path "$tempDir\webp" -Recurse -Filter "cwebp.exe" | Select-Object -First 1
    Copy-Item $file.FullName -Destination "$binDir\cwebp.exe" -Force
}

if (-not (Test-Path "$binDir\pngquant.exe")) {
    Write-Host "Downloading pngquant..."
    curl.exe -L -s -o "$tempDir\pngquant.zip" "https://pngquant.org/pngquant-windows.zip"
    Expand-Archive -Path "$tempDir\pngquant.zip" -DestinationPath "$tempDir\pngquant" -Force
    $file = Get-ChildItem -Path "$tempDir\pngquant" -Recurse -Filter "pngquant.exe" | Select-Object -First 1
    Copy-Item $file.FullName -Destination "$binDir\pngquant.exe" -Force
}

if (-not (Test-Path "$binDir\oxipng.exe")) {
    Write-Host "Downloading oxipng..."
    curl.exe -L -s -o "$tempDir\oxipng.zip" "https://github.com/oxipng/oxipng/releases/download/v9.1.2/oxipng-9.1.2-x86_64-pc-windows-msvc.zip"
    Expand-Archive -Path "$tempDir\oxipng.zip" -DestinationPath "$tempDir\oxipng" -Force
    $file = Get-ChildItem -Path "$tempDir\oxipng" -Recurse -Filter "oxipng.exe" | Select-Object -First 1
    Copy-Item $file.FullName -Destination "$binDir\oxipng.exe" -Force
}

if (-not (Test-Path "$binDir\ffmpeg.exe")) {
    Write-Host "Downloading ffmpeg..."
    curl.exe -L -s -o "$tempDir\ffmpeg.zip" "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
    Expand-Archive -Path "$tempDir\ffmpeg.zip" -DestinationPath "$tempDir\ffmpeg" -Force
    $file = Get-ChildItem -Path "$tempDir\ffmpeg" -Recurse -Filter "ffmpeg.exe" | Select-Object -First 1
    Copy-Item $file.FullName -Destination "$binDir\ffmpeg.exe" -Force
}

if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
Write-Host "All 4 Windows CLI binaries present in Burrito.Windows\bin!"
