# kafka_handler.py
import json
from kafka import KafkaConsumer, KafkaProducer
from typing import Callable, Optional
from log.logger import setup_logging, get_logger

class KafkaFittingHandler:
    def __init__(
        self,
        bootstrap_servers: list = ["10.10.104.51:9092"],
        consume_topic: str = "fitting",
        produce_topic: str = "FITTING_STATE_MESSAGE",
        group_id: str = "my-group2",
        callback: Optional[Callable[[dict], bool]] = None
    ):
        setup_logging()
        self.logger = get_logger(__name__)
        
        self.bootstrap_servers = bootstrap_servers
        self.consume_topic = consume_topic
        self.produce_topic = produce_topic
        self.group_id = group_id
        self.callback = callback

        self.consumer = KafkaConsumer(
            self.consume_topic,
            bootstrap_servers=self.bootstrap_servers,
            auto_offset_reset="earliest",
            group_id=self.group_id,
            value_deserializer=lambda x: x.decode('utf-8')
        )

        self.producer = KafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda x: x.encode('utf-8')
        )

    def start_listening(self):
        """开始监听消息的主循环"""
        self.logger.info("启动 Kafka 监听服务")
        try:
            for message in self.consumer:
                try:
                    # msg_value = message.value
                    # msg_value = json.loads(message.value)
                    #---------------------先设置默认消息-------------------
                    msg_value = {
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
                            "xData": [{"name": "X1", "value": 480}],
                            "yData": [{"name": "Y1", "value": 435}],
                        },
                        "productId": "201A60085",
                        "saveDir": "\\data\\dms-nas\\poc\\klarf\\output\\fitting\\201A60085",
                    }
                    self.logger.info(f"收到原始消息: {msg_value}")

                    # 如果注册了回调函数
                    if self.callback:
                        success = self.callback(msg_value)
                        if success:
                            self._send_confirmation(msg_value)
                except Exception as e:
                    self.logger.error(f"消息处理失败: {str(e)}")
        except KeyboardInterrupt:
            self.logger.info("主动停止监听")
        finally:
            self.close()

    def _send_confirmation(self, original_msg: dict):
        """发送确认消息"""
        confirmation = f"成功处理消息: {original_msg}"
        self.producer.send(self.produce_topic, value=confirmation)
        self.logger.info("已发送处理确认")

    def close(self):
        """关闭连接"""
        self.consumer.close()
        self.producer.close()
        self.logger.info("Kafka 连接已关闭")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()