import os
import configparser
import yaml
from .log import logging
# def load_config_default(ROOT_DIR):
#     CONFIG = configparser.ConfigParser()
#     # 先读defualt
#     # CONFIG.read(os.path.join(ROOT_DIR, "./hyps/default.yml"))
#     CONFIG.read(os.path.join(ROOT_DIR, "./hyps/default.yml"))
#     # config覆盖defualt
#     if os.path.isfile(os.path.join(ROOT_DIR, "./hyps/server.yml", encoding='utf-8')):
#         CONFIG.read(os.path.join(ROOT_DIR, "./hyps/server.yml", encoding='utf-8'))
#     return CONFIG
logger = logging.getLogger(__name__)

def load_config_default(root_dir):
    config = {}
    # 先读取 default.yml
    default_config_path = os.path.join(root_dir, "./hyps/default.yml")
    try:
        with open(default_config_path, 'r', encoding='utf-8') as file:
            config = yaml.safe_load(file)
    except FileNotFoundError:
        logger.error(f"未找到 default.yml 文件: {default_config_path}")
    except Exception as e:
        logger.error(f"读取 default.yml 文件时出错: {e}")

    # 读取 server.yml 并覆盖 default.yml 的配置
    server_config_path = os.path.join(root_dir, "./hyps/server.yml")
    if os.path.isfile(server_config_path):
        try:
            with open(server_config_path, 'r', encoding='utf-8') as file:
                server_config = yaml.safe_load(file)
                # 合并配置，使用 server.yml 的配置覆盖 default.yml 的配置
                if server_config:
                    config.update(server_config)
        except Exception as e:
            logger.error(f"读取 server.yml 文件时出错: {e}")

    return config