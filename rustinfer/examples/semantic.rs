//! 语义分割（仅 YOLO26）：yolo26n-sem.onnx + TensorRT + GPU 预处理

fn main() -> Result<(), Box<dyn std::error::Error>> {
    rustinfer::run_task_example("yolo26n-sem.onnx")
}
