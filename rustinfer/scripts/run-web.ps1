# 安装依赖并启动 Ultralytics ↔ Rust 对比 Web（http://127.0.0.1:8787）
# 别名：也可使用 .\scripts\run-compare.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

. "$PSScriptRoot\env.ps1"

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw "未找到 python"
}

Write-Host "INFO  pip install -r web\requirements.txt"
python -m pip install -r "$Root\web\requirements.txt"

$bin = Join-Path $Root "target\release\rustinfer.exe"
if (-not (Test-Path $bin)) {
    Write-Host "WARN  未找到 $bin ，正在 cargo build --release ..."
    cargo build --release
}

$env:RUSTINFER_BIN = $bin
if (-not $env:RUSTINFER_RUST_MODEL -and (Test-Path (Join-Path $Root "yolo26n.onnx"))) {
    $env:RUSTINFER_RUST_MODEL = (Join-Path $Root "yolo26n.onnx")
}

Write-Host "INFO  uvicorn → http://127.0.0.1:8787"
Set-Location (Join-Path $Root "web")
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8787
