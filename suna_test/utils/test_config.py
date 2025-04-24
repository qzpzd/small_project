import logging

# 假设这是 configuration.py 文件中的内容
class Configuration:
    USE_RANDOM_NUMBER_NINE = False  # 九抽一是否使用随机数
    UNDER_WAFER_ADD_MAX_NUMBER = True  # 下片加上上片最大行数

    # 根据算法内部需求添加配置参数
    __options__ = (("USE_RANDOM_NUMBER_NINE", bool, True),
                   ("UNDER_WAFER_ADD_MAX_NUMBER", bool, True),)

configuration = Configuration()
logger = logging.getLogger(__name__)

def parse_type(val, ty, default):
    try:
        return ty(val)
    except (ValueError, TypeError):
        return default

def update_model_configuration(options):
    if isinstance(options, dict):
        for (key, ty, default) in configuration.__options__:
            val = options.get(key, None)
            if val is None:
                # 重置设置默认值
                configuration.__dict__[key] = default
                continue
            val = parse_type(val, ty, default)
            configuration.__dict__[key] = val
            logger.info(f"solver configuration: {key} is set to {val}")

# 示例调用
options = {
    "USE_RANDOM_NUMBER_NINE": True
}
update_model_configuration(options)

print(configuration.USE_RANDOM_NUMBER_NINE)
print(configuration.UNDER_WAFER_ADD_MAX_NUMBER)