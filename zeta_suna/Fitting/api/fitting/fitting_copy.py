import gc
import matplotlib.pyplot as plt
import numpy as np
import time
import weakref
import os
import xlwt
import pandas as pd
from concurrent.futures import ThreadPoolExecutor
import concurrent.futures
from matplotlib.figure import Figure
from functools import wraps
from tqdm import tqdm
import sys
from log.logger import get_logger
from .fitting_rotate import rotate3, rotate31
from tools import convertxyz_to_float_lists, convertcsv_to_float_lists, get_row_col_info
# 添加 data_preprocess 目录到 sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data_preprocess')))
from data_preprocess import PreprocessData

# matplotlib.interactive(True)
# matplotlib.use('agg')
class Fitting():
    
    def __init__(self, kafka_infos):
        # 初始化日志
        self.logger = get_logger(self.__class__.__name__)
        # 初始化核心参数
        self.kafka_infos = kafka_infos
        self.isauto = self.kafka_infos['isauto']
        self.file_path = self.kafka_infos['input_dir']
        self.file_type = self.kafka_infos['file_type']
        self.output_dir = self.kafka_infos['output_dir']
        self.levelpercent = self.kafka_infos['levelpercent']
        self.rocoffset = self.kafka_infos['rocoffset']
        self.roc_step = self.kafka_infos['roc_step']
        self.roc_start = self.kafka_infos['roc_start']
        self.roc_end = self.kafka_infos['roc_end']
        self.conic_start = self.kafka_infos['conic_start']
        self.conic_step = self.kafka_infos['conic_step']
        self.conic_end = self.kafka_infos['conic_end']
        self.count = 1

        # 动态收集所有A系数并按数字排序
        self.coefficients = sorted(
            [(int(k[1:]), v) for k, v in kafka_infos.items() 
            if k.startswith('A') and k[1:].isdigit()],
            key=lambda x: x[0]
        )
        # 创建系数缩放因子字典
        self.scale_factors = {
            num: 10 ** (-12 - 6*(num//2 - 2)) for num, _ in self.coefficients
        }
    #todo run放到主程序中
    def run(self):
        self.logger.info(f"开始处理文件: {self.file_path}")
        try:

            # 第一次并行计算：处理数据文件的格式.xyz转化为.xz
            self.selectx= self.kafka_infos['d_x1'] or self.kafka_infos['d_x2']
            self.selecty= self.kafka_infos['d_y1'] or self.kafka_infos['d_y2']

            start_time = time.time()
            self.logger.info("数据转化中······")

            if self.file_type == 'xyz':
                x,xz,y,yz = self.preprocess_xyz_files(self.file_path)
                x,xz,y,yz = convertxyz_to_float_lists(x, xz, y, yz)
                
            elif self.file_type == 'csv':
                x,xz = self.preprocess_csv_files(self.file_path)
                x,xz = convertcsv_to_float_lists(x, xz)

            self.logger.info(f"数据转化用时：{time.time() - start_time:.2f} s")

            # 第二次并行计算：对处理过后的数据文件进行计算
            start_time = time.time()
            self.logger.info("数据拟合中······")
            ifselect_values = [self.kafka_infos['d_x1'], self.kafka_infos['d_x2'], self.kafka_infos['d_y1'], self.kafka_infos['d_y2']]
            # 必须有一个为 true
            ifselect_flags = [self.kafka_infos['d_x1'] is not None, self.kafka_infos['d_x2'] is not None, self.kafka_infos['d_y1'] is not None, self.kafka_infos['d_y2'] is not None]
            msgdict={0:'X1',1:'X2',2:'Y1',3:'Y2'}
            flagid=[index for index,flagvalue in enumerate(ifselect_flags) if flagvalue==1]

            final_results = []
            # 初始化一行数据模板：包含固定列和 A 系数
            row_template = {
                '序号': self.count,
                '文件名': 'NA',
                '行': 'NA',
                '列': 'NA',
                '起始ROC': self.roc_start,
                '终止ROC': self.roc_end,
                'ROC步进': self.roc_step,
                '起始Conic': self.conic_start,
                '终止Conic': self.conic_end,
                'Conic步进': self.conic_step,
                **{f'A{num}': value for num, value in self.coefficients}
            }

            if self.file_type == 'xyz':
                # 解析文件名中的行列信息（示例逻辑）
                str_split = os.path.basename(self.file_path).split('-')
                if len(str_split) == 3:
                    row_template['文件名'] = str_split[0] 
                    row_template['行'] = int(str_split[1])  # 转换为整型
                    row_template['列'] = int(str_split[2].split('.')[0])  # 转换为整型
            elif self.file_type == 'csv':
                row, col = get_row_col_info(self.file_path)
                row_template['文件名'] = os.path.basename(self.file_path) 
                row_template['行'] = row  
                row_template['列'] = col  

            # 遍历所有启用的直径，填充动态列
            for flag in flagid:
                self.app_D = ifselect_values[flag]
                axis = msgdict[flag]  # 例如 'X1', 'Y3'
                file_name = os.path.basename(self.file_path)
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
                # print(rocfit)
                self.logger.info(f"数据拟合用时：{time.time() - start_time:.2f} s")
                # 动态列名
                print(rocfit,conicfit,minrmsdelta)
                row_template[f'{axis}'] = self.app_D
                row_template[f'Best_ROC_{axis}'] = rocfit
                row_template[f'Best_Conic_{axis}'] = conicfit
                row_template[f'RMS(um)_{axis}'] = minrmsdelta

                ############################绘图######################################
                image_name2 = f"{filename}-{self.app_D}-deltar.png"
                image_path2 = os.path.join(self.output_dir, image_name2)
                
                self.save_plot_2(
                    xdeltar, deltar, self.app_D,
                    rocfit, minroc, maxroc, conicfit, self.conic_start, self.conic_end,
                    maxdeltar, rmsdeltar, iflevel, self.levelpercent,
                    image_path2
                )

            # 将当前文件的数据添加到最终结果
            final_results = [row_template]
            self.write_excel_fitting(final_results)
            

        except Exception as e:
            self.logger.error(f"数据处理异常: {str(e)}", exc_info=True)
            raise

    def write_excel_fitting(self, data):
        # 固定表头
        fixed_header = [
            '序号', '文件名', '行', '列',
            '起始ROC', '终止ROC', 'ROC步进',
            '起始Conic', '终止Conic', 'Conic步进'
        ]
        # todo 列表修改字典
        # 动态表头：A系数 + 启用的直径列
        dynamic_header = [f'A{num}' for num, _ in self.coefficients]
        for key in ['d_x1', 'd_x2', 'd_y1', 'd_y2']:
            if self.kafka_infos.get(key):
                axis = 'X1' if key == 'd_x1' else 'X2' if key == 'd_x2' else 'Y1' if key == 'd_y1' else 'Y2'
                dynamic_header.extend([
                    f'{axis}', 
                    f'Best_ROC_{axis}', 
                    f'Best_Conic_{axis}', 
                    f'RMS(um)_{axis}'
                ])
        
        # 合并表头
        header = fixed_header + dynamic_header

        output_path = os.path.join(self.output_dir, f"{self.file_type}_summary.xlsx")
        
        # 如果文件不存在，直接创建并写入数据
        if not os.path.exists(output_path):
            df = pd.DataFrame(data, columns=header)
            df.to_excel(output_path, index=False)
            self.logger.info(f"创建新文件并保存结果至: {output_path}")
            return
        
        # 使用 dtype 参数确保 '文件名' 列为字符串类型
        df_existing = pd.read_excel(output_path, engine='openpyxl', dtype={'文件名': str})
        # df_existing = pd.read_excel(output_path, engine='xlwt', dtype={'文件名': str})
        
        
        # 检查表头是否对齐
        existing_columns = df_existing.columns.tolist()
        missing_columns = [col for col in header if col not in existing_columns]
        
        # 如果缺少列名，添加缺失列并填充默认值 None
        if missing_columns:
            for col in missing_columns:
                df_existing[col] = None
            self.logger.info(f"添加缺失列: {missing_columns}")
        
        # 创建新数据的 DataFrame
        df_new = pd.DataFrame(data, columns=header)
        
        # 自动更新序号值
        if not df_existing.empty:
            last_seq_num = df_existing['序号'].max()
            df_new['序号'] = range(last_seq_num + 1, last_seq_num + len(df_new) + 1)
        else:
            df_new['序号'] = range(1, len(df_new) + 1)

        # 合并新旧数据
        
        df = pd.concat([df_existing, df_new], ignore_index=True)
        
        # 保存到 Excel
        df.to_excel(output_path, index=False)
        self.logger.info(f"结果已追加保存至: {output_path}")
    
    def preprocess_xyz_files(self, file):
        preprocessor = PreprocessData(self.kafka_infos)
        x,xz,y,yz = preprocessor.process_kafka_message(file, self.selectx, self.selecty)
        return x,xz,y,yz
    
    def preprocess_csv_files(self, file):
        preprocessor = PreprocessData(self.kafka_infos)
        x,xz = preprocessor.process_kafka_message(file)
        return x,xz
    #todo 修改函数参数，合并属性
    def save_plot_2(self, x, y, D,
                rocfit, minroc, maxroc, conicfit, minconic, maxconic,
                maxdeltar, rmsdeltar, iflevel, levelpercent,
                filename):  # 移除固定A参数

        try:
            fig = Figure(figsize=(12, 6))
            ax = fig.add_subplot()
            ax.plot(x, y, label='deltar', color='k')
            fig.text(0.35, 0.9, f'Best Fit ROC = {int(rocfit)}  ({int(minroc)} to {int(maxroc)})', ha='left')
            fig.text(0.35, 0.85, f'Best Fit Conic = {conicfit}  ({minconic} to {maxconic})', ha='left')
            fig.text(0.35, 0.8, f'pv = {maxdeltar:.5f}, rms = {rmsdeltar:.5f}', ha='left')
            fig.text(0.35, 0.75, f'Auto level = {iflevel}, level point = {100 * levelpercent}%', ha='left')

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
        # R = D / 2
        # count = 0
        # x2 = []
        # y2 = []
        # for i in range(len(x1)):
        #     if abs(x1[i]) <= R:
        #         x2.append(x1[i])
        #         y2.append(y1[i])
        #         count += 1
        # # R = D / 2
        # # mask = np.abs(x1) <= R
        # # x2, y2 = x1[mask], y1[mask]
        # return x2, y2
        
        # 优化后
        x1 = np.asarray(x1)
        y1 = np.asarray(y1)
        mask = np.abs(x1) <= (D / 2)
        return x1[mask].tolist(), y1[mask].tolist()

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
            print('##############################################')
            print(y1_shifted.shape,y2.shape,yindexshift)
            delta = y1_shifted[yindexshift:] - y2[:len(x2) - yindexshift]
        else:
            delta = y1_shifted[:len(x2) + yindexshift] - y2[-yindexshift:]
            print('------------------------------------------------')
            print(y1_shifted.shape,y2.shape,yindexshift)
        xdelta = x2[:len(delta)]

        # if shift >= 0:
        #     # 检查 y1_shifted 的长度
        #     new_length = min(len(x1) - yindexshift, len(y1_shifted))
        #     delta = y1_shifted[yindexshift:yindexshift + new_length] - y2[:new_length]
        # else:
        #     # 检查 y1_shifted 的长度
        #     new_length = min(len(x1) + yindexshift, len(y1_shifted))
        #     delta = y1_shifted[:new_length] - y2[-yindexshift:-yindexshift + new_length]

        # xdelta = x2[:len(delta)]
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

        # print('gen')
        gentime=time.time()
        # print(roc)
        # x2, y2 = self.genxnofig_ho1(x1, D, roc, conic)
        x2, y2 = self.genxnofig_ho_vectorized(x1, D, roc, conic)
        print(x2.shape,y2.shape)
        y1=np.tile(y1,(len(roc),len(conic),1))
        # print(y1.shape,np.max(y1,axis=-1,keepdims=True).shape)
        y1_shifted = y1 - np.max(y1,axis=-1,keepdims=True) + np.max(y2,axis=-1,keepdims=True)

        shape1,shape2=y1.shape[:2]

        xstep = x1[1] - x1[0]
        # xstep = x2[:,:,1:2] - x1[:,:,0:1]
        yindexshift = round(shift / xstep) # shift 常数


        # TODO shift 不是0时存在bug
        if shift >= 0:
            print('##############################################')
            print(y1_shifted.shape,y2.shape,yindexshift)
            m1 = np.zeros_like(y1_shifted)
            m1[:, :, yindexshift:] = 1
            m2 = np.ones_like(y1_shifted)
            m2[:, :, len(x1) - yindexshift:] = 0
            delta = y1_shifted[yindexshift:] - y2[:len(x1) - yindexshift]

            # 确保切片后的数组形状一致
            # new_length = min(len(x1) - yindexshift, y1_shifted.shape[2])
            # delta = y1_shifted[:, :, yindexshift:yindexshift + new_length] - y2[:, :, :new_length]
        else:
            print('------------------------------------------------')
            print(y1_shifted.shape,y2.shape,yindexshift)
            m1=np.zeros_like(y1_shifted)
            m1[:,:,:len(x1)+yindexshift]=1
            m2=np.ones_like(y1_shifted)
            m2[:,:,:-yindexshift]=0

            delta = y1_shifted[m1] - y2[m2]

            # 确保切片后的数组形状一致
            # new_length = min(len(x1) + yindexshift, y1_shifted.shape[2])
            # delta = y1_shifted[:, :, :new_length] - y2[:, :, -yindexshift:-yindexshift + new_length]


        xdelta = x2[:,:,:len(delta[0][0])]
        # print(time.time()-gentime)
        if level == 1:
            xdeltar, deltar = rotate31(xdelta, delta, percent)
        else:
            xdeltar = xdelta
            deltar = delta
        # print('sssss',xdeltar.shape,deltar.shape)
        pvdeltar = np.max(deltar,axis=-1) - np.min(deltar,axis=-1)
        rmsdeltar = np.sqrt(np.mean(np.square(deltar - np.mean(deltar,axis=-1,keepdims=True)),axis=-1))
        # print(pvdeltar,'pvdeltar')
        return pvdeltar, rmsdeltar
