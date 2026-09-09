#!/usr/bin/env bash
# 摄像头 Rust 推理会话 → sessions/cam_* ，事后用 analyze_session.py 分析
# 用法：
#   source scripts/env.sh   # Jetson: env-jetson.sh
#   ./scripts/camera_session.sh
#   ./scripts/camera_session.sh --camera 0 --device cuda:0 --max-seconds 30
#   ./scripts/camera_session.sh --no-show --save-video-only

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"
cd "$ROOT"

CAMERA=0
DEVICE=tensorrt:0
MODEL=""
CONF=0.25
SHOW=1
MAX_SECONDS=0
SAVE_FRAMES=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --camera) CAMERA="$2"; shift 2 ;;
    --device) DEVICE="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --conf) CONF="$2"; shift 2 ;;
    --no-show) SHOW=0; shift ;;
    --show) SHOW=1; shift ;;
    --max-seconds) MAX_SECONDS="$2"; shift 2 ;;
    --save-video-only) SAVE_FRAMES=0; shift ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *) log_error "未知参数: $1"; exit 1 ;;
  esac
done

platform="$(detect_platform)"
if [[ "$platform" == "jetson" ]]; then
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/env-jetson.sh"
else
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/env.sh"
fi

BIN="$ROOT/target/release/rustinfer"
if [[ ! -x "$BIN" ]]; then
  log_info "构建 rustinfer ..."
  "$SCRIPT_DIR/build.sh"
fi

stamp="$(date +%Y%m%d_%H%M%S)"
SESSION="$ROOT/sessions/cam_${stamp}"
mkdir -p "$SESSION"
LOG="$SESSION/run.log"

ARGS=(predict --source "$CAMERA" --device "$DEVICE" --conf "$CONF" --save --verbose)
[[ "$SAVE_FRAMES" -eq 1 ]] && ARGS+=(--save-frames)
[[ "$SHOW" -eq 1 ]] && ARGS+=(--show)
[[ -n "$MODEL" ]] && ARGS+=(--model "$MODEL")

DETECT="$ROOT/runs/detect"
mapfile -t BEFORE < <(find "$DETECT" -maxdepth 1 -type d -name 'predict*' 2>/dev/null | sort || true)

log_info "session=$SESSION"
log_info "camera=$CAMERA device=$DEVICE  (Ctrl+C 结束)"
log_info "cmd: $BIN ${ARGS[*]}"

cleanup() {
  :
}
trap cleanup EXIT

if [[ "$MAX_SECONDS" -gt 0 ]]; then
  timeout --signal=INT "$MAX_SECONDS" "$BIN" "${ARGS[@]}" 2>&1 | tee "$LOG" || true
else
  "$BIN" "${ARGS[@]}" 2>&1 | tee "$LOG" || true
fi

mapfile -t AFTER < <(find "$DETECT" -maxdepth 1 -type d -name 'predict*' 2>/dev/null | sort || true)
NEW=()
for d in "${AFTER[@]:-}"; do
  skip=0
  for b in "${BEFORE[@]:-}"; do
    [[ "$d" == "$b" ]] && skip=1 && break
  done
  [[ "$skip" -eq 0 && -n "$d" ]] && NEW+=("$d")
done
if [[ ${#NEW[@]} -eq 0 ]]; then
  NEW=("$(find "$DETECT" -maxdepth 1 -type d -name 'predict*' -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -1 | cut -d' ' -f2- || true)")
fi

mkdir -p "$SESSION/media"
for d in "${NEW[@]:-}"; do
  [[ -z "$d" || ! -d "$d" ]] && continue
  log_info "收集结果: $d"
  cp -a "$d/." "$SESSION/media/" 2>/dev/null || true
  [[ -f "$d/frames.jsonl" ]] && cp -f "$d/frames.jsonl" "$SESSION/frames.jsonl"
  echo "$d" >"$SESSION/predict_dir.txt"
done

grep 'BENCH_JSON:' "$LOG" >"$SESSION/bench.txt" 2>/dev/null || true

log_ok "会话已保存: $SESSION"
log_info "分析: python3 scripts/analyze_session.py \"$SESSION\""
