//! 标注结果保存：图片直接写盘；视频优先走系统 `ffmpeg` 管道（libx264），
//! 避免 vcpkg 默认 FFmpeg 未编进 x264 时 `video-rs` 报 Invalid argument。

use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, Command, Stdio};

use image::DynamicImage;
use ultralytics_inference::source::SourceMeta;

/// 保存推理标注结果（图片 / 视频 / 逐帧回退）。
pub struct AnnotatedSaver {
    save_dir: PathBuf,
    save_frames: bool,
    video: Option<FfmpegPipeWriter>,
    force_frames: bool,
    warned_fallback: bool,
}

impl AnnotatedSaver {
    pub fn new(save_dir: PathBuf, save_frames: bool) -> Self {
        let _ = std::fs::create_dir_all(&save_dir);
        Self {
            save_dir,
            save_frames,
            video: None,
            force_frames: false,
            warned_fallback: false,
        }
    }

    pub fn save(
        &mut self,
        is_video: bool,
        meta: &SourceMeta,
        annotated: &DynamicImage,
    ) -> Result<(), String> {
        let save_as_video = is_video && !self.save_frames && !self.force_frames;

        if save_as_video {
            if self.video.is_none() {
                match FfmpegPipeWriter::open(&self.save_dir, meta, annotated) {
                    Ok(w) => {
                        eprintln!(
                            "INFO 💾 视频写出使用系统 ffmpeg → {}",
                            w.output_path.display()
                        );
                        self.video = Some(w);
                    }
                    Err(e) => {
                        self.warn_fallback(&e);
                        self.force_frames = true;
                        return self.save_image_frame(is_video, meta, annotated);
                    }
                }
            }

            if let Some(writer) = self.video.as_mut() {
                if let Err(e) = writer.write_frame(annotated) {
                    if let Some(w) = self.video.take() {
                        let _ = w.finish();
                    }
                    self.warn_fallback(&e);
                    self.force_frames = true;
                    return self.save_image_frame(is_video, meta, annotated);
                }
            }
            return Ok(());
        }

        self.save_image_frame(is_video, meta, annotated)
    }

    pub fn finish(mut self) -> Result<(), String> {
        if let Some(writer) = self.video.take() {
            writer.finish()?;
        }
        Ok(())
    }

    fn warn_fallback(&mut self, err: &str) {
        if !self.warned_fallback {
            eprintln!(
                "WARNING ⚠️  无法创建视频编码器（{err}）。\
                 已回退为逐帧 JPG。若需 mp4：把带 libx264 的 ffmpeg 加入 PATH（如 D:\\soft\\ffmpeg\\bin），\
                 或 vcpkg 安装带 x264 的 ffmpeg。"
            );
            self.warned_fallback = true;
        }
    }

    fn save_image_frame(
        &self,
        is_video: bool,
        meta: &SourceMeta,
        annotated: &DynamicImage,
    ) -> Result<(), String> {
        let (dir, filename) = if is_video {
            let video_stem = Path::new(&meta.path)
                .file_stem()
                .unwrap_or_default()
                .to_string_lossy();
            let frames_dir = self.save_dir.join(format!("{video_stem}_frames"));
            let filename = format!("{video_stem}_{}.jpg", meta.frame_idx + 1);
            (frames_dir, filename)
        } else {
            let filename = Path::new(&meta.path)
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            (self.save_dir.clone(), filename)
        };

        std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        let path = dir.join(filename);
        annotated
            .save(&path)
            .map_err(|e| format!("Failed to save image {}: {e}", path.display()))
    }
}

struct FfmpegPipeWriter {
    child: Option<Child>,
    stdin: Option<ChildStdin>,
    output_path: PathBuf,
    width: u32,
    height: u32,
}

