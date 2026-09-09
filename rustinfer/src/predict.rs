//! 自定义 predict：在 `--show` / `--save` 标注帧上叠加 pre / infer / post / e2e 耗时。
//!
//! 逻辑对齐 `ultralytics_inference::cli::predict::run_prediction`，仅在标注后额外绘制 timing overlay。

use std::path::Path;
use std::process;
use std::time::Duration;

use image::GenericImageView;
use ultralytics_inference::annotate::annotate_image;
use ultralytics_inference::batch::BatchProcessor;
use ultralytics_inference::cli::args::PredictArgs;
use ultralytics_inference::io::find_next_run_dir;
use ultralytics_inference::logging::is_verbose;
use ultralytics_inference::source::{Source, SourceIterator, SourceMeta};
use ultralytics_inference::task::Task;
use ultralytics_inference::visualizer::Viewer;
use ultralytics_inference::{
    InferenceConfig, Quantization, Results, DISPLAY_NAME, VERSION, YOLOModel,
};

use rustinfer::export_jsonl::FrameJsonlWriter;
use rustinfer::timing_overlay::{overlay_speed, speed_summary_line};
use crate::save_out::AnnotatedSaver;

const DEFAULT_OBB_IMAGES: &[&str] = &[ultralytics_inference::download::DEFAULT_OBB_IMAGE];

