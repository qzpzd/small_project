#!/usr/bin/env bash
# Linux（x86_64 / aarch64）运行/编译环境：探测 CUDA、TensorRT、FFmpeg、clang 并注入 PATH/LD。
# 用法：source scripts/env.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/common.sh"

apply_runtime_env
print_env_summary

if ! find_cuda_home >/dev/null; then
  log_warn "未找到 CUDA。GPU/TensorRT 推理不可用；可用: cargo build --release --no-default-features --features video"
fi
if ! find_tensorrt_home >/dev/null; then
  log_warn "未找到 TensorRT。可改用 --device cuda:0 或安装 TensorRT 10.x"
fi
