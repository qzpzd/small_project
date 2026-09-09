//! 深度估计（仅 YOLO26）：yolo26n-depth.onnx + TensorRT + GPU 预处理

fn main() -> Result<(), Box<dyn std::error::Error>> {
    rustinfer::run_task_example("yolo26n-depth.onnx")
}
