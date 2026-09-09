"""Python 客户端：调用 rustinfer-api 做图片 / 视频 / 摄像头推理。

依赖：pip install requests opencv-python-headless

示例：
  python python/rustinfer_client.py image path/to.jpg
  python python/rustinfer_client.py video path/to.mp4 --max-frames 30
  python python/rustinfer_client.py camera --index 0 --max-frames 30
  python python/rustinfer_client.py stream --index 0
"""

from __future__ import annotations

import argparse
import base64
import json
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any, Optional

try:
    import requests
except ImportError:
    print("请安装: pip install requests", file=sys.stderr)
    raise SystemExit(1)


def _raise_http(r: requests.Response) -> None:
    if r.ok:
        return
    detail = r.text
    try:
        detail = json.dumps(r.json(), ensure_ascii=False)
    except Exception:
        pass
    raise requests.HTTPError(f"{r.status_code} {r.reason}: {detail}", response=r)


class RustInferClient:
    def __init__(self, base_url: str = "http://127.0.0.1:8790", timeout: float = 600.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def health(self) -> dict[str, Any]:
        r = requests.get(f"{self.base_url}/health", timeout=30)
        _raise_http(r)
        return r.json()

    def predict_image(
        self,
        path: str | Path,
        *,
        conf: float = 0.25,
        return_image: bool = True,
    ) -> dict[str, Any]:
        path = Path(path)
        with path.open("rb") as f:
            files = {"file": (path.name, f, "application/octet-stream")}
            data = {"conf": str(conf), "return_image": "true" if return_image else "false"}
            r = requests.post(
                f"{self.base_url}/v1/predict/image",
                files=files,
                data=data,
                timeout=self.timeout,
            )
        _raise_http(r)
        return r.json()

    def predict_image_b64(
        self,
        image_b64: str,
        *,
        conf: float = 0.25,
        return_image: bool = True,
    ) -> dict[str, Any]:
        r = requests.post(
            f"{self.base_url}/v1/predict/image/json",
            json={"image_b64": image_b64, "conf": conf, "return_image": return_image},
            timeout=self.timeout,
        )
        _raise_http(r)
        return r.json()

    def predict_frame_bytes(
        self,
        jpeg_bytes: bytes,
        *,
        conf: float = 0.25,
        return_image: bool = False,
        filename: str = "frame.jpg",
    ) -> dict[str, Any]:
        files = {"file": (filename, jpeg_bytes, "image/jpeg")}
        data = {"conf": str(conf), "return_image": "true" if return_image else "false"}
        r = requests.post(
            f"{self.base_url}/v1/predict/frame",
            files=files,
            data=data,
            timeout=self.timeout,
        )
        _raise_http(r)
        return r.json()

    def predict_video(
        self,
        path: str | Path,
        *,
        conf: float = 0.25,
        max_frames: Optional[int] = 120,
        return_image: bool = False,
    ) -> dict[str, Any]:
        path = Path(path)
        with path.open("rb") as f:
            files = {"file": (path.name, f, "application/octet-stream")}
            data = {
                "conf": str(conf),
                "return_image": "true" if return_image else "false",
            }
            if max_frames is not None:
                data["max_frames"] = str(max_frames)
            r = requests.post(
                f"{self.base_url}/v1/predict/video",
                files=files,
                data=data,
                timeout=self.timeout,
            )
        _raise_http(r)
        return r.json()

    def predict_path(
        self,
        path: str,
        *,
        conf: float = 0.25,
        max_frames: Optional[int] = None,
        return_image: bool = False,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {
            "path": path,
            "conf": conf,
            "return_image": return_image,
        }
        if max_frames is not None:
            body["max_frames"] = max_frames
        r = requests.post(
            f"{self.base_url}/v1/predict/path",
            json=body,
            timeout=self.timeout,
        )
        _raise_http(r)
        return r.json()

    def predict_camera_server(
        self,
        index: int = 0,
        *,
        conf: float = 0.25,
        max_frames: int = 60,
        return_image: bool = False,
    ) -> dict[str, Any]:
        """服务端打开摄像头（Windows 上常失败，请优先用本机 camera/stream）。"""
        r = requests.post(
            f"{self.base_url}/v1/predict/camera",
            json={
                "index": index,
                "conf": conf,
                "max_frames": max_frames,
                "return_image": return_image,
            },
            timeout=self.timeout,
        )
        _raise_http(r)
        return r.json()


def _open_camera(index: int, width: int = 640, height: int = 480):
    import cv2

    # Windows 优先 DSHOW，减少 MSMF 曝光/缓冲异常
    backends = []
    if sys.platform.startswith("win"):
        backends = [cv2.CAP_DSHOW, cv2.CAP_MSMF, cv2.CAP_ANY]
    else:
        backends = [cv2.CAP_ANY]

    cap = None
    for be in backends:
        c = cv2.VideoCapture(index, be)
        if c.isOpened():
            cap = c
            break
        c.release()
    if cap is None or not cap.isOpened():
        raise RuntimeError(f"无法打开摄像头 index={index}")

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
    cap.set(cv2.CAP_PROP_FPS, 30)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    # 自动曝光：不同后端取值不同，尽量打开 AE 并略降曝光
    # CAP_PROP_AUTO_EXPOSURE: DSHOW 常用 0.75=auto, 0.25=manual
    cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.75)
    # 若仍过曝，可手动压曝光（负值，越小越暗）
    try:
        cap.set(cv2.CAP_PROP_EXPOSURE, -6)
    except Exception:
        pass
    try:
        cap.set(cv2.CAP_PROP_GAIN, 0)
    except Exception:
        pass

    # 丢弃启动阶段过曝/未稳定帧
    for _ in range(8):
        cap.read()
    return cap


def _grab_latest(cap) -> tuple[bool, Any]:
    """丢掉缓冲积压，只取最新一帧，降低延迟。"""
    # 多 grab 一次再 retrieve
    for _ in range(2):
        if not cap.grab():
            return False, None
    return cap.retrieve()


def _draw_dets(frame, detections: list[dict[str, Any]]):
    import cv2

    for d in detections or []:
        x1, y1, x2, y2 = map(int, d["xyxy"])
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 140), 2)
        cv2.putText(
            frame,
            f"{d['name']} {d['conf']:.2f}",
            (x1, max(0, y1 - 6)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 255, 140),
            1,
        )


