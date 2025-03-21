import os
from pathlib import Path
import numpy as np
import pandas as pd
import timeit
import concurrent.futures

def timetest(func):
    # @wraps(func)
    # def
    timer = timeit.Timer('func()', f'import {func.__name__}')
    execution_time = timer.timeit(number=1)
    average_execution_time = execution_time / 1
    print(f"代码的平均执行时间为：{average_execution_time} 秒")

def generate_image_filename(self, str, D, file):
        filename = os.path.basename(file)
        image_folder = str
        filename_without_ext = os.path.splitext(filename)[0]
        filename = f"{filename_without_ext}-{D}.png"
        image_folder_path = os.path.join(self.filepathout, image_folder)
        # Ensure the directory exists
        os.makedirs(image_folder_path, exist_ok=True)
        image_filename = os.path.join(image_folder_path, filename)
        return image_filename

#########################################################抽测################################################################
def match_and_execute(self, subfolder, excel_data, excel_no, data):
    # 比对子文件夹名和 Excel 第一列的值
    for i in range(len(excel_data)):
        first_part = subfolder.split('-')[0]
        if excel_data[i] == first_part:
            no = excel_no[i]
    if no > 0:
        func_name = f'pop_{no}'
        MarkerContents = self.get_excels(self.markerfile)
        for i in range(len(MarkerContents)):
            if first_part == MarkerContents[i].split('-')[0]:
                fullpath0 = os.path.join(self.markerfile, MarkerContents[i])
        try:
            # 动态调用函数
            func = getattr(self, func_name)
            # print(data)

            data3 = [int(s[2][0]) for s in data]
            data4 = [int(s[3][0]) for s in data]
            data6 = [s[5] for s in data]
            data8 = [s[7] for s in data]

            datalater3, datalater4, datalater6, datalater8 = func(data3, data4, data6, data8, fullpath0)
            self.write_excel_pop(datalater3, datalater4, datalater6, datalater8, subfolder, func_name)
            print(f'MSG: 参与抽测并与抽测信息匹配：{no}')
        except AttributeError:
            print(f'Function {func_name} not found.')

def parallel_process_result(self, subfolders, excel_data, excel_no, data):
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            futures = [executor.submit(self.match_and_execute, subfolder, excel_data, excel_no, data) for subfolder in
                       subfolders]
            for future in concurrent.futures.as_completed(futures):
                try:
                    future.result()
                except Exception as exc:
                    print(f'Generated an exception: {exc}')

