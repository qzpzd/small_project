from kafka import KafkaConsumer, KafkaProducer
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from Fitting.test.fitting_test_file_copy import kafka_run
from log.logger import setup_logging, get_logger

setup_logging()
logger = get_logger(__name__)
logger.info("程序启动")
print(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# 配置 Kafka 消费者
consumer = KafkaConsumer(
    "fitting",  # 替换为你要监听的 Kafka 主题
    bootstrap_servers=["10.10.104.51:9092"],  # 替换为你的 Kafka 服务器地址
    auto_offset_reset="earliest",  # 从最早的消息开始消费
    # enable_auto_commit=False,
    group_id="my-group2",  # 消费者组 ID
)

# 配置 Kafka 生产者，用于发送确认消息
producer = KafkaProducer(
    bootstrap_servers=["10.10.104.51:9092"]  # 替换为你的 Kafka 服务器地址
)

try:
    # 开始监听消息
    for message in consumer:
        received_message = message.value.decode("utf-8")
        logger.info(f"收到消息: {received_message}")

        # 运行本地程序（这里以执行系统命令为例）
        try:
            received_message = {
                "filePath": "\\data\\dms-nas\\poc\\klarf\\output\\201A60085-6寸\\201A60085-SNZ6785-6寸-全测-19#2抽一\\000014-3-69.xyz",
                "fileType": "xyz",
                "fitting": True,
                "lineFitting": True,
                "lineFittingInfo": {
                    "autoMode": False,
                    "conicInfo": {
                        "conic_start": -3.5,
                        "conic_end": -1.9,
                        "conic_step": 1,
                    },
                    "fParams": {
                        "A10": 0,
                        "A12": 0,
                        "A4": 0,
                        "A24": 0,
                        "A14": 0,
                        "A6": 0,
                        "A26": 0,
                        "A16": 0,
                        "A8": 0,
                        "A28": 0,
                        "A18": 0,
                        "A20": 0,
                    },
                    "rocInfo": {
                        "roc_start": 1191,
                        "roc_step": 1,
                        "roc_end": 1390,
                    },
                    "selectPv": False,
                    "selectX": False,
                    "selectY": False,
                    "xData": [],
                    "yData": [{"name": "Y2", "value": 435}],
                },
                "productId": "201A60085",
                "saveDir": "\\data\\dms-nas\\poc\\klarf\\output\\fitting\\201A60085",
            }
            kafka_run(received_message)
        except Exception as e:
            logger.error("本地程序执行出错:", e.stderr)

        # 发送确认消息
        confirmation_message = f"确认收到消息: {received_message}"
        producer.send("FITTING_STATE_MESSAGE", confirmation_message.encode("utf-8"))
        producer.flush()
        logger.info("确认消息已发送")

except KeyboardInterrupt:
    logger.info("停止监听...")
finally:
    # 关闭消费者和生产者
    consumer.close()
    producer.close()
