import sys
import os
import re
import json
import argparse
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from log.logger import setup_logging,get_logger
from api.fitting.fitting import Fitting 
from tools.profile import Timer, profile


def load_config(config_path):
    """Load configuration from a JSON file."""
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
    return config

def build_kafka_infos(config):
    """直接使用驼峰式键名"""
    lineFittingInfo = config.get('lineFittingInfo', {})
    conicInfo = lineFittingInfo.get('conicInfo', {})
    rocInfo = lineFittingInfo.get('rocInfo', {})
    fParams = lineFittingInfo.get('fParams', {})
    
    # 动态收集所有有效A系数
    a_coefficients = {
        k: v for k, v in fParams.items()
        if re.match(r'^A\d+$', k)  # 严格匹配A+数字格式
    }
    # 从 lineFittingInfo 提取数据
    xData = {item['name']: item['value'] for item in lineFittingInfo.get('xData', [])}
    yData = {item['name']: item['value'] for item in lineFittingInfo.get('yData', [])}

    return {
        # 文件参数
        'inputDir': "D:/project/fulltest-yield-platform-algo/Fitting/test/input_data/xyz_data/000033-3-96.xyz",#config.get('filePath', ""),
        'outputDir': "D:/project/fulltest-yield-platform-algo/Fitting/test/out_data/xyz",#config.get('saveDir', ""),
        'fileType': config.get('fileType', "xyz"),
        "productId": config.get('productId'),

        # 选择参数
        'enableFitting': int(config.get('fitting', True)),
        'lineFitting': int(config.get('lineFitting', True)),
        'ifSelectX': int(lineFittingInfo.get('selectX', False)),
        'ifSelectY': int(lineFittingInfo.get('selectY', False)),
        "selectPv": int(lineFittingInfo.get('selectPv', False)),
        "isauto": int(lineFittingInfo.get('isauto', False)),
        "levelPercent" :int(lineFittingInfo.get('levelPercent', False)),

        # 曲率半径参数
        'rocStart': rocInfo.get('roc_start', 1191),
        'rocEnd': rocInfo.get('roc_end', 1392),
        'rocStep': rocInfo.get('roc_step', 1),

        # 二次曲线参数
        'conicStart': conicInfo.get('conic_start', -3.5),
        'conicEnd': conicInfo.get('conic_end', -1.9),
        'conicStep': conicInfo.get('conic_step', 0.1),

        # 尺寸参数
        'dX1': xData.get('X1', 480),
        'dX2': xData.get('X2', 435),
        'dY1': yData.get('Y1', 480),
        'dY2': yData.get('Y2', None),

        # 拟合参数
        'aCoefficients': a_coefficients,
    }
# @profile
def testmain():
    try:
        if kafka_infos['enableFitting'] == 1:
            fit.run()
    except Exception as e:
        print(f"执行过程中发生错误: {e}")


if __name__ == '__main__':
    # setup_logging()
    # # 获取当前模块的logger
    # logger = get_logger(__name__)
    # logger.info("程序启动")

    config = load_config(r'D:\project\fulltest-yield-platform-algo\hyps\kafka_config.json')
    kafka_infos = build_kafka_infos(config)
    fit=Fitting(kafka_infos)
       
    with Timer():
        testmain()
       