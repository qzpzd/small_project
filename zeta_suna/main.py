# main.py
from utils.kafka_handler import KafkaFittingHandler
from Fitting.test.fitting_test_file_copy import kafka_run

def custom_callback(message: dict) -> bool:
    try:
        # 这里可以添加业务逻辑
        kafka_run(message)
        return True
    except Exception as e:
        print(f"处理失败: {str(e)}")
        return False

if __name__ == "__main__":
    handler = KafkaFittingHandler(
        callback=custom_callback,
        group_id="my-group2"  # 可按需修改
    )
    
    # 使用上下文管理器自动管理连接
    with handler:
        handler.start_listening()