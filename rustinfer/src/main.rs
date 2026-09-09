//! Ultralytics YOLO Rust 推理 CLI。
//!
//! 基于官方 `ultralytics-inference` crate 的 `predict` 命令，默认启用：
//! - `--device tensorrt:0`
//! - `--quantize 16`（FP16 TensorRT 引擎）
//! - 编译期 `cuda-preprocess`（letterbox + 归一化 + HWC→CHW 融合核）
//! - `--show` / `--save` 时在画面叠加 pre / infer / post / e2e 耗时
//!
//! 文档：https://docs.ultralytics.com/zh/inference

mod predict;
mod save_out;

use clap::Parser;
use ultralytics_inference::cli::args::{Cli, Commands};
use ultralytics_inference::logging::set_verbose;
use ultralytics_inference::Quantization;

use predict::run_prediction_with_timing;

fn main() {
    ultralytics_inference::io::init_logging();

    match Cli::parse().command {
        Commands::Predict(mut args) => {
            if args.device.is_none() {
                args.device = Some("tensorrt:0".to_string());
            }
            if args.quantize.is_none() && !args.half {
                args.quantize = Some(Quantization::Fp16);
            }
            set_verbose(args.verbose);
            eprintln!(
                "rustinfer  device={}  quantize={:?}  cuda-preprocess=on  timing-overlay=on",
                args.device.as_deref().unwrap_or("tensorrt:0"),
                args.quantize
            );
            run_prediction_with_timing(&args);
        }
        Commands::Version => {
            println!(
                "rustinfer {} (ultralytics-inference {})",
                env!("CARGO_PKG_VERSION"),
                ultralytics_inference::VERSION
            );
        }
    }
}
