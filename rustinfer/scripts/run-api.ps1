# 启动 Rust 推理 API（默认 http://127.0.0.1:8790）
# 用法：. .\scripts\env.ps1; .\scripts\run-api.ps1
# 可选环境变量：RUSTINFER_MODEL / RUSTINFER_DEVICE / RUSTINFER_API_PORT

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
. "$PSScriptRoot\env.ps1"

if (-not $env:RUSTINFER_MODEL) {
    $onnx = Join-Path $Root "yolo26n.onnx"
    if (Test-Path $onnx) { $env:RUSTINFER_MODEL = $onnx }
}
if (-not $env:RUSTINFER_DEVICE) { $env:RUSTINFER_DEVICE = "tensorrt:0" }
if (-not $env:RUSTINFER_API_PORT) { $env:RUSTINFER_API_PORT = "8790" }

$bin = Join-Path $Root "target\release\rustinfer-api.exe"
if (-not (Test-Path $bin)) {
    Write-Host "INFO  cargo build --release --bin rustinfer-api"
    cargo build --release --bin rustinfer-api
}

Write-Host "INFO  $bin  model=$($env:RUSTINFER_MODEL) device=$($env:RUSTINFER_DEVICE)"
Write-Host "INFO  http://127.0.0.1:$($env:RUSTINFER_API_PORT)"
& $bin
