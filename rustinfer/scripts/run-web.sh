#!/usr/bin/env bash
# 安装依赖并启动对比 Web：http://127.0.0.1:8787
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

python3 -m pip install -r "$ROOT/web/requirements.txt"

BIN="$ROOT/target/release/rustinfer"
if [[ ! -x "$BIN" ]]; then
  log_warn "未找到 $BIN，开始构建"
  "$SCRIPT_DIR/build.sh"
fi

export RUSTINFER_BIN="$BIN"
if [[ -z "${RUSTINFER_RUST_MODEL:-}" && -f "$ROOT/yolo26n.onnx" ]]; then
  export RUSTINFER_RUST_MODEL="$ROOT/yolo26n.onnx"
fi

cd "$ROOT/web"
log_info "uvicorn → http://127.0.0.1:8787"
exec python3 -m uvicorn backend.app:app --host 127.0.0.1 --port 8787
