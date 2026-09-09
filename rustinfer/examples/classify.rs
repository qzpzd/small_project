//! 分类：yolo26n-cls.onnx + TensorRT
//! 分类走 center-crop，官方文档说明 cuda-preprocess 快路径不覆盖 classify。

fn main() -> Result<(), Box<dyn std::error::Error>> {
    rustinfer::run_task_example("yolo26n-cls.onnx")
}
