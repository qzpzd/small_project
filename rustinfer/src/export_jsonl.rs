//! 将每帧检测与耗时导出为 JSONL，供摄像头/视频会话事后单独分析。

use std::fs::OpenOptions;
use std::io::Write;
use std::path::{Path, PathBuf};

use ultralytics_inference::results::Results;
use ultralytics_inference::source::SourceMeta;

/// 追加写入 `frames.jsonl`（一行一帧，无 serde 依赖）。
pub struct FrameJsonlWriter {
    path: PathBuf,
    file: std::fs::File,
}

impl FrameJsonlWriter {
    pub fn create(save_dir: &Path) -> std::io::Result<Self> {
        std::fs::create_dir_all(save_dir)?;
        let path = save_dir.join("frames.jsonl");
        let file = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(&path)?;
        Ok(Self { path, file })
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    pub fn write_frame(
        &mut self,
        meta: &SourceMeta,
        result: &Results,
        source_kind: &str,
    ) -> std::io::Result<()> {
        let pre = result.speed.preprocess.unwrap_or(0.0);
        let infer = result.speed.inference.unwrap_or(0.0);
        let post = result.speed.postprocess.unwrap_or(0.0);
        let e2e = result.speed.total();
        let fps = if e2e > 1e-9 { 1000.0 / e2e } else { 0.0 };
        let shape = result.inference_shape();

        let mut dets = String::from("[");
        if let Some(boxes) = &result.boxes {
            let xyxy = boxes.xyxy();
            let n = boxes.len();
            for i in 0..n {
                if i > 0 {
                    dets.push(',');
                }
                let cls = boxes.cls()[i] as usize;
                let name = result
                    .names
                    .get(&cls)
                    .map(|s| s.as_str())
                    .unwrap_or("unknown");
                let b = xyxy.row(i);
                dets.push_str(&format!(
                    "{{\"cls\":{cls},\"name\":\"{}\",\"conf\":{:.4},\"xyxy\":[{:.1},{:.1},{:.1},{:.1}]}}",
                    escape_json(name),
                    boxes.conf()[i],
                    b[0],
                    b[1],
                    b[2],
                    b[3]
                ));
            }
        }
        dets.push(']');

        let line = format!(
            "{{\"frame_idx\":{},\"path\":\"{}\",\"source\":\"{}\",\"summary\":\"{}\",\
\"imgsz\":[{},{}],\"speed\":{{\"preprocess_ms\":{:.3},\"inference_ms\":{:.3},\
\"postprocess_ms\":{:.3},\"e2e_ms\":{:.3},\"fps\":{:.3}}},\"detections\":{dets}}}\n",
            meta.frame_idx,
            escape_json(&meta.path),
            escape_json(source_kind),
            escape_json(&result.detection_summary()),
            shape.0,
            shape.1,
            pre,
            infer,
            post,
            e2e,
            fps
        );
        self.file.write_all(line.as_bytes())?;
        Ok(())
    }

    pub fn flush(&mut self) -> std::io::Result<()> {
        self.file.flush()
    }
}

fn escape_json(s: &str) -> String {
    s.replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "\\n")
        .replace('\r', "\\r")
}