/// 与官方 CLI 兼容的 predict，额外在画面叠加耗时。
pub fn run_prediction_with_timing(args: &PredictArgs) {
    let (model_path, model_is_default) = resolve_model_path(args);
    let source_path = &args.source;
    let save = args.save;
    let save_frames = args.save_frames;
    let save_json = args.save_json;
    let verbose = args.verbose;
    let batch_size = args.batch as usize;
    let device = parse_device_arg(args.device.as_deref()).unwrap_or_else(|e| {
        eprintln!("ERROR 💥 {e}");
        process::exit(1);
    });
    let mut show = args.show;

    if model_is_default && verbose {
        eprintln!("WARNING ⚠️  'model' argument is missing. Using default '--model={model_path}'.");
    }

    let config = build_inference_config(args, device).unwrap_or_else(|e| {
        eprintln!("ERROR 💥 {e}");
        process::exit(1);
    });

    let mut model = match YOLOModel::load_with_config(&model_path, config) {
        Ok(m) => m,
        Err(e) => {
            eprintln!("ERROR 💥 Error loading model: {e}");
            process::exit(1);
        }
    };

    if let Some(task) = args.task {
        if model_is_default {
            model.set_task(task);
        } else if task != model.task() {
            eprintln!(
                "ERROR 💥 '--task={task}' conflicts with task '{}' from model metadata.",
                model.task()
            );
            process::exit(1);
        }
    }

    let source = source_path.as_ref().map_or_else(
        || {
            let default_urls = default_source_urls(model.task());
            if verbose {
                eprintln!(
                    "WARNING ⚠️  'source' missing. Using defaults: {}",
                    default_urls.join(", ")
                );
            }
            let downloaded = ultralytics_inference::download::download_images(default_urls);
            if downloaded.is_empty() {
                eprintln!("ERROR 💥 Failed to download any images");
                process::exit(1);
            }
            Source::ImageList(
                downloaded
                    .into_iter()
                    .map(std::path::PathBuf::from)
                    .collect(),
            )
        },
        |s| Source::from(s.as_str()),
    );

    if save_json && model.task() != Task::Semantic {
        eprintln!(
            "WARNING ⚠️  --save-json currently only for semantic; ignoring for '{}'.",
            model.task()
        );
    }

    let need_predict_dir = save || (save_json && model.task() == Task::Semantic);
    let save_dir: Option<std::path::PathBuf> = if need_predict_dir {
        let parent_dir = format!("runs/{}", model.task().as_str());
        let dir = find_next_run_dir(&parent_dir, "predict");
        if let Err(e) = std::fs::create_dir_all(&dir) {
            eprintln!("ERROR 💥 Failed to create save directory '{dir}': {e}");
            process::exit(1);
        }
        Some(std::path::PathBuf::from(dir))
    } else {
        None
    };

    let results_dir: Option<std::path::PathBuf> = save_dir.as_ref().and_then(|d| {
        if !(save_json && model.task() == Task::Semantic) {
            return None;
        }
        let dir = d.join("results");
        if let Err(e) = std::fs::create_dir_all(&dir) {
            eprintln!("ERROR 💥 Failed to create results dir '{}': {e}", dir.display());
            process::exit(1);
        }
        Some(dir)
    });

    let precision = precision_label(model.quantize());
    let device_str = provider_label(model.execution_provider());
    println!("{DISPLAY_NAME} {VERSION} 🚀 Rust ONNX {precision} {device_str}  timing-overlay=on");
    println!("Using ONNX Runtime {}", model.execution_provider());

    let is_video = source.is_video();
    #[cfg(not(feature = "video"))]
    if is_video {
        eprintln!("ERROR 💥 Video source needs --features video");
        process::exit(1);
    }

    let mut result_count = 0usize;
    let mut total_preprocess = 0.0;
    let mut total_inference = 0.0;
    let mut total_postprocess = 0.0;
    let mut last_inference_shape = (0usize, 0usize);
    let mut viewer: Option<Viewer> = None;
    let mut result_saver = save_dir
        .as_ref()
        .filter(|_| save)
        .map(|d| AnnotatedSaver::new(d.clone(), save_frames));
    // 有保存目录时同步写 frames.jsonl，便于摄像头/视频事后单独分析
    let mut jsonl_writer = save_dir
        .as_ref()
        .and_then(|d| match FrameJsonlWriter::create(d) {
            Ok(w) => {
                eprintln!("INFO 📝 逐帧结果 → {}", w.path().display());
                Some(w)
            }
            Err(e) => {
                eprintln!("WARNING ⚠️  无法创建 frames.jsonl: {e}");
                None
            }
        });
    let source_kind = if is_video {
        if args
            .source
            .as_deref()
            .is_some_and(|s| s.chars().all(|c| c.is_ascii_digit()))
        {
            "webcam"
        } else {
            "video"
        }
    } else {
        "image"
    };

    let channel_capacity = batch_size * 2;
    let (sender, receiver) = std::sync::mpsc::sync_channel(channel_capacity);
    let source_clone = source.clone();
    std::thread::spawn(move || {
        let iter = match SourceIterator::new(source_clone) {
            Ok(iter) => iter,
            Err(e) => {
                eprintln!("ERROR 💥 Error initializing source: {e}");
                return;
            }
        };
        for item in iter {
            if sender.send(item).is_err() {
                break;
            }
        }
    });

    {
        let mut batch_processor = BatchProcessor::new(
            &mut model,
            batch_size,
            |batch_results: Vec<Vec<Results>>,
             images: &[image::DynamicImage],
             paths: &[String],
             metas: &[SourceMeta]| {
                for (results, (meta, (image_path, img))) in batch_results
                    .into_iter()
                    .zip(metas.iter().zip(paths.iter().zip(images.iter())))
                {
                    for result in results {
                        let inference_shape = result.inference_shape();
                        last_inference_shape =
                            (inference_shape.0 as usize, inference_shape.1 as usize);

                        if is_verbose() {
                            let frames = meta
                                .total_frames
                                .map_or_else(|| "?".to_string(), |n| n.to_string());
                            let position = if is_video {
                                format!("video 1/1 (frame {}/{frames})", meta.frame_idx + 1)
                            } else {
                                format!("image {}/{frames}", meta.frame_idx + 1)
                            };
                            println!(
                                "{position} {image_path}: {}  {}",
                                result.detection_summary(),
                                speed_summary_line(&result.speed)
                            );
                        }

                        if let (Some(cdir), Some(sm)) = (results_dir.as_ref(), result.semantic_mask.as_ref()) {
                            let stem =
                                semantic_output_stem(image_path, meta.frame_idx, meta.total_frames);
                            let out_path = cdir.join(format!("{stem}.png"));
                            let (h, w) = (sm.data.shape()[0] as u32, sm.data.shape()[1] as u32);
                            let max_id = sm.data.iter().copied().max().unwrap_or(0);
                            let saved = if max_id > 255 {
                                image::ImageBuffer::<image::Luma<u16>, Vec<u16>>::from_raw(
                                    w,
                                    h,
                                    sm.data.iter().copied().collect(),
                                )
                                .map(|img| img.save(&out_path))
                            } else {
                                image::GrayImage::from_raw(
                                    w,
                                    h,
                                    sm.data.iter().map(|&v| v as u8).collect(),
                                )
                                .map(|img| img.save(&out_path))
                            };
                            if let Some(Err(e)) = saved {
                                eprintln!(
                                    "ERROR 💥 Failed to save semantic mask '{}': {e}",
                                    out_path.display()
                                );
                            }
                        }

                        // 标注检测结果，再叠加耗时面板
                        let annotated = annotate_image(img, &result, None);
                        let with_timing = overlay_speed(&annotated, &result.speed);

                        if save {
                            if let Some(saver) = result_saver.as_mut() {
                                if let Err(e) = saver.save(is_video, meta, &with_timing) {
                                    eprintln!("ERROR 💥 Failed to save result: {e}");
                                }
                            }
                        }

                        if let Some(w) = jsonl_writer.as_mut() {
                            if let Err(e) = w.write_frame(meta, &result, source_kind) {
                                eprintln!("WARNING ⚠️  frames.jsonl write failed: {e}");
                            }
                        }

                        if show {
                            let (orig_w, orig_h) = img.dimensions();
                            let view_width = orig_w as usize;
                            let view_height = orig_h as usize;

                            if let Some(ref v) = viewer {
                                if v.width != view_width || v.height != view_height {
                                    viewer = None;
                                }
                            }

                            if viewer.is_none() {
                                match Viewer::new(DISPLAY_NAME, view_width, view_height) {
                                    Ok(v) => viewer = Some(v),
                                    Err(e) => {
                                        eprintln!(
                                            "WARNING ⚠️  Cannot open display ({e}). Continuing without --show."
                                        );
                                        show = false;
                                    }
                                }
                            }

                            if let Some(ref mut v) = viewer {
                                if v.update(&with_timing).is_ok() {
                                    if !is_video {
                                        let _ = v.wait(Duration::from_millis(200));
                                    }
                                } else {
                                    show = false;
                                }
                            }
                        }

                        total_preprocess += result.speed.preprocess.unwrap_or(0.0);
                        total_inference += result.speed.inference.unwrap_or(0.0);
                        total_postprocess += result.speed.postprocess.unwrap_or(0.0);
                        result_count += 1;
                    }
                }
            },
        );

        let mut skipped = 0usize;
        for item in receiver {
            let (img, meta) = match item {
                Ok(val) => val,
                Err(e) => {
                    eprintln!("ERROR 💥 Error reading source: {e}");
                    skipped += 1;
                    continue;
                }
            };
            batch_processor.add(img, meta.path.clone(), meta);
        }
        batch_processor.flush();
        if skipped > 0 {
            eprintln!("WARNING ⚠️  Skipped {skipped} unreadable input(s)");
        }
    }

    if let Some(mut w) = jsonl_writer.take() {
        let _ = w.flush();
    }

    if let Some(saver) = result_saver {
        if let Err(e) = saver.finish() {
            eprintln!("ERROR 💥 Failed to finish saving: {e}");
        }
    }

    let num_results = result_count.max(1) as f64;
    let avg_pre = total_preprocess / num_results;
    let avg_inf = total_inference / num_results;
    let avg_post = total_postprocess / num_results;
    let avg_e2e = avg_pre + avg_inf + avg_post;
    let avg_fps = if avg_e2e > 1e-6 { 1000.0 / avg_e2e } else { 0.0 };
    println!(
        "Speed: {avg_pre:.1}ms preprocess, {avg_inf:.1}ms inference, {avg_post:.1}ms postprocess \
         per image at shape ({batch_size}, 3, {}, {})  |  e2e {avg_e2e:.1}ms  {avg_fps:.1} FPS  (n={result_count})",
        last_inference_shape.0, last_inference_shape.1
    );
    // 机器可读一行，供 web 对比后端解析（不依赖 serde）
    println!(
        "BENCH_JSON:{{\"engine\":\"ultralytics-inference\",\"preprocess_ms\":{avg_pre:.3},\"inference_ms\":{avg_inf:.3},\"postprocess_ms\":{avg_post:.3},\"e2e_ms\":{avg_e2e:.3},\"fps\":{avg_fps:.3},\"n\":{result_count},\"batch\":{batch_size},\"imgsz_h\":{},\"imgsz_w\":{}}}",
        last_inference_shape.0, last_inference_shape.1
    );

    if let Some(ref dir) = save_dir {
        println!("Results saved to {}", dir.display());
    }
}