def _encode_jpeg(
    frame,
    max_side: int | None = None,
    quality: int = 85,
) -> bytes:
    """编码 JPEG。默认不缩放，与 CLI 一样把原分辨率交给服务端 cuda-preprocess letterbox。

    若需省带宽可传 max_side（例如 640）在客户端先缩小。
    """
    import cv2

    if max_side is not None and max_side > 0:
        h, w = frame.shape[:2]
        scale = min(1.0, max_side / max(h, w))
        if scale < 1.0:
            frame = cv2.resize(
                frame, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA
            )
    ok, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
    if not ok:
        raise RuntimeError("jpeg encode failed")
    return buf.tobytes()


def cmd_camera_local(
    client: RustInferClient,
    index: int,
    conf: float,
    max_frames: int,
    max_side: int | None = None,
) -> dict[str, Any]:
    """本机 OpenCV 采 N 帧再调 API（Windows 推荐，避开服务端 dshow video=0）。"""
    try:
        import cv2  # noqa: F401
    except ImportError:
        raise SystemExit("需要: pip install opencv-python-headless") from None

    cap = _open_camera(index)
    frames_out: list[dict[str, Any]] = []
    side_note = "原分辨率" if not max_side else f"max_side={max_side}"
    print(f"本机摄像头 {index} 采集 {max_frames} 帧（{side_note}）→ /v1/predict/frame")
    try:
        for i in range(max_frames):
            ok, frame = _grab_latest(cap)
            if not ok or frame is None:
                break
            jpeg = _encode_jpeg(frame, max_side=max_side)
            resp = client.predict_frame_bytes(jpeg, conf=conf, return_image=False)
            fr = (resp.get("frames") or [None])[0]
            if fr:
                fr = dict(fr)
                fr["frame_idx"] = i
                frames_out.append(fr)
                sp = fr.get("speed") or {}
                print(
                    f"[{i+1}/{max_frames}] dets={len(fr.get('detections') or [])}  "
                    f"e2e={sp.get('e2e_ms')}ms"
                )
    finally:
        cap.release()

    return {
        "ok": True,
        "model": client.health().get("model"),
        "device": "client-camera+api",
        "n": len(frames_out),
        "frames": frames_out,
    }


