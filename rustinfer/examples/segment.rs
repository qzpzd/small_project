//! 实例分割：yolo26n-seg.onnx + TensorRT + GPU 预处理

fn main() -> Result<(), Box<dyn std::error::Error>> {
    rustinfer::run_task_example("yolo26n-seg.onnx")
}
