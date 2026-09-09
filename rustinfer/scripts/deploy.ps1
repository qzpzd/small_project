# 一键部署（Windows）：检查依赖 → 提示/尽量配置 → 构建 → 运行。
# 用法：
#   .\scripts\deploy.ps1
#   .\scripts\deploy.ps1 -Source .\video.mp4 -Show
#   .\scripts\deploy.ps1 -Device cuda:0 -NoRun
#   .\scripts\deploy.ps1 -SkipInstall

[CmdletBinding()]
param(
    [string]$Source = "",
    [string]$Device = "",
    [switch]$Show,
    [switch]$NoRun,
    [switch]$SkipInstall,
    [string[]]$ExtraArgs = @()
)

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Write-Info($m) { Write-Host "INFO  $m" }
function Write-Warn($m) { Write-Host "WARN  $m" -ForegroundColor Yellow }
function Write-Ok($m)   { Write-Host "OK    $m" -ForegroundColor Green }

Write-Info "======== rustinfer Windows 一键部署 ========"
Write-Info "root=$Root"

. "$PSScriptRoot\env.ps1"

function Test-Cmd($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

$missing = @()
if (-not (Test-Cmd rustc)) { $missing += "rustc/cargo (rustup)" }
if (-not (Test-Cmd cl)) { $missing += "MSVC Build Tools (cl.exe)" }
if (-not $env:CUDA_PATH -or -not (Test-Path "$env:CUDA_PATH\bin")) { $missing += "CUDA Toolkit" }
if (-not $env:TENSORRT_DIR -or -not (Test-Path "$env:TENSORRT_DIR")) { $missing += "TensorRT 10.x" }
if (-not $env:LIBCLANG_PATH) { $missing += "LLVM/libclang" }
if (-not $env:PKG_CONFIG_PATH) { $missing += "vcpkg FFmpeg (PKG_CONFIG_PATH)" }

if ($missing.Count -gt 0) {
    Write-Warn "检测到可能缺失: $($missing -join ', ')"
    if (-not $SkipInstall) {
        if (-not (Test-Cmd rustc)) {
            Write-Info "尝试通过 winget/rustup 安装 Rust ..."
            if (Test-Cmd winget) {
                winget install --id Rustlang.Rustup -e --accept-package-agreements --accept-source-agreements
            } else {
                Write-Warn "请手动安装 https://rustup.rs ，然后重新打开终端"
            }
        }
        Write-Warn "CUDA / TensorRT / vcpkg FFmpeg / LLVM 体积大，请按 README 安装后改 scripts\env.ps1 路径"
        Write-Warn "或先 SkipInstall 仅用已有环境构建"
    }
} else {
    Write-Ok "关键依赖路径已配置（以 env.ps1 为准）"
}

Write-Info "cargo build --release"
cargo build --release
if ($LASTEXITCODE -ne 0) {
    Write-Error "构建失败"
    exit $LASTEXITCODE
}

$bin = Join-Path $Root "target\release\rustinfer.exe"
Write-Ok "产物: $bin"
& $bin version

if ($NoRun) {
    Write-Info "已跳过运行 (-NoRun)"
    exit 0
}

if (-not $Device) {
    if ($env:RUSTINFER_DEVICE) { $Device = $env:RUSTINFER_DEVICE }
    elseif (Test-Path "$env:TENSORRT_DIR\bin") { $Device = "tensorrt:0" }
    elseif ($env:CUDA_PATH) { $Device = "cuda:0" }
    else { $Device = "cpu" }
}

if (-not $Source) {
    $cand = Get-ChildItem $Root -Include *.mp4,*.jpg,*.png -File -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($cand) { $Source = $cand.FullName }
}

$argsList = @("predict", "--device", $Device)
if ($Source) { $argsList += @("--source", $Source) }
if ($Show) { $argsList += "--show" }
if ($ExtraArgs) { $argsList += $ExtraArgs }

Write-Info ("运行: {0} {1}" -f $bin, ($argsList -join ' '))
& $bin @argsList
exit $LASTEXITCODE
