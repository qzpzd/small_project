//! 将 `Results` 序列化为 API / JSONL 共用的结构化数据。

use serde::Serialize;
use ultralytics_inference::results::Results;

#[derive(Debug, Clone, Serialize)]
pub struct SpeedJson {
    pub preprocess_ms: f64,
    pub inference_ms: f64,
    pub postprocess_ms: f64,
    pub e2e_ms: f64,
    pub fps: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct DetectionJson {
    pub cls: usize,
    pub name: String,
    pub conf: f32,
    pub xyxy: [f32; 4],
}

#[derive(Debug, Clone, Serialize)]
pub struct FrameResultJson {
    pub frame_idx: usize,
    pub path: String,
    pub source: String,
    pub summary: String,
    pub imgsz: [u32; 2],
    pub speed: SpeedJson,
    pub detections: Vec<DetectionJson>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_b64: Option<String>,
}

impl SpeedJson {
    pub fn from_result(result: &Results) -> Self {
        let pre = result.speed.preprocess.unwrap_or(0.0);
        let infer = result.speed.inference.unwrap_or(0.0);
        let post = result.speed.postprocess.unwrap_or(0.0);
        let e2e = result.speed.total();
        let fps = if e2e > 1e-9 { 1000.0 / e2e } else { 0.0 };
        Self {
            preprocess_ms: pre,
            inference_ms: infer,
            postprocess_ms: post,
            e2e_ms: e2e,
            fps,
        }
    }
}

pub fn detections_from_result(result: &Results) -> Vec<DetectionJson> {
    let mut out = Vec::new();
    if let Some(boxes) = &result.boxes {
        let xyxy = boxes.xyxy();
        for i in 0..boxes.len() {
            let cls = boxes.cls()[i] as usize;
            let name = result
                .names
                .get(&cls)
                .cloned()
                .unwrap_or_else(|| "unknown".into());
            let b = xyxy.row(i);
            out.push(DetectionJson {
                cls,
                name,
                conf: boxes.conf()[i],
                xyxy: [b[0], b[1], b[2], b[3]],
            });
        }
    }
    out
}

pub fn frame_from_result(
    result: &Results,
    frame_idx: usize,
    path: impl Into<String>,
    source: impl Into<String>,
    image_b64: Option<String>,
) -> FrameResultJson {
    let shape = result.inference_shape();
    FrameResultJson {
        frame_idx,
        path: path.into(),
        source: source.into(),
        summary: result.detection_summary(),
        imgsz: [shape.0, shape.1],
        speed: SpeedJson::from_result(result),
        detections: detections_from_result(result),
        image_b64,
    }
}
