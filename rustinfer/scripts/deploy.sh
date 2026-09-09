#!/usr/bin/env bash
# 一键部署：探测平台 → 检查依赖 → 缺失则安装/配置 → 构建 → 运行。
#
# 用法：
#   ./scripts/deploy.sh                          # 检测+安装+构建+version
#   ./scripts/deploy.sh --skip-install           # 不装包，只构建运行
#   ./scripts/deploy.sh --source video.mp4       # 构建后 predict
#   ./scripts/deploy.sh --source img.jpg --show
#   ./scripts/deploy.sh --device cuda:0
#   ./scripts/deploy.sh --no-run                 # 只部署构建
#
# 环境变量：
#   RUSTINFER_DEVICE   默认 tensorrt:0（有 TRT）或 cuda:0 / cpu
#   RUSTINFER_SKIP_APT=1  跳过 apt/dnf 安装

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

SKIP_INSTALL=0
SKIP_RUN=0
SOURCE_ARG=""
SHOW_ARG=()
DEVICE_ARG=""
EXTRA_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-install) SKIP_INSTALL=1; shift ;;
    --no-run) SKIP_RUN=1; shift ;;
    --source) SOURCE_ARG="$2"; shift 2 ;;
    --show) SHOW_ARG=(--show); shift ;;
    --device) DEVICE_ARG="$2"; shift 2 ;;
    --help|-h)
      sed -n '2,20p' "$0"
      exit 0
      ;;
    *) EXTRA_ARGS+=("$1"); shift ;;
  esac
done

cd "$ROOT"
platform="$(detect_platform)"
log_info "======== rustinfer 一键部署 ========"
log_info "platform=$platform  root=$ROOT"

case "$platform" in
  jetson|linux-x86_64|linux-aarch64) ;;
  macos)
    log_error "macOS 未作为一等公民支持（无 CUDA/TensorRT）。可尝试仅 CPU：cargo build --no-default-features"
    exit 1
    ;;
  windows)
    log_error "请在 PowerShell 使用: .\\scripts\\deploy.ps1"
    exit 1
    ;;
  *)
    log_warn "未知平台，继续按 Linux 处理"
    ;;
esac

# ---------- 1) 检查 / 安装 ----------
if [[ "$SKIP_INSTALL" -eq 0 && "${RUSTINFER_SKIP_APT:-0}" != "1" ]]; then
  need_pkgs=0
  have_cmd pkg-config || need_pkgs=1
  have_cmd clang || need_pkgs=1
  ffmpeg_dev_ok || need_pkgs=1
  have_cmd cmake || need_pkgs=1

  if [[ "$need_pkgs" -eq 1 ]]; then
    log_info "检测到缺失的系统依赖，开始安装 ..."
    install_build_deps
  else
    log_ok "系统编译依赖已存在，跳过包安装"
  fi

  ensure_rust
else
  log_info "跳过依赖安装（--skip-install / RUSTINFER_SKIP_APT）"
  # shellcheck disable=SC1091
  source "$HOME/.cargo/env" 2>/dev/null || true
  prepend_path "$HOME/.cargo/bin"
fi

# ---------- 2) 注入环境 ----------
if [[ "$platform" == "jetson" ]]; then
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/env-jetson.sh"
else
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/env.sh"
fi

echo "-------- dependency status --------"
check_dep_status
echo "-----------------------------------"

# ---------- 3) 构建 ----------
# shellcheck disable=SC2207
FEATURES_ARGS=( $(resolve_cargo_features) )
log_info "构建: cargo build --release ${FEATURES_ARGS[*]}"
cargo build --release "${FEATURES_ARGS[@]}"

BIN="$ROOT/target/release/rustinfer"
if [[ ! -x "$BIN" ]]; then
  log_error "构建失败：找不到 $BIN"
  exit 1
fi
log_ok "构建完成: $BIN"
"$BIN" version || true

# ---------- 4) 运行 ----------
if [[ "$SKIP_RUN" -eq 1 ]]; then
  log_info "已跳过运行（--no-run）"
  exit 0
fi

# 选择默认 device
if [[ -z "$DEVICE_ARG" ]]; then
  if [[ -n "${RUSTINFER_DEVICE:-}" ]]; then
    DEVICE_ARG="$RUSTINFER_DEVICE"
  elif find_tensorrt_home >/dev/null && find_cuda_home >/dev/null; then
    DEVICE_ARG="tensorrt:0"
  elif find_cuda_home >/dev/null; then
    DEVICE_ARG="cuda:0"
  else
    DEVICE_ARG="cpu"
  fi
fi

if [[ -z "$SOURCE_ARG" ]]; then
  # 自动找样例
  for cand in \
    "$ROOT/WIN_20260821_16_59_54_Pro.mp4" \
    "$ROOT"/*.mp4 \
    "$ROOT"/*.jpg \
    "$ROOT"/*.png
  do
    if [[ -f "$cand" ]]; then
      SOURCE_ARG="$cand"
      break
    fi
  done
fi

CMD=("$BIN" predict --device "$DEVICE_ARG")
if [[ -n "$SOURCE_ARG" ]]; then
  CMD+=(--source "$SOURCE_ARG")
fi
if [[ ${#SHOW_ARG[@]} -gt 0 ]]; then
  CMD+=("${SHOW_ARG[@]}")
fi
if [[ ${#EXTRA_ARGS[@]} -gt 0 ]]; then
  CMD+=("${EXTRA_ARGS[@]}")
fi

log_info "运行: ${CMD[*]}"
exec "${CMD[@]}"
