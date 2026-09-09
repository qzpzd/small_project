#!/usr/bin/env bash
# 跨平台公共函数：供 env.sh / env-jetson.sh / deploy.sh / check-deps.sh 使用。
# shellcheck shell=bash

set -euo pipefail

RUSTINFER_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export RUSTINFER_ROOT

# ---------- 日志 ----------
log_info()  { printf 'INFO  %s\n' "$*"; }
log_warn()  { printf 'WARN  %s\n' "$*" >&2; }
log_error() { printf 'ERROR %s\n' "$*" >&2; }
log_ok()    { printf 'OK    %s\n' "$*"; }

# ---------- 平台探测 ----------
detect_platform() {
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"
  case "$os" in
    linux)
      if [[ -f /etc/nv_tegra_release ]] || [[ -f /etc/nv_tegra_version ]] \
        || grep -qi tegra /proc/device-tree/model 2>/dev/null \
        || [[ -d /usr/lib/aarch64-linux-gnu/tegra ]]; then
        echo "jetson"
      elif [[ "$arch" == "aarch64" || "$arch" == "arm64" ]]; then
        echo "linux-aarch64"
      else
        echo "linux-x86_64"
      fi
      ;;
    darwin) echo "macos" ;;
    msys*|mingw*|cygwin*) echo "windows" ;;
    *) echo "unknown" ;;
  esac
}

is_jetson() { [[ "$(detect_platform)" == "jetson" ]]; }

have_cmd() { command -v "$1" >/dev/null 2>&1; }

# ---------- 包管理 ----------
detect_pkg_mgr() {
  if have_cmd apt-get; then echo apt
  elif have_cmd dnf; then echo dnf
  elif have_cmd yum; then echo yum
  elif have_cmd pacman; then echo pacman
  else echo none
  fi
}

sudo_if_needed() {
  if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
    "$@"
  elif have_cmd sudo; then
    sudo "$@"
  else
    log_error "需要 root 权限安装依赖，但未找到 sudo"
    return 1
  fi
}

apt_install() {
  sudo_if_needed apt-get update -y
  sudo_if_needed DEBIAN_FRONTEND=noninteractive apt-get install -y "$@"
}

dnf_install() {
  sudo_if_needed dnf install -y "$@"
}

# ---------- 路径工具 ----------
prepend_path() {
  local p="$1"
  [[ -d "$p" ]] || return 0
  case ":${PATH}:" in
    *":$p:"*) ;;
    *) export PATH="$p:$PATH" ;;
  esac
}

prepend_ld() {
  local p="$1"
  [[ -d "$p" ]] || return 0
  if [[ -z "${LD_LIBRARY_PATH:-}" ]]; then
    export LD_LIBRARY_PATH="$p"
  else
    case ":${LD_LIBRARY_PATH}:" in
      *":$p:"*) ;;
      *) export LD_LIBRARY_PATH="$p:$LD_LIBRARY_PATH" ;;
    esac
  fi
}

prepend_pkg_config() {
  local p="$1"
  [[ -d "$p" ]] || return 0
  if [[ -z "${PKG_CONFIG_PATH:-}" ]]; then
    export PKG_CONFIG_PATH="$p"
  else
    case ":${PKG_CONFIG_PATH}:" in
      *":$p:"*) ;;
      *) export PKG_CONFIG_PATH="$p:$PKG_CONFIG_PATH" ;;
    esac
  fi
}

# ---------- CUDA ----------
find_cuda_home() {
  local c
  for c in \
    "${CUDA_HOME:-}" \
    "${CUDA_PATH:-}" \
    /usr/local/cuda \
    /usr/local/cuda-13.1 \
    /usr/local/cuda-13.0 \
    /usr/local/cuda-12.6 \
    /usr/local/cuda-12.4 \
    /usr/local/cuda-12.2 \
    /usr/local/cuda-11.4 \
    /usr/lib/cuda
  do
    if [[ -n "$c" && -x "$c/bin/nvcc" ]]; then
      echo "$c"
      return 0
    fi
  done
  # Jetson 有时只有 /usr/local/cuda 软链或 nvcc 在 PATH
  if have_cmd nvcc; then
    local nvcc_bin
    nvcc_bin="$(command -v nvcc)"
    c="$(cd "$(dirname "$nvcc_bin")/.." && pwd)"
    if [[ -d "$c" ]]; then
      echo "$c"
      return 0
    fi
  fi
  return 1
}

