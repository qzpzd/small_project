//! 依次跑官方全部任务（detect / segment / pose / obb / classify / semantic / depth）。
//!
//! ```bash
//! cargo run --release --example all_tasks
//! ```
//!
//! 每个模型首次 TensorRT 引擎构建可能要 30s–数分钟，缓存写在 `.trt_cache/`。

fn main() -> Result<(), Box<dyn std::error::Error>> {
    for task in rustinfer::ALL_TASKS {
        let model = rustinfer::default_model_for_task(task);
        println!("======== {task}  {model} ========");
        rustinfer::run_task_example(model)?;
        println!();
    }
    Ok(())
}
