"""Ultralytics (Python) vs ultralytics-inference (Rust) 对比后端。"""

from __future__ import annotations

import base64
import io
import json
import os
import re
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Any, Literal

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
WEB_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = WEB_DIR / "frontend"
DEFAULT_MODEL_PT = os.environ.get("RUSTINFER_UL_MODEL", "yolo26n.pt")
DEFAULT_MODEL_ONNX = os.environ.get("RUSTINFER_RUST_MODEL", str(ROOT / "yolo26n.onnx"))
RUST_BIN = Path(
    os.environ.get(
        "RUSTINFER_BIN",
        str(ROOT / "target" / "release" / ("rustinfer.exe" if os.name == "nt" else "rustinfer")),
    )
)

app = FastAPI(title="rustinfer compare", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_ul_model_cache: dict[str, Any] = {}


def _load_ultralytics(model_name: str):
    key = model_name
    if key not in _ul_model_cache:
        from ultralytics import YOLO

        _ul_model_cache[key] = YOLO(model_name)
    return _ul_model_cache[key]


def _image_to_b64_jpeg(img: Image.Image, quality: int = 85) -> str:
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="JPEG", quality=quality)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def _np_bgr_to_pil(arr: np.ndarray) -> Image.Image:
    # Ultralytics plot() returns BGR ndarray
    if arr.ndim == 3 and arr.shape[2] == 3:
        rgb = arr[:, :, ::-1]
    else:
        rgb = arr
    return Image.fromarray(rgb)


def _speed_dict(pre: float, infer: float, post: float, **extra: Any) -> dict[str, Any]:
    e2e = pre + infer + post
    fps = 1000.0 / e2e if e2e > 1e-9 else 0.0
    out = {
        "preprocess_ms": round(pre, 3),
        "inference_ms": round(infer, 3),
        "postprocess_ms": round(post, 3),
        "e2e_ms": round(e2e, 3),
        "fps": round(fps, 3),
    }
    out.update(extra)
    return out


def run_ultralytics(
    image_bytes: bytes,
    *,
    model_name: str,
    device: str,
    conf: float,
    imgsz: int,
    warmup: int,
) -> dict[str, Any]:
    model = _load_ultralytics(model_name)
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Ultralytics device: 0 / cpu / cuda:0
    ul_device: str | int = device
    if device.startswith("cuda:"):
        ul_device = int(device.split(":")[-1])
    elif device in {"cuda", "0"}:
        ul_device = 0
    elif device.startswith("tensorrt"):
        # Python Ultralytics TensorRT 需先导出引擎；此处用 CUDA 并标注
        ul_device = 0

    for _ in range(max(0, warmup)):
        model.predict(source=img, conf=conf, imgsz=imgsz, device=ul_device, verbose=False)

    t0 = time.perf_counter()
    results = model.predict(source=img, conf=conf, imgsz=imgsz, device=ul_device, verbose=False)
    wall_ms = (time.perf_counter() - t0) * 1000.0
    r0 = results[0]
    speed = getattr(r0, "speed", None) or {}
    pre = float(speed.get("preprocess", 0.0) or 0.0)
    infer = float(speed.get("inference", 0.0) or 0.0)
    post = float(speed.get("postprocess", 0.0) or 0.0)

    plotted = r0.plot()
    annotated = _np_bgr_to_pil(plotted)

    dets: list[dict[str, Any]] = []
    names = r0.names or {}
    if r0.boxes is not None and len(r0.boxes):
        xyxy = r0.boxes.xyxy.cpu().numpy()
        confs = r0.boxes.conf.cpu().numpy()
        clss = r0.boxes.cls.cpu().numpy().astype(int)
        for i in range(len(xyxy)):
            dets.append(
                {
                    "cls": int(clss[i]),
                    "name": names.get(int(clss[i]), str(int(clss[i]))),
                    "conf": float(confs[i]),
                    "xyxy": [float(x) for x in xyxy[i].tolist()],
                }
            )

    note = None
    if device.startswith("tensorrt"):
        note = "Ultralytics Python 路径使用 CUDA EP；TensorRT 需先 yolo export format=engine"

    return {
        "engine": "ultralytics",
        "backend": "python",
        "model": model_name,
        "device_requested": device,
        "device_used": str(ul_device),
        "note": note,
        "detections": dets,
        "count": len(dets),
        "speed": _speed_dict(pre, infer, post, wall_ms=round(wall_ms, 3), n=1),
        "image_b64": _image_to_b64_jpeg(annotated),
    }