set_cudarc_version() {
  local cuda_home="$1"
  local ver major minor
  if [[ -x "$cuda_home/bin/nvcc" ]]; then
    ver="$("$cuda_home/bin/nvcc" --version 2>/dev/null | sed -n 's/.*release \([0-9]\+\.[0-9]\+\).*/\1/p' | head -1)"
  else
    ver=""
  fi
  if [[ -z "$ver" ]]; then
    export CUDARC_CUDA_VERSION="${CUDARC_CUDA_VERSION:-12020}"
    return 0
  fi
  major="${ver%%.*}"
  minor="${ver#*.}"
  minor="${minor%%.*}"
  export CUDARC_CUDA_VERSION=$((major * 1000 + minor * 10))
}

# ---------- TensorRT ----------
find_tensorrt_home() {
  local c
  for c in \
    "${TENSORRT_DIR:-}" \
    "${TENSORRT_HOME:-}" \
    /usr \
    /usr/local/tensorrt \
    /opt/tensorrt \
    /usr/src/tensorrt
  do
    if [[ -z "$c" ]]; then continue; fi
    if [[ -f "$c/include/NvInfer.h" ]] \
      || [[ -f "$c/include/x86_64-linux-gnu/NvInfer.h" ]] \
      || [[ -f "/usr/include/aarch64-linux-gnu/NvInfer.h" && "$c" == "/usr" ]] \
      || [[ -f "/usr/include/x86_64-linux-gnu/NvInfer.h" && "$c" == "/usr" ]] \
      || ls "$c"/lib*/libnvinfer.so* >/dev/null 2>&1 \
      || ls /usr/lib/*/libnvinfer.so* >/dev/null 2>&1; then
      echo "$c"
      return 0
    fi
  done
  # 仅有系统 so 也算可用
  if ldconfig -p 2>/dev/null | grep -q 'libnvinfer\.so'; then
    echo "/usr"
    return 0
  fi
  return 1
}

# ---------- FFmpeg / clang ----------
ffmpeg_dev_ok() {
  pkg-config --exists libavcodec libavformat libavutil libswscale 2>/dev/null
}

clang_ok() {
  have_cmd clang && { [[ -n "${LIBCLANG_PATH:-}" ]] || have_cmd llvm-config || [[ -f /usr/lib/llvm-*/lib/libclang.so* ]]; }
}

find_libclang_path() {
  local d
  for d in \
    "${LIBCLANG_PATH:-}" \
    /usr/lib/llvm-18/lib \
    /usr/lib/llvm-17/lib \
    /usr/lib/llvm-16/lib \
    /usr/lib/llvm-15/lib \
    /usr/lib/llvm-14/lib \
    /usr/lib64 \
    /usr/lib/x86_64-linux-gnu \
    /usr/lib/aarch64-linux-gnu
  do
    [[ -n "$d" ]] || continue
    if ls "$d"/libclang.so* >/dev/null 2>&1; then
      echo "$d"
      return 0
    fi
  done
  if have_cmd llvm-config; then
    d="$(llvm-config --libdir 2>/dev/null || true)"
    if [[ -n "$d" && -d "$d" ]]; then
      echo "$d"
      return 0
    fi
  fi
  return 1
}