fn resolve_model_path(args: &PredictArgs) -> (String, bool) {
    let model_is_default = args.model.is_none();
    let model_path = args
        .model
        .clone()
        .unwrap_or_else(|| args.task.unwrap_or(Task::Detect).default_model());
    (model_path, model_is_default)
}

fn parse_device_arg(device: Option<&str>) -> Result<Option<ultralytics_inference::Device>, String> {
    device
        .map(|d| d.parse().map_err(|e| format!("Invalid device '{d}': {e}")))
        .transpose()
}

fn build_inference_config(
    args: &PredictArgs,
    device: Option<ultralytics_inference::Device>,
) -> Result<InferenceConfig, String> {
    let mut config = InferenceConfig::new()
        .with_confidence(args.conf)
        .with_iou(args.iou)
        .with_batch(args.batch as usize)
        .with_half(args.half)
        .with_save_frames(args.save_frames)
        .with_rect(args.rect)
        .with_max_det(args.max_det)
        .with_cuda_preprocess(true)
        .with_save(args.save);

    if let Some(quantize) = args.quantize {
        config = config.with_quantize(quantize);
    } else if args.half {
        config = config.with_quantize(Quantization::Fp16);
    }

    if let Some(sz) = args.imgsz {
        config = config.with_imgsz(sz, sz);
    }
    if let Some(d) = device {
        config = config.with_device(d);
    }
    if let Some(classes_str) = &args.classes {
        let classes = ultralytics_inference::cli::args::parse_classes(classes_str)
            .map_err(|e| format!("Error parsing classes: {e}"))?;
        if !classes.is_empty() {
            config = config.with_classes(classes);
        }
    }
    Ok(config)
}