def _parse_bench_json(stdout: str) -> dict[str, Any] | None:
    for line in stdout.splitlines():
        line = line.strip()
        if line.startswith("BENCH_JSON:"):
            raw = line[len("BENCH_JSON:") :]
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                continue
    # fallback: Speed: xms preprocess...
    m = re.search(
        r"Speed:\s*([\d.]+)ms preprocess,\s*([\d.]+)ms inference,\s*([\d.]+)ms postprocess",
        stdout,
    )
    if m:
        pre, infer, post = map(float, m.groups())
        return _speed_dict(pre, infer, post, engine="ultralytics-inference")
    return None


def run_rustinfer(
    image_bytes: bytes,
    *,
    model_path: str,
    device: str,
    conf: float,
    imgsz: int,
    warmup: int,
) -> dict[str, Any]:
    if not RUST_BIN.is_file():
        raise HTTPException(
            status_code=503,
            detail=f"未找到 rustinfer 二进制: {RUST_BIN}。请先 cargo build --release",
        )

    model = Path(model_path)
    if not model.is_file():
        # 允许相对仓库根
        alt = ROOT / model_path
        if alt.is_file():
            model = alt
        else:
            raise HTTPException(status_code=400, detail=f"Rust 模型不存在: {model_path}")

    with tempfile.TemporaryDirectory(prefix="rustinfer_cmp_") as td:
        td_path = Path(td)
        src = td_path / "input.jpg"
        Image.open(io.BytesIO(image_bytes)).convert("RGB").save(src, format="JPEG", quality=95)

        def once() -> subprocess.CompletedProcess[str]:
            cmd = [
                str(RUST_BIN),
                "predict",
                "--model",
                str(model),
                "--source",
                str(src),
                "--device",
                device,
                "--conf",
                str(conf),
                "--imgsz",
                str(imgsz),
                "--save",
            ]
            env = os.environ.copy()
            # Windows 下由调用方先 source env.ps1；此处尽量继承
            return subprocess.run(
                cmd,
                cwd=str(ROOT),
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                env=env,
                check=False,
            )

        for _ in range(max(0, warmup)):
            once()

        t0 = time.perf_counter()
        proc = once()
        wall_ms = (time.perf_counter() - t0) * 1000.0
        out = (proc.stdout or "") + "\n" + (proc.stderr or "")
        if proc.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"rustinfer 退出码 {proc.returncode}: {out[-2000:]}",
            )

        bench = _parse_bench_json(out)
        if not bench:
            raise HTTPException(status_code=500, detail=f"未能解析 BENCH_JSON:\n{out[-2000:]}")

        # 找最新 annotate 图
        annotated_b64 = None
        runs = ROOT / "runs" / "detect"
        if runs.is_dir():
            jpgs = sorted(runs.rglob("input.jpg"), key=lambda p: p.stat().st_mtime, reverse=True)
            if not jpgs:
                jpgs = sorted(runs.rglob("*.jpg"), key=lambda p: p.stat().st_mtime, reverse=True)
            if jpgs:
                annotated_b64 = _image_to_b64_jpeg(Image.open(jpgs[0]))

        speed = _speed_dict(
            float(bench.get("preprocess_ms", 0)),
            float(bench.get("inference_ms", 0)),
            float(bench.get("postprocess_ms", 0)),
            wall_ms=round(wall_ms, 3),
            n=int(bench.get("n", 1)),
            fps=float(bench.get("fps", 0)),
        )
        # 覆盖 fps 用 bench 值
        if "fps" in bench:
            speed["fps"] = round(float(bench["fps"]), 3)

        return {
            "engine": "ultralytics-inference",
            "backend": "rust",
            "model": str(model),
            "device_requested": device,
            "device_used": device,
            "note": None,
            "detections": [],
            "count": None,
            "speed": speed,
            "image_b64": annotated_b64,
            "raw_tail": out[-800:],
        }