# ---------- Rust ----------
ensure_rust() {
  local need_msrv="1.89"
  if have_cmd rustc && have_cmd cargo; then
    local ver
    ver="$(rustc --version | awk '{print $2}')"
    log_ok "已安装 Rust $ver"
    # 粗略检查：主.次 >= 1.89
    local major minor
    major="$(echo "$ver" | cut -d. -f1)"
    minor="$(echo "$ver" | cut -d. -f2)"
    if [[ "$major" -gt 1 ]] || { [[ "$major" -eq 1 ]] && [[ "$minor" -ge 89 ]]; }; then
      return 0
    fi
    log_warn "Rust $ver < MSRV $need_msrv，尝试 rustup update"
  fi

  if ! have_cmd rustup; then
    log_info "安装 rustup ..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
  fi
  # shellcheck disable=SC1091
  source "$HOME/.cargo/env" 2>/dev/null || true
  prepend_path "$HOME/.cargo/bin"
  rustup default stable
  rustup update stable
  log_ok "Rust $(rustc --version)"
}

# ---------- 系统构建依赖 ----------
install_build_deps() {
  local mgr
  mgr="$(detect_pkg_mgr)"
  log_info "包管理器=$mgr，安装编译依赖 ..."

  case "$mgr" in
    apt)
      apt_install \
        build-essential pkg-config curl ca-certificates git \
        clang libclang-dev llvm-dev \
        ffmpeg \
        libavcodec-dev libavformat-dev libavutil-dev \
        libswscale-dev libswresample-dev libavdevice-dev libavfilter-dev \
        libavfilter-dev \
        cmake ninja-build
      # Jetson 额外：常已有 nvidia-cuda / tensorrt，尽量补齐开发头文件
      if is_jetson; then
        apt_install nvidia-cuda-dev nvidia-cudnn8-dev tensorrt 2>/dev/null \
          || apt_install nvidia-jetpack 2>/dev/null \
          || log_warn "Jetson CUDA/TensorRT 开发包 apt 安装失败（可能已预装 JetPack，可忽略）"
      else
        # 桌面 Linux：不强制 apt 装 CUDA（版本多样），仅尝试常见包名
        apt_install nvidia-cuda-toolkit 2>/dev/null \
          || log_warn "未通过 apt 安装 CUDA Toolkit；若无 GPU 构建将走 CPU 或请手动装 CUDA/TensorRT"
      fi
      ;;
    dnf|yum)
      if [[ "$mgr" == "dnf" ]]; then
        dnf_install gcc gcc-c++ make pkgconf-pkg-config curl ca-certificates git \
          clang clang-devel llvm-devel ffmpeg ffmpeg-devel cmake \
          || log_warn "部分 RPM 包安装失败，请按发行版手动补齐 FFmpeg/clang"
      else
        sudo_if_needed yum install -y gcc gcc-c++ make pkgconfig curl ca-certificates git \
          clang clang-devel llvm-devel ffmpeg ffmpeg-devel cmake \
          || log_warn "部分 RPM 包安装失败，请按发行版手动补齐 FFmpeg/clang"
      fi
      ;;
    *)
      log_warn "未知包管理器，请手动安装：gcc/clang/pkg-config/ffmpeg-dev/cmake"
      ;;
  esac
}

# ---------- 依赖检查报告 ----------
check_dep_status() {
  local cuda_home trt_home libclang platform
  platform="$(detect_platform)"
  echo "platform=$platform"
  echo "arch=$(uname -m)"

  if have_cmd rustc; then echo "rustc=$(rustc --version)"; else echo "rustc=MISSING"; fi
  if have_cmd cargo; then echo "cargo=$(cargo --version)"; else echo "cargo=MISSING"; fi
  if have_cmd pkg-config; then echo "pkg-config=$(pkg-config --version)"; else echo "pkg-config=MISSING"; fi
  if have_cmd clang; then echo "clang=$(clang --version | head -1)"; else echo "clang=MISSING"; fi
  if have_cmd ffmpeg; then echo "ffmpeg=$(ffmpeg -version | head -1)"; else echo "ffmpeg=MISSING"; fi
  if ffmpeg_dev_ok; then echo "ffmpeg-dev=OK"; else echo "ffmpeg-dev=MISSING"; fi

  if cuda_home="$(find_cuda_home)"; then
    echo "cuda_home=$cuda_home"
    echo "nvcc=$("$cuda_home/bin/nvcc" --version 2>/dev/null | sed -n 's/.*release //p' | head -1)"
  else
    echo "cuda_home=MISSING"
  fi

  if trt_home="$(find_tensorrt_home)"; then
    echo "tensorrt_home=$trt_home"
  else
    echo "tensorrt_home=MISSING"
  fi

  if libclang="$(find_libclang_path)"; then
    echo "libclang_path=$libclang"
  else
    echo "libclang_path=MISSING"
  fi

  if have_cmd nvidia-smi; then
    echo "gpu=$(nvidia-smi --query-gpu=name,driver_version --format=csv,noheader 2>/dev/null | head -1)"
  elif is_jetson; then
    echo "gpu=Jetson (tegra)"
  else
    echo "gpu=UNKNOWN"
  fi
}

