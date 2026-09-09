//! rustinfer HTTP API：图片 / 视频 / 摄像头 / 单帧流式推理。
//!
//! 启动：`cargo run --release --bin rustinfer-api`
//! 环境变量：RUSTINFER_MODEL、RUSTINFER_DEVICE、RUSTINFER_API_HOST、RUSTINFER_API_PORT

use std::io::Cursor;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;

use axum::extract::{DefaultBodyLimit, Multipart, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use base64::Engine as _;
use image::DynamicImage;
use serde::{Deserialize, Serialize};
use tower_http::cors::CorsLayer;
use ultralytics_inference::source::Source;

use rustinfer::engine::{InferEngine, InferOptions};
use rustinfer::result_json::FrameResultJson;

#[derive(Clone)]
struct AppState {
    engine: Arc<InferEngine>,
}

#[derive(Serialize)]
struct HealthResponse {
    ok: bool,
    model: String,
    device: String,
    version: String,
}

#[derive(Serialize)]
struct PredictResponse {
    ok: bool,
    model: String,
    device: String,
    frames: Vec<FrameResultJson>,
    n: usize,
}

#[derive(Deserialize)]
struct ImageJsonRequest {
    image_b64: String,
    #[serde(default = "default_conf")]
    conf: f32,
    #[serde(default = "default_true")]
    return_image: bool,
}

#[derive(Deserialize)]
struct CameraRequest {
    #[serde(default)]
    index: u32,
    #[serde(default = "default_conf")]
    conf: f32,
    #[serde(default = "default_max_frames")]
    max_frames: usize,
    #[serde(default = "default_true")]
    return_image: bool,
}

#[derive(Deserialize)]
struct PathRequest {
    path: String,
    #[serde(default = "default_conf")]
    conf: f32,
    #[serde(default = "default_true")]
    return_image: bool,
    max_frames: Option<usize>,
}

fn default_conf() -> f32 {
    0.25
}
fn default_true() -> bool {
    true
}
fn default_max_frames() -> usize {
    60
}

#[tokio::main]
async fn main() {
    let model = std::env::var("RUSTINFER_MODEL").unwrap_or_else(|_| "yolo26n.onnx".into());
    let device = std::env::var("RUSTINFER_DEVICE").unwrap_or_else(|_| "tensorrt:0".into());
    let host = std::env::var("RUSTINFER_API_HOST").unwrap_or_else(|_| "127.0.0.1".into());
    let port: u16 = std::env::var("RUSTINFER_API_PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(8790);

    eprintln!("rustinfer-api loading model={model} device={device} ...");
    let engine = InferEngine::load(&model, &device).unwrap_or_else(|e| {
        eprintln!("ERROR load model: {e}");
        std::process::exit(1);
    });
    if let Err(e) = engine.warmup() {
        eprintln!("WARNING warmup: {e}");
    }
    eprintln!("rustinfer-api ready");

    let state = AppState {
        engine: Arc::new(engine),
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/v1/health", get(health))
        .route("/v1/predict/image", post(predict_image_multipart))
        .route("/v1/predict/image/json", post(predict_image_json))
        .route("/v1/predict/frame", post(predict_image_multipart))
        .route("/v1/predict/video", post(predict_video_multipart))
        .route("/v1/predict/path", post(predict_path))
        .route("/v1/predict/camera", post(predict_camera))
        .layer(DefaultBodyLimit::max(512 * 1024 * 1024))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr: SocketAddr = format!("{host}:{port}").parse().expect("invalid bind addr");
    eprintln!("listening on http://{addr}");
    let listener = tokio::net::TcpListener::bind(addr).await.expect("bind");
    axum::serve(listener, app).await.expect("serve");
}

async fn health(State(state): State<AppState>) -> Json<HealthResponse> {
    Json(HealthResponse {
        ok: true,
        model: state.engine.model_path.clone(),
        device: state.engine.device.clone(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

async fn predict_image_multipart(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<PredictResponse>, ApiError> {
    let mut bytes: Option<Vec<u8>> = None;
    let mut conf = 0.25f32;
    let mut return_image = true;
    let mut filename = "upload.jpg".to_string();

    while let Some(field) = multipart.next_field().await.map_err(ApiError::bad)? {
        let name = field.name().unwrap_or("").to_string();
        match name.as_str() {
            "file" | "image" | "frame" => {
                if let Some(fname) = field.file_name() {
                    filename = fname.to_string();
                }
                bytes = Some(field.bytes().await.map_err(ApiError::bad)?.to_vec());
            }
            "conf" => {
                conf = field
                    .text()
                    .await
                    .ok()
                    .and_then(|t| t.parse().ok())
                    .unwrap_or(0.25);
            }
            "return_image" => {
                return_image = field
                    .text()
                    .await
                    .ok()
                    .map(|t| matches!(t.as_str(), "1" | "true" | "True" | "yes"))
                    .unwrap_or(true);
            }
            _ => {}
        }
    }

    let bytes = bytes.ok_or_else(|| ApiError::bad_msg("missing file field"))?;
    let image = decode_image(&bytes)?;
    let opts = InferOptions {
        conf,
        return_image,
        max_frames: None,
    };
    let frame = state
        .engine
        .predict_image(&image, &filename, "image", &opts)
        .map_err(ApiError::bad_msg)?;
    Ok(ok_frames(state, vec![frame]))
}

async fn predict_image_json(
    State(state): State<AppState>,
    Json(req): Json<ImageJsonRequest>,
) -> Result<Json<PredictResponse>, ApiError> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(req.image_b64.trim())
        .map_err(|e| ApiError::bad_msg(e.to_string()))?;
    let image = decode_image(&bytes)?;
    let opts = InferOptions {
        conf: req.conf,
        return_image: req.return_image,
        max_frames: None,
    };
    let frame = state
        .engine
        .predict_image(&image, "image.jpg", "image", &opts)
        .map_err(ApiError::bad_msg)?;
    Ok(ok_frames(state, vec![frame]))
}

async fn predict_video_multipart(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<PredictResponse>, ApiError> {
    let mut bytes: Option<Vec<u8>> = None;
    let mut conf = 0.25f32;
    let mut return_image = false;
    let mut max_frames: Option<usize> = None;
    let mut filename = "upload.mp4".to_string();

    while let Some(field) = multipart.next_field().await.map_err(ApiError::bad)? {
        let name = field.name().unwrap_or("").to_string();
        match name.as_str() {
            "file" | "video" => {
                if let Some(fname) = field.file_name() {
                    filename = fname.to_string();
                }
                bytes = Some(field.bytes().await.map_err(ApiError::bad)?.to_vec());
            }
            "conf" => {
                conf = field
                    .text()
                    .await
                    .ok()
                    .and_then(|t| t.parse().ok())
                    .unwrap_or(0.25);
            }
            "return_image" => {
                return_image = field
                    .text()
                    .await
                    .ok()
                    .map(|t| matches!(t.as_str(), "1" | "true" | "True" | "yes"))
                    .unwrap_or(false);
            }
            "max_frames" => {
                max_frames = field.text().await.ok().and_then(|t| t.parse().ok());
            }
            _ => {}
        }
    }

    let bytes = bytes.ok_or_else(|| ApiError::bad_msg("missing video file"))?;
    let tmp_dir = std::env::temp_dir().join(format!("rustinfer_api_{}", std::process::id()));
    std::fs::create_dir_all(&tmp_dir).map_err(ApiError::bad)?;
    let path = tmp_dir.join(&filename);
    std::fs::write(&path, &bytes).map_err(ApiError::bad)?;

    let opts = InferOptions {
        conf,
        return_image,
        max_frames,
    };
    let source = Source::from(path.as_path());
    let frames = state
        .engine
        .predict_source(source, "video", &opts)
        .map_err(ApiError::bad_msg)?;
    let _ = std::fs::remove_file(&path);
    Ok(ok_frames(state, frames))
}

async fn predict_path(
    State(state): State<AppState>,
    Json(req): Json<PathRequest>,
) -> Result<Json<PredictResponse>, ApiError> {
    let path = PathBuf::from(&req.path);
    if !path.exists() {
        return Err(ApiError::bad_msg(format!("path not found: {}", req.path)));
    }
    let opts = InferOptions {
        conf: req.conf,
        return_image: req.return_image,
        max_frames: req.max_frames,
    };
    let kind = if path
        .extension()
        .and_then(|e| e.to_str())
        .is_some_and(|e| matches!(e.to_ascii_lowercase().as_str(), "mp4" | "avi" | "mkv" | "mov"))
    {
        "video"
    } else {
        "image"
    };
    let source = Source::from(path.as_path());
    let frames = state
        .engine
        .predict_source(source, kind, &opts)
        .map_err(ApiError::bad_msg)?;
    Ok(ok_frames(state, frames))
}

async fn predict_camera(
    State(state): State<AppState>,
    Json(req): Json<CameraRequest>,
) -> Result<Json<PredictResponse>, ApiError> {
    let opts = InferOptions {
        conf: req.conf,
        return_image: req.return_image,
        max_frames: Some(req.max_frames.max(1)),
    };
    let source = Source::from(req.index);
    let frames = state
        .engine
        .predict_source(source, "webcam", &opts)
        .map_err(|e| {
            ApiError::bad_msg(format!(
                "{e}; Windows 上 DirectShow 通常不能用 video=0，请改用 Python 客户端本机采集：\
                 `python python/rustinfer_client.py camera --index 0` 或 `stream --index 0`"
            ))
        })?;
    if frames.is_empty() {
        return Err(ApiError::bad_msg(
            "webcam returned 0 frames; on Windows prefer client-side camera/stream instead of /v1/predict/camera",
        ));
    }
    Ok(ok_frames(state, frames))
}

fn ok_frames(state: AppState, frames: Vec<FrameResultJson>) -> Json<PredictResponse> {
    let n = frames.len();
    Json(PredictResponse {
        ok: true,
        model: state.engine.model_path.clone(),
        device: state.engine.device.clone(),
        frames,
        n,
    })
}

fn decode_image(bytes: &[u8]) -> Result<DynamicImage, ApiError> {
    image::load_from_memory(bytes)
        .or_else(|_| {
            // JPEG fallback via Cursor
            image::ImageReader::new(Cursor::new(bytes))
                .with_guessed_format()
                .map_err(|e| e.to_string())?
                .decode()
                .map_err(|e| e.to_string())
        })
        .map_err(ApiError::bad_msg)
}

struct ApiError {
    status: StatusCode,
    message: String,
}

impl ApiError {
    fn bad<E: std::fmt::Display>(e: E) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            message: e.to_string(),
        }
    }
    fn bad_msg(msg: impl Into<String>) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            message: msg.into(),
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> axum::response::Response {
        (
            self.status,
            Json(serde_json::json!({ "ok": false, "error": self.message })),
        )
            .into_response()
    }
}
