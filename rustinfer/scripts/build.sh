#!/usr/bin/env bash
# Linux / Jetson：注入环境后 release 构建。
# 用法：./scripts/build.sh [--features ...]

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

FEATURES_ARGS=()
if [[ $# -gt 0 ]]; then
  FEATURES_ARGS=("$@")
else
  # shellcheck disable=SC2207
  FEATURES_ARGS=( $(resolve_cargo_features) )
fi

log_info "cargo build --release ${FEATURES_ARGS[*]}"
# shellcheck disable=SC2086
cargo build --release "${FEATURES_ARGS[@]}"
log_ok "产物: $ROOT/target/release/rustinfer"