# def find_filedir_xz(self, folder_path,suf='.xz'):
    #     all_files = []
    #     for subdir, _, files in os.walk(folder_path):
    #         for file in files:
    #             if file.endswith(suf):  # 假设数据文件为文本文件
    #                 all_files.append(os.path.join(subdir, file))
    #     new_all_files = [s.replace('/', '\\') for s in all_files]
    #     return new_all_files

    # def find_all_data_files(self, folder_path):
    #     all_files = []
    #     for subdir, dirs, files in os.walk(folder_path):
    #         if len(dirs)<1:
    #             for file in files:
    #                 if file.endswith('.xyz'):  # 假设数据文件为文本文件
    #                     all_files.append(subdir+f'/{file}')
    #     # new_all_files = [s.replace('/', '\\') for s in all_files]
    #     return all_files

    # def parallel_process_data(self, files, process_function):
    #     results = []
    #     with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
    #         futures = {executor.submit(process_function, file): file for file in files}
    #         for i, future in enumerate(
    #                 tqdm(concurrent.futures.as_completed(futures), total=len(futures), desc="Fitting data")):
    #             file = futures[future]
    #             # try:
    #             result = future.result()
    #             if result is not None:
    #                 results.append(result)
    #             # except Exception as e:
    #             #     print(f"Error processing file {file}: {e}")
    #             # self.progressUpdate.emit(int((i + 1) / len(futures) * 50))
    #     return results   
    
    # def parallel_process_files_all(self, files, process_function,selectx,selecty):
    #     with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
    #         futures = [executor.submit(process_function, file,selectx,selecty) for file in files]
    #         for i, future in enumerate(
    #                 tqdm(concurrent.futures.as_completed(futures), total=len(futures), desc="Processing files")):
    #             future.result()

    # def process_file_data(self, x_z):
        
    #     # if self.count % 500 == 0:
    #     #     gc.collect()

    #     # x, z = self.scanxz(file_path)
    #     x,z = x_z[0],x_z[1]

    #     if self.isauto == 1:
    #         x, z = self.cut(x, z, self.app_D)
    #         sag = max(z) - min(z)
    #         realD = max(x) - min(x)
    #         rocauto = sag / 2 + realD * realD / (8 * sag)
    #         r1 = rocauto - self.rocoffset
    #         s1 = int(self.roc_step)
    #         r2 = rocauto + self.rocoffset
    #     else:
    #         r1 = int(self.roc_start)
    #         s1 = int(self.step)
    #         r2 = int(self.roc_end)

    #     iflevel = 1 if self.levelpercent != 0 else 0
    #     results = self.fitrocrms4_ho(
    #         x, z, self.app_D, 0, list(np.arange(r1, r2, s1)), list(np.arange(self.conic_start, self.conic_end, self.conic_step)),
    #         self.levelpercent, iflevel
    #     )

        
    #     (rocfit, conicfit, minrmsdelta, xdeltar, deltar, x1_plot, y1_plot, x2_plot, y2_plot, maxdeltar, rmsdeltar,
    #     maxroc, minroc, maxconic, minconic) = results
        
    #     # 打印调试信息
    #     # self.logger.info(f"File: {file_path}, Diameter: {self.app_D}, ROC Fit: {rocfit}, Conic Fit: {conicfit}, RMS Delta: {minrmsdelta}")
        
    #     file_name = os.path.basename(self.file_path)
    #     dir_path = os.path.dirname(self.file_path)
    #     image_name2 = f"{file_name}-{self.app_D}-deltar.png"
    #     image_path2 = os.path.join(dir_path, image_name2)

    #     self.save_plot_2(
    #         xdeltar, deltar, self.app_D,
    #         rocfit, minroc, maxroc, conicfit, self.conic_start, self.conic_end,
    #         maxdeltar, rmsdeltar, iflevel, self.levelpercent,
    #         image_path2
    #     )

    #     str_split = file_name.split('-')
    #     if len(str_split) == 3:
    #         name = str_split[0]
    #         row = str_split[1]
    #         column = str_split[2].split('.')[0]
    #     else:
    #         name = str_split[0].split('.')[0]
    #         row = 'NA'
    #         column = 'NA'

    #     # 动态调整 data 的长度
    #     values = [
    #         self.count, name, row, column,
    #         r1, r2, s1, self.conic_start, self.conic_end, self.conic_step,
    #         *[value for _, value in self.coefficients],self.app_D, rocfit, conicfit, minrmsdelta
    #     ]

    #     # # 添加动态数据
    #     # dynamic_values = []
    #     # for i, flag in enumerate([self.kafka_infos['d_x1'], self.kafka_infos['d_x2'], self.kafka_infos['d_y1'], self.kafka_infos['d_y2']]):
    #     #     if flag is not None:
    #     #         dynamic_values.extend([self.app_D, rocfit, conicfit, minrmsdelta])

    #     # 添加动态数据
    #     # dynamic_values = []
    #     # if self.kafka_infos['d_x1'] is not None:
    #     #     dynamic_values.extend([self.kafka_infos['d_x1'], rocfit, conicfit, minrmsdelta])
    #     # if self.kafka_infos['d_x2'] is not None:
    #     #     dynamic_values.extend([self.kafka_infos['d_x2'], rocfit, conicfit, minrmsdelta])
    #     # if self.kafka_infos['d_y1'] is not None:
    #     #     dynamic_values.extend([self.kafka_infos['d_y1'], rocfit, conicfit, minrmsdelta])
    #     # if self.kafka_infos['d_y2'] is not None:
    #     #     dynamic_values.extend([self.kafka_infos['d_y2'], rocfit, conicfit, minrmsdelta])
        
    #     # values.extend(dynamic_values)

    #     data = [[] for _ in range(len(values))]  # 根据 values 的长度动态调整 data 的长度

    #     for idx, value in enumerate(values):
    #         data[idx].append(value)

    #     return [values]

    # def process_file_data(self, x_z):
    #     self.count += 1
    #     if self.count % 500 == 0:
    #         gc.collect()

    #     x, z = x_z[0], x_z[1]

    #     if self.isauto == 1:
    #         x, z = self.cut(x, z, self.app_D)
    #         sag = max(z) - min(z)
    #         realD = max(x) - min(x)
    #         rocauto = sag / 2 + realD * realD / (8 * sag)
    #         r1 = rocauto - self.rocoffset
    #         s1 = int(self.roc_step)
    #         r2 = rocauto + self.rocoffset
    #     else:
    #         r1 = int(self.roc_start)
    #         s1 = int(self.step)
    #         r2 = int(self.roc_end)

    #     iflevel = 1 if self.levelpercent != 0 else 0
    #     results = self.fitrocrms4_ho(
    #         x, z, self.app_D, 0, list(np.arange(r1, r2, s1)), list(np.arange(self.conic_start, self.conic_end, self.conic_step)),
    #         self.levelpercent, iflevel
    #     )

    #     (rocfit, conicfit, minrmsdelta, xdeltar, deltar, x1_plot, y1_plot, x2_plot, y2_plot, maxdeltar, rmsdeltar,
    #     maxroc, minroc, maxconic, minconic) = results

    #     file_name = os.path.basename(self.file_path)
    #     dir_path = os.path.dirname(self.file_path)
    #     image_name2 = f"{file_name}-{self.app_D}-deltar.png"
    #     image_path2 = os.path.join(dir_path, image_name2)

    #     self.save_plot_2(
    #         xdeltar, deltar, self.app_D,
    #         rocfit, minroc, maxroc, conicfit, self.conic_start, self.conic_end,
    #         maxdeltar, rmsdeltar, iflevel, self.levelpercent,
    #         image_path2
    #     )

    #     str_split = file_name.split('-')
    #     if len(str_split) == 3:
    #         name = str_split[0]
    #         row = str_split[1]
    #         column = str_split[2].split('.')[0]
    #     else:
    #         name = str_split[0].split('.')[0]
    #         row = 'NA'
    #         column = 'NA'

    #     # 构建最终结果行
    #     result_row = [
    #         self.count, name, row, column,
    #         r1, r2, s1, self.conic_start, self.conic_end, self.conic_step,
    #         *[value for _, value in self.coefficients],
    #         self.app_D, rocfit, conicfit, minrmsdelta
    #     ]

    #     return [result_row]
    # def scanxz(self, filename):

    #     # with open(filename, 'r') as file:
    #     #     x,z=zip(*[map(float, line.strip().split()) for line in file])
    #     # return list(x), list(z)
    #     with open(filename, 'r') as file:
    #         data = np.loadtxt(file, dtype=float)
    #         x, z = data.T[0], data.T[1]
    #     # print("####################file####################")
    #     # print(x,z)
    #     return x,z

    # def fitrocrms4_ho(self, x1, y1, D, shift, roc, conic, percent, level):
    #     x1, y1 = self.cut(x1, y1, D)

    #     pvdelta = np.zeros((len(roc), len(conic)))
    #     rmsdelta = np.zeros((len(roc), len(conic)))

    #     # for i in range(len(roc)):
    #     #     for j in range(len(conic)):
    #     #         pvdelta[i, j], rmsdelta[i, j] = self.comparex4resizenofig_ho(x1, y1, D, shift, roc[i], conic[j], percent,
    #     #                                              level, A4, A6, A8, A10, A12, A14, A16)
    #     def compute_pv_rms(i, j):
    #         return self.comparex4resizenofig_ho(x1, y1, D, shift, roc[i], conic[j], percent, level, 
    #                                             )

    #     with ThreadPoolExecutor() as executor:
    #         futures = []
    #         for i in range(len(roc)):
    #             for j in range(len(conic)):
    #                 futures.append((i, j, executor.submit(compute_pv_rms, i, j)))

    #         for i, j, future in futures:
    #             pvdelta[i, j], rmsdelta[i, j] = future.result()

    #     minrmsdelta = np.min(rmsdelta)
    #     i, j = np.where(rmsdelta == minrmsdelta)
    #     rocfit = roc[i[0]]
    #     conicfit = conic[j[0]]
    #     maxroc = max(roc)
    #     minroc = min(roc)
    #     maxconic = max(conic)
    #     minconic = min(conic)

    #     maxdeltar, rmsdeltar, xdeltar, deltar, x1_plot, y1_plot, x2_plot, y2_plot = self.comparex4resize_ho(x1, y1, D,
    #                                                                                                         shift,
    #                                                                                                         rocfit,
    #                                                                                                         conicfit,
    #                                                                                                         percent,
    #                                                                                                         level)
    #     return rocfit, conicfit, minrmsdelta, xdeltar, deltar, x1_plot, y1_plot, x2_plot, y2_plot, maxdeltar, rmsdeltar, maxroc, minroc, maxconic, minconic
    # def comparex4resizenofig_ho(self, x1, y1, D, shift, roc, conic, percent, level):
    #     x1 = np.array(x1)
    #     y1 = np.array(y1)
    #     R = D / 2
    #     x2, y2 = self.genxnofig_ho1(x1, D, roc, conic)

    #     y1_shifted = y1 - np.max(y1) + np.max(y2)
    #     xstep = x1[1] - x1[0]
    #     yindexshift = round(shift / xstep)

    #     delta = []

    #     if shift >= 0:
    #         delta = y1_shifted[yindexshift:] - y2[:len(x2) - yindexshift]
    #     else:
    #         delta = y1_shifted[:len(x2) + yindexshift] - y2[-yindexshift:]

    #     xdelta = x2[:len(delta)]
    #     if level == 1:
    #         xdeltar, deltar = rotate3(xdelta, delta, percent)
    #     else:
    #         xdeltar = xdelta
    #         deltar = delta

    #     pvdeltar = np.max(deltar) - np.min(deltar)
    #     rmsdeltar = np.sqrt(np.mean(np.square(deltar - np.mean(deltar))))

    #     return pvdeltar, rmsdeltar