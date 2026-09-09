#!/usr/bin/env bash
# 依赖探测：打印兼容环境状态（不修改系统）。
# 用法：./scripts/check-deps.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

echo "======== rustinfer dependency check ========"
check_dep_status
echo "============================================"

missing=0
have_cmd rustc || missing=1
have_cmd cargo || missing=1
have_cmd pkg-config || missing=1
have_cmd clang || missing=1
ffmpeg_dev_ok || missing=1

if find_cuda_home >/dev/null; then
  :
else
  log_warn "CUDA 缺失：无法启用 gpu feature / TensorRT"
fi

if [[ "$missing" -eq 0 ]]; then
  log_ok "基础编译依赖齐全"
  exit 0
else
  log_warn "存在缺失项；请运行: ./scripts/deploy.sh"
  exit 1
fi