const fn default_source_urls(task: Task) -> &'static [&'static str] {
    match task {
        Task::Obb => DEFAULT_OBB_IMAGES,
        _ => ultralytics_inference::download::DEFAULT_IMAGES,
    }
}

const fn precision_label(quantize: Option<Quantization>) -> &'static str {
    match quantize {
        Some(Quantization::Int8) => "INT8",
        Some(Quantization::Fp16) => "FP16",
        Some(Quantization::Fp32) | None => "FP32",
        Some(Quantization::W8a16) => "W8A16",
        Some(Quantization::W8a32) => "W8A32",
    }
}

fn provider_label(provider: &str) -> &'static str {
    let provider = provider.to_ascii_lowercase();
    if provider.contains("coreml") {
        "CoreML"
    } else if provider.contains("cuda") {
        "CUDA"
    } else if provider.contains("tensorrt") {
        "TensorRT"
    } else if provider.contains("directml") {
        "DirectML"
    } else if provider.contains("rocm") {
        "ROCm"
    } else if provider.contains("openvino") {
        "OpenVINO"
    } else {
        "CPU"
    }
}

fn semantic_output_stem(image_path: &str, frame_idx: usize, total_frames: Option<usize>) -> String {
    let base_stem = Path::new(image_path)
        .file_stem()
        .map_or_else(|| "frame".to_owned(), |s| s.to_string_lossy().into_owned());
    if total_frames == Some(1) {
        base_stem
    } else {
        format!("{base_stem}_{frame_idx:06}")
    }
}
