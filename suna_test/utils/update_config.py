# import os
# import sys
# sys.path.append(r"D:\project\fulltest-yield-platform-algo\Fitting\tools")
from . import configuration
from utils.log import logging
import inspect

logger = logging.getLogger("FULL_test")


# def update_model_configuration(options):
#     if isinstance(options, dict):
#         for (key, ty, default) in configuration.__options__:
#             val = options.get(key, None)
#             if val is None:
#                 # 重置设置默认值
#                 configuration.__dict__[key] = default
#                 continue
#             val = parse_type(val, ty, default)
#             configuration.__dict__[key] = val
#             logger.info(f"solver configuration: {key} is set to {val}")
            
# def update_model_configuration(options):
    # if isinstance(options, dict):
    #     for key, ty, default in configuration.__options__:
    #         parts = key.split('.')
    #         nested_options = options
    #         for part in parts[:-1]:
    #             nested_options = nested_options.get(part, {})
    #         val = nested_options.get(parts[-1], None)

    #         if val is None:
    #             # 重置设置默认值
    #             configuration.__dict__[key.replace('.', '_')] = default
    #             logger.info(f"solver configuration: {key} is set to default value {default}")
    #             continue

    #         val = parse_type(val, ty, default)
    #         configuration.__dict__[key.replace('.', '_')] = val
    #         logger.info(f"solver configuration: {key} is set to {val}")
            
def update_model_configuration(options):
    if isinstance(options, dict):
        for key, ty, default in configuration.__options__:
            parts = key.split('.')
            nested_options = options
            for part in parts[:-1]:
                nested_options = nested_options.get(part, {})
            val = nested_options.get(parts[-1], None)

            if val is None:
                # 重置设置默认值
                setattr(configuration, key.replace('.', '_'), default)
                logger.info(f"solver configuration: {key} is set to default value {default}")
                continue

            val = parse_type(val, ty, default)
            setattr(configuration, key.replace('.', '_'), val)
            logger.info(f"solver configuration: {key} is set to {val}")
def parse_type(v, t, default):
    if t == bool:
        if isinstance(v, str):
            if v.lower() in ["false", "no", "off"]:
                return False
            elif v.lower() in ["true", "yes", "on"]:
                return True
            else:
                return default
        if isinstance(v, int):
            return bool(v)
        if isinstance(v, bool):
            return v
        try:
            return bool(v)
        except TypeError as e:
            return default
    elif t == int:
        try:
            return int(v)
        except TypeError as e:
            return default
    elif t == str:
        try:
            return str(v)
        except TypeError as e:
            return default
    elif t == str:
        try:
            return str(v)
        except TypeError as e:
            return default
    try:
        return t(v)
    except TypeError as e:
        return default
    
def save_configuration():
    config_file_path = inspect.getfile(configuration)
    lines = []
    # 读取原始配置文件内容
    with open(config_file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    # 查找 __options__ 之前的行
    options_index = next((i for i, line in enumerate(lines) if '__options__' in line), None)
    if options_index is None:
        print("未找到 __options__ 定义")
        return

    # 生成新的配置行
    new_lines = []
    for key, ty, default in configuration.__options__:
        attr_name = key.replace('.', '_')
        attr_value = getattr(configuration, attr_name)
        comment = next((line for line in lines if key in line and '#' in line), '').strip()
        if comment:
            new_lines.append(f"{attr_name} = {attr_value}  # {comment.split('#')[1].strip()}\n")
        else:
            new_lines.append(f"{attr_name} = {attr_value}\n")

    # 插入新的配置行
    new_content = lines[:options_index] + new_lines + lines[options_index:]

    # 写入更新后的配置文件
    with open(config_file_path, 'w', encoding='utf-8') as file:
        file.writelines(new_content)