def cmd_stream(
    client: RustInferClient,
    index: int,
    conf: float,
    max_frames: int,
    max_side: int | None = None,
) -> int:
    """低延迟预览：显示与推理解耦；只对最新帧推理。"""
    try:
        import cv2
    except ImportError:
        print("stream 模式需要: pip install opencv-python-headless", file=sys.stderr)
        return 1

    cap = _open_camera(index)
    side_note = "原分辨率" if not max_side else f"max_side={max_side}"
    print(
        f"本机摄像头 {index}（{side_note}）→ 异步 /v1/predict/frame"
        f"（q 退出，[/] 调曝光，a 自动曝光）"
    )

    latest_dets: list[dict[str, Any]] = []
    latest_speed: dict[str, Any] = {}
    lock = threading.Lock()
    inflight = threading.Event()
    stop = threading.Event()
    n_infer = 0
    exposure = -6.0

    def worker(jpeg: bytes, frame_id: int) -> None:
        nonlocal n_infer, latest_dets, latest_speed
        try:
            resp = client.predict_frame_bytes(jpeg, conf=conf, return_image=False)
            fr = (resp.get("frames") or [{}])[0]
            with lock:
                latest_dets = fr.get("detections") or []
                latest_speed = fr.get("speed") or {}
                n_infer += 1
            sp = latest_speed
            print(
                f"infer#{n_infer} frame={frame_id} dets={len(latest_dets)}  "
                f"e2e={sp.get('e2e_ms')}ms",
                flush=True,
            )
        except Exception as e:
            print(f"infer error: {e}", file=sys.stderr)
        finally:
            inflight.clear()

    pool = ThreadPoolExecutor(max_workers=1)
    frame_id = 0
    shown = 0
    t0 = time.perf_counter()

    try:
        while shown < max_frames and not stop.is_set():
            ok, frame = _grab_latest(cap)
            if not ok or frame is None:
                break
            frame_id += 1

            # 仅当没有在飞请求时提交最新帧，避免队列堆积造成延迟
            if not inflight.is_set():
                try:
                    jpeg = _encode_jpeg(frame, max_side=max_side)
                    inflight.set()
                    pool.submit(worker, jpeg, frame_id)
                except Exception as e:
                    inflight.clear()
                    print(f"encode error: {e}", file=sys.stderr)

            with lock:
                dets = list(latest_dets)
                sp = dict(latest_speed)
            display = frame.copy()
            _draw_dets(display, dets)
            e2e = sp.get("e2e_ms")
            fps_show = shown / max(time.perf_counter() - t0, 1e-6)
            cv2.putText(
                display,
                f"preview {fps_show:.1f}fps  infer_e2e={e2e}ms  exp={exposure:.1f}",
                (10, 24),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (240, 240, 240),
                2,
            )
            cv2.imshow("rustinfer-api stream", display)
            shown += 1

            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break
            if key == ord("["):
                exposure = max(-13.0, exposure - 1.0)
                cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.25)
                cap.set(cv2.CAP_PROP_EXPOSURE, exposure)
                print(f"exposure → {exposure}")
            elif key == ord("]"):
                exposure = min(0.0, exposure + 1.0)
                cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.25)
                cap.set(cv2.CAP_PROP_EXPOSURE, exposure)
                print(f"exposure → {exposure}")
            elif key == ord("a"):
                cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.75)
                print("auto exposure on")
    finally:
        stop.set()
        pool.shutdown(wait=False, cancel_futures=True)
        cap.release()
        cv2.destroyAllWindows()
    return 0


def _save_first_image(resp: dict[str, Any], out: Path) -> None:
    frames = resp.get("frames") or []
    if not frames:
        return
    b64 = frames[0].get("image_b64")
    if not b64:
        return
    out.write_bytes(base64.b64decode(b64))
    print(f"saved annotated → {out}")