impl FfmpegPipeWriter {
    fn open(save_dir: &Path, meta: &SourceMeta, frame: &DynamicImage) -> Result<Self, String> {
        let ffmpeg = find_ffmpeg().ok_or_else(|| {
            "未找到 ffmpeg 可执行文件（请把 D:\\soft\\ffmpeg\\bin 加入 PATH）".to_string()
        })?;

        let filename = Path::new(&meta.path)
            .file_name()
            .unwrap_or_default()
            .to_string_lossy();
        let output_name = Path::new(filename.as_ref())
            .with_extension("mp4")
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        let output_path = save_dir.join(output_name);
        std::fs::create_dir_all(save_dir).map_err(|e| e.to_string())?;

        let width = frame.width();
        let height = frame.height();
        let enc_w = width & !1;
        let enc_h = height & !1;
        if enc_w == 0 || enc_h == 0 {
            return Err(format!("invalid frame size {width}x{height}"));
        }

        let fps = meta.fps.unwrap_or(30.0).clamp(1.0, 120.0);
        let fps_str = format!("{fps:.3}");
        let size = format!("{enc_w}x{enc_h}");

        let mut child = Command::new(&ffmpeg)
            .args([
                "-y",
                "-loglevel",
                "error",
                "-f",
                "rawvideo",
                "-pix_fmt",
                "rgb24",
                "-s",
                &size,
                "-r",
                &fps_str,
                "-i",
                "-",
                "-an",
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-crf",
                "23",
                "-pix_fmt",
                "yuv420p",
                "-movflags",
                "+faststart",
            ])
            .arg(&output_path)
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("spawn ffmpeg failed ({}): {e}", ffmpeg.display()))?;

        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| "ffmpeg stdin unavailable".to_string())?;

        Ok(Self {
            child: Some(child),
            stdin: Some(stdin),
            output_path,
            width: enc_w,
            height: enc_h,
        })
    }

    fn write_frame(&mut self, frame: &DynamicImage) -> Result<(), String> {
        let stdin = self
            .stdin
            .as_mut()
            .ok_or_else(|| "ffmpeg stdin already closed".to_string())?;
        let rgb = frame.to_rgb8();
        let (w, h) = rgb.dimensions();
        let enc_w = self.width;
        let enc_h = self.height;
        if w < enc_w || h < enc_h {
            return Err(format!(
                "frame {w}x{h} smaller than encoder {enc_w}x{enc_h}"
            ));
        }

        if w == enc_w && h == enc_h {
            stdin
                .write_all(rgb.as_raw())
                .map_err(|e| format!("ffmpeg pipe write failed: {e}"))?;
        } else {
            let mut buf = Vec::with_capacity((enc_w * enc_h * 3) as usize);
            for y in 0..enc_h {
                let row_start = ((y * w) * 3) as usize;
                let row_end = row_start + (enc_w * 3) as usize;
                buf.extend_from_slice(&rgb.as_raw()[row_start..row_end]);
            }
            stdin
                .write_all(&buf)
                .map_err(|e| format!("ffmpeg pipe write failed: {e}"))?;
        }
        Ok(())
    }

    fn finish(mut self) -> Result<(), String> {
        drop(self.stdin.take());
        let Some(mut child) = self.child.take() else {
            return Ok(());
        };
        let mut stderr = child.stderr.take();
        let status = child
            .wait()
            .map_err(|e| format!("wait ffmpeg failed: {e}"))?;
        if !status.success() {
            let mut err = String::new();
            if let Some(ref mut s) = stderr {
                let _ = s.read_to_string(&mut err);
            }
            let code = status.code().unwrap_or(-1);
            return Err(format!(
                "ffmpeg exited with code {code} (output {}): {err}",
                self.output_path.display()
            ));
        }
        Ok(())
    }
}

impl Drop for FfmpegPipeWriter {
    fn drop(&mut self) {
        drop(self.stdin.take());
        if let Some(mut child) = self.child.take() {
            let _ = child.wait();
        }
    }
}

fn find_ffmpeg() -> Option<PathBuf> {
    if let Ok(path) = which_ffmpeg() {
        return Some(path);
    }
    [
        // Windows
        r"D:\soft\ffmpeg\bin\ffmpeg.exe",
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\ProgramData\chocolatey\bin\ffmpeg.exe",
        // Linux / Jetson
        "/usr/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
    ]
    .into_iter()
    .map(PathBuf::from)
    .find(|p| p.is_file())
}

fn which_ffmpeg() -> Result<PathBuf, ()> {
    #[cfg(windows)]
    {
        let output = Command::new("where.exe")
            .arg("ffmpeg")
            .output()
            .map_err(|_| ())?;
        if !output.status.success() {
            return Err(());
        }
        let text = String::from_utf8_lossy(&output.stdout);
        for line in text.lines() {
            let p = PathBuf::from(line.trim());
            if p.is_file() {
                return Ok(p);
            }
        }
        Err(())
    }
    #[cfg(not(windows))]
    {
        let output = Command::new("sh")
            .args(["-c", "command -v ffmpeg"])
            .output()
            .map_err(|_| ())?;
        if !output.status.success() {
            return Err(());
        }
        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let p = PathBuf::from(path);
        if p.is_file() {
            Ok(p)
        } else {
            Err(())
        }
    }
}
