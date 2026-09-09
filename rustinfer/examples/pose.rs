//! 姿态估计：yolo26n-pose.onnx + TensorRT + GPU 预处理

fn main() -> Result<(), Box<dyn std::error::Error>> {
    rustinfer::run_task_example("yolo26n-pose.onnx")
}
