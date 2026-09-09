# rustinfer

基于 [Ultralytics Rust 推理](https://docs.ultralytics.com/zh/inference) 的本地项目：用 `ultralytics-inference` **0.0.41** 跑全部 YOLO 任务，默认 **TensorRT GPU** + **GPU 端预处理**（`cuda-preprocess`），可选视频/摄像头（`video`）。

官方文档：https://docs.ultralytics.com/zh/inference  
CUDA 指南：https://docs.rs/ultralytics-inference/latest/ultralytics_inference/cuda_guide/

---

## 目录结构

```
rustinfer/
├── Cargo.toml                 # 默认 features: video + gpu(cuda-preprocess)
│                              # [[bin]] rustinfer → src/main.rs
│                              # [[bin]] rustinfer-api → src/bin/rustinfer-api.rs
├── README.md
├── src/
│   ├── lib.rs                 # 库：engine / predict 等模块，供两个 bin 共用
│   ├── main.rs                # 二进制 rustinfer（CLI）
│   ├── bin/
│   │   └── rustinfer-api.rs   # 二进制 rustinfer-api（HTTP，默认 :8790）
│   ├── predict.rs             # 自定义 predict（标注 + timing overlay + jsonl）
│   ├── timing_overlay.rs      # 画面叠加 pre/infer/post/e2e
│   ├── engine.rs              # API/CLI 共享 YOLO 引擎（Mutex + warmup）
│   ├── result_json.rs         # 检测框 / speed JSON
│   ├── export_jsonl.rs        # 会话 frames.jsonl
│   └── save_out.rs            # 视频保存（系统 ffmpeg/libx264 优先）
├── python/                    # API 客户端与示例（见 python/README.md）
│   ├── rustinfer_client.py
│   ├── example_detect_results.py
│   └── README.md
├── examples/                  # detect / segment / pose / obb / classify / …
├── scripts/                   # env / build / deploy / run-api / run-web / camera_session
├── web/                       # Ultralytics↔Rust 耗时对比（:8787）
├── target/release/            # rustinfer.exe / rustinfer-api.exe（gitignore）
├── .trt_cache/                # TensorRT 引擎缓存（首次编译很慢）
├── runs/ / sessions/          # 推理与摄像头会话输出
└── yolo26n.onnx               # 可选本地模型（可自动下载）
```

同一 crate 两个可执行文件时，Cargo 约定：

| 路径 | 产物 | 原因 |
| --- | --- | --- |
| `src/main.rs` | `rustinfer` | 包的**默认**二进制（CLI） |
| `src/bin/*.rs` | 同名二进制，如 `rustinfer-api` | **额外**二进制入口；与 `main.rs` 并列，共用 `lib.rs` 里的模块 |

因此 API 放在 `src/bin/rustinfer-api.rs`，而不是和 `main.rs` 挤在同一文件；`Cargo.toml` 里也写了 `path = "src/bin/rustinfer-api.rs"`。

---

## 项目架构分析

### 分层关系

```
┌─────────────────────────────────────────────────────────┐
│  CLI / rustinfer-api / examples / python 客户端         │
│  默认 device=tensorrt:0  quantize=FP16  cuda-preprocess │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  ultralytics-inference 0.0.41                           │
│  · YOLOModel 加载 ONNX                                  │
│  · predict / annotate / visualize                       │
│  · video-rs（feature video）读写视频/摄像头             │
│  · cuda-preprocess：整图 H2D + letterbox+/255+HWC→CHW   │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  ONNX Runtime（预编译 GPU + TensorRT EP）               │
│  onnxruntime.dll / onnxruntime_providers_*.dll          │
└───────┬─────────────────────────────┬───────────────────┘
        │                             │
        ▼                             ▼
   CUDA 13 运行时                 TensorRT 10
   cublas/cudart/...              nvinfer*.dll
   cuDNN 9                        （引擎写入 .trt_cache）
```

### 本仓库职责

| 模块 | 作用 |
| --- | --- |
| `main.rs` / `predict.rs` | CLI：默认 `tensorrt:0` + FP16；`--show`/`--save` 叠加耗时；可写 `frames.jsonl` |
| `timing_overlay.rs` | 画面叠加 pre / infer / post / e2e / FPS |
| `bin/rustinfer-api.rs` + `engine.rs` | HTTP API，进程内复用同一模型 |
| `python/` | Python 客户端：`image` / `video` / `camera` / `stream` / `path` |
| `lib.rs` / `examples/*` | 库加载与各任务最小示例 |
| `scripts/*` | Windows/Linux/Jetson 环境、构建、deploy、run-api、run-web、camera_session |
| `web/` | Ultralytics（Python）与 Rust 耗时对比页 |

### 数据流（单次推理）

1. 解析 `--source`（图 / 目录 / 视频 / 摄像头）与 `--model`（缺失则下载）。
2. ORT 注册 TensorRT EP（首次为该模型 **编译 FP16 引擎**，耗时可数分钟）。
3. 预处理：CUDA/TRT 且非 classify 时走 `cuda-preprocess`——**原图整帧 H2D**，GPU 内做 letterbox + `/255` + HWC→CHW；否则 CPU letterbox 后再拷设备。
4. 推理 → 后处理 → 可选 `--show` / `runs/<task>/predict`（含耗时叠加）。

> 同输入下 API 与 CLI 的 `speed.e2e` 应对齐。单次请求或 video/camera **前几帧**偏慢多为 GPU 冷启动；`stream` 长时间连续推理看到的是稳态。详见 [`python/README.md`](python/README.md)。

### Feature 开关

| Cargo feature | 含义 |
| --- | --- |
| `default = ["video", "gpu"]` | 默认带视频 + CUDA 预处理 |
| `video` | `ultralytics-inference/video` → FFmpeg |
| `gpu` | `cuda-preprocess`（需本机 CUDA / JetPack） |

---

## 已启用能力一览

| 能力 | 实现 |
| --- | --- |
| 全部任务 | detect / segment / pose / obb / classify / semantic / depth |
| GPU | `Device::Cuda(0)` 或 `Device::TensorRt(0)` |
| TensorRT | `--device tensorrt:0`，FP16 缓存 `.trt_cache/` |
| GPU 端预处理 | `cuda-preprocess` 融合核 |
| 视频 / 摄像头 | feature `video` |
| 标注保存 | `runs/<task>/predict` |

`cuda-preprocess`：设备为 CUDA/TensorRT、任务非 classify、模型 FP32 输入时自动走快路径。分类用 center-crop，官方说明不走融合核。`semantic` / `depth` 仅 YOLO26。

---

## 一键部署（推荐跨平台入口）

脚本会：**探测平台与已装依赖 → 缺失则尽量自动安装 → 注入环境 → `cargo build --release` → 运行**。

### Linux / Jetson

```bash
cd /path/to/rustinfer
chmod +x scripts/*.sh

# 仅检查（不改系统）
./scripts/check-deps.sh

# 一键：装依赖 + 构建 + 跑 version / 自动找样例媒体
./scripts/deploy.sh

# 指定输入
./scripts/deploy.sh --source ./demo.mp4 --show
./scripts/deploy.sh --device cuda:0 --source ./image.jpg
./scripts/deploy.sh --no-run          # 只部署构建
./scripts/deploy.sh --skip-install    # 跳过 apt/rustup
```

| 平台 | 环境脚本 | 说明 |
| --- | --- | --- |
| Ubuntu/Debian x86_64 | `source scripts/env.sh` | apt 装 clang/FFmpeg；CUDA/TRT 若无则需本机已装或改用 CPU |
| Jetson（JetPack） | `source scripts/env-jetson.sh` | 使用 JetPack 自带 CUDA/cuDNN/TensorRT |
| 手动构建 | `./scripts/build.sh` | 按探测结果选择 `--features gpu,video` |

**Jetson 注意**

- 建议 JetPack 5.x / 6.x（含 CUDA + TensorRT）。
- 首次 `--device tensorrt:0` 会编译引擎，较慢；冒烟可用 `--device cuda:0`。
- ORT 预编译 aarch64 二进制由 `ort` crate 下载；需能访问网络。

**Linux 桌面注意**

- apt 可能装到发行版自带的 `nvidia-cuda-toolkit`（版本未必匹配 ORT）；更稳妥是安装与驱动匹配的官方 CUDA + TensorRT 10.x，再 `source scripts/env.sh`。
- 无 GPU 时 deploy 会去掉 `gpu` feature，仅尝试 `video`（若 FFmpeg 开发库可用）。

### Windows

```powershell
cd D:\ai_projects\test\rustinfer
.\scripts\deploy.ps1
.\scripts\deploy.ps1 -Source .\WIN_20260821_16_59_54_Pro.mp4 -Show
.\scripts\deploy.ps1 -Device cuda:0 -NoRun
```

Windows 上 CUDA / TensorRT / vcpkg FFmpeg / LLVM 体积大，deploy 会检测并提示；路径在 `scripts\env.ps1` 中配置（见下一节完整安装顺序）。

---

## 依赖清单与安装顺序（Windows）

> 顺序很重要：先驱动与编译器，再 CUDA/cuDNN/TRT，再 vcpkg FFmpeg 与 LLVM，最后 Rust 工程编译。

### 0. 本机参考配置（已验证）

| 组件 | 版本 / 路径 |
| --- | --- |
| GPU | RTX 4060 Laptop（sm_89） |
| 驱动 | 支持 CUDA 13.1（`nvidia-smi` 可见） |
| MSVC | Build Tools 2022，工具集 **≥ 14.40**（推荐 14.44 / VS 17.14） |
| CUDA | **12.2**（可并存）+ **13.1**（ORT 运行时必需） |
| cuDNN | **9.x for CUDA 13** → `D:\soft\nvidia-cudnn-cu13\nvidia\cudnn\bin` |
| TensorRT | **10.14.1.48**（必须用 10.x，不要用 8.6）→ `D:\soft\tools\TensorRT-10.14.1.48` |
| FFmpeg 开发库 | vcpkg **ffmpeg 8.1.2**（勿用 9.x，与 `ffmpeg-sys-next` 8.x 不匹配） |
| FFmpeg 运行时（可选） | `D:\soft\ffmpeg\bin` |
| LLVM | 提供 `libclang.dll` → `C:\Program Files\LLVM\bin` |
| Rust | **1.89+**（建议 rustup stable） |
| vcpkg | `D:\soft\vcpkg` |
| CUDA 切换脚本 | `D:\soft\cuda-switch\` |

### 1. NVIDIA 驱动

安装较新 Studio/Game Ready 驱动，使 `nvidia-smi` 显示的 CUDA Version ≥ 13。

### 2. Visual Studio Build Tools（MSVC 14.40+）

- 安装「使用 C++ 的桌面开发」或 VS 2022 Build Tools，工具集升到最新。
- ORT 预编译库链接需要 MSVC **14.40+**；过旧会出现 `__std_find_*` 无法解析。
- 本机：`C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools`（14.44）。

### 3. CUDA Toolkit（12 与 13 可并存）

1. 保留或安装 **CUDA 12.2**（`nvcc` / 部分编译场景）。
2. 安装 **CUDA 13.1** Toolkit（不覆盖 12；CUDA 13 Windows 安装包不再捆绑驱动）。
3. 运行时 DLL 在 `...\CUDA\v13.1\bin\x64\`（如 `cublas64_13.dll`、`cudart64_13.dll`）。

切换（用户 PATH，不删任何版本）：

```powershell
D:\soft\cuda-switch\use-cuda13.cmd   # 推理 / ORT TensorRT（推荐默认）
D:\soft\cuda-switch\use-cuda12.cmd   # 切回 12.2
D:\soft\cuda-switch\cuda-status.cmd
```

切换后请**新开终端**。

### 4. cuDNN 9（CUDA 13）

ORT TensorRT EP 需要 `cudnn64_9.dll`。推荐：

```powershell
# 安装到独立目录（勿与 cu12 的 nvidia-cudnn 混用）
D:\soft\miniconda3\python.exe -m pip install --target D:\soft\nvidia-cudnn-cu13 nvidia-cudnn-cu13
```

将 `D:\soft\nvidia-cudnn-cu13\nvidia\cudnn\bin` 加入 PATH（`use-cuda13` / `scripts\env.ps1` 已处理）。

### 5. TensorRT 10.x

1. 从 NVIDIA 下载 TensorRT **10.x**，解压到例如 `D:\soft\tools\TensorRT-10.14.1.48`。
2. 确保 `bin` 在 PATH（`env.ps1` 会加入）。
3. **不要**用 TensorRT 8.6。

### 6. vcpkg + FFmpeg 8.x + pkgconf（仅 video / 默认 feature）

```powershell
# 若尚未有 vcpkg
git clone https://github.com/microsoft/vcpkg D:\soft\vcpkg
D:\soft\vcpkg\bootstrap-vcpkg.bat

# 需要 FFmpeg 8.x（解码用）。若要让库内 video-rs 也能直接写 mp4，需带 x264：
cd D:\soft\vcpkg
.\vcpkg.exe install "ffmpeg[core,avcodec,avformat,avdevice,avfilter,swresample,swscale,x264]:x64-windows" pkgconf:x64-windows
# 仅解码也可：.\vcpkg.exe install ffmpeg:x64-windows pkgconf:x64-windows
#
# --save 写视频时 rustinfer 会优先调用系统 ffmpeg（如 D:\soft\ffmpeg\bin，需含 libx264）
# 管道编码；找不到则回退逐帧 JPG，避免 Invalid argument 刷屏。
```

校验：

```powershell
$env:PKG_CONFIG_PATH = 'D:\soft\vcpkg\installed\x64-windows\lib\pkgconfig'
# lavc major 应为 62（FFmpeg 8），不是 63（FFmpeg 9）
```

另需 **LLVM**（bindgen）：安装 LLVM 并把 `LIBCLANG_PATH` 指到含 `libclang.dll` 的 `bin`。

### 7. Rust

```powershell
# rustup 安装后
rustc --version   # >= 1.89
```

### 依赖与报错对照

| 运行/链接报错 | 缺什么 |
| --- | --- |
| `__std_find_*` 无法解析 | MSVC &lt; 14.40 |
| `cublas64_13.dll` 找不到 | CUDA 13 未装或 PATH 未切到 13 |
| `cudnn64_9.dll` 找不到 | 未装 cuDNN 9（cu13）或未进 PATH |
| `nvinfer*.dll` 相关 | TensorRT 10 `bin` 未进 PATH |
| `ffmpeg-sys-next` / bindgen 失败 | FFmpeg 版本不对、缺 pkgconf、或缺 LLVM |
| 停在 `Registering ... TensorRTExecutionProvider` | **正常**：首次编引擎，等数分钟 |

---

## 项目部署步骤

在**一台新的 Windows 机器**上按下列顺序部署：

1. **驱动** → 确认 `nvidia-smi` CUDA ≥ 13  
2. **VS Build Tools 2022**（MSVC ≥ 14.40）  
3. **CUDA 13.1**（+ 可选保留 12.2）→ 配置 `D:\soft\cuda-switch` 或等价 PATH  
4. **cuDNN 9 for CUDA 13** → PATH  
5. **TensorRT 10.x** 解压 → PATH  
6. **vcpkg**：`ffmpeg:x64-windows@8.x` + `pkgconf`；安装 **LLVM**  
7. **Rust**（rustup）  
8. 拷贝本仓库到例如 `D:\ai_projects\test\rustinfer`  
9. 按本机路径改 `scripts\env.ps1`（CUDA / TRT / vcpkg / cuDNN / LLVM）  
10. 编译：

```powershell
cd D:\ai_projects\test\rustinfer
. .\scripts\env.ps1
# 确认输出含：CUDA_PATH=...\v13.1  cublas=cublas64_13.dll  cudnn=cudnn64_9.dll
.\scripts\build.ps1
# 或: cargo build --release
```

产物：`target\release\rustinfer.exe`（同目录会有 ORT 相关 DLL）。

**部署检查清单**

- [ ] `nvcc --version` 或 `cuda-status` 显示期望的 CUDA  
- [ ] `where.exe cublas64_13.dll` / `cudnn64_9.dll` 有结果  
- [ ] `Test-Path $env:TENSORRT_DIR\bin`  
- [ ] `cargo build --release` 成功  
- [ ] `.\target\release\rustinfer.exe version` 有输出  

---

## 运行步骤

### 每次开新终端

```powershell
cd D:\ai_projects\test\rustinfer
D:\soft\cuda-switch\use-cuda13.cmd    # 若默认不是 13
. .\scripts\env.ps1
```

### 基础推理

```powershell
# 检测（无 --model 时用/下载 yolo26n.onnx）
cargo run --release -- predict

# 本地视频（首次 TensorRT 会编译引擎，终端可能长时间停在 Registering EP，属正常）
cargo run --release -- predict --source .\WIN_20260821_16_59_54_Pro.mp4 --show

# 图片 / 目录批处理
cargo run --release -- predict --source image.jpg
cargo run --release -- predict --source images/ --batch 8

# 其它任务
cargo run --release -- predict --task segment --source image.jpg
cargo run --release -- predict --task pose --source video.mp4 --show
cargo run --release -- predict --task obb --source aerial.jpg
cargo run --release -- predict --task classify --source image.jpg
cargo run --release -- predict --task semantic --source image.jpg
cargo run --release -- predict --task depth --source image.jpg

# 跳过 TRT 引擎构建，改用 CUDA EP（首次验证更合适）
cargo run --release -- predict --source image.jpg --device cuda:0
```

结果默认：`runs/<task>/predict`。

### Ultralytics（Python）前后端与耗时对比

```powershell
. .\scripts\env.ps1
.\scripts\run-web.ps1
# 浏览器 http://127.0.0.1:8787
```

同一张图并行对比 Python Ultralytics 与 Rust `ultralytics-inference` 的 preprocess / inference / postprocess / e2e。详见 [`web/README.md`](web/README.md)。

### Rust 推理 HTTP API（Python 调用）

```powershell
. .\scripts\env.ps1
.\scripts\run-api.ps1
# 另开终端：
pip install requests opencv-python-headless
python python\rustinfer_client.py health
python python\rustinfer_client.py image .\photo.jpg --out out.jpg
python python\example_detect_results.py .\runs\detect\predict18\input.jpg
python python\rustinfer_client.py video .\demo.mp4 --max-frames 30
# 本机摄像头 → /v1/predict/frame（默认原分辨率，与 CLI 一致由服务端 letterbox）
python python\rustinfer_client.py camera --index 0 --max-frames 30
python python\rustinfer_client.py stream --index 0
# 可选省带宽：--max-side 640
# stream: q 退出，[ / ] 调曝光，a 自动曝光
# Windows 勿依赖服务端 /v1/predict/camera（dshow 常失败）
```

`speed.*` 为服务端模型内计时（不含 HTTP）。客户端摘要会区分冷启动首帧与稳态 mean/p50。完整 API 表与说明见 [`python/README.md`](python/README.md)。

### 摄像头推理 + 事后单独分析

```powershell
. .\scripts\env.ps1
.\scripts\camera_session.ps1 -Camera 0 -Show          # Ctrl+C 结束
# 或限时：.\scripts\camera_session.ps1 -MaxSeconds 30 -NoShow

python scripts\analyze_session.py sessions\cam_xxxxxxxx_xxxxxx
```

会话目录含 `frames.jsonl`（逐帧检测框+耗时）、`media/`（标注帧/视频）。`analyze_session.py` 输出类别统计、耗时 mean/p95、CSV 与 `summary.json`。也可对已有 `runs/detect/predictN`（需含 `frames.jsonl`）直接分析。

### 直接跑已编译二进制

```powershell
. .\scripts\env.ps1
.\target\release\rustinfer.exe predict --source image.jpg --show
.\target\release\rustinfer.exe version
```

### 库示例

```powershell
cargo run --release --example detect
cargo run --release --example segment
cargo run --release --example pose
cargo run --release --example classify
cargo run --release --example obb
cargo run --release --example semantic
cargo run --release --example depth
cargo run --release --example all_tasks
```

库用法：

```rust
use rustinfer::load_gpu_model;

let mut model = load_gpu_model("yolo26n.onnx")?;
let results = model.predict("image.jpg")?;
```

`load_gpu_model` 等价于：

```rust
InferenceConfig::new()
    .with_device(Device::TensorRt(0))
    .with_quantize(Quantization::Fp16)
    .with_cuda_preprocess(true);
```

### 只要图像、不要 FFmpeg

```powershell
cargo build --release --no-default-features
```

---

## 注意

- TensorRT **第一次**加载某模型会编译引擎（约 30 秒～十几分钟），之后读 `.trt_cache/`。
- 已知模型名会从 Ultralytics assets 自动下载。
- 官方预编译 ORT GPU/TRT EP 面向 **CUDA 13**；本机需 CUDA 13 + cuDNN 9 + TensorRT 10。
- 测速请看**稳态**（跳过前几帧），不要用空闲后单次请求或摘要里的前 1～5 帧当峰值能力；`e2e` 慢时先看 `infer` 是否占大头（冷启动常见）。
- 正在运行的 `rustinfer-api.exe` 会锁住产物，需停服务后再 `cargo build --release`。
- 本 crate 为 AGPL-3.0（与上游一致）。

