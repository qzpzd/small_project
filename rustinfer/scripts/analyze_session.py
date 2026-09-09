#!/usr/bin/env python3
"""单独分析 rustinfer 摄像头/视频会话（frames.jsonl + 可选标注帧）。

用法：
  python scripts/analyze_session.py sessions/cam_20260101_120000
  python scripts/analyze_session.py runs/detect/predict18
  python scripts/analyze_session.py sessions/cam_xxx --csv out.csv --plot

输入优先读 <dir>/frames.jsonl；若在 media/ 下也会查找。
输出：控制台报告 + summary.json（及可选 CSV / 简易 ASCII 图）。
"""

from __future__ import annotations

import argparse
import csv
import json
import statistics
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


def find_jsonl(session: Path) -> Path:
    candidates = [
        session / "frames.jsonl",
        session / "media" / "frames.jsonl",
    ]
    for c in candidates:
        if c.is_file():
            return c
    # 若 session 本身是 predict 目录
    raise FileNotFoundError(
        f"未找到 frames.jsonl：请先用 --save 跑推理（camera_session 会自动导出）。\n"
        f"查找过: {', '.join(str(c) for c in candidates)}"
    )


def load_frames(jsonl: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with jsonl.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as e:
                print(f"WARN  skip line {line_no}: {e}", file=sys.stderr)
    return rows


def pct(xs: list[float], p: float) -> float:
    if not xs:
        return 0.0
    s = sorted(xs)
    k = (len(s) - 1) * p
    f = int(k)
    c = min(f + 1, len(s) - 1)
    if f == c:
        return s[f]
    return s[f] + (s[c] - s[f]) * (k - f)


def summarize(rows: list[dict[str, Any]]) -> dict[str, Any]:
    pre = [float(r["speed"]["preprocess_ms"]) for r in rows]
    inf = [float(r["speed"]["inference_ms"]) for r in rows]
    post = [float(r["speed"]["postprocess_ms"]) for r in rows]
    e2e = [float(r["speed"]["e2e_ms"]) for r in rows]
    fps = [float(r["speed"]["fps"]) for r in rows]
    det_counts = [len(r.get("detections") or []) for r in rows]

    class_counter: Counter[str] = Counter()
    conf_by_class: dict[str, list[float]] = defaultdict(list)
    empty_frames = 0
    for r in rows:
        dets = r.get("detections") or []
        if not dets:
            empty_frames += 1
        for d in dets:
            name = str(d.get("name", d.get("cls", "?")))
            class_counter[name] += 1
            conf_by_class[name].append(float(d.get("conf", 0.0)))

    def block(name: str, xs: list[float]) -> dict[str, float]:
        if not xs:
            return {"n": 0}
        return {
            "n": len(xs),
            "mean": round(statistics.fmean(xs), 3),
            "median": round(statistics.median(xs), 3),
            "p95": round(pct(xs, 0.95), 3),
            "min": round(min(xs), 3),
            "max": round(max(xs), 3),
            "stdev": round(statistics.pstdev(xs), 3) if len(xs) > 1 else 0.0,
        }

    top_classes = [
        {
            "name": n,
            "count": c,
            "mean_conf": round(statistics.fmean(conf_by_class[n]), 3),
        }
        for n, c in class_counter.most_common(20)
    ]

    return {
        "frames": len(rows),
        "empty_frames": empty_frames,
        "detection_rate": round(1.0 - empty_frames / max(len(rows), 1), 4),
        "detections_total": int(sum(det_counts)),
        "detections_per_frame": block("det", [float(x) for x in det_counts]),
        "speed": {
            "preprocess_ms": block("pre", pre),
            "inference_ms": block("infer", inf),
            "postprocess_ms": block("post", post),
            "e2e_ms": block("e2e", e2e),
            "fps": block("fps", fps),
        },
        "top_classes": top_classes,
        "source": rows[0].get("source") if rows else None,
    }


def print_report(summary: dict[str, Any], session: Path) -> None:
    print("=" * 60)
    print(f"会话分析  {session}")
    print("=" * 60)
    print(f"帧数           {summary['frames']}")
    print(f"空检帧         {summary['empty_frames']}  (有检率 {summary['detection_rate']*100:.1f}%)")
    print(f"检测总数       {summary['detections_total']}")
    print(f"来源           {summary.get('source')}")
    print("-" * 60)
    print(f"{'阶段':<16}{'mean':>8}{'median':>8}{'p95':>8}{'min':>8}{'max':>8}")
    for key, label in [
        ("preprocess_ms", "preprocess"),
        ("inference_ms", "inference"),
        ("postprocess_ms", "postprocess"),
        ("e2e_ms", "e2e"),
        ("fps", "fps"),
    ]:
        b = summary["speed"][key]
        if not b.get("n"):
            continue
        print(
            f"{label:<16}{b['mean']:8.2f}{b['median']:8.2f}{b['p95']:8.2f}"
            f"{b['min']:8.2f}{b['max']:8.2f}"
        )
    print("-" * 60)
    print("类别 Top（次数 / 平均 conf）")
    if not summary["top_classes"]:
        print("  (无检测)")
    for item in summary["top_classes"]:
        print(f"  {item['name']:<20} {item['count']:>6}   conf={item['mean_conf']:.3f}")
    print("=" * 60)


def ascii_fps_plot(rows: list[dict[str, Any]], width: int = 48) -> str:
    fps = [float(r["speed"]["fps"]) for r in rows]
    if not fps:
        return ""
    # 降采样
    step = max(1, len(fps) // width)
    samples = fps[::step][:width]
    lo, hi = min(samples), max(samples)
    span = max(hi - lo, 1e-6)
    lines = ["FPS 轨迹（降采样）:", f"  min={lo:.1f}  max={hi:.1f}"]
    for v in samples:
        n = int((v - lo) / span * 20)
        lines.append("  |" + "#" * n + f" {v:.1f}")
    return "\n".join(lines)


def write_csv(rows: list[dict[str, Any]], path: Path) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "frame_idx",
                "num_det",
                "preprocess_ms",
                "inference_ms",
                "postprocess_ms",
                "e2e_ms",
                "fps",
                "classes",
            ]
        )
        for r in rows:
            dets = r.get("detections") or []
            names = ",".join(sorted({str(d.get("name", "")) for d in dets}))
            sp = r["speed"]
            w.writerow(
                [
                    r.get("frame_idx"),
                    len(dets),
                    sp.get("preprocess_ms"),
                    sp.get("inference_ms"),
                    sp.get("postprocess_ms"),
                    sp.get("e2e_ms"),
                    sp.get("fps"),
                    names,
                ]
            )


