#!/usr/bin/env python
# -*- coding:utf-8 -*-
# @Company:  Zeta Tech
# @Author:   Ben Qi
# @Datetime: 2025/03/022
# @Description: kafuka Consumer and Producer

import sys
from confluent_kafka import Consumer, Producer
import json
from pathlib import Path
# import logging
from utils.log import logging, configure_logging
import signal

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from utils.config import get_server_info  # noqa
from utils.common import load_config


class KafkaConsumerProducer:
    def __init__(self, bootstrap_servers=None, request_topic=None, response_topic=None,max_poll_interval_ms=600000):
        self.logger = logging.getLogger(__name__)
        self.default_info = get_server_info()["kafka"]
        self.bootstrap_servers = self.default_info["bootstrap_servers"] if bootstrap_servers is None else bootstrap_servers  # noqa: E501
        self.request_topic = self.default_info["request_topic"] if request_topic is None else request_topic
        self.request_topic = self.request_topic if type(self.request_topic) is list else [self.request_topic]
        self.group_id = self.default_info["group_id"]
        self.response_topic = self.default_info["response_topic"] if response_topic is None else response_topic
        self.consumer = None
        self.producer = None
        self.bulid_consumer()
        self.bulid_producter()
        self.redy_exit = False
        signal.signal(signal.SIGTERM, self.handle_signal)
        signal.signal(signal.SIGINT, self.handle_signal)

        self.count = 0
         
    def bulid_consumer(self):
        # 创建消费者
        self.consumer = Consumer({
            'bootstrap.servers': self.bootstrap_servers,
            'group.id': self.group_id,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': True
        })
        self.logger.info("Create consumer over.")

        # 订阅消费者主题
        self.consumer.subscribe(self.request_topic)
        self.logger.info("Successfully subscribed to consumer theme.")

    def bulid_producter(self):
        # 创建 Kafka 生产者实例
        self.producer = Producer({'bootstrap.servers': self.bootstrap_servers})
        self.logger.info("Create producer over.")

    def handle_signal(self, signum, frame):
        """handle signal"""
        if signum == signal.SIGTERM or signum == signal.SIGINT:
            self.logger.info("Service ready to exit.")
            self.redy_exit = True

    def consume_messages(self, consumer, algorithm_func):
        try:
            if not callable(algorithm_func):  # noqa
                raise Exception("Algorithm func is not callable!")
            while True:
                if self.redy_exit:
                    self.logger.info("Service exit.")
                    break
                msg = consumer.poll(1.0)
                if msg is None:
                    continue
                if msg.error():
                    self.logger.error("Error while consuming message:", msg.error())
                else:
                    self.logger.info('-' * 20 + "Received message over." + '-' * 20)
                    
                    # 修改后
                    raw_value = msg.value()
                    if not raw_value:
                        self.logger.error("Received empty message value")
                        continue  # 跳过无效消息

                    try:
                        decoded_value = raw_value
                    except UnicodeDecodeError as e:
                        self.logger.error(f"Decode error: {e}, raw bytes: {raw_value.hex()}")
                        continue

                    try:
                        # print(decoded_value)
                        msg_value = json.loads(decoded_value)
                    except json.JSONDecodeError as e:
                        self.logger.error(f"JSON parse error: {e}, raw string: {decoded_value[:200]}...")  # 截断避免日志过长
                        continue
                    self.logger.info(f"收到信息: {msg_value}")  # noqa: E501msg_value")
                    # 获取消息
                    # msg_value = json.loads(msg.value().decode('utf-8'))
                    # 算法推理
                    # msg_value = load_config(r'hyps/kafka_config.json')
                    try:
                        self.count += 1  # 接收到消息时计数加一
                        resp_value = algorithm_func(msg_value,self.count)
                        
                        if resp_value is not None:
                            self.logger.info(f"返回信息: {resp_value}")
                            # 推理结果发送到kafka
                            self.produce_message(msg=resp_value)
                            
                    except Exception as e: 
                        self.logger.error("Algorithm inference Error: %s", str(e))     
                        # self.logger.error("Algorithm inference Error:", e)
                        # continue  # 算法推理出现错误时，跳过当前消息，继续下一个消息
        except Exception as e:
            self.logger.error("Consumer message Error:", e)
    
        finally:
            consumer.close()

    def produce_message(self, msg=None):
        """
        发送消息到指定的Kafka主题
        :param msg: 消息的内容
        :return:
        """
        if msg is not None:
            try:
                self.producer.produce(self.response_topic, value=json.dumps(msg).encode("utf-8"))
                # 等待消息被发送，flush() 方法将消息刷新到 Kafka 服务器
                self.producer.flush()  # 确保消息被发送
                self.logger.info("Algorithm inference message to kafka successful.")
            except Exception as e:
                self.logger.error("Algorithm inference message to kafka Error:", e)
        else:
            self.logger.info("Algorithm inference message is None.")

    def run(self, algorithm_func):
        # 消费消息并生产结果消息
        self.consume_messages(self.consumer, algorithm_func)


    