def _speed_stats(frames: list[dict[str, Any]], *, skip: int = 5) -> dict[str, Any]:
    """跳过前 skip 帧（冷启动）后的稳态 speed 统计。"""
    e2es: list[float] = []
    pres: list[float] = []
    infs: list[float] = []
    for fr in frames[skip:]:
        sp = fr.get("speed") or {}
        if sp.get("e2e_ms") is not None:
            e2es.append(float(sp["e2e_ms"]))
        if sp.get("preprocess_ms") is not None:
            pres.append(float(sp["preprocess_ms"]))
        if sp.get("inference_ms") is not None:
            infs.append(float(sp["inference_ms"]))
    if not e2es:
        # 帧太少则用全部
        for fr in frames:
            sp = fr.get("speed") or {}
            if sp.get("e2e_ms") is not None:
                e2es.append(float(sp["e2e_ms"]))
            if sp.get("preprocess_ms") is not None:
                pres.append(float(sp["preprocess_ms"]))
            if sp.get("inference_ms") is not None:
                infs.append(float(sp["inference_ms"]))
        skip = 0

    def _avg(xs: list[float]) -> float | None:
        return sum(xs) / len(xs) if xs else None

    def _p50(xs: list[float]) -> float | None:
        if not xs:
            return None
        s = sorted(xs)
        return s[len(s) // 2]

    return {
        "skip": skip,
        "n": len(e2es),
        "e2e_mean": _avg(e2es),
        "e2e_p50": _p50(e2es),
        "pre_mean": _avg(pres),
        "infer_mean": _avg(infs),
    }


def _print_summary(resp: dict[str, Any]) -> None:
    print(
        json.dumps(
            {k: resp[k] for k in ("ok", "model", "device", "n") if k in resp},
            ensure_ascii=False,
        )
    )
    frames = list(resp.get("frames") or [])
    show = min(3, len(frames))
    for i in range(show):
        fr = frames[i]
        sp = fr.get("speed") or {}
        print(
            f"[{i}] (首帧/冷启动?) dets={len(fr.get('detections') or [])}  "
            f"pre={sp.get('preprocess_ms')} infer={sp.get('inference_ms')} "
            f"e2e={sp.get('e2e_ms')}ms"
        )
    if len(frames) <= show:
        return
    skip = 5 if len(frames) > 8 else max(1, len(frames) // 5)
    st = _speed_stats(frames, skip=skip)
    if not st["n"] or st["e2e_mean"] is None:
        return
    line = (
        f"稳态(跳过前{st['skip']}帧, n={st['n']}): "
        f"e2e_mean={st['e2e_mean']:.3f}ms  e2e_p50={st['e2e_p50']:.3f}ms"
    )
    if st["pre_mean"] is not None and st["infer_mean"] is not None:
        line += f"  pre_mean={st['pre_mean']:.3f}ms  infer_mean={st['infer_mean']:.3f}ms"
    print(line)
    print(f"... 共 {len(frames)} frames（勿只用前几帧判断；stream 快因连续稳态）")


def main() -> int:
    ap = argparse.ArgumentParser(description="rustinfer-api Python 客户端")
    ap.add_argument("--url", default="http://127.0.0.1:8790")
    ap.add_argument("--conf", type=float, default=0.25)
    ap.add_argument("--out", type=Path, default=None, help="保存首帧标注图")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_img = sub.add_parser("image", help="推理图片文件")
    p_img.add_argument("path")

    p_vid = sub.add_parser("video", help="上传视频推理")
    p_vid.add_argument("path")
    p_vid.add_argument("--max-frames", type=int, default=60)

    p_path = sub.add_parser("path", help="服务端本地路径推理")
    p_path.add_argument("path")
    p_path.add_argument("--max-frames", type=int, default=None)

    p_cam = sub.add_parser(
        "camera",
        help="本机摄像头采 N 帧再调 API（推荐）。加 --server 才走服务端开摄像头",
    )
    p_cam.add_argument("--index", type=int, default=0)
    p_cam.add_argument("--max-frames", type=int, default=60)
    p_cam.add_argument(
        "--server",
        action="store_true",
        help="使用 POST /v1/predict/camera（Windows 常因 dshow 设备名失败）",
    )
    p_cam.add_argument(
        "--max-side",
        type=int,
        default=None,
        help="可选：客户端先缩长边（默认不缩，与 CLI 一致由服务端 letterbox）",
    )

    p_st = sub.add_parser("stream", help="本机摄像头低延迟预览 + 异步推理")
    p_st.add_argument("--index", type=int, default=0)
    p_st.add_argument("--max-frames", type=int, default=10_000)
    p_st.add_argument(
        "--max-side",
        type=int,
        default=None,
        help="可选：客户端先缩长边（默认不缩，与 CLI 一致由服务端 letterbox）",
    )

    sub.add_parser("health", help="健康检查")

    args = ap.parse_args()
    client = RustInferClient(args.url)

    if args.cmd == "health":
        print(json.dumps(client.health(), ensure_ascii=False, indent=2))
        return 0

    if args.cmd == "stream":
        return cmd_stream(
            client, args.index, args.conf, args.max_frames, max_side=args.max_side
        )

    try:
        if args.cmd == "image":
            resp = client.predict_image(args.path, conf=args.conf, return_image=bool(args.out))
        elif args.cmd == "video":
            resp = client.predict_video(
                args.path, conf=args.conf, max_frames=args.max_frames, return_image=False
            )
        elif args.cmd == "path":
            resp = client.predict_path(
                args.path, conf=args.conf, max_frames=args.max_frames, return_image=False
            )
        elif args.cmd == "camera":
            if args.server:
                resp = client.predict_camera_server(
                    args.index,
                    conf=args.conf,
                    max_frames=args.max_frames,
                    return_image=False,
                )
            else:
                resp = cmd_camera_local(
                    client,
                    args.index,
                    args.conf,
                    args.max_frames,
                    max_side=args.max_side,
                )
        else:
            return 1
    except requests.HTTPError as e:
        print(f"ERROR {e}", file=sys.stderr)
        if args.cmd == "camera" and getattr(args, "server", False):
            print(
                "提示: Windows 上服务端摄像头常失败。请改用:\n"
                "  python python\\rustinfer_client.py camera --index 0 --max-frames 30\n"
                "  python python\\rustinfer_client.py stream --index 0",
                file=sys.stderr,
            )
        return 1

    _print_summary(resp)
    if args.out:
        _save_first_image(resp, args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
