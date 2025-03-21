import logging
from logging.config import fileConfig
from pathlib import Path

def setup_logging():
    # 创建日志目录
    log_dir = Path(__file__).parent.parent / "log"
    log_dir.mkdir(exist_ok=True)
    
    # 读取配置文件
    config_file = Path(__file__).parent / "logging.conf"
    fileConfig(config_file)
    
    # 测试日志
    root_logger = logging.getLogger()
    root_logger.info("="*50)
    root_logger.info("日志系统初始化完成")
    root_logger.info(f"日志文件路径: {(log_dir / 'application.log').absolute()}")

def get_logger(name):
    return logging.getLogger(name)