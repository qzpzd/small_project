import os
import time
import numpy as np
import pandas as pd
from tqdm import tqdm
import concurrent.futures
import json
from Fitting.tools import scancsv
from utils.log import logging
from concurrent.futures import ThreadPoolExecutor
from utils import configuration

class PreprocessData:
    def __init__(self, kafka_infos):
        self.input_dir = kafka_infos['inputDir']
        self.file_type = kafka_infos['fileType']
        self.folder_path = kafka_infos['folderPath']
        self.product_id = kafka_infos['productId']
        self.wafer_id = kafka_infos['waferId']
        self.output_path = kafka_infos['outputDir']
        self.logger = logging.getLogger(self.__class__.__name__)
        
    def process_kafka_message(self, filepathpr, *args, output):
        try:
            # self.logger.debug(f"开始处理文件: {filepathpr}")

            file_path = filepathpr
            file_type = self.file_type
            
            if len(args) == 2:
                selectx, selecty = args
            # selectx = selectx
            # selecty = selecty

            if file_type == 'xyz':
                if configuration.algorithm_is_use_parallel:
                    self.logger.info("---------------------添加数据转化并行--------------------------")
                    x, xz, y, yz = self.preprocess_xyz_parallel(file_path, selectx=selectx, selecty=selecty, output=output)
                else:
                    x, xz, y, yz = self.preprocess_xyz(file_path, selectx=selectx, selecty=selecty, output=output)
                return x, xz, y, yz
            elif file_type == 'csv':
                x, xz = self.preprocess_csv(file_path, output=output)
                return x, xz
            elif file_type == 'xlsx':
                self.preprocess_xlsx(file_path, selectx=selectx, selecty=selecty, output=output)
            else:
                self.logger.error(f"Unsupported file type: {file_type}")
            self.logger.info(f"文件处理完成: {filepathpr}")
            
        except Exception as e:
            self.logger.error(f"文件处理失败: {filepathpr}, 错误: {str(e)}", exc_info=True)
            raise

    def preprocess_xyz(self, file_path, selectx, selecty, output):
        try:
            if file_path == '':
                return None, None, None, None
            relative_path = os.path.basename(file_path)
            filepathout = os.path.join(output, relative_path)
            os.makedirs(os.path.dirname(filepathout), exist_ok=True)

            with open(file_path, 'r') as fidin:
                datas = fidin.readlines()
            # strline4 = datas[3]
            # s = strline4.split()
            # totalline = int(float(s[2])) * int(float(s[3]))

            strline8 = datas[7]
            zygopixel = float(strline8.split()[6]) * 1000000

            xyz = datas[14:-1]
            process_xyz = []
            for sublist in xyz:
                sublist = sublist.strip().split()
                if len(sublist) not in [3, 4]:
                    continue
                elif len(sublist) == 3:
                    process_xyz.append([int(sublist[0]), int(sublist[1]), float(sublist[2])])
                elif sublist[2] == 'No':
                    process_xyz.append([int(sublist[0]), int(sublist[1]), np.nan])

            x, y, z = np.split(process_xyz, indices_or_sections=[1, 2], axis=-1)
            
            x_new, xz, y_new, yz = None, None, None, None

            if selectx:
                suffix = '.xz'
                x_new, xz = self.parsing_data(filepathout, suffix, x, y, z, zygopixel)
                # if x is None or xz is None:
                #     self.logger.error(f"文件 {file_path} 处理失败，x 或 xz 为 None")
            
            if selecty:
                suffix = '.yz'
                y_new, yz = self.parsing_data(filepathout, suffix, x, y, z, zygopixel)
                # if y is None or yz is None:
                #     self.logger.error(f"文件 {file_path} 处理失败，y 或 yz 为 None")
            return x_new,xz,y_new,yz

        except Exception as e:
            self.logger.error(f"Error processing file {file_path}: {e}")
            return None, None, None, None

    def preprocess_xyz_parallel(self, file_path, selectx, selecty, output):

        try:
            if not file_path:
                return None, None, None, None
            
            with open(file_path, 'r') as fidin:
                datas = fidin.readlines()

            # 解析关键参数
            try:
                zygopixel = float(datas[7].split()[6]) * 1e6
            except (IndexError, ValueError):
                zygopixel = 0.0

            """向量化优化版数据预处理"""
            
            # 预分配内存（假设平均每行3列）
            max_lines = len(datas) - 15  # 最大可能行数
            temp_arr = np.empty((max_lines, 3), dtype=np.float64)
            valid_count = 0

            for line in datas[14:-1]:
                parts = line.strip().split()
                if len(parts) not in (3, 4):
                    continue
                try:
                    # 直接填充预分配数组
                    temp_arr[valid_count, 0] = float(parts[0])  # x
                    temp_arr[valid_count, 1] = float(parts[1])  # y

                    if len(parts) == 3:
                        temp_arr[valid_count, 2] = float(parts[2])  # z
                    elif parts[2] == 'No':
                        temp_arr[valid_count, 2] = np.nan
                    else:
                        continue

                    valid_count += 1
                except (ValueError, IndexError):
                    continue

            # 裁剪出有效数据部分
            process_array = temp_arr[:valid_count]
            # self.logger.info(f"数据预处理用时：{time.time() - second_time:.2f} s")
            # 并行处理 selectx 和 selecty
            results = [None] * 4
            with ThreadPoolExecutor(max_workers=2) as executor:
                futures = {}
                if selectx:
                    relative_path = os.path.join('xz', os.path.basename(file_path))
                    filepathout = os.path.join(output, relative_path)
                    os.makedirs(os.path.dirname(filepathout), exist_ok=True)
                    futures['x'] = executor.submit(
                        self.parsing_data, filepathout, '.xz', process_array[:, 0:1], process_array[:, 1:2],
                        process_array[:, 2:3], zygopixel)
                if selecty:
                    relative_path = os.path.join('yz', os.path.basename(file_path))
                    filepathout = os.path.join(output, relative_path)
                    os.makedirs(os.path.dirname(filepathout), exist_ok=True)
                    futures['y'] = executor.submit(
                        self.parsing_data, filepathout, '.yz', process_array[:, 0:1], process_array[:, 1:2],
                        process_array[:, 2:3], zygopixel)
            
                # 获取结果
                if selectx:
                    results[0], results[1] = futures['x'].result()
                if selecty:
                    results[2], results[3] = futures['y'].result()
            
            return tuple(results)

        except Exception as e:
            return None, None, None, None

    def parsing_data(self, filepathout, suffix, x, y, z, zygopixel):
        try:
            filepathout = filepathout.replace('.xyz', suffix)

            value = x if suffix == '.xz' else y
            unique = y if suffix == '.xz' else x

            unique_numbers_array = np.unique(unique)
            py1 = np.where(unique_numbers_array == np.floor(np.median(unique_numbers_array)))[0]
            medy_1 = np.unique(value)
            lenx = len(medy_1)

            if suffix == '.xz':
                data_3py1 = z[py1[0] * len(medy_1):(py1[0] + 1) * len(medy_1)]
            else:
                idxmask = [(i * len(unique_numbers_array)) + py1[0] for i in range(lenx)]
                data_3py1 = z[idxmask]

            midpoint = int(np.ceil(len(data_3py1) / 2))
            range_start = max(0, midpoint - 30)
            range_end = min(len(data_3py1), midpoint + 30 + 1)
            values = data_3py1[range_start:range_end]
            max_med = np.nanmax(values)
            max_index = np.nanargmax(values)
            px1 = max_index + range_start
            medz_1 = data_3py1 - max_med
            medy1_1 = (medy_1 - medy_1[px1]) * zygopixel
            newxz1 = np.column_stack((medy1_1, medz_1))
            newxz1_1 = newxz1[~np.isnan(newxz1).any(axis=1)]
            # with open(filepathout, 'w') as fid1:
            #     for row in newxz1_1:
            #         fid1.write('%6.3f %12.6f\n' % (row[0], row[1]))

            # return newxz1_1[:, 0], newxz1_1[:, 1]
            
            formatted_x = []
            formatted_z = []

            with open(filepathout, 'w') as fid1:
                for row in newxz1_1:
                    x_formatted = '{:6.3f}'.format(row[0])
                    z_formatted = '{:12.6f}'.format(row[1])
                    fid1.write(f"{x_formatted} {z_formatted}\n")
                    formatted_x.append(x_formatted)
                    formatted_z.append(z_formatted)

            return formatted_x, formatted_z

        except Exception as e:
            self.logger.error(f"Error parsing data for file {filepathout}: {str(e)}", exc_info=True)
            return None, None
        

    def preprocess_csv(self, file_path, output):
        try:
            # # 读取CSV文件，指定无表头
            # df = pd.read_csv(file_path, header=None)

            # # 检查文件是否至少有两列
            # if df.shape[1] < 2:
            #     raise ValueError(f"File {file_path} does not have at least two columns.")

            # # 分别提取第一列和第二列的数据，并转换为列表
            # x = df.iloc[:, 0].tolist()
            # z = df.iloc[:, 1].tolist()

            x, z = scancsv(file_path)

            return x, z
        except Exception as e:
            self.logger.error(f"Error processing file {file_path}: {e}")
            return None, None

    def preprocess_xlsx(self, file_path, output):
        try:
            df = pd.read_excel(file_path)
            # 假设动态规则是一个函数，这里简单示例为一个过滤操作
            filtered_df = df[df['value'] > 10]  # 示例规则：过滤 value 列大于 10 的行
            new_output_dir = os.path.join(output, os.path.basename(file_path).replace('.xlsx', '_processed.xlsx'))
            filtered_df.to_excel(new_output_dir, index=False)
            return new_output_dir
        except Exception as e:
            self.logger.error(f"Error processing file {file_path}: {e}")
            return None

    def parallel_process_files_all(self, files, process_function, selectx, selecty):
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            futures = [executor.submit(process_function, file, selectx, selecty) for file in files]
            for i, future in enumerate(
                    tqdm(concurrent.futures.as_completed(futures), total=len(futures), desc="Processing files")):
                future.result()