# Ultralytics ↔ Rust 对比前后端

用 **Python Ultralytics** 做在线预测，并与本仓库 **ultralytics-inference（Rust / rustinfer）** 在同一张图上对比：

| 阶段 | 含义 |
| --- | --- |
| preprocess | 前处理 |
| inference | 纯模型推理 |
| postprocess | 后处理 |
| e2e | 三者合计 |

## 结构

```
web/
├── backend/app.py      # FastAPI：/api/predict/* 、/api/compare
├── frontend/           # 单页对比 UI
└── requirements.txt
```

## 准备

1. 已 `cargo build --release`（生成 `target/release/rustinfer[.exe]`，输出含 `BENCH_JSON:`）
2. 仓库根目录有 `yolo26n.onnx`（Rust）；Ultralytics 默认会拉 `yolo26n.pt`
3. Windows 先 `. .\scripts\env.ps1`，保证 Rust 侧 CUDA/TRT DLL 可用

```powershell
cd D:\ai_projects\test\rustinfer
python -m pip install -r web\requirements.txt
. .\scripts\env.ps1
.\scripts\run-compare.ps1
```

```bash
cd /path/to/rustinfer
python3 -m pip install -r web/requirements.txt
source scripts/env.sh   # Jetson: env-jetson.sh
./scripts/run-compare.sh
```

浏览器打开 http://127.0.0.1:8787

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | Ultralytics / rustinfer 是否可用 |
| GET | `/api/defaults` | 默认模型与 device |
| POST | `/api/predict/ultralytics` | 仅 Python |
| POST | `/api/predict/rust` | 仅 Rust CLI |
| POST | `/api/compare` | 两者 + 加速比表 |

`multipart/form-data` 字段：`file`, `ul_model`, `rust_model`, `ul_device`, `rust_device`, `conf`, `imgsz`, `warmup`, `engines`.

## 如何读对比结果

- **加速比 = Python(ms) / Rust(ms)**：>1 表示 Rust 更快。
- **inference** 最能反映 TensorRT/CUDA EP 与 PyTorch 的差异；**e2e** 含前后处理与进程开销。
- Rust 路径每次通过子进程调 `rustinfer`，`wall_ms` 含进程启动；面板主指标用结果内的 `speed.*`（与 CLI `BENCH_JSON` 一致）。
- Ultralytics 默认 `.pt` + CUDA；选 `tensorrt:*` 时 Python 侧仍走 CUDA（需先 `yolo export format=engine` 才有原生 TRT）。Rust 默认 `tensorrt:0` + ONNX。
- 首次 TRT 引擎编译请提高 `warmup` 或先 CLI 跑通。

## 环境变量

| 变量 | 含义 |
| --- | --- |
| `RUSTINFER_BIN` | rustinfer 可执行文件路径 |
| `RUSTINFER_UL_MODEL` | 默认 Ultralytics 模型 |
| `RUSTINFER_RUST_MODEL` | 默认 ONNX 路径 |
