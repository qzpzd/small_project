//! 进程内共享 YOLO 引擎（API 多请求复用同一模型）。

use std::path::{Path, PathBuf};
use std::str::FromStr;
use std::sync::Mutex;

use image::DynamicImage;
use ultralytics_inference::annotate::annotate_image;
use ultralytics_inference::download::try_download_model;
use ultralytics_inference::source::{Source, SourceIterator};
use ultralytics_inference::{Device, InferenceConfig, Quantization, Results, YOLOModel};

use crate::result_json::{frame_from_result, FrameResultJson};
use crate::timing_overlay::overlay_speed;

pub struct InferEngine {
    model: Mutex<YOLOModel>,
    pub model_path: String,
    pub device: String,
}

#[derive(Clone, Debug)]
pub struct InferOptions {
    /// 对外过滤置信度（模型内部以较低阈值推理，再在此过滤）。
    pub conf: f32,
    pub return_image: bool,
    pub max_frames: Option<usize>,
}

impl Default for InferOptions {
    fn default() -> Self {
        Self {
            conf: 0.25,
            return_image: true,
            max_frames: None,
        }
    }
}

impl InferEngine {
    pub fn load(model: &str, device: &str) -> Result<Self, String> {
        let path = resolve_model_path(model)?;
        let device_parsed = Device::from_str(device).map_err(|e| e.to_string())?;
        // 内部阈值放低，请求级 conf 在结果上过滤
        let config = InferenceConfig::new()
            .with_device(device_parsed)
            .with_confidence(0.01)
            .with_quantize(Quantization::Fp16)
            .with_cuda_preprocess(true)
            .with_save(false);
        let model = YOLOModel::load_with_config(&path, config).map_err(|e| e.to_string())?;
        Ok(Self {
            model: Mutex::new(model),
            model_path: path.display().to_string(),
            device: device.to_string(),
        })
    }

    pub fn warmup(&self) -> Result<(), String> {
        let mut m = self.model.lock().map_err(|e| e.to_string())?;
        m.warmup().map_err(|e| e.to_string())
    }

    pub fn predict_image(
        &self,
        image: &DynamicImage,
        path: &str,
        source: &str,
        opts: &InferOptions,
    ) -> Result<FrameResultJson, String> {
        let mut m = self.model.lock().map_err(|e| e.to_string())?;
        let results = m
            .predict_image(image, path.to_string())
            .map_err(|e| e.to_string())?;
        let Some(result) = results.first() else {
            return Err("empty results".into());
        };
        Ok(finalize_frame(result, image, 0, path, source, opts)?)
    }

    pub fn predict_source(
        &self,
        source: Source,
        source_kind: &str,
        opts: &InferOptions,
    ) -> Result<Vec<FrameResultJson>, String> {
        let mut m = self.model.lock().map_err(|e| e.to_string())?;
        let iter = SourceIterator::new(source).map_err(|e| e.to_string())?;
        let mut frames = Vec::new();
        let limit = opts.max_frames.unwrap_or(usize::MAX);

        for item in iter {
            if frames.len() >= limit {
                break;
            }
            let (img, meta) = item.map_err(|e| e.to_string())?;
            let results = m
                .predict_image(&img, meta.path.clone())
                .map_err(|e| e.to_string())?;
            for result in &results {
                frames.push(finalize_frame(
                    result,
                    &img,
                    meta.frame_idx,
                    &meta.path,
                    source_kind,
                    opts,
                )?);
                if frames.len() >= limit {
                    break;
                }
            }
        }
        Ok(frames)
    }
}

fn finalize_frame(
    result: &Results,
    image: &DynamicImage,
    frame_idx: usize,
    path: &str,
    source: &str,
    opts: &InferOptions,
) -> Result<FrameResultJson, String> {
    let mut frame = frame_from_result(result, frame_idx, path, source, None);
    frame.detections.retain(|d| d.conf >= opts.conf);
    frame.summary = format!("{} objects", frame.detections.len());
    if opts.return_image {
        frame.image_b64 = Some(encode_annotated(image, result)?);
    }
    Ok(frame)
}

fn encode_annotated(image: &DynamicImage, result: &Results) -> Result<String, String> {
    use base64::Engine as _;
    let annotated = annotate_image(image, result, None);
    let with_timing = overlay_speed(&annotated, &result.speed);
    let mut buf = Vec::new();
    let mut cursor = std::io::Cursor::new(&mut buf);
    with_timing
        .write_to(&mut cursor, image::ImageFormat::Jpeg)
        .map_err(|e| e.to_string())?;
    Ok(base64::engine::general_purpose::STANDARD.encode(buf))
}

fn resolve_model_path(model: &str) -> Result<PathBuf, String> {
    let p = Path::new(model);
    if p.exists() {
        return Ok(p.to_path_buf());
    }
    try_download_model(model).map_err(|e| e.to_string())
}
