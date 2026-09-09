#!/usr/bin/env bash
# 启动 Rust 推理 API：http://127.0.0.1:8790
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"
cd "$ROOT"

platform="$(detect_platform)"
if [[ "$platform" == "jetson" ]]; then
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/env-jetson.sh"
else
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/env.sh"
fi

export RUSTINFER_MODEL="${RUSTINFER_MODEL:-$ROOT/yolo26n.onnx}"
export RUSTINFER_DEVICE="${RUSTINFER_DEVICE:-tensorrt:0}"
export RUSTINFER_API_PORT="${RUSTINFER_API_PORT:-8790}"

BIN="$ROOT/target/release/rustinfer-api"
if [[ ! -x "$BIN" ]]; then
  cargo build --release --bin rustinfer-api
fi

log_info "listening http://127.0.0.1:${RUSTINFER_API_PORT}"
exec "$BIN"
