//! Ultralytics YOLO Rust 推理库：GPU 配置、结果 JSON、API 引擎。

pub mod engine;
pub mod export_jsonl;
pub mod result_json;
pub mod timing_overlay;

use std::path::{Path, PathBuf};

use ultralytics_inference::download::try_download_model;
use ultralytics_inference::{Device, InferenceConfig, Quantization, Results, YOLOModel};

/// 缺失时自动下载已知 YOLO ONNX，然后用 TensorRT + GPU 预处理加载。
pub fn load_gpu_model(model: &str) -> ultralytics_inference::error::Result<YOLOModel> {
    let path = resolve_model(model)?;
    YOLOModel::load_with_config(path, tensorrt_config())
}

fn resolve_model(model: &str) -> ultralytics_inference::error::Result<PathBuf> {
    let p = Path::new(model);
    if p.exists() {
        Ok(p.to_path_buf())
    } else {
        try_download_model(model)
    }
}

/// 按官方示例打印各任务字段。
pub fn print_task_results(results: &[Results]) {
    for result in results {
        if let Some(masks) = &result.masks {
            println!(
                "segment: {} instance masks  shape {:?}",
                masks.len(),
                masks.data.shape()
            );
        } else if let Some(keypoints) = &result.keypoints {
            println!("pose: {} sets of keypoints", keypoints.len());
        } else if let Some(obb) = &result.obb {
            println!("obb: {} oriented boxes", obb.len());
            for i in 0..obb.len() {
                let cls = obb.cls()[i] as usize;
                let name = result.names.get(&cls).map_or("unknown", String::as_str);
                println!("  {name} {:.2}", obb.conf()[i]);
            }
        } else if let Some(probs) = &result.probs {
            let top1 = probs.top1();
            let name = result.names.get(&top1).map_or("unknown", String::as_str);
            println!("classify: top1 {name} {:.2}", probs.top1conf());
        } else if let Some(sem) = &result.semantic_mask {
            println!("semantic: class map shape {:?}", sem.data.shape());
        } else if let Some(depth) = &result.depth {
            println!(
                "depth: map shape {:?}, range {:?}..{:?}",
                depth.data.shape(),
                depth.min_depth(),
                depth.max_depth()
            );
        } else if let Some(boxes) = &result.boxes {
            println!("detect: {} objects", boxes.len());
            let xyxy = boxes.xyxy();
            for i in 0..boxes.len() {
                let cls = boxes.cls()[i] as usize;
                let name = result.names.get(&cls).map_or("unknown", String::as_str);
                let b = xyxy.row(i);
                println!(
                    "  {name} {:.2} [{:.1} {:.1} {:.1} {:.1}]",
                    boxes.conf()[i],
                    b[0],
                    b[1],
                    b[2],
                    b[3]
                );
            }
        }
        println!(
            "  {}  speed={:.1}ms  ep-shape={:?}",
            result.detection_summary(),
            result.speed.total(),
            result.inference_shape()
        );
    }
}

/// TensorRT EP + FP16 + GPU 端预处理。
pub fn tensorrt_config() -> InferenceConfig {
    InferenceConfig::new()
        .with_device(Device::TensorRt(0))
        .with_quantize(Quantization::Fp16)
        .with_cuda_preprocess(true)
        .with_save(true)
}

/// 仅 CUDA EP。
pub fn cuda_config() -> InferenceConfig {
    InferenceConfig::new()
        .with_device(Device::Cuda(0))
        .with_quantize(Quantization::Fp16)
        .with_cuda_preprocess(true)
        .with_save(true)
}

/// 任务名 -> 官方自动下载的 YOLO26 nano ONNX。
pub fn default_model_for_task(task: &str) -> &'static str {
    match task {
        "detect" => "yolo26n.onnx",
        "segment" => "yolo26n-seg.onnx",
        "pose" => "yolo26n-pose.onnx",
        "obb" => "yolo26n-obb.onnx",
        "classify" => "yolo26n-cls.onnx",
        "semantic" => "yolo26n-sem.onnx",
        "depth" => "yolo26n-depth.onnx",
        other => panic!("unknown task: {other}"),
    }
}

/// 加载 GPU 模型，预热，推理默认样例或命令行图片。
pub fn run_task_example(model: &str) -> Result<(), Box<dyn std::error::Error>> {
    let mut yolo = load_gpu_model(model)?;
    eprintln!(
        "loaded {model}  task={:?}  ep={}  imgsz={:?}",
        yolo.task(),
        yolo.execution_provider(),
        yolo.imgsz()
    );
    yolo.warmup()?;
    let results = match std::env::args().nth(1) {
        Some(path) if !path.ends_with(".onnx") => yolo.predict(path)?,
        _ => yolo.predict_default()?,
    };
    print_task_results(&results);
    Ok(())
}

pub const ALL_TASKS: &[&str] = &[
    "detect",
    "segment",
    "pose",
    "obb",
    "classify",
    "semantic",
    "depth",
];
