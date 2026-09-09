# 在 rustinfer 目录执行： . .\scripts\env.ps1; cargo build --release
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
. "$PSScriptRoot\env.ps1"
Set-Location $root
cargo build --release @args
