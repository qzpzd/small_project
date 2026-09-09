$ErrorActionPreference = "Continue"

# Prefer switched CUDA (User CUDA_PATH / CUDA_ACTIVE_HOME), else 13 for ORT, else 12.2
$cudaRoot = "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA"
$cuda13 = @(
    "$cudaRoot\v13.1",
    "$cudaRoot\v13.0"
) | Where-Object { Test-Path "$_\bin" } | Select-Object -First 1
$cuda12 = "$cudaRoot\v12.2"
$cudaPreferred = $null
foreach ($c in @(
    [Environment]::GetEnvironmentVariable('CUDA_ACTIVE_HOME', 'User'),
    [Environment]::GetEnvironmentVariable('CUDA_PATH', 'User'),
    $env:CUDA_ACTIVE_HOME,
    $env:CUDA_PATH,
    $cuda13,
    $cuda12
)) {
    if ($c -and (Test-Path "$c\bin")) { $cudaPreferred = $c; break }
}
$cuda = $cudaPreferred

# TensorRT 10.x（官方要求 10.x；不要用 8.6）
$trt = "D:\soft\tools\TensorRT-10.14.1.48"
$ffmpegBin = "D:\soft\ffmpeg\bin"
$vcpkgHome = "D:\soft\vcpkg"
$vcpkgInstalled = Join-Path $vcpkgHome "installed\x64-windows"
$llvmBin = "C:\Program Files\LLVM\bin"
$cudnnBin = "D:\soft\nvidia-cudnn-cu13\nvidia\cudnn\bin"

# Prefer Build Tools MSVC 14.40+ (needed for ONNX Runtime link), fall back to Community
$vcvarsCandidates = @(
    "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat",
    "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat",
    "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
)
$vcvars = $vcvarsCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($vcvars) {
    cmd /c "`"$vcvars`" >nul && set" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
    Write-Host "vcvars=$vcvars"
} else {
    Write-Host "WARNING: vcvars64.bat not found"
}

# Re-apply after vcvars (VS may set its own VCPKG_ROOT)
$env:CUDA_PATH = $cuda
$env:CUDA_ACTIVE_HOME = $cuda
if ($cuda -match '\\v13') {
    $env:CUDARC_CUDA_VERSION = "13000"
} elseif ($cuda -match '\\v12\.2') {
    $env:CUDARC_CUDA_VERSION = "12020"
} elseif ($cuda -match '\\v12') {
    $env:CUDARC_CUDA_VERSION = "12010"
} else {
    $env:CUDARC_CUDA_VERSION = "12020"
}
$env:TENSORRT_HOME = $trt
$env:TENSORRT_DIR = $trt
$env:VCPKG_ROOT = $vcpkgHome
$env:VCPKG_DEFAULT_TRIPLET = "x64-windows"
$env:FFMPEG_DIR = $vcpkgInstalled
if (Test-Path "$llvmBin\libclang.dll") {
    $env:LIBCLANG_PATH = $llvmBin
}

$nvccHome = $cuda
if (-not (Test-Path "$cuda\bin\nvcc.exe") -and (Test-Path "$cuda12\bin\nvcc.exe")) {
    $nvccHome = $cuda12
}

$pathParts = [System.Collections.Generic.List[string]]::new()
$cudaBins = @()
if ($cuda -and (Test-Path "$cuda\bin\x64")) { $cudaBins += "$cuda\bin\x64" }
if ($cuda -and (Test-Path "$cuda\bin")) { $cudaBins += "$cuda\bin" }
if ($cuda -and (Test-Path "$cuda\libnvvp")) { $cudaBins += "$cuda\libnvvp" }
if ($nvccHome -ne $cuda -and (Test-Path "$nvccHome\bin")) { $cudaBins += "$nvccHome\bin" }

foreach ($p in @(
    $cudaBins + @(
        $(if (Test-Path $cudnnBin) { $cudnnBin } else { $null }),
        "$trt\bin",
        "$trt\lib",
        $ffmpegBin,
        $llvmBin,
        "$env:USERPROFILE\.cargo\bin",
        "$vcpkgInstalled\bin",
        "$vcpkgInstalled\tools\pkgconf",
        "$vcpkgHome",
        "D:\soft\cuda-switch"
    )
)) {
    if ($p -and (Test-Path $p) -and -not $pathParts.Contains($p)) { [void]$pathParts.Add($p) }
}
foreach ($p in ($env:Path -split ';')) {
    if ($p -and -not $pathParts.Contains($p)) { [void]$pathParts.Add($p) }
}
$env:Path = ($pathParts -join ';')

if (Test-Path "$vcpkgInstalled\lib\pkgconfig") {
    $env:PKG_CONFIG_PATH = "$vcpkgInstalled\lib\pkgconfig"
    $env:PKG_CONFIG_ALLOW_SYSTEM_CFLAGS = "1"
    $env:PKG_CONFIG_ALLOW_SYSTEM_LIBS = "1"
}
if (Test-Path "$vcpkgInstalled\include") {
    $env:INCLUDE = "$vcpkgInstalled\include;$env:INCLUDE"
}
if (Test-Path "$vcpkgInstalled\lib") {
    $env:LIB = "$vcpkgInstalled\lib;$env:LIB"
    $env:LIBRARY_PATH = "$vcpkgInstalled\lib;$env:LIBRARY_PATH"
}

$pkgconf = Get-Command pkgconf -ErrorAction SilentlyContinue
$pkgconfig = Get-Command pkg-config -ErrorAction SilentlyContinue
if ($pkgconf -and -not $pkgconfig) {
    $shimDir = Join-Path $env:TEMP 'pkgconfig-shim'
    New-Item -ItemType Directory -Force -Path $shimDir | Out-Null
    $shim = Join-Path $shimDir 'pkg-config.cmd'
    Set-Content -Path $shim -Value '@pkgconf %*' -Encoding ASCII
    $env:Path = "$shimDir;$env:Path"
}

Write-Host "CUDA_PATH=$env:CUDA_PATH"
Write-Host "TENSORRT_DIR=$env:TENSORRT_DIR"
Write-Host "CUDARC_CUDA_VERSION=$env:CUDARC_CUDA_VERSION"
Write-Host "VCPKG_ROOT=$env:VCPKG_ROOT"
Write-Host "PKG_CONFIG_PATH=$env:PKG_CONFIG_PATH"
Write-Host "LIBCLANG_PATH=$env:LIBCLANG_PATH"
Write-Host "rustc=$((rustc --version 2>$null))"
Write-Host "nvcc=$((nvcc --version 2>$null | Select-String 'release'))"
$clPath = (Get-Command cl -ErrorAction SilentlyContinue).Source
Write-Host "cl=$clPath"
$pc = (Get-Command pkg-config -ErrorAction SilentlyContinue).Source
if (-not $pc) { $pc = (Get-Command pkgconf -ErrorAction SilentlyContinue).Source }
Write-Host "pkg-config=$pc"
$cublas = $null
foreach ($d in @("$cuda\bin\x64", "$cuda\bin")) {
    if (-not $cublas -and (Test-Path $d)) {
        $cublas = Get-ChildItem $d -Filter 'cublas64_*.dll' -EA SilentlyContinue |
            Select-Object -First 1 -ExpandProperty Name
    }
}
Write-Host "cublas=$cublas"
$cudnn = if (Test-Path "$cudnnBin\cudnn64_9.dll") { 'cudnn64_9.dll' } else { $null }
Write-Host "cudnn=$cudnn"
