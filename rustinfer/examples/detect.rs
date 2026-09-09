//! 检测：yolo26n.onnx + TensorRT + GPU 预处理
//!
//! ```bash
//! cargo run --release --example detect
//! cargo run --release --example detect -- path/to/image.jpg
//! ```

fn main() -> Result<(), Box<dyn std::error::Error>> {
    rustinfer::run_task_example("yolo26n.onnx")
}
