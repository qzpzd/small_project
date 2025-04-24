import re
import json
import os
import cProfile
from ..api.fitting.fitting import Fitting 
from ..tools.profile import Timer, profile
from utils.config import get_server_info
from utils.log import logging
from datetime import datetime
from ..tools.find_filedir_xz_yz import find_filedir_xzyz

logger = logging.getLogger(__name__)

def load_config(config_path):
    """Load configuration from a JSON file."""
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
    return config

def build_kafka_infos(config):
    """直接使用驼峰式键名"""
    lineFittingInfo = config.get('line_fitting_info', {})
    conicInfo = lineFittingInfo.get('conic_info', {})
    rocInfo = lineFittingInfo.get('roc_info', {})
    fParams = lineFittingInfo.get('f_params', {})
    
    # 动态收集所有有效A系数
    a_coefficients = {
        k: v for k, v in fParams.items()
        if re.match(r'^A\d+$', k)  # 严格匹配A+数字格式
    }
    # 从 lineFittingInfo 提取数据
    xData = {item['name']: item['value'] for item in lineFittingInfo.get('x_data', [])}
    yData = {item['name']: item['value'] for item in lineFittingInfo.get('y_data', [])}

    return {
        # 文件参数
        'inputDir': config.get('file_path', "/data/hym/output/201A60052-E5A002J4N-全测6寸四抽一-整片-16#/000079-5-73.xyz"),
        "folderPath": config.get('folder_path'),
        'outputDir': config.get('save_dir', get_server_info()["filepath"]),
        "outputPath" : config.get('output_dir'),
        'fileType': config.get('file_type', "xyz"),
        "productId": config.get('material_sn'),
        "waferId": config.get('wafer_id'),
        "auto": config.get('auto'),
        "ruleId": config.get('rule_id'),
        "yieldUpdate": config.get('yield_update'),

        # 选择参数
        'enableFitting': int(config.get('fitting', True)),
        'lineFitting': int(config.get('line_fitting', True)),
        'ifSelectX': int(lineFittingInfo.get('select_x', False)),
        'ifSelectY': int(lineFittingInfo.get('select_y', False)),
        "selectPv": int(lineFittingInfo.get('select_pv', False)),
        "isauto": int(lineFittingInfo.get('auto_mode', False)),
        "levelPercent" :lineFittingInfo.get('level_percent', 0.1),
        "rocoffset": int(lineFittingInfo.get('roc_offset', 100)),
        "roc_flag": int(lineFittingInfo.get('roc_flag', 0)),

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

def kafka_run(config,count):
    kafka_infos = build_kafka_infos(config)
    fit=Fitting(kafka_infos,count) 
    if kafka_infos['enableFitting'] == 1:
        # with Timer():
            # if config.get('auto')==2 and config.get('yield_update')==1:
            #     respvalue = fit.run_copy()
            # else:
            respvalue = fit.run()          
                
    return respvalue

def generate_error_response(e):
    return {
        "status": 'error',
        "message": f"Exception type: {type(e).__name__}, info: {e}"
    }
    
def process_config(config,count):
    logger = logging.getLogger(__name__)
    auto = config.get('auto')
    yield_update = config.get('yield_update')
    filePath = config.get('file_path')
    folderPath = config.get('folder_path')
    outputPath = config.get('output_dir')
    
    
    now = datetime.now()
    global timestamp
    timestamp = now.strftime("%Y%m%d%H%M%S")  # 按照年月日时分秒的格式生成时间戳字符串
        
    if auto==1:
        # 单个文件地址
        try:
            respvalue = kafka_run(config,count)
        except Exception as e:
            logger.error(f"处理单个文件 {filePath} 时出错: {e}")
        return respvalue
    elif auto==2:
        # count = 0
        new_config = config.copy()
        if yield_update==0:
            count = 0
            file_ext = folderPath[0].split('.')[-1].lower()
            if file_ext == 'xyz':
                new_config['file_type'] = 'xyz'
            elif file_ext == 'csv':
                new_config['file_type'] = 'csv'
            files = folderPath 
        elif yield_update==1:
            count = 0
            new_config['file_type'] = 'xyz'
            if outputPath and not os.path.exists(outputPath):
                e = FileNotFoundError(f"Directory {outputPath} does not exist")
                resp = generate_error_response(e)
                logger.error(resp["message"])
                return resp
            try:
                files = find_filedir_xzyz(outputPath)
            except Exception as e:
                logger.error(f"Error finding xzyz: {str(e)}")
                return generate_error_response(e)
           
        # 文件列表       
        for file in files:
            count+=1
            new_config['file_path'] = file
            try:
                respvalue = kafka_run(new_config,count)
            except Exception as e:
                logger.error(f"处理文件 {file} 时出错: {e}")
        return respvalue
    else:
        logger.error("配置中既没有 'filePath' 也没有 'folderPath'")
        return None