def main() -> int:
    ap = argparse.ArgumentParser(description="分析 rustinfer 会话 frames.jsonl")
    ap.add_argument("session", type=Path, help="会话目录或 predict 目录")
    ap.add_argument("--csv", type=Path, default=None, help="导出逐帧 CSV")
    ap.add_argument("--plot", action="store_true", help="打印 FPS ASCII 轨迹")
    ap.add_argument(
        "--out",
        type=Path,
        default=None,
        help="summary.json 路径（默认写到 session/summary.json）",
    )
    args = ap.parse_args()

    session = args.session.resolve()
    if not session.is_dir():
        print(f"ERROR 目录不存在: {session}", file=sys.stderr)
        return 1

    try:
        jsonl = find_jsonl(session)
    except FileNotFoundError as e:
        print(f"ERROR {e}", file=sys.stderr)
        return 1

    rows = load_frames(jsonl)
    if not rows:
        print("ERROR frames.jsonl 为空", file=sys.stderr)
        return 1

    summary = summarize(rows)
    print_report(summary, session)
    if args.plot:
        print(ascii_fps_plot(rows))
        print()

    out = args.out or (session / "summary.json")
    out.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"已写 {out}")

    csv_path = args.csv or (session / "frames.csv")
    write_csv(rows, csv_path)
    print(f"已写 {csv_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
