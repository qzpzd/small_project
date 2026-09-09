# rustinfer-api

Rust（`ultralytics-inference`）推理 HTTP 服务 + Python 客户端。与 CLI 共用同一套 **TensorRT FP16 + `cuda-preprocess`**（原图 H2D，GPU 内 letterbox）。

更完整的工程说明见仓库根目录 [`README.md`](../README.md)。

## 启动服务

```powershell
. .\scripts\env.ps1
.\scripts\run-api.ps1
```

```bash
source scripts/env.sh   # Jetson: env-jetson.sh
./scripts/run-api.sh
```

默认：`http://127.0.0.1:8790`  
环境变量：`RUSTINFER_MODEL` / `RUSTINFER_DEVICE` / `RUSTINFER_API_HOST` / `RUSTINFER_API_PORT`

进程启动时会做一次模型 `warmup`。若正在跑 `rustinfer-api.exe`，重新 `cargo build` 可能因文件占用失败，需先停服务。

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/health` | 健康检查 |
| POST | `/v1/predict/image` | multipart 上传图片（`file` + `conf` + `return_image`） |
| POST | `/v1/predict/image/json` | JSON `{image_b64, conf, return_image}` |
| POST | `/v1/predict/frame` | 同 image，供本机摄像头/推流逐帧调用 |
| POST | `/v1/predict/video` | multipart 上传视频（可选 `max_frames`） |
| POST | `/v1/predict/path` | JSON 服务端本地路径（大文件免上传） |
| POST | `/v1/predict/camera` | JSON `{index, max_frames, conf}`，**服务端**开摄像头（Windows 常失败） |

响应：`{ ok, model, device, n, frames:[{ detections, speed, imgsz, summary, image_b64? }] }`

`speed` 字段（服务端模型内计时，**不含** HTTP / 客户端编码 / JPEG 解码）：

| 字段 | 含义 |
| --- | --- |
| `preprocess_ms` | `to_rgb8` + 整图 H2D + GPU letterbox |
| `inference_ms` | TensorRT / ORT 推理 |
| `postprocess_ms` | 后处理 |
| `e2e_ms` | 上三者之和 |
| `fps` | `1000 / e2e_ms` |

## 预处理与分辨率

- 与 CLI 一致：默认 **客户端不提前 resize**，原分辨率进服务端，由 `cuda-preprocess` letterbox 到模型 `imgsz`。
- 可选 `--max-side N`：仅在客户端先缩长边（省带宽），一般不如「整图 H2D + GPU letterbox」干净；跨网推流时可按需开启。
- 公平对比 CLI：用同一张图、看 `speed.*` / `BENCH_JSON`，不要拿单次冷启动去比 stream 稳态。

## 耗时怎么读（易踩坑）

| 现象 | 原因 |
| --- | --- |
| 单张图 / video·camera **前几帧** e2e 十几～几十 ms | GPU/TRT 冷启动或空闲后升频；看 `infer` 是否占大头 |
| **stream** 看起来一直很快 | 长时间连续推理，打印的是稳态帧 |
| camera/video「很慢」 | 旧摘要只印前几帧；或把墙钟（编码+HTTP）当成 `e2e` |
| 稳态后仍慢 | 再拆 `pre` / `infer`；`pre` 正常约 1–2ms 量级时，问题在推理侧抖动 |

客户端摘要会打印前几帧，并给出 **跳过冷启动后的 e2e_mean / p50 / pre / infer**。

## Python 依赖

```bash
pip install requests opencv-python-headless
```

## 库用法

```python
from rustinfer_client import RustInferClient  # 在 python/ 目录下，或加入 PYTHONPATH

c = RustInferClient("http://127.0.0.1:8790")
print(c.health())
print(c.predict_image("bus.jpg", conf=0.25, return_image=False))
print(c.predict_video("demo.mp4", max_frames=30))
# 本机摄像头（推荐）见下方 CLI；服务端摄像头：
# print(c.predict_camera_server(0, max_frames=60))
```

只打检测框示例：

```powershell
python python\example_detect_results.py .\runs\detect\predict18\input.jpg
```

## CLI

```powershell
python python\rustinfer_client.py health
python python\rustinfer_client.py image .\photo.jpg --out out.jpg
python python\rustinfer_client.py video .\demo.mp4 --max-frames 30
python python\rustinfer_client.py path D:\data\big.mp4 --max-frames 60

# 本机采摄像头 → /v1/predict/frame（推荐；参数间必须有空格）
python python\rustinfer_client.py camera --index 0 --max-frames 30
python python\rustinfer_client.py stream --index 0
# stream: q 退出，[ / ] 调曝光，a 自动曝光

# 可选：客户端先缩长边（默认不缩）
python python\rustinfer_client.py camera --index 0 --max-frames 30 --max-side 640
python python\rustinfer_client.py stream --index 0 --max-side 640

# 服务端开摄像头（Windows 上 dshow video=0 常 400，不推荐）
python python\rustinfer_client.py camera --server --index 0 --max-frames 30
```

| 命令 | 行为 |
| --- | --- |
| `camera` | 本机 OpenCV 采 N 帧，逐帧 POST `/v1/predict/frame`（默认同分辨率） |
| `stream` | 预览与推理解耦，只推理最新帧；适合看稳态 `e2e` |
| `video` | 上传整段视频，服务端连续推理（看摘要里的「稳态」行） |
| `path` | 服务端读本地路径，免上传 |

## Windows 注意

- 服务端 `POST /v1/predict/camera` 常因设备名失败；请用本机 `camera` / `stream`。
- 客户端与 API 必须同一套 CUDA/TRT 环境已由 `env.ps1` + `run-api.ps1` 配好；换模型后首次仍可能触发 TensorRT 引擎编译。
