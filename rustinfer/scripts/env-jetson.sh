#!/usr/bin/env bash
# NVIDIA Jetson（JetPack）环境：在 env.sh 基础上强化 tegra / aarch64 路径与常见 JetPack 布局。
# 用法：source scripts/env-jetson.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

if ! is_jetson && [[ "$(uname -m)" != "aarch64" ]]; then
  log_warn "当前不像 Jetson（无 /etc/nv_tegra_release 且非 aarch64），仍按 Jetson 路径配置"
fi

# JetPack 常见路径优先
prepend_path /usr/local/cuda/bin
prepend_ld /usr/local/cuda/lib64
prepend_ld /usr/local/cuda/targets/aarch64-linux/lib
prepend_ld /usr/lib/aarch64-linux-gnu
prepend_ld /usr/lib/aarch64-linux-gnu/tegra
prepend_ld /usr/lib/aarch64-linux-gnu/tegra-egl

# TensorRT（JetPack 系统包）
export TENSORRT_HOME="${TENSORRT_HOME:-/usr}"
export TENSORRT_DIR="${TENSORRT_DIR:-/usr}"

apply_runtime_env

# Jetson 上 CUDA 版本由 JetPack 决定，cudarc 需匹配
if [[ -n "${CUDA_HOME:-}" ]]; then
  set_cudarc_version "$CUDA_HOME"
fi

# 部分 JetPack 把 headers 放在多架构 include
if [[ -d /usr/include/aarch64-linux-gnu ]]; then
  export CPATH="/usr/include/aarch64-linux-gnu${CPATH:+:$CPATH}"
fi

print_env_summary
log_info "Jetson tip: 首次 TensorRT 引擎构建较慢；可用 --device cuda:0 做冒烟"
if [[ -f /etc/nv_tegra_release ]]; then
  log_info "tegra=$(head -1 /etc/nv_tegra_release 2>/dev/null || true)"
fi