def _compare_speeds(a: dict[str, Any], b: dict[str, Any]) -> dict[str, Any]:
    """a = ultralytics, b = rust。"""
    sa, sb = a["speed"], b["speed"]
    keys = ["preprocess_ms", "inference_ms", "postprocess_ms", "e2e_ms"]

    def ratio(py: float, rs: float) -> float | None:
        if rs <= 1e-9:
            return None
        return round(py / rs, 3)

    rows = {}
    for k in keys:
        rows[k] = {
            "ultralytics": sa.get(k),
            "rust": sb.get(k),
            "speedup_vs_python": ratio(float(sa.get(k) or 0), float(sb.get(k) or 0)),
        }
    winner = "rust" if float(sb.get("e2e_ms") or 1e9) < float(sa.get("e2e_ms") or 1e9) else "ultralytics"
    return {"metrics": rows, "faster_e2e": winner}


@app.get("/api/health")
def health() -> dict[str, Any]:
    ul_ok = True
    try:
        import ultralytics  # noqa: F401
    except Exception:
        ul_ok = False
    return {
        "ok": True,
        "ultralytics": ul_ok,
        "rustinfer_bin": str(RUST_BIN),
        "rustinfer_exists": RUST_BIN.is_file(),
        "root": str(ROOT),
    }


@app.get("/api/defaults")
def defaults() -> dict[str, Any]:
    return {
        "ultralytics_model": DEFAULT_MODEL_PT,
        "rust_model": DEFAULT_MODEL_ONNX,
        "ultralytics_device": "0",
        "rust_device": "tensorrt:0",
        "conf": 0.25,
        "imgsz": 640,
        "warmup": 1,
    }


@app.post("/api/predict/ultralytics")
async def predict_ultralytics(
    file: UploadFile = File(...),
    model: str = Form(DEFAULT_MODEL_PT),
    device: str = Form("0"),
    conf: float = Form(0.25),
    imgsz: int = Form(640),
    warmup: int = Form(1),
) -> dict[str, Any]:
    data = await file.read()
    if not data:
        raise HTTPException(400, "空文件")
    try:
        return run_ultralytics(
            data, model_name=model, device=device, conf=conf, imgsz=imgsz, warmup=warmup
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Ultralytics 推理失败: {e}") from e


@app.post("/api/predict/rust")
async def predict_rust(
    file: UploadFile = File(...),
    model: str = Form(DEFAULT_MODEL_ONNX),
    device: str = Form("tensorrt:0"),
    conf: float = Form(0.25),
    imgsz: int = Form(640),
    warmup: int = Form(1),
) -> dict[str, Any]:
    data = await file.read()
    if not data:
        raise HTTPException(400, "空文件")
    try:
        return run_rustinfer(
            data, model_path=model, device=device, conf=conf, imgsz=imgsz, warmup=warmup
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Rust 推理失败: {e}") from e


@app.post("/api/compare")
async def compare(
    file: UploadFile = File(...),
    ul_model: str = Form(DEFAULT_MODEL_PT),
    rust_model: str = Form(DEFAULT_MODEL_ONNX),
    ul_device: str = Form("0"),
    rust_device: str = Form("tensorrt:0"),
    conf: float = Form(0.25),
    imgsz: int = Form(640),
    warmup: int = Form(1),
    engines: Literal["both", "ultralytics", "rust"] = Form("both"),
) -> dict[str, Any]:
    data = await file.read()
    if not data:
        raise HTTPException(400, "空文件")

    result: dict[str, Any] = {"engines_run": engines}
    if engines in {"both", "ultralytics"}:
        result["ultralytics"] = run_ultralytics(
            data, model_name=ul_model, device=ul_device, conf=conf, imgsz=imgsz, warmup=warmup
        )
    if engines in {"both", "rust"}:
        result["rust"] = run_rustinfer(
            data, model_path=rust_model, device=rust_device, conf=conf, imgsz=imgsz, warmup=warmup
        )
    if "ultralytics" in result and "rust" in result:
        result["comparison"] = _compare_speeds(result["ultralytics"], result["rust"])
    return result


@app.get("/")
def index() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")


if FRONTEND_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")
