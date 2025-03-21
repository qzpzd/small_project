import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from log.logger import setup_logging,get_logger
from api.fitting.fitting import Fitting
# from api.fitting.fitting_copy import Fitting
from api.yield_rate_calculation.yield_rate_calculation import YieldRateCalculator
from api.sampling_inspection.sampling_inspection import SamplingInspection  
from tools.profile import Timer, profile
# @profile
def load_config(config_path):
    """Load configuration from a JSON file."""
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
    return config

def build_kafka_infos(input,config):
    """Build kafka infos dictionary from the loaded configuration."""
    
    line_fitting_info = config.get('line_fitting_info', {})
    conic_info = line_fitting_info.get('conic_info', {})
    roc_info = line_fitting_info.get('roc_info', {})
    f_params = line_fitting_info.get('f_params', {})
    auto_mode = line_fitting_info.get('auto_mode', {})

    # 从 line_fitting_info 中提取 x_data 和 y_data
    x_data = {item['name']: item['value'] for item in line_fitting_info.get('x_data', [])}
    y_data = {item['name']: item['value'] for item in line_fitting_info.get('y_data', [])}

    kafka_infos = {
        # 文件参数
        'input_dir': input,
        'output_dir': config.get('save_dir'),
        'file_type': config.get('file_type'),
        "product_id": config.get('product_id'),
        "product_size": config.get('product_size', 76),

        # 选择参数 (0-不选择 1-选择)
        'enable_yield_rate_calculation': 0,
        'enable_sampling_inspection': 0,
        "enable_fitting": config.get('fitting', 1),
        "line_fitting": config.get('line_fitting', 0),
        'ifselectx': line_fitting_info.get('select_x', 1),
        'ifselecty': line_fitting_info.get('select_y', 1),
        "rotate_percent": line_fitting_info.get("rotate_percent", "0.30"),
        "select_pv": line_fitting_info.get("select_pv", 1),
        'levelpercent': 0.1,  # 水平百分比
        'rocoffset':100,

        # 自动模式设置 (0-手动 1-自动)
        'isauto': auto_mode.get('isauto', 0),

        # 曲率半径相关参数
        'roc_start': roc_info.get('roc_start', 1191),
        'roc_end': roc_info.get('roc_end', 1392),
        'roc_step': roc_info.get('roc_step', 1),  # 注意这里应该是 'roc_step' 而不是 'rocstep'

        # 二次曲线常数设置
        'conic_start': conic_info.get('conic_start', -3.5),
        'conic_end': conic_info.get('conic_end', -1.9),
        'conic_step': conic_info.get('conic_step', 0.1),  # 注意这里应该是 'conic_step' 而不是 'step2'

        # 尺寸参数 (单位：mm)
        'd_x1': x_data.get('X1', 480),
        'd_x2': x_data.get('X2', 435),
        'd_y1': y_data.get('Y1', 480),
        'd_y2': y_data.get('Y2', None),  # 如果 Y2 不存在，默认为 None

        # 拟合参数
        'A4': f_params.get('A4', 0),
        'A6': f_params.get('A6', 0),
        'A8': f_params.get('A8', 0),
        'A10': f_params.get('A10', 0),
        'A12': f_params.get('A12', 0),
        'A14': f_params.get('A14', 0),
        'A16': f_params.get('A16', 0),
    }
    return kafka_infos
# @profile
def testmain():
    try:
        if kafka_infos['enable_fitting'] == 1:
            fit.run()
        if kafka_infos['enable_yield_rate_calculation'] == 1:
            yrc.run()
        if kafka_infos['enable_sampling_inspection'] == 1:
            si.run()
    except Exception as e:
        print(f"执行过程中发生错误: {e}")

def find_all_xyz_files(folder_path):
    return [
        os.path.join(root, file)
        for root, _, files in os.walk(folder_path)
        for file in files
        if file.endswith('.xyz')
    ]
def handle_xyz_file(file_path):
    # print(file_path)
    kafka_infos = build_kafka_infos(file_path)
    fit=Fitting(kafka_infos)
    yrc=YieldRateCalculator(kafka_infos['input_dir'],kafka_infos['output_dir'])
    si=SamplingInspection(kafka_infos['input_dir'],kafka_infos['output_dir'])
    if kafka_infos['enable_fitting'] == 1:
        with Timer():
            fit.run()
    if kafka_infos['enable_yield_rate_calculation'] == 1:
        yrc.run()
    if kafka_infos['enable_sampling_inspection'] == 1:
        si.run()
    return None
if __name__ == '__main__':
    setup_logging()
    # 获取当前模块的logger
    logger = get_logger(__name__)
    logger.info("程序启动")
    input_floder = r'Fitting\test\input_data\xyz_data'
    all_files = find_all_xyz_files(input_floder)
    # print(all_files)
    config = load_config(r'D:\project\fulltest-yield-platform-algo\hyps\kafka_config.json')
    
    with Timer():
        for input in all_files:
            # print(all_files)
            kafka_infos = build_kafka_infos(input,config) 
            # print(kafka_infos)          
            fit=Fitting(kafka_infos)
            yrc=YieldRateCalculator(kafka_infos['input_dir'],kafka_infos['output_dir'])
            si=SamplingInspection(kafka_infos['input_dir'],kafka_infos['output_dir'])
        
            with Timer():
                testmain()
    ##############################################################
    # import dask.bag as db
    # from dask.distributed import Client
        
    # # 启动本地客户端
    # client = Client()

    # # 创建一个 Dask Bag 来处理所有文件
    # bag = db.from_sequence(all_files)

    # # 应用自定义函数到每个文件上
    # processed_bag = bag.map(handle_xyz_file)

    # # 计算结果
    # results = processed_bag.compute()

    # # 关闭客户端
    # client.close()
    ############################################################
    

