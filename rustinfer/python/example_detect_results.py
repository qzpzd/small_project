"""示例：调用 rustinfer-api 推理单张图片，只取检测结果（不回传标注图）。

用法：
  1) 先启动 API：. .\\scripts\\env.ps1; .\\scripts\\run-api.ps1
  2) python python/example_detect_results.py path/to/a.jpg
  3) 可选：python python/example_detect_results.py a.jpg --url http://127.0.0.1:8790 --conf 0.25
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# 允许直接 `python python/example_detect_results.py` 找到同目录客户端
sys.path.insert(0, str(Path(__file__).resolve().parent))

from rustinfer_client import RustInferClient  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description="打印每张图的检测框结果")
    ap.add_argument("image", type=Path, help="图片路径，如 a.jpg")
    ap.add_argument("--url", default="http://127.0.0.1:8790", help="API 地址")
    ap.add_argument("--conf", type=float, default=0.25, help="置信度阈值")
    ap.add_argument("--json", action="store_true", help="整段响应以 JSON 打印")
    args = ap.parse_args()

    if not args.image.is_file():
        print(f"文件不存在: {args.image}", file=sys.stderr)
        return 1

    client = RustInferClient(args.url)
    resp = client.predict_image(args.image, conf=args.conf, return_image=False)

    if args.json:
        # image_b64 已关闭，可直接打印
        print(json.dumps(resp, ensure_ascii=False, indent=2))
        return 0

    print(f"ok={resp.get('ok')}  model={resp.get('model')}  device={resp.get('device')}  n={resp.get('n')}")
    print("说明: speed.* 为服务端模型内计时（pre+infer+post），不含 HTTP/解码；与 CLI 对比请用同分辨率图片。")
    for fi, frame in enumerate(resp.get("frames") or []):
        sp = frame.get("speed") or {}
        dets = frame.get("detections") or []
        print(
            f"\n--- frame[{fi}]  summary={frame.get('summary')}  imgsz={frame.get('imgsz')} ---"
        )
        print(
            f"speed  pre={sp.get('preprocess_ms')}ms  "
            f"infer={sp.get('inference_ms')}ms  "
            f"post={sp.get('postprocess_ms')}ms  "
            f"e2e={sp.get('e2e_ms')}ms  fps={sp.get('fps')}"
        )
        if not dets:
            print("(no detections)")
            continue
        for d in dets:
            print(d["name"], d["conf"], d["xyxy"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
