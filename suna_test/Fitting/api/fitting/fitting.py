import gc
import matplotlib.pyplot as plt
import numpy as np
import time
import weakref
import os
import xlwt
import xlrd
import pandas as pd
from concurrent.futures import ThreadPoolExecutor
import concurrent.futures
from matplotlib.figure import Figure
from functools import wraps
from tqdm import tqdm
import sys
from .fitting_rotate import rotate3, rotate31
from ...tools import convertxyz_to_float_lists, convertcsv_to_float_lists, get_csv_row_col_info, get_xyz_row_col_info,delete_csv_files_in_parent_dir,scanxz
# 添加 data_preprocess 目录到 sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data_preprocess')))
from data_preprocess import PreprocessData

from utils.log import logging, configure_logging  # noqa: E402
import csv
from pathlib import Path

# matplotlib.interactive(True)
# matplotlib.use('agg')

class Fitting():
    
    def __init__(self, kafka_infos,count):
        # 初始化日志
        self.logger = logging.getLogger(__name__)
        # 初始化核心参数
        self.kafka_infos = kafka_infos
        self.auto = self.kafka_infos['auto']
        self.isauto = self.kafka_infos['isauto']
        self.file_path = self.kafka_infos['inputDir']
        self.folder_path = self.kafka_infos['folderPath']
        self.file_type = self.kafka_infos['fileType']
        self.output_path = self.kafka_infos['outputDir']
        self.output_dir = self.kafka_infos['outputPath']
        self.product_id = self.kafka_infos['productId']
        self.wafer_id = self.kafka_infos['waferId']
        self.levelpercent = self.kafka_infos['levelPercent']
        self.rocoffset = self.kafka_infos['rocoffset']
        self.roc_step = self.kafka_infos['rocStep']
        self.roc_start = self.kafka_infos['rocStart']
        self.roc_end = self.kafka_infos['rocEnd']
        self.conic_start = self.kafka_infos['conicStart']
        self.conic_step = self.kafka_infos['conicStep']
        self.conic_end = self.kafka_infos['conicEnd']
        self.ruleId = self.kafka_infos['ruleId']
        self.yieldUpdate = self.kafka_infos['yieldUpdate']
        self.roc_flag = self.kafka_infos['roc_flag']
        self.count = count
                       
        # 获取容器 ID
        self.container_id = os.environ.get('HOSTNAME')
        if self.auto==2: 
            if self.yieldUpdate == 0:#手动进行新计算
                self.new_output_dir = self.output_dir
            elif self.yieldUpdate == 1:#手动更新历史
                self.new_output_dir = os.path.join(self.output_dir,os.path.basename(os.path.dirname(os.path.dirname(self.file_path[0]))))
        elif self.auto==1:
            self.new_output_dir = os.path.join(self.output_dir,os.path.basename(os.path.dirname(os.path.dirname(self.file_path))))

        # 如果目录不存在则创建
        if not os.path.exists(self.new_output_dir):
            os.makedirs(self.new_output_dir, exist_ok=True)

        # 动态收集所有A系数并按数字排序
        self.coefficients = sorted(
            [(int(k[1:]), v) for k, v in self.kafka_infos['aCoefficients'].items() 
            if k.startswith('A') and k[1:].isdigit()],
            key=lambda x: x[0]
        )
        # 创建系数缩放因子字典
        self.scale_factors = {
            num: 10 ** (-12 - 6*(num//2 - 2)) for num, _ in self.coefficients
        }
        
        self.return_dict = {
                "output_dir": self.output_dir,
                "material_sn": self.product_id,
                "wafer_id": self.wafer_id,
                "auto": self.auto,
                "rule_id":self.ruleId,
                "yield_update": self.yieldUpdate,
                "status": None,
                "message": None,
                "roc_flag": self.roc_flag
            }
        # 初始化一行数据模板：包含固定列和 A 系数
        self.row_template = {
                '序号': self.count,
                '文件名': 'NA',
                'row_s': 'NA',
                'column_s': 'NA',
                '起始ROC': self.roc_start,
                '终止ROC': self.roc_end,
                'ROC步进': self.roc_step,
                '起始Conic': self.conic_start,
                '终止Conic': self.conic_end,
                'Conic步进': self.conic_step,
                **{f'A{num}': value for num, value in self.coefficients}
            }
    def run(self):
        self.logger.info(f"开始处理文件: {self.file_path}")
        status = "success"
        message = ""
        try:

            # 第一次并行计算：处理数据文件的格式.xyz转化为.xz
            self.selectx= self.kafka_infos['dX1'] or self.kafka_infos['dX2']
            self.selecty= self.kafka_infos['dY1'] or self.kafka_infos['dY2']

            start_time = time.time()
            self.logger.info("数据转化中······")

            if self.file_type == 'xyz':
                if self.auto==2 and self.yieldUpdate == 1:
                   
                    for file in self.file_path:
                        if file.endswith('.xz'):
                            x,xz = scanxz(file) 
                        elif file.endswith('.yz'):
                            y,yz = scanxz(file) 
                else:
                    x,xz,y,yz = self.preprocess_xyz_files(self.file_path, self.new_output_dir)
                    x,xz,y,yz = convertxyz_to_float_lists(x, xz, y, yz)

            elif self.file_type == 'csv':
                x,xz = self.preprocess_csv_files(self.file_path, self.new_output_dir)
                x,xz = convertcsv_to_float_lists(x, xz)

            self.logger.info(f"数据转化用时：{time.time() - start_time:.2f} s")

            # 第二次并行计算：对处理过后的数据文件进行计算
            start_time = time.time()
            self.logger.info("数据拟合中······")
            ifselect_values = [self.kafka_infos['dX1'], self.kafka_infos['dX2'], self.kafka_infos['dY1'], self.kafka_infos['dY2']]
            # 必须有一个为 true
            ifselect_flags = [self.kafka_infos['dX1'] is not None, self.kafka_infos['dX2'] is not None, self.kafka_infos['dY1'] is not None, self.kafka_infos['dY2'] is not None]
            msgdict={0:'X1',1:'X2',2:'Y1',3:'Y2'}
            flagid=[index for index,flagvalue in enumerate(ifselect_flags) if flagvalue==1]

            final_results = []            

            if self.file_type == 'xyz':
                if self.auto==2 and self.yieldUpdate == 1:
                    file_name = os.path.basename(self.file_path[0])
                else:
                    file_name = os.path.basename(self.file_path)
                if '-' in file_name:
                    # 文件名包含 '-' 的处理逻辑
                    str_split = file_name.split('-')
                    if len(str_split) == 3:
                        self.row_template['文件名'] = str_split[0]
                        self.row_template['row_s'] = int(str_split[1])
                        self.row_template['column_s'] = int(str_split[2].split('.')[0])
                else:
                    # 文件名不包含 '-' 的处理逻辑
                    file_name_without_ext = os.path.splitext(file_name)[0]
                    self.row_template['文件名'] = file_name_without_ext
                    base_dir = os.path.join(self.output_path, 'quance', 'sequence')
               
                    if '.' in file_name_without_ext:                      
                        parts = file_name_without_ext.split('.')
                        if len(parts) >= 2:
                            # 从 sequence 文件获取行列信息
                            num_seq = int(parts[0])
                            row_seq, col_seq = get_xyz_row_col_info(num_seq, base_dir, 'sequence')
                            if row_seq is not None and col_seq is not None:
                                self.row_template['row_s'] = row_seq
                                self.row_template['column_s'] = col_seq

                            # 从 subsequence 文件获取行列信息
                            num_subseq = int(parts[1])
                            row_subseq, col_subseq = get_xyz_row_col_info(num_subseq, base_dir, 'subsequence')
                            if row_subseq is not None and col_subseq is not None:
                                self.row_template['big_row'] = row_subseq
                                self.row_template['big_column'] = col_subseq
                    else:                    
                        # 从 sequence 文件获取行列信息
                        num_seq = int(file_name_without_ext)
                        row_seq, col_seq = get_xyz_row_col_info(num_seq, base_dir, 'sequence')
                        if row_seq is not None and col_seq is not None:
                            self.row_template['row_s'] = row_seq
                            self.row_template['column_s'] = col_seq
                        

            elif self.file_type == 'csv':
                row, col = get_csv_row_col_info(self.file_path)
                self.row_template['文件名'] = os.path.basename(self.file_path)
                self.row_template['row_s'] = row
                self.row_template['column_s'] = col
                
            # 遍历所有启用的直径，填充动态列
            for flag in flagid:
                self.app_D = ifselect_values[flag]
                axis = msgdict[flag]  # 例如 'X1', 'Y3'
                self.logger.info(f'MSG: 当前拟合直径是{axis}：{self.app_D}')
                
                if self.auto==2 and self.yieldUpdate == 1:
                    file_name = os.path.basename(self.file_path[0])
                else:
                    file_name = os.path.basename(self.file_path)
                    
                if self.auto==2 and self.yieldUpdate == 1:
                    base_name, _ = os.path.splitext(file_name)
                    if flag < 2:
                        x, z = x, xz
                        filename=base_name + '.xz'
                    else:
                        filename=base_name + '.yz'
                        x, z = y, yz  
                else:
                    # # 处理数据并获取四个参数
                    if flag < 2:
                        x, z = x, xz
                        if self.file_type == 'xyz':                    
                            filename = file_name.replace('.xyz', '.xz')
                        elif self.file_type == 'csv':
                            filename = file_name
                    else:
                        if self.file_type == 'xyz':
                            x, z = y, yz                     
                            filename = file_name.replace('.xyz', '.yz')
                        elif self.file_path == 'csv':
                            filename = file_name
                
                # 设置roc手动或者自动
                if self.isauto == 1:
                    while True:
                        x, z = self.cut(x, z, self.app_D)
                        sag = max(z) - min(z)
                        realD = max(x) - min(x)
                        rocauto = sag / 2 + realD * realD / (8 * sag)
                        r1 = rocauto - self.rocoffset
                        s1 = int(self.roc_step)
                        r2 = rocauto + self.rocoffset

                        iflevel = 1 if self.levelpercent != 0 else 0

                        # 调用拟合函数
                        (rocfit, conicfit, minrmsdelta, xdeltar, deltar, x1_plot, y1_plot, x2_plot, y2_plot, maxdeltar, rmsdeltar,
                         maxroc, minroc, maxconic, minconic) = self.fitrocrms4_ho1(
                            x, z, self.app_D, 0,
                            list(np.arange(r1, r2, s1)),
                            list(np.arange(self.conic_start, self.conic_end, self.conic_step)),
                            self.levelpercent, iflevel
                        )
                        #添加roc自动部分自动修改
                        if rocfit == r2:
                            new_offsets = [100, 200, 500, 1000]
                            next_offset = None
                            for offset in new_offsets:
                                if offset > self.rocoffset:
                                    next_offset = offset
                                    break
                            if next_offset is None:
                                self.roc_flag = 1
                                self.return_dict['message'] = "roc is too small and rocoffset is already 1000"
                                self.return_dict['status'] = "success"
                                return self.return_dict
                            else:
                                self.rocoffset = next_offset
                                self.logger.info(f"rocfit == r2, increasing rocoffset to {self.rocoffset}")
                        else:
                            self.roc_flag = 0
                            break

                else:
                    r1 = int(self.roc_start)
                    s1 = int(self.roc_step)
                    r2 = int(self.roc_end)

                    iflevel = 1 if self.levelpercent != 0 else 0

                    # 调用拟合函数
                    (rocfit, conicfit, minrmsdelta, xdeltar, deltar, x1_plot, y1_plot, x2_plot, y2_plot, maxdeltar, rmsdeltar,
                     maxroc, minroc, maxconic, minconic) = self.fitrocrms4_ho1(
                        x, z, self.app_D, 0,
                        list(np.arange(r1, r2, s1)),
                        list(np.arange(self.conic_start, self.conic_end, self.conic_step)),
                        self.levelpercent, iflevel
                    )
                    self.roc_flag = 0
                self.row_template[f'{axis.lower()}'] = self.app_D
                self.row_template[f'best_roc_{axis.lower()}'] = rocfit
                self.row_template[f'best_conic_{axis.lower()}'] = conicfit
                self.row_template[f'best_rms_{axis.lower()}'] = minrmsdelta

                ############################绘图######################################
                image_name2 = f"{filename}-{self.app_D}-deltar.png"
                if filename.endswith('.xz'):
                    self.image_output_dir = os.path.join(self.new_output_dir, 'xz_images')
                elif filename.endswith('.yz'):
                    self.image_output_dir = os.path.join(self.new_output_dir, 'yz_images')
                image_path2 = os.path.join(self.image_output_dir, image_name2)
                os.makedirs(os.path.dirname(image_path2), exist_ok=True)
                
                self.save_plot_2(
                    xdeltar, deltar, self.app_D,
                    rocfit, minroc, maxroc, conicfit, self.conic_start, self.conic_end,
                    maxdeltar, rmsdeltar, iflevel, self.levelpercent,
                    image_path2
                )

            # 将当前文件的数据添加到最终结果
            final_results = [self.row_template]
            self.logger.info(final_results)
            
            if self.auto==2 and self.yieldUpdate == 1:
                delete_csv_files_in_parent_dir(self.file_path[0])
            self.write_csv_fitting(final_results)
            # self.write_excel_fitting(final_results)
            self.logger.info(f"数据拟合用时：{time.time() - start_time:.2f} s")
            self.return_dict['status']=status
            self.return_dict['message']=message

        except Exception as e:           
            self.return_dict['message'] = f"Exception type: {type(e).__name__}, info: {e}"
            self.return_dict['status'] = "error"
            self.logger.error(f"异常类型: {type(e).__name__}, 错误信息: {e}", exc_info=True)
            # raise
            
        return self.return_dict
    
    def run_copy(self):
        self.logger.info(f"开始处理文件: {self.file_path}")
        status = "success"
        message = ""
        try:

            # 第一次并行计算：处理数据文件的格式.xyz转化为.xz
            self.selectx= self.kafka_infos['dX1'] or self.kafka_infos['dX2']
            self.selecty= self.kafka_infos['dY1'] or self.kafka_infos['dY2']

            start_time = time.time()
            self.logger.info("数据转化中······")

            if self.file_type == 'xyz':
                if self.auto==2 and self.yieldUpdate == 1:
                    for file in self.file_path:
                        if file.endswith('.xz'):
                            x,xz = scanxz(file) 
                        elif file.endswith('.yz'):
                            y,yz = scanxz(file)

            self.logger.info(f"数据转化用时：{time.time() - start_time:.2f} s")

            # 第二次并行计算：对处理过后的数据文件进行计算
            start_time = time.time()
            self.logger.info("数据拟合中······")
            ifselect_values = [self.kafka_infos['dX1'], self.kafka_infos['dX2'], self.kafka_infos['dY1'], self.kafka_infos['dY2']]
            # 必须有一个为 true
            ifselect_flags = [self.kafka_infos['dX1'] is not None, self.kafka_infos['dX2'] is not None, self.kafka_infos['dY1'] is not None, self.kafka_infos['dY2'] is not None]
            msgdict={0:'X1',1:'X2',2:'Y1',3:'Y2'}
            flagid=[index for index,flagvalue in enumerate(ifselect_flags) if flagvalue==1]

            final_results = []            

            if self.file_type == 'xyz':
                file_name = os.path.basename(self.file_path[0])
                if '-' in file_name:
                    # 文件名包含 '-' 的处理逻辑
                    str_split = file_name.split('-')
                    if len(str_split) == 3:
                        self.row_template['文件名'] = str_split[0]
                        self.row_template['row_s'] = int(str_split[1])
                        self.row_template['column_s'] = int(str_split[2].split('.')[0])
                else:
                    # 文件名不包含 '-' 的处理逻辑
                    file_name_without_ext = os.path.splitext(file_name)[0]
                    self.row_template['文件名'] = file_name_without_ext
                    base_dir = os.path.join(self.output_path, 'quance', 'sequence')
               
                    if '.' in file_name_without_ext:                      
                        parts = file_name_without_ext.split('.')
                        if len(parts) >= 2:
                            # 从 sequence 文件获取行列信息
                            num_seq = int(parts[0])
                            row_seq, col_seq = get_xyz_row_col_info(num_seq, base_dir, 'sequence')
                            if row_seq is not None and col_seq is not None:
                                self.row_template['row_s'] = row_seq
                                self.row_template['column_s'] = col_seq

                            # 从 subsequence 文件获取行列信息
                            num_subseq = int(parts[1])
                            row_subseq, col_subseq = get_xyz_row_col_info(num_subseq, base_dir, 'subsequence')
                            if row_subseq is not None and col_subseq is not None:
                                self.row_template['big_row'] = row_subseq
                                self.row_template['big_column'] = col_subseq
                    else:                    
                        # 从 sequence 文件获取行列信息
                        num_seq = int(file_name_without_ext)
                        row_seq, col_seq = get_xyz_row_col_info(num_seq, base_dir, 'sequence')
                        if row_seq is not None and col_seq is not None:
                            self.row_template['row_s'] = row_seq
                            self.row_template['column_s'] = col_seq
                        

            elif self.file_type == 'csv':
                row, col = get_csv_row_col_info(self.file_path)
                self.row_template['文件名'] = os.path.basename(self.file_path)
                self.row_template['row_s'] = row
                self.row_template['column_s'] = col
                
            # 遍历所有启用的直径，填充动态列
            for flag in flagid:
                self.app_D = ifselect_values[flag]
                axis = msgdict[flag]  # 例如 'X1', 'Y3'
                self.logger.info(f'MSG: 当前拟合直径是{axis}：{self.app_D}')
                file_name = os.path.basename(self.file_path[0])
                
                if self.auto==2 and self.yieldUpdate == 1:
                    base_name, _ = os.path.splitext(file_name)
                    if flag < 2:
                        x, z = x, xz
                        filename=base_name + '.xz'
                    else:
                        filename=base_name + '.yz'
                        x, z = y, yz                     
                
                #设置roc手动或者自动
                if self.isauto == 1:                    
                    x, z = self.cut(x, z, self.app_D)                    
                    sag = max(z) - min(z)
                    realD = max(x) - min(x)
                    rocauto = sag / 2 + realD * realD / (8 * sag)
                    r1 = rocauto - self.rocoffset
                    s1 = int(self.roc_step)
                    r2 = rocauto + self.rocoffset
                else:
                    r1 = int(self.roc_start)
                    s1 = int(self.roc_step)
                    r2 = int(self.roc_end)

                iflevel = 1 if self.levelpercent != 0 else 0
                
                # 调用拟合函数
                (rocfit, conicfit, minrmsdelta, xdeltar, deltar, x1_plot, y1_plot, x2_plot, y2_plot, maxdeltar, rmsdeltar,
        maxroc, minroc, maxconic, minconic) = self.fitrocrms4_ho1(
                    x, z, self.app_D, 0, 
                    list(np.arange(r1, r2, s1)), 
                    list(np.arange(self.conic_start, self.conic_end, self.conic_step)),
                    self.levelpercent, iflevel
                )
                self.row_template[f'{axis.lower()}'] = self.app_D
                self.row_template[f'best_roc_{axis.lower()}'] = rocfit
                self.row_template[f'best_conic_{axis.lower()}'] = conicfit
                self.row_template[f'best_rms_{axis.lower()}'] = minrmsdelta

                ############################绘图######################################
                image_name2 = f"{filename}-{self.app_D}-deltar.png"
                if filename.endswith('.xz'):
                    self.image_output_dir = os.path.join(self.new_output_dir, 'xz_images')
                elif filename.endswith('.yz'):
                    self.image_output_dir = os.path.join(self.new_output_dir, 'yz_images')
                image_path2 = os.path.join(self.image_output_dir, image_name2)
                os.makedirs(os.path.dirname(image_path2), exist_ok=True)
                
                self.save_plot_2(
                    xdeltar, deltar, self.app_D,
                    rocfit, minroc, maxroc, conicfit, self.conic_start, self.conic_end,
                    maxdeltar, rmsdeltar, iflevel, self.levelpercent,
                    image_path2
                )

            # 将当前文件的数据添加到最终结果
            final_results = [self.row_template]
            self.logger.info(final_results)
            
            if self.auto==2 and self.yieldUpdate == 1:
                delete_csv_files_in_parent_dir(self.file_path[0])
            self.write_csv_fitting(final_results)
            # self.write_excel_fitting(final_results)
            self.logger.info(f"数据拟合用时：{time.time() - start_time:.2f} s")
            self.return_dict['status']=status
            self.return_dict['message']=message

        except Exception as e:           
            self.return_dict['message'] = f"Exception type: {type(e).__name__}, info: {e}"
            self.return_dict['status'] = "error"
            self.logger.error(f"异常类型: {type(e).__name__}, 错误信息: {e}", exc_info=True)
            # raise
            
        return self.return_dict
    # @profile    
    def write_csv_fitting(self, data):
        dynamic_header = list(self.row_template.keys())
        
        output_path = os.path.join(self.new_output_dir, f"{self.file_type}_summary_{self.container_id}.csv")
        
        file_exists = os.path.isfile(output_path)
        
        with open(output_path, mode='a', newline='', encoding='gbk') as file:
            writer = csv.writer(file)
            
            # 如果是新建文件，则写入表头
            if not file_exists:
                writer.writerow(dynamic_header)
            
            # 写入数据
            for data_item in data:  # 遍历每条记录
                row = []
                for key in dynamic_header:
                    value = data_item.get(key)
                    # 处理numpy数据类型
                    if isinstance(value, (np.int64, np.float64)):
                        value = value.item()  # 将numpy数据类型转换为Python原生类型
                    row.append(value if value is not None else "")
                print(row)
                writer.writerow(row)
        
        self.logger.info(f"结果已保存至: {output_path}")
        
    def write_excel_fitting(self, data):
        dynamic_header = list(self.row_template.keys())
        # for key in ['dX1', 'dX2', 'dY1', 'dY2']:
        #     if self.kafka_infos.get(key):
        #         axis = 'X1' if key == 'dX1' else 'X2' if key == 'dX2' else 'Y1' if key == 'dY1' else 'Y2'
        #         dynamic_header.extend([
        #             f'{axis}', 
        #             f'Best_ROC_{axis}', 
        #             f'Best_Conic_{axis}', 
        #             f'Best_RMS_{axis}'
        #         ])

        output_path = os.path.join(self.new_output_dir, f"{self.file_type}_summary_{self.container_id}.xlsx")
        
        # 如果文件不存在，直接创建并写入数据
        if not os.path.exists(output_path):
            df = pd.DataFrame(data, columns=dynamic_header)
            df.to_excel(output_path, index=False)
            self.logger.info(f"创建新文件并保存结果至: {output_path}")
            return
        
        # 使用 dtype 参数确保 '文件名' 列为字符串类型
        try:
            df_existing = pd.read_excel(output_path, dtype={'文件名': str})
        except Exception as e:
            self.logger.info(f"读取文件时出现错误: {e}")
        
        
        # 检查表头是否对齐
        existing_columns = df_existing.columns.tolist()
        missing_columns = [col for col in dynamic_header if col not in existing_columns]
        
        # 如果缺少列名，添加缺失列并填充默认值 None
        if missing_columns:
            for col in missing_columns:
                df_existing[col] = None
            self.logger.info(f"添加缺失列: {missing_columns}")
        
        # 创建新数据的 DataFrame
        df_new = pd.DataFrame(data, columns=dynamic_header)
        
        # 自动更新序号值
        if not df_existing.empty:
            last_seq_num = df_existing['序号'].max()
            df_new['序号'] = range(last_seq_num + 1, last_seq_num + len(df_new) + 1)
        else:
            df_new['序号'] = range(1, len(df_new) + 1)

        # 合并新旧数据
        df = pd.concat([df_existing, df_new], ignore_index=True)
        
        # 保存到 Excel
        df.to_excel(output_path, engine='openpyxl',index=False)
        self.logger.info(f"结果已追加保存至: {output_path}")
    
    def preprocess_xyz_files(self, file, output):
        preprocessor = PreprocessData(self.kafka_infos)
        x,xz,y,yz = preprocessor.process_kafka_message(file, self.selectx, self.selecty, output=output)
        return x,xz,y,yz
    
    def preprocess_csv_files(self, file, output):
        preprocessor = PreprocessData(self.kafka_infos)
        x,xz = preprocessor.process_kafka_message(file, output=output)
        return x,xz
    #todo 修改函数参数，合并属性
    # @profile
    def save_plot_2(self, x, y, D,
                rocfit, minroc, maxroc, conicfit, minconic, maxconic,
                maxdeltar, rmsdeltar, iflevel, levelpercent,
                filename):  # 移除固定A参数

        try:
            fig = Figure(figsize=(12, 6))
            ax = fig.add_subplot()
            ax.plot(x, y, label='deltar', color='k')
            fig.text(0.35, 0.9, f'Best Fit ROC = {int(rocfit)}  ({int(minroc)} to {int(maxroc)})', ha='left')
            fig.text(0.35, 0.85, f'Best Fit Conic = {conicfit:.3f}  ({minconic} to {maxconic})', ha='left')
            fig.text(0.35, 0.8, f'pv = {maxdeltar:.3f}, rms = {rmsdeltar:.3f}', ha='left')
            fig.text(0.35, 0.75, f'Auto level = {iflevel}, level point = {levelpercent:.0f}%', ha='left')

            # 动态显示所有A系数
            a_coeff_text = ', '.join([f'A{num} = {value}' for num, value in self.coefficients])
            fig.text(0.35, 0.65, a_coeff_text, ha='left')

            if rocfit == minroc or rocfit == maxroc or conicfit == minconic or conicfit == maxconic:
                fig.text(0.35, 0.7, 'Note that the best fit result is the search boundary value, please confirm', ha='left')

            ax.legend()
            fig.savefig(filename)
            fig.clf()
            plt.close(fig)
            figweaker = weakref.ref(fig)
            del fig, ax

        except Exception as e:
            self.logger.error(f"保存图片失败: {filename}, 错误信息: {str(e)}", exc_info=True)

    #todo 将x1,y1返回直接进行数组转换
    def cut(self, x1, y1, D):
        R = D / 2
        count = 0
        x2 = []
        y2 = []
        for i in range(len(x1)):
            if abs(x1[i]) <= R:
                x2.append(x1[i])
                y2.append(y1[i])
                count += 1
        # R = D / 2
        # mask = np.abs(x1) <= R
        # x2, y2 = x1[mask], y1[mask]
        return x2, y2
        
        # 优化后
        # x1 = np.asarray(x1)
        # y1 = np.asarray(y1)
        # mask = np.abs(x1) <= (D / 2)
        # return x1[mask].tolist(), y1[mask].tolist()

    def genxnofig_ho_vectorized(self, x, aperture, rocs, conics):
        
        rocs = np.array(rocs)[:, None, None]
        conics = np.array(conics)[:, None]
        
        R = aperture / 2
        mask = (x >= -R) & (x <= R)
        x[~mask] = 0
        x = x[None]

        c = 1.0 / rocs
        x_squared = np.power(x, 2)
        sqrt_term = np.sqrt(1 - (1 + conics) * c ** 2 * x_squared)

        y1 = (c * x_squared / (1 + sqrt_term))
        
        # 动态累加高次项
        for coeff_num, a_value in self.coefficients:
            exponent = coeff_num // 2
            scale = self.scale_factors[coeff_num]
            y1 += a_value * (x_squared ** exponent) * scale

        # 反转 y1 的值
        max_y1 = np.max(y1, axis=-1, keepdims=True)
        y1[:, :, mask] = max_y1 - y1[:, :, mask]

        xout = np.tile(x, (len(rocs), len(conics), 1))
        return xout, y1
    def fitrocrms4_ho1(self, x, z, D, shift, roc, conic, percent, level):
        x, z = self.cut(x, z, D)
        
        # 调用动态处理A系数的方法
        pvdelta, rmsdelta = self.comparex4resizenofig_ho1(x, z, D, shift, roc, conic, percent, level)
        minrmsdelta = np.min(rmsdelta)
        i, j = np.where(rmsdelta == minrmsdelta)
        rocfit = roc[i[0]]
        conicfit = conic[j[0]]
        maxroc = max(roc)
        minroc = min(roc)
        maxconic = max(conic)
        minconic = min(conic)

        maxdeltar, rmsdeltar, xdeltar, deltar, x1_plot, y1_plot, x2_plot, y2_plot = self.comparex4resize_ho(x, z, D,
                                                                                                            shift,
                                                                                                            rocfit,
                                                                                                            conicfit,
                                                                                                            percent,
                                                                                                            level)
        
        return rocfit, conicfit, minrmsdelta, xdeltar, deltar, x1_plot, y1_plot, x2_plot, y2_plot, maxdeltar, rmsdeltar, maxroc, minroc, maxconic, minconic

    def comparex4resize_ho(self, x1, y1, D, shift, roc, conic, percent, level):
        x1 = np.array(x1)
        y1 = np.array(y1)
        # 使用动态生成的 genxnofig_ho_vectorized
        x2, y2 = self.genxnofig_ho1(x1, D, roc, conic)

        x1_shifted = x1 + shift
        y1_shifted = y1 - np.max(y1) + np.max(y2)

        xstep = x1[1] - x1[0]
        yindexshift = round(shift / xstep)
        delta = []

        if shift >= 0:
            delta = y1_shifted[yindexshift:] - y2[:len(x2) - yindexshift]
        else:
            delta = y1_shifted[:len(x2) + yindexshift] - y2[-yindexshift:]
        xdelta = x2[:len(delta)]

        if level == 1:
            xdeltar, deltar = rotate3(xdelta, delta, percent)
        else:
            xdeltar = xdelta
            deltar = delta

        deltar = np.array(deltar)
        maxdeltar = np.max(deltar) - np.min(deltar)
        middeltar = np.mean(deltar)
        deltar -= middeltar
        rmsdeltar = np.sqrt(np.mean(deltar ** 2))
        
        return maxdeltar, rmsdeltar, xdeltar, deltar, x1_shifted, y1_shifted, x2, y2

    def genxnofig_ho1(self, x, aperture, roc, conic):
        """
        生成非球面高度（动态A系数版本）
        :param x: 输入x坐标
        :param aperture: 孔径
        :param roc: 曲率半径
        :param conic: 圆锥常数
        :return: x坐标和对应的非球面高度
        """
        x1 = np.copy(x)
        c = 1.0 / roc
        R = aperture / 2
        y1 = np.zeros_like(x1)

        # 计算非球面高度
        for i in range(len(x1)):
            if -R <= x1[i] <= R:
                # 基础非球面公式
                y1[i] = c * (x1[i] ** 2) / (1 + np.sqrt(1 - (1 + conic) * c ** 2 * x1[i] ** 2))
                
                # 动态累加高次项
                for coeff_num, a_value in self.coefficients:
                    exponent = coeff_num // 2  # 高次项的指数
                    scale = self.scale_factors[coeff_num]  # 缩放因子
                    y1[i] += a_value * (x1[i] ** (2 * exponent)) * scale
            else:
                y1[i] = 0

        # 反转 y1 的值
        maximum = np.max(y1)

        # y1 = maximum - y1
        for i in range(len(x1)):
            if -R <= x1[i] <= R:
                y1[i] = maximum - y1[i]

        return x1, y1
    def comparex4resizenofig_ho1(self, x1, y1, D, shift, roc, conic, percent, level):
        x1 = np.array(x1)

        y1 = np.array(y1)
        R = D / 2

        gentime=time.time()
        # x2, y2 = self.genxnofig_ho1(x1, D, roc, conic)
        x2, y2 = self.genxnofig_ho_vectorized(x1, D, roc, conic)
        y1=np.tile(y1,(len(roc),len(conic),1))
        y1_shifted = y1 - np.max(y1,axis=-1,keepdims=True) + np.max(y2,axis=-1,keepdims=True)

        shape1,shape2=y1.shape[:2]

        xstep = x1[1] - x1[0]
        # xstep = x2[:,:,1:2] - x1[:,:,0:1]
        yindexshift = round(shift / xstep) # shift 常数


        # TODO shift 不是0时存在bug
        if shift >= 0:
            m1 = np.zeros_like(y1_shifted)
            m1[:, :, yindexshift:] = 1
            m2 = np.ones_like(y1_shifted)
            m2[:, :, len(x1) - yindexshift:] = 0
            delta = y1_shifted[yindexshift:] - y2[:len(x1) - yindexshift]
        else:
            m1=np.zeros_like(y1_shifted)
            m1[:,:,:len(x1)+yindexshift]=1
            m2=np.ones_like(y1_shifted)
            m2[:,:,:-yindexshift]=0

            delta = y1_shifted[m1] - y2[m2]

        xdelta = x2[:,:,:len(delta[0][0])]
        if level == 1:
            xdeltar, deltar = rotate31(xdelta, delta, percent)
        else:
            xdeltar = xdelta
            deltar = delta
        pvdeltar = np.max(deltar,axis=-1) - np.min(deltar,axis=-1)
        rmsdeltar = np.sqrt(np.mean(np.square(deltar - np.mean(deltar,axis=-1,keepdims=True)),axis=-1))
        return pvdeltar, rmsdeltar
