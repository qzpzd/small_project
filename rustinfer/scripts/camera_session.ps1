# 摄像头 Rust 推理会话：采集 → 保存帧/视频 + frames.jsonl → 可事后单独分析
#
# 用法：
#   . .\scripts\env.ps1
#   .\scripts\camera_session.ps1                  # 默认摄像头 0，Ctrl+C 结束
#   .\scripts\camera_session.ps1 -Camera 0 -Show
#   .\scripts\camera_session.ps1 -Camera 0 -NoShow -MaxSeconds 30
#   .\scripts\camera_session.ps1 -Device cuda:0
#
# 结束后会话目录：sessions\cam_yyyyMMdd_HHmmss\
#   frames.jsonl   逐帧检测与耗时（分析主输入）
#   media\         标注视频或逐帧 JPG
#   run.log        控制台日志
# 分析：
#   python scripts\analyze_session.py sessions\cam_...

[CmdletBinding()]
param(
    [string]$Camera = "0",
    [string]$Device = "tensorrt:0",
    [string]$Model = "",
    [double]$Conf = 0.25,
    [switch]$Show,
    [switch]$NoShow,
    [int]$MaxSeconds = 0,
    [switch]$SaveVideoOnly
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
. "$PSScriptRoot\env.ps1"

$bin = Join-Path $Root "target\release\rustinfer.exe"
if (-not (Test-Path $bin)) {
    Write-Host "INFO  building rustinfer ..."
    cargo build --release
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$session = Join-Path $Root "sessions\cam_$stamp"
New-Item -ItemType Directory -Force -Path $session | Out-Null
$log = Join-Path $session "run.log"

$doShow = $true
if ($NoShow) { $doShow = $false }
elseif ($Show) { $doShow = $true }

$argsList = @(
    "predict",
    "--source", $Camera,
    "--device", $Device,
    "--conf", "$Conf",
    "--save",
    "--verbose"
)
if (-not $SaveVideoOnly) {
    $argsList += "--save-frames"
}
if ($doShow) { $argsList += "--show" }
if ($Model) { $argsList += @("--model", $Model) }

# 记录会话前已有的 predict 目录，便于事后定位新建目录
$detectRoot = Join-Path $Root "runs\detect"
$before = @()
if (Test-Path $detectRoot) {
    $before = @(Get-ChildItem $detectRoot -Directory -Filter "predict*" | ForEach-Object { $_.FullName })
}

Write-Host "INFO  session=$session"
Write-Host "INFO  camera=$Camera device=$Device  (Ctrl+C 结束采集)"
Write-Host "INFO  cmd: $bin $($argsList -join ' ')"

$procArgs = @{
    FilePath               = $bin
    ArgumentList           = $argsList
    WorkingDirectory       = $Root
    RedirectStandardOutput = $log
    RedirectStandardError  = (Join-Path $session "run.err.log")
    PassThru               = $true
    NoNewWindow            = $true
}

# 同时在控制台显示：用 Start-Process 不易 tee；改为直接前台运行并 Tee
$errLog = Join-Path $session "run.err.log"
$psi = "& `"$bin`" $($argsList -join ' ') 2>&1 | Tee-Object -FilePath `"$log`""

if ($MaxSeconds -gt 0) {
    Write-Host "INFO  最长运行 ${MaxSeconds}s"
    $job = Start-Job -ScriptBlock {
        param($Root, $bin, $argsList, $log)
        Set-Location $Root
        & $bin @argsList 2>&1 | Tee-Object -FilePath $log
    } -ArgumentList $Root, $bin, $argsList, $log
    Wait-Job $job -Timeout $MaxSeconds | Out-Null
    if ($job.State -eq "Running") {
        Write-Host "INFO  超时，停止推理进程"
        Stop-Job $job -Force
        Get-Process rustinfer -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    }
    Receive-Job $job -ErrorAction SilentlyContinue | Out-Null
    Remove-Job $job -Force -ErrorAction SilentlyContinue
} else {
    try {
        & $bin @argsList 2>&1 | Tee-Object -FilePath $log
    } catch {
        Write-Host "WARN  $($_.Exception.Message)"
    }
}

# 定位本次新建的 runs/detect/predict*
$after = @()
if (Test-Path $detectRoot) {
    $after = @(Get-ChildItem $detectRoot -Directory -Filter "predict*" | ForEach-Object { $_.FullName })
}
$newDirs = $after | Where-Object { $before -notcontains $_ } | Sort-Object
if (-not $newDirs) {
    # 回退：取最新修改的 predict*
    $newDirs = @(Get-ChildItem $detectRoot -Directory -Filter "predict*" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName)
}

$media = Join-Path $session "media"
New-Item -ItemType Directory -Force -Path $media | Out-Null
foreach ($d in $newDirs) {
    Write-Host "INFO  收集结果: $d"
    Copy-Item -Path (Join-Path $d "*") -Destination $media -Recurse -Force -ErrorAction SilentlyContinue
    $jsonl = Join-Path $d "frames.jsonl"
    if (Test-Path $jsonl) {
        Copy-Item $jsonl (Join-Path $session "frames.jsonl") -Force
    }
    Set-Content -Path (Join-Path $session "predict_dir.txt") -Value $d
}

# 从日志提取 BENCH_JSON
Select-String -Path $log -Pattern "BENCH_JSON:" -ErrorAction SilentlyContinue |
    ForEach-Object { $_.Line } |
    Set-Content (Join-Path $session "bench.txt")

Write-Host "OK    会话已保存: $session"
Write-Host "NEXT  python scripts\analyze_session.py `"$session`""