# ---------- 应用环境变量（Linux / Jetson 共用） ----------
apply_runtime_env() {
  local cuda_home trt_home libclang
  prepend_path "$HOME/.cargo/bin"

  if cuda_home="$(find_cuda_home)"; then
    export CUDA_HOME="$cuda_home"
    export CUDA_PATH="$cuda_home"
    prepend_path "$cuda_home/bin"
    prepend_ld "$cuda_home/lib64"
    prepend_ld "$cuda_home/lib"
    prepend_ld "$cuda_home/targets/aarch64-linux/lib"
    prepend_ld "$cuda_home/targets/x86_64-linux/lib"
    set_cudarc_version "$cuda_home"
  fi

  if trt_home="$(find_tensorrt_home)"; then
    export TENSORRT_HOME="$trt_home"
    export TENSORRT_DIR="$trt_home"
    prepend_path "$trt_home/bin"
    prepend_ld "$trt_home/lib"
    prepend_ld "$trt_home/lib64"
  fi

  # 系统多架构 lib
  prepend_ld /usr/lib/aarch64-linux-gnu
  prepend_ld /usr/lib/x86_64-linux-gnu
  prepend_ld /usr/local/lib

  if libclang="$(find_libclang_path)"; then
    export LIBCLANG_PATH="$libclang"
  fi

  # FFmpeg pkg-config
  prepend_pkg_config /usr/lib/pkgconfig
  prepend_pkg_config /usr/lib/aarch64-linux-gnu/pkgconfig
  prepend_pkg_config /usr/lib/x86_64-linux-gnu/pkgconfig
  prepend_pkg_config /usr/local/lib/pkgconfig

  export PKG_CONFIG_ALLOW_SYSTEM_CFLAGS=1
  export PKG_CONFIG_ALLOW_SYSTEM_LIBS=1
}

print_env_summary() {
  log_info "platform=$(detect_platform)"
  log_info "CUDA_HOME=${CUDA_HOME:-}"
  log_info "CUDARC_CUDA_VERSION=${CUDARC_CUDA_VERSION:-}"
  log_info "TENSORRT_DIR=${TENSORRT_DIR:-}"
  log_info "LIBCLANG_PATH=${LIBCLANG_PATH:-}"
  log_info "PKG_CONFIG_PATH=${PKG_CONFIG_PATH:-}"
  log_info "rustc=$(rustc --version 2>/dev/null || echo MISSING)"
  log_info "nvcc=$(nvcc --version 2>/dev/null | sed -n 's/.*release //p' | head -1 || echo MISSING)"
  log_info "ffmpeg=$(command -v ffmpeg 2>/dev/null || echo MISSING)"
}

# 选择 cargo features：有 CUDA 则开 gpu，否则仅 video（若 FFmpeg 可用）
resolve_cargo_features() {
  local feats=()
  if find_cuda_home >/dev/null; then
    feats+=("gpu")
  else
    log_warn "未检测到 CUDA，将不启用 gpu/cuda-preprocess（CPU/无 GPU 构建）"
  fi
  if ffmpeg_dev_ok || have_cmd ffmpeg; then
    feats+=("video")
  else
    log_warn "未检测到 FFmpeg 开发库，将禁用 video feature"
  fi
  if [[ ${#feats[@]} -eq 0 ]]; then
    echo "--no-default-features"
  else
    local joined
    joined="$(IFS=,; echo "${feats[*]}")"
    echo "--no-default-features --features ${joined}"
  fi
}
