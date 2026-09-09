# scripts 说明

跨平台环境与一键部署入口。

| 脚本 | 平台 | 作用 |
| --- | --- | --- |
| `common.sh` | Linux/Jetson | 平台探测、依赖检查、apt/dnf 安装、CUDA/TRT/FFmpeg/Rust 辅助函数 |
| `env.sh` | Linux | `source` 后注入编译/运行环境 |
| `env-jetson.sh` | Jetson | JetPack 路径增强版 `env.sh` |
| `env.ps1` | Windows | MSVC/CUDA/TRT/vcpkg/LLVM |
| `check-deps.sh` | Linux/Jetson | 只探测，不安装 |
| `build.sh` / `build.ps1` | 各平台 | release 构建 |
| `deploy.sh` / `deploy.ps1` | 各平台 | **检测 → 安装缺失项 → 构建 → 运行** |
| `run-web.sh` / `run-web.ps1` | 各平台 | Ultralytics↔Rust 对比 Web |
| `run-api.ps1` / `.sh` | 各平台 | 启动 `rustinfer-api`（HTTP） |
| `camera_session.ps1` / `.sh` | 各平台 | 摄像头采集 → `sessions/cam_*` |
| `analyze_session.py` | 各平台 | 对 `frames.jsonl` 单独统计分析 |

## 典型流程

```bash
# Linux / Jetson
./scripts/deploy.sh --source ./demo.mp4

# 或分步
./scripts/check-deps.sh
source scripts/env.sh          # Jetson: source scripts/env-jetson.sh
./scripts/build.sh
./target/release/rustinfer predict --source ./demo.mp4 --device cuda:0
```

```powershell
# 摄像头 → 事后分析
.\scripts\camera_session.ps1 -Camera 0 -Show
python scripts\analyze_session.py sessions\cam_xxxxxxxx_xxxxxx
```

```powershell
# Windows 一键部署
.\scripts\deploy.ps1 -Source .\demo.mp4 -Show
```

## 自动安装范围

| 依赖 | Linux/Jetson | Windows |
| --- | --- | --- |
| Rust (rustup) | 自动 | 尽量 winget |
| clang / pkg-config / FFmpeg-dev | apt/dnf 自动 | 需 vcpkg + LLVM（见 README） |
| CUDA / TensorRT | Jetson 用 JetPack；桌面尽量 apt 或需预装 | 需预装，路径写在 `env.ps1` |

无法静默下载完整 NVIDIA CUDA/TensorRT 官方安装包时（体积/许可），脚本会检测并给出明确提示，而不是假装已装好。
