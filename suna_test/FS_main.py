#!/usr/bin/env python
# -*- coding:utf-8 -*-
# @Company:  Zeta Tech
# @Author:   Ben Qi
# @Datetime: 2025/3/22
# @Description: FS main

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from utils.log import logging, configure_logging  # noqa: E402
from Fitting.test.fitting_test_file_copy import kafka_run,process_config
from utils.kafka import KafkaConsumerProducer  # noqa: E402

# 更新model配置项
from utils.load_config import load_config_default
from utils.update_config import update_model_configuration,save_configuration
from pathlib import Path

    
def main():
    try:
        # 调用kafka监听
        consumer_producer = KafkaConsumerProducer(request_topic="fitting2", response_topic="FITTING_STATE_MESSAGE")
        consumer_producer.run(algorithm_func=process_config)
        
    except Exception as e:
        logger.error(f"主函数异常: {e}")
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)

if __name__ == "__main__":
    # 日志打印
    configure_logging()
    logger = logging.getLogger(__name__)

    # 更改默认参数
    current_script_path = Path(__file__).resolve()
    root_dir = current_script_path.parents[0]
    CONFIG = load_config_default(root_dir)
    update_model_configuration(CONFIG)
    
    logger.info('=' * 20 + "ADC Start" + '=' * 20)
    # 任务开始
    main()

