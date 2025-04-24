
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))
sys.path.append('D:/project/fulltest-yield-platform-algo')
import re
import os
import json
from Fitting.api.fitting.fitting import Fitting 
from Fitting.tools.profile import Timer, profile
from utils.config import get_server_info

# @profile
def load_config(config_path):
    """Load configuration from a JSON file."""
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
    return config

def build_kafka_infos(input,config):
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
        'inputDir': input,
        "folderPath": config.get('folderPath', []),
        'outputDir': config.get('saveDir', get_server_info()["filepath"]),
        'fileType': config.get('fileType', "xyz"),
        "productId": config.get('productId',"201A60052"),
        "waferId": config.get('waferId',"E5A002J4N"),
        "auto": config.get('auto',True),
        "ruleId": config.get('ruleId','52'),
        "yieldUpdate": config.get('yieldUpdate',0),

        # 选择参数
        'enableFitting': int(config.get('fitting', True)),
        'lineFitting': int(config.get('lineFitting', True)),
        'ifSelectX': int(lineFittingInfo.get('selectX', False)),
        'ifSelectY': int(lineFittingInfo.get('selectY', False)),
        "selectPv": int(lineFittingInfo.get('selectPv', False)),
        "isauto": int(lineFittingInfo.get('autoMode', False)),
        "levelPercent" :lineFittingInfo.get('levelPercent', 0.1),
        "rocoffset": int(lineFittingInfo.get('rocoffset', 100)),

        # 曲率半径参数
        'rocStart': rocInfo.get('roc_start', 745),
        'rocEnd': rocInfo.get('roc_end', 946),
        'rocStep': rocInfo.get('roc_step', 1),

        # 二次曲线参数
        'conicStart': conicInfo.get('conic_start', -3.5),
        'conicEnd': conicInfo.get('conic_end', -1.9),
        'conicStep': conicInfo.get('conic_step', 0.1),

        # 尺寸参数
        'dX1': xData.get('X1', 388),
        'dX2': xData.get('X2', None),
        'dY1': yData.get('Y1', None),
        'dY2': yData.get('Y2', None),

        # 拟合参数
        'aCoefficients': a_coefficients,
    }
# @profile5
def testmain():
    try:
        if kafka_infos['enableFitting'] == 1:
            fit.run()
    except Exception as e:
        print(f"执行过程中发生错误: {e}")

def find_all_xyz_files(folder_path):
    return [
        os.path.join(root, file)
        for root, _, files in os.walk(folder_path)
        for file in files
        if file.endswith('.xyz')
    ]

if __name__ == '__main__':
    input_floder = r'C:\Users\EDY\Desktop\zetasuna\data'
    all_files = find_all_xyz_files(input_floder)
    config = load_config(r'D:\project\fulltest-yield-platform-algo\hyps\kafka_config.json')
    
    with Timer():
        for input in all_files:
            kafka_infos = build_kafka_infos(input,config)           
            fit=Fitting(kafka_infos)
        
            with Timer():
                testmain()
    