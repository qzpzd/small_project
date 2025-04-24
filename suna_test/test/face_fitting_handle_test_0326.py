#!/usr/bin/env python
# -*- coding: UTF-8 -*-
"""
@Project     ：Fit_the_predictor 
@File        ：face_fitting_handle_test.py
@IDE         ：PyCharm 
@Author      ：Wangqiong
@Email       :SN0581@suna-opto.com
@Date        ：2025/2/10 13:14
@Test_Author ：SN0581
@Test_Date   ：2025/2/10 13:14
"""

import json
import os
import time
import unittest
from pathlib import Path

import openpyxl
import pandas as pd
import simplejson
from pyspark.shuffle import process

from Fit_handle.predict_handle import MarkList
from Processing.start_process_and_fitting import parse_FittingModelList, BaseModel
from common.json_encoder import jsonencode
import numpy as np
import logging
from test import tmp_path, dat_path, case_path
from Processing.file_precess_2 import FileWorkerThread
import dask.bag as db
from dask.distributed import Client
from Processing.file_precess_2 import FileWorkerThread
import simplejson
from common.json_encoder import jsonencode
from test import tmp_path, dat_path, case_path
from Processing.file_precess import FileWorkerThread
import numpy as np

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

logger = logging.getLogger('FullTest')


def process_file_format_xyz(file_path, output_excel):
    """
    解析 XYZ 格式数据，转换为二维数组，并存入 Excel，第一行作为列索引，第一列作为行索引
    :param file_path: str, TXT 文件路径
    :param output_excel: str, 输出 Excel 文件路径
    """
    try:
        if not file_path:
            return None

        count = 1
        with open(file_path, 'r') as fidin:
            # 跳过前 3 行
            for _ in range(3 - count + 1):
                fidin.readline()
                count += 1

            # 读取网格尺寸信息 (起始行, 起始列, 终止行, 终止列)
            str_line = fidin.readline()
            s = list(map(float, str_line.split()))
            col_start, row_start = int(s[0]), int(s[1])
            X, Y = int(s[2]), int(s[3])  # 直接使用提供的行数和列数
            col_end = col_start + X - 1
            row_end = row_start + Y - 1
            total_lines = X * Y  # 计算总数据点数
            count += 1
            # 计算需要跳过的行数
            lines_to_skip = 7 - count + 1

            # 确保 lines_to_skip 不是负数
            if lines_to_skip > 0:
                for _ in range(lines_to_skip):
                    fidin.readline()
                    count += 1

            # 读取 zygopixel 值 (单位转换为微米)
            str_line = fidin.readline()
            s = str_line.split()
            zygopixel = float(s[6]) * 1_000_000  # 单位转换
            count += 1

            # 跳过到第 14 行
            for _ in range(14 - count + 1):
                fidin.readline()
                count += 1

            # 读取数据并解析
            data = np.full((Y, X), np.nan)  # 先填充 NaN，确保数组大小
            for _ in range(total_lines):
                str_line = fidin.readline().strip()
                parts = str_line.split()
                if len(parts) < 3:
                    continue  # 避免空行或异常数据行

                # **转换实际行列索引**
                x, y = int(parts[0]) - col_start, int(parts[1]) - row_start  # **调整索引**
                if 0 <= y < Y and 0 <= x < X:  # 确保索引合法
                    if parts[2] == 'No' and parts[3] == 'Data':
                        data[y, x] = np.nan  # 处理无效数据
                    else:
                        data[y, x] = float(parts[2])  # 读取 Z 值

        # **📌 去除全 NaN 行列**
        df = pd.DataFrame(data, index=range(row_start, row_end + 1), columns=range(col_start, col_end + 1))
        df.dropna(how="all", axis=0, inplace=True)  # 删除全是 NaN 的行
        df.dropna(how="all", axis=1, inplace=True)  # 删除全是 NaN 的列

        # **📌 存入 Excel**
        df.to_excel(output_excel, index=True, sheet_name="Z-Matrix")

        print(f"✅ 数据已成功存入: {output_excel}")
        return df
    except Exception as e:
        print(f"❌ 读取文件失败: {e}")
        return None


def calculate_surface_values_modified_D(start_row, start_col, row_count, col_count,
                                        current_roc, current_conic, A4, A6, A8, A10, A12, A14, A16,
                                        D_max, D_min):
    """
    计算指定范围的 Y 值，以行列的中位数作为原点，并根据直径规则调整 Y 值

    :param start_row: 起始行索引
    :param start_col: 起始列索引
    :param row_count: 行数
    :param col_count: 列数
    :param current_roc: 曲率半径 (ROC)
    :param current_conic: 二次曲率 (conic)
    :param A4, A6, A8, A10, A12, A14, A16: 高阶系数
    :param D_max: 中心点直径最大值
    :param D_min: 边缘点直径最小值
    :return: 计算后的 (row_count × col_count) 矩阵
    """
    # 常数
    scale_factor = 0.87187
    c = 1.0 / current_roc  # ROC 倒数

    # 生成行列索引，并找到各自的中位数作为原点
    row_indices = np.arange(start_row, start_row + row_count)
    col_indices = np.arange(start_col, start_col + col_count)

    mid_row = start_row + row_count // 2
    mid_col = start_col + col_count // 2

    # 计算相对坐标 (以中位数为原点)
    y_rel, x_rel = np.meshgrid(row_indices - mid_row, col_indices - mid_col, indexing='ij')

    # 计算点到中心点的距离
    r = np.sqrt(x_rel ** 2 + y_rel ** 2)

    # 计算直径 D(i, j) 随距离的变化（线性关系）
    r_max = np.sqrt((row_count // 2) ** 2 + (col_count // 2) ** 2)  # 最大距离
    D = D_max - ((D_max - D_min) / r_max) * r  # 直径

    # 将直径 D(i, j) 作为 x_in_range 代入非球面公式
    x_in_range = D

    # 计算 y 值（使用非球面公式）
    y_values = (
            (c * (x_in_range ** 2)) / (1 + np.sqrt(1 - (1 + current_conic) * c ** 2 * x_in_range ** 2))
            + A4 * (x_in_range ** 4) * 1e-12
            + A6 * (x_in_range ** 6) * 1e-18
            + A8 * (x_in_range ** 8) * 1e-24
            + A10 * (x_in_range ** 10) * 1e-30
            + A12 * (x_in_range ** 12) * 1e-36
            + A14 * (x_in_range ** 14) * 1e-42
            + A16 * (x_in_range ** 16) * 1e-48
    )

    # 创建 DataFrame，并添加行列索引
    df_result = pd.DataFrame(y_values, index=row_indices, columns=col_indices)
    df_result.index.name = "Row_Index"
    df_result.columns.name = "Col_Index"

    return df_result


def calculate_surface_values_modified_max(start_row, start_col, row_count, col_count,
                                          current_roc, current_conic, max_r, A4, A6, A8, A10, A12, A14, A16):
    """
    计算指定范围的 Y 值，以行列的中位数作为原点，且距离中位数越远，半径越小

    :param start_row: 起始行索引
    :param start_col: 起始列索引
    :param row_count: 行数
    :param col_count: 列数
    :param current_roc: 曲率半径 (ROC)
    :param current_conic: 二次曲率 (conic)
    :param A4, A6, A8, A10, A12, A14, A16: 高阶系数
    :return: 计算后的 (row_count × col_count) 矩阵
    """
    # 常数
    scale_factor = 0.87187
    c = 1.0 / current_roc  # ROC 倒数

    # 生成行列索引，并找到各自的中位数作为原点
    row_indices = np.arange(start_row, start_row + row_count)
    col_indices = np.arange(start_col, start_col + col_count)

    # mid_row = start_row + row_count // 2
    # mid_col = start_col + col_count // 2
    mid_row = 510
    mid_col = 482
    # 计算相对坐标 (以中位数为原点)
    y_rel, x_rel = np.meshgrid(row_indices - mid_row, col_indices - mid_col, indexing='ij')

    # 最大半径是到边界的距离
    # max_radius = scale_factor * min(mid_row - start_row, mid_col - start_col)
    max_radius = max_r
    # 计算每个点的实际半径（从中位数向外递减）
    # distance_from_center = scale_factor * np.sqrt(x_rel ** 2 + y_rel ** 2) / 2
    distance_from_center = scale_factor * np.sqrt(x_rel ** 2 + y_rel ** 2)
    # x_in_range = max_radius - distance_from_center
    x_in_range = distance_from_center

    # 确保x_in_range不为负值
    # x_in_range = np.maximum(x_in_range, 0)

    # 计算 y 值
    y_values = (
            (c * (x_in_range ** 2)) / (1 + np.sqrt(1 - (1 + current_conic) * c ** 2 * x_in_range ** 2))
            + A4 * (x_in_range ** 4) * 1e-12
            + A6 * (x_in_range ** 6) * 1e-18
            + A8 * (x_in_range ** 8) * 1e-24
            + A10 * (x_in_range ** 10) * 1e-30
            + A12 * (x_in_range ** 12) * 1e-36
            + A14 * (x_in_range ** 14) * 1e-42
            + A16 * (x_in_range ** 16) * 1e-48
    )

    # 创建 DataFrame，并添加行列索引
    df_result = pd.DataFrame(y_values, index=row_indices, columns=col_indices)
    df_result.index.name = "Row_Index"
    df_result.columns.name = "Col_Index"

    return df_result


def calculate_surface_values_modified_max_2(start_row, start_col, row_count, col_count,
                                            current_roc, current_conic, max_r, A4, A6, A8, A10, A12, A14, A16):
    """
    计算指定范围的 Y 值，以行列的中位数作为原点，且距离中位数越远，半径越小

    :param start_row: 起始行索引
    :param start_col: 起始列索引
    :param row_count: 行数
    :param col_count: 列数
    :param current_roc: 曲率半径 (ROC)
    :param current_conic: 二次曲率 (conic)
    :param A4, A6, A8, A10, A12, A14, A16: 高阶系数
    :return: 计算后的 (row_count × col_count) 矩阵
    """
    # 常数
    scale_factor = 0.87187
    c = 1.0 / current_roc  # ROC 倒数

    # 生成行列索引，并找到各自的中位数作为原点
    row_indices = np.arange(start_row, start_row + row_count)
    col_indices = np.arange(start_col, start_col + col_count)

    # mid_row = start_row + row_count // 2
    # mid_col = start_col + col_count // 2
    mid_row = 510
    mid_col = 482
    # 计算相对坐标 (以中位数为原点)
    y_rel, x_rel = np.meshgrid(row_indices - mid_row, col_indices - mid_col, indexing='ij')

    # 最大半径是到边界的距离
    # max_radius = scale_factor * min(mid_row - start_row, mid_col - start_col)
    max_radius = max_r  # 采用坐标的数据作为半径，而不是乘以折射常数
    # 计算每个点的实际半径（从中位数向外递减）
    # distance_from_center = scale_factor * np.sqrt(x_rel ** 2 + y_rel ** 2) / 2
    distance_from_center = np.sqrt(x_rel ** 2 + y_rel ** 2) / 2
    # distance_from_center = scale_factor * np.sqrt(x_rel ** 2 + y_rel ** 2)
    x_in_range = max_radius - distance_from_center

    # 确保x_in_range不为负值
    # x_in_range = np.maximum(x_in_range, 0)

    # 计算 y 值
    y_values = (
            (c * (x_in_range ** 2)) / (1 + np.sqrt(1 - (1 + current_conic) * c ** 2 * x_in_range ** 2))
            + A4 * (x_in_range ** 4) * 1e-12
            + A6 * (x_in_range ** 6) * 1e-18
            + A8 * (x_in_range ** 8) * 1e-24
            + A10 * (x_in_range ** 10) * 1e-30
            + A12 * (x_in_range ** 12) * 1e-36
            + A14 * (x_in_range ** 14) * 1e-42
            + A16 * (x_in_range ** 16) * 1e-48
    )

    # 创建 DataFrame，并添加行列索引
    df_result = pd.DataFrame(y_values, index=row_indices, columns=col_indices)
    df_result.index.name = "Row_Index"
    df_result.columns.name = "Col_Index"

    return df_result


def calculate_surface_values_modified_max_3(start_row, start_col, row_count, col_count,
                                            current_roc, current_conic, max_r, A4, A6, A8, A10, A12, A14, A16):
    """
    计算指定范围的 Y 值，以行列的中位数作为原点，且距离中位数越远，半径越小

    :param start_row: 起始行索引
    :param start_col: 起始列索引
    :param row_count: 行数
    :param col_count: 列数
    :param current_roc: 曲率半径 (ROC)
    :param current_conic: 二次曲率 (conic)
    :param A4, A6, A8, A10, A12, A14, A16: 高阶系数
    :return: 计算后的 (row_count × col_count) 矩阵
    """
    # 常数
    scale_factor = 0.87187
    c = 1.0 / current_roc  # ROC 倒数

    # 生成行列索引，并找到各自的中位数作为原点
    row_indices = np.arange(start_row, start_row + row_count)
    col_indices = np.arange(start_col, start_col + col_count)

    # mid_row = start_row + row_count // 2
    # mid_col = start_col + col_count // 2
    mid_row = 510
    mid_col = 482
    # 计算相对坐标 (以中位数为原点)
    y_rel, x_rel = np.meshgrid(row_indices - mid_row, col_indices - mid_col, indexing='ij')

    # 最大半径是到边界的距离
    # max_radius = scale_factor * min(mid_row - start_row, mid_col - start_col)
    max_radius = max_r  # 采用坐标的数据作为半径，而不是乘以折射常数
    # 计算每个点的实际半径（从中位数向外递减）
    # distance_from_center = scale_factor * np.sqrt(x_rel ** 2 + y_rel ** 2) / 2
    distance_from_center = np.sqrt(x_rel ** 2 + y_rel ** 2) / 2
    # distance_from_center = scale_factor * np.sqrt(x_rel ** 2 + y_rel ** 2)
    x_in_range = distance_from_center

    # 确保x_in_range不为负值
    # x_in_range = np.maximum(x_in_range, 0)

    # 计算 y 值
    y_values = 54.439483 - (
            (c * (x_in_range ** 2)) / (1 + np.sqrt(1 - (1 + current_conic) * c ** 2 * x_in_range ** 2))
            + A4 * (x_in_range ** 4) * 1e-12
            + A6 * (x_in_range ** 6) * 1e-18
            + A8 * (x_in_range ** 8) * 1e-24
            + A10 * (x_in_range ** 10) * 1e-30
            + A12 * (x_in_range ** 12) * 1e-36
            + A14 * (x_in_range ** 14) * 1e-42
            + A16 * (x_in_range ** 16) * 1e-48
    )

    # 创建 DataFrame，并添加行列索引
    df_result = pd.DataFrame(y_values, index=row_indices, columns=col_indices)
    df_result.index.name = "Row_Index"
    df_result.columns.name = "Col_Index"

    return df_result


def calculate_surface_values_modified(start_row, start_col, row_count, col_count,
                                      current_roc, current_conic, A4, A6, A8, A10, A12, A14, A16):
    """
    计算指定范围的 Y 值，以行列的中位数作为原点

    :param start_row: 起始行索引
    :param start_col: 起始列索引
    :param row_count: 行数
    :param col_count: 列数
    :param current_roc: 曲率半径 (ROC)
    :param current_conic: 二次曲率 (conic)
    :param A4, A6, A8, A10, A12, A14, A16: 高阶系数
    :return: 计算后的 (row_count × col_count) 矩阵
    """
    # 常数
    scale_factor = 0.87187
    c = 1.0 / current_roc  # ROC 倒数

    # 生成行列索引，并找到各自的中位数作为原点
    row_indices = np.arange(start_row, start_row + row_count)
    col_indices = np.arange(start_col, start_col + col_count)

    mid_row = start_row + row_count // 2
    mid_col = start_col + col_count // 2

    # 计算相对坐标 (以中位数为原点)
    y_rel, x_rel = np.meshgrid(row_indices - mid_row, col_indices - mid_col, indexing='ij')

    # 计算 x_in_range
    x_in_range = scale_factor * np.sqrt(x_rel ** 2 + y_rel ** 2)

    # 计算 y 值（与原函数相同）
    y_values = (
            (c * (x_in_range ** 2)) / (1 + np.sqrt(1 - (1 + current_conic) * c ** 2 * x_in_range ** 2))
            + A4 * (x_in_range ** 4) * 1e-12
            + A6 * (x_in_range ** 6) * 1e-18
            + A8 * (x_in_range ** 8) * 1e-24
            + A10 * (x_in_range ** 10) * 1e-30
            + A12 * (x_in_range ** 12) * 1e-36
            + A14 * (x_in_range ** 14) * 1e-42
            + A16 * (x_in_range ** 16) * 1e-48
    )

    # 创建 DataFrame，并添加行列索引
    df_result = pd.DataFrame(y_values, index=row_indices, columns=col_indices)
    df_result.index.name = "Row_Index"
    df_result.columns.name = "Col_Index"

    return df_result


def calculate_surface_values_2(start_row, start_col, row_count, col_count,
                               current_roc, current_conic, A4, A6, A8, A10, A12, A14, A16):
    """
    计算指定范围的 Y 值，以行列的起始位作为原点

    :param start_row: 起始行索引 (234)
    :param start_col: 起始列索引 (207)
    :param row_count: 行数 (551)
    :param col_count: 列数 (551)
    :param current_roc: 曲率半径 (ROC)
    :param current_conic: 二次曲率 (conic)
    :param A4, A6, A8, A10, A12, A14, A16: 高阶系数
    :return: 计算后的 (row_count × col_count) 矩阵
    """
    # 常数
    scale_factor = 0.87187
    c = 1.0 / current_roc  # ROC 倒数

    # 生成行列索引
    row_indices = np.arange(start_row, start_row + row_count)  # 行索引 (234-784)
    col_indices = np.arange(start_col, start_col + col_count)  # 列索引 (207-757)

    # 计算相对坐标 (以起始点为原点)
    y_rel, x_rel = np.meshgrid(row_indices - start_row, col_indices - start_col, indexing='ij')

    # 计算 x_in_range
    x_in_range = scale_factor * np.sqrt(x_rel ** 2 + y_rel ** 2)

    # 计算 y 值
    y_values = (
            (c * (x_in_range ** 2)) / (1 + np.sqrt(1 - (1 + current_conic) * c ** 2 * x_in_range ** 2))
            + A4 * (x_in_range ** 4) * 1e-12
            + A6 * (x_in_range ** 6) * 1e-18
            + A8 * (x_in_range ** 8) * 1e-24
            + A10 * (x_in_range ** 10) * 1e-30
            + A12 * (x_in_range ** 12) * 1e-36
            + A14 * (x_in_range ** 14) * 1e-42
            + A16 * (x_in_range ** 16) * 1e-48
    )

    # return y_values
    # 创建 DataFrame，并添加行列索引
    df_result = pd.DataFrame(y_values, index=row_indices, columns=col_indices)

    # 添加行列索引标签
    df_result.index.name = "Row_Index"
    df_result.columns.name = "Col_Index"

    return df_result


def calculate_surface_values(rows, cols, current_roc, current_conic, A4, A6, A8, A10, A12, A14, A16):
    """
    计算 692x692 维度数据的 Y 值，根据给定公式计算表面值

    :param rows: 行的起始索引 (164)
    :param cols: 列的起始索引 (136)
    :param current_roc: 曲率半径 (ROC)
    :param current_conic: 二次曲率 (conic)
    :param A4, A6, A8, A10, A12, A14, A16: 高阶系数
    :return: 692x692 维度的 numpy 数组
    """
    # 定义常数
    scale_factor = 0.87187
    c = 1.0 / current_roc  # ROC 倒数

    # 生成坐标索引 (以 164,136 为起点)
    row_indices = np.arange(rows, rows + 692)  # 行范围 164-855
    col_indices = np.arange(cols, cols + 692)  # 列范围 136-827
    x_grid, y_grid = np.meshgrid(col_indices, row_indices)  # 生成 X, Y 网格

    # 计算 x_in_range
    x_in_range = scale_factor * np.sqrt(x_grid ** 2 + y_grid ** 2)

    # 计算 y 值
    y = (
            (c * (x_in_range ** 2)) / (1 + np.sqrt(1 - (1 + current_conic) * c ** 2 * x_in_range ** 2))
            + A4 * (x_in_range ** 4) * 1e-12
            + A6 * (x_in_range ** 6) * 1e-18
            + A8 * (x_in_range ** 8) * 1e-24
            + A10 * (x_in_range ** 10) * 1e-30
            + A12 * (x_in_range ** 12) * 1e-36
            + A14 * (x_in_range ** 14) * 1e-42
            + A16 * (x_in_range ** 16) * 1e-48
    )

    return y


import pandas as pd


def subtract_excel_files(base_file, compare_file, output_file, sheet_name=0):
    """
    读取两个 Excel 文件，对应位置作差，确保 base 表为空时，仍返回空值
    :param base_file: 基准 Excel 文件路径
    :param compare_file: 比较 Excel 文件路径
    :param output_file: 输出 Excel 文件路径
    :param sheet_name: 读取的表单名或索引，默认第一个表单
    """
    # 读取 Excel 文件
    base_df = pd.read_excel(base_file, sheet_name=sheet_name, index_col=0)
    compare_df = pd.read_excel(compare_file, sheet_name=sheet_name, index_col=0)

    # 确保数据尺寸一致（如果 compare_df 比 base_df 大，截取相同范围）
    compare_df = compare_df.reindex_like(base_df)

    # 计算作差，并保留 base_df 的空值
    result_df = compare_df - base_df
    result_df[base_df.isna()] = None  # base_df 为空的地方，结果仍为空

    # 保存结果到 Excel
    result_df.to_excel(output_file)

    print(f"✅ 计算完成，结果已保存至 {output_file}")


class FullTestCase(unittest.TestCase):
    def process_file_format_new(self, file_path):
        """
        24,12.25 修复maxz取值
        :param file_path:
        :return:
        """
        try:
            if file_path == '':
                return None

            # 获取文件路径的相对路径部分
            relative_path = os.path.relpath(file_path, self.filepathpr)
            # 构建输出文件路径
            filepathout = os.path.join(self.filepathout, relative_path)
            # 确保输出目录存在
            os.makedirs(os.path.dirname(filepathout), exist_ok=True)
            # 将 .xyz 扩展名更改为 .xz
            filepathout = filepathout.replace('.xyz', '.xz')

            count = 1
            res = {}
            with open(file_path, 'r') as fidin:
                while count <= 3:
                    fidin.readline()
                    count += 1

                str_line = fidin.readline()
                s = str_line.split()
                totalline = int(float(s[2])) * int(float(s[3]))  # 确保正确转换为整数
                count += 1

                while count <= 7:
                    fidin.readline()
                    count += 1

                str_line = fidin.readline()
                s = str_line.split()
                zygopixel = float(s[6]) * 1000000
                count += 1

                while count <= 14:
                    fidin.readline()
                    count += 1

                data = []
                for _ in range(totalline):
                    str_line = fidin.readline().strip()
                    parts = str_line.split()
                    if len(parts) < 3:
                        continue  # 如果数据行不完整，跳过此行
                    if parts[2] == 'No' and parts[3] == 'Data':
                        data.append([float(parts[0]), float(parts[1]), np.nan])
                    else:
                        data.append(list(map(float, parts)))

                data = np.array(data)
                x1 = data[:, 0]
                # x = [int(a) for a in x1]  # 不需要再次转换浮点数
                y1 = data[:, 1]
                # y = [int(a) for a in y1]  # 不需要再次转换浮点数
                x = x1.astype(int)
                y = y1.astype(int)
                z = data[:, 2]
                unique_numbers_array = np.unique(y)
                # py1 = np.where(unique_numbers_array == np.floor(np.median(unique_numbers_array)))[0]
                median_value = np.median(unique_numbers_array)

                # 如果中位数不是整数，则向下取整和向上取整以考虑中位数位于两个数之间的情况
                if not median_value.is_integer():
                    lower = np.floor(median_value)
                    upper = np.ceil(median_value)
                    # 查找等于向下取整或向上取整后的中位数值的位置
                    # py1 = np.where((unique_numbers_array == lower) | (unique_numbers_array == upper))[0]
                    py1 = np.where(unique_numbers_array == lower)[0]
                else:
                    # 如果中位数是一个整数，直接查找等于中位数的位置
                    py1 = np.where(unique_numbers_array == median_value)[0]
                medy_1 = np.unique(x)
                # start_idx, end_idx, subseq, subseq_length = self.find_nth_subsequence(x, py1[0])
                # data_3py1 = self.extract_subarray(z, start_idx, end_idx)
                # midpoint = int(np.ceil(len(data_3py1) / 2))
                # range_start = max(0, midpoint - 30)
                # range_end = min(len(data_3py1), midpoint + 30 + 1)
                # range_indices = np.arange(range_start, range_end)
                # values = data_3py1[range_indices]
                # 获取目标形状
                target_shape = (len(unique_numbers_array), len(medy_1))

                # 检查是否可以重塑
                if np.prod(target_shape) != z.size:
                    self.logRefresh_func(f"无法将{os.path.basename(file_path)}数组Z重塑为目标形状，因为元素数量不匹配")
                    # raise ValueError("无法将数组重塑为目标形状，因为元素数量不匹配")

                # 应用 reshape 方法
                reshaped_Z = z.reshape(target_shape)
                # max_index = np.argmax(reshaped_Z[py1[0],:])
                px1 = np.nanargmax(reshaped_Z[py1[0], :])
                max_med = reshaped_Z[py1[0], px1]
                data_3py1 = reshaped_Z[py1[0], :]
                # max_med = np.max(values)
                # max_index = np.argmax(values)
                # px1 = range_indices[max_index]
                medz_1 = data_3py1 - max_med
                medy1_1 = (medy_1 - medy_1[px1]) * zygopixel

                newxz1 = np.vstack((medy1_1, medz_1)).T
                newxz1_1 = newxz1[~np.isnan(newxz1).any(axis=1)]
                res = {'file_name': file_path, 'direction': 'X', 'X_data': np.round(newxz1_1[:, 0], 3),
                       'Y_data': None,
                       'Z_data': np.round(newxz1_1[:, 1], 6)}
                with open(filepathout, 'w') as fid1:
                    for row in newxz1_1:
                        fid1.write('%6.3f %12.6f\n' % (row[0], row[1]))

            # return filepathout

        except Exception as e:
            self.logRefresh_func(f"文件{os.path.basename(file_path)}由XYZ转换成YZ未成功，因为元素数量不匹配")
            logger.info(f"文件{os.path.basename(file_path)}由XYZ转换成YZ未成功，因为元素数量不匹配")

        return res

    def test_process_file_format_xyz(self):
        import numpy as np
        file_path = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480\xyz.xyz"  # 替换为你的文件路径

        output_excel = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480\output_data_XYZ_CA480.xlsx"  # 输出 Excel 文件路径

        # process_file_format_xyz(file_path, output_excel)
        z_matrix = process_file_format_xyz(file_path, output_excel)
        print(z_matrix.shape)  # 输出 Z 数组的形状 (Y, X)

    def test_process_file_format_xyz_2(self):
        """
        1. 通过这个函数将xyz数据转化成Excel，便于查看
        :return:
        """
        import numpy as np
        file_path_1 = r"D:\002-project\005-面拟合\003-28#-AL-1218-CA435\xyz.xyz"  # 替换为实际需要转化的xyz文件路径

        output_excel = r"D:\002-project\005-面拟合\003-28#-AL-1218-CA435\output_data_XYZ_CA435.xlsx"  # 输出 Excel 文件路径

        # process_file_format_xyz(file_path, output_excel)
        z_matrix = process_file_format_xyz(file_path_1, output_excel)
        print(z_matrix.shape)  # 输出 Z 数组的形状 (Y, X)

    def test_one_file_trans(self):
        # 启动本地客户端，也可以连接到远程集群
        folder_handle_input = {'filepathout': 'D:/002-project/002-FullTest/111-test_out2',
                               'filepathpr': 'D:/002-project/002-FullTest/自动拟合程序/test_input/8寸',
                               'ifselectx1': True, 'ifselectx2': True,
                               'ifselecty1': True, 'ifselecty2': False,
                               'markerfile': 'D:/002-project/002-FullTest/自动拟合程序/标记点',
                               'spottestfile': 'D:/002-project/002-FullTest/自动拟合程序/抽测汇总.xlsx'}
        # filepath = 'D:\\002-project\\002-FullTest\\自动拟合程序\\SIL085全测\\6寸'
        filepath = 'D:\\002-project\\002-FullTest\\自动拟合程序\\test_input\\8寸'
        case = FileWorkerThread(folder_handle_input)
        file_paths = filepath
        resu = []
        for file in file_paths:
            res_1 = case.process_file_format_new(file)
            res_2 = case.process_file_format_y_new(file)
            resu.append(res_1)
        return resu

    def test_read_datx_file(self):
        import h5py
        import numpy as np
        import matplotlib.pyplot as plt

        # 1️⃣  读取 .datx 文件
        file_path = r"D:\002-project\005-面拟合\28#-AL-1218.datx"  # 替换为你的文件路径
        # with h5py.File(file_path, "r") as f:
        #     print("HDF5 文件结构：")
        #     f.visit(print)  # 打印文件结构，查看存在哪些数据
        #
        #     # 2️⃣  读取表面高度数据
        #     data_path = "Data/Surface"  # 可能不同，需检查 f.visit(print) 输出
        #     if data_path in f:
        #         surface_data = f[data_path][:]
        #     else:
        #         raise ValueError(f"未找到 {data_path} 数据，请检查文件结构！")
        #
        # # 3️⃣  可视化表面形貌
        # plt.imshow(surface_data, cmap="jet")
        # plt.colorbar(label="高度 (um)")
        # plt.title("干涉仪表面数据")
        # plt.show()
        with h5py.File(file_path, "r") as f:
            def print_hdf5_structure(name, obj):
                """遍历 HDF5 文件结构，打印数据集形状和类型"""
                if isinstance(obj, h5py.Dataset):
                    print(f"📂 数据集: {name} | 形状: {obj.shape} | 类型: {obj.dtype}")

            # 递归遍历整个 HDF5 文件结构
            f.visititems(print_hdf5_structure)

    def test_read_and_save_datx_file(self):
        import h5py
        import os
        import pandas as pd
        from docx import Document
        import numpy as np

        # ------------- 配置 -------------
        datx_file = r"D:\002-project\005-面拟合\28#-AL-1218-CA435.datx"  # 你的 .datx 文件路径
        output_folder = r"D:\002-project\005-面拟合\output_data_CA435"  # 输出的根文件夹
        save_format = "excel"  # 可选："excel", "csv", "txt", "word"

        # 创建输出目录
        os.makedirs(output_folder, exist_ok=True)

        # 创建 Word 文档（用于存储所有文本数据）
        word_doc = Document()
        word_doc.add_heading('HDF5 数据转换', level=1)

        def save_data(name, obj):
            """ 处理 HDF5 数据集并保存 """
            if isinstance(obj, h5py.Dataset):  # 只处理数据集
                rel_path = name.replace("/", "_")  # 替换路径中的 `/`，以免创建非法文件名
                file_path = os.path.join(output_folder, rel_path)

                try:
                    data = obj[()]  # 读取数据
                except Exception as e:
                    print(f"❌ 无法读取 {name}: {e}")
                    return

                # 1️⃣ 处理数值数据 (int, float)
                if isinstance(data, np.ndarray) and data.dtype.kind in {"i", "f"}:
                    df = pd.DataFrame(data)

                    if save_format == "excel":
                        file_path += ".xlsx"
                        df.to_excel(file_path, index=False)
                    else:
                        file_path += ".csv"
                        df.to_csv(file_path, index=False)

                    print(f"✅ 数值数据已保存: {file_path}")

                # 2️⃣ 处理文本数据 (string)
                elif data.dtype.kind == "S":  # S = 字符串 (bytes)
                    text = data[()].tobytes().decode("utf-8", errors="ignore")
                    file_path += ".txt"

                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(text)

                    # 也写入 Word 文档
                    word_doc.add_heading(name, level=2)
                    word_doc.add_paragraph(text)

                    print(f"✅ 文本数据已保存: {file_path}")

        # ------------- 遍历 HDF5 文件 -------------
        with h5py.File(datx_file, "r") as f:
            f.visititems(save_data)

        # 保存 Word 文档
        word_path = os.path.join(output_folder, "HDF5_Text_Data.docx")
        word_doc.save(word_path)
        print(f"📄 Word 文档已保存: {word_path}")

        print(f"🎉 数据成功转换并保存到 {output_folder}")

    def test_read_and_save_datx_file_2(self):
        import h5py
        import os
        import pandas as pd
        from docx import Document
        import numpy as np
        import json

        # ------------- 配置 -------------
        datx_file = r"D:\002-project\005-面拟合\28#-AL-1218-CA480\datx.datx"  # 你的 .datx 文件路径
        output_folder = r"D:\002-project\005-面拟合\28#-AL-1218-CA480\001-datx_trans_output"  # 输出的根文件夹
        save_format = "excel"  # 可选："excel", "csv", "txt", "word"

        # 创建输出目录
        os.makedirs(output_folder, exist_ok=True)

        # 创建 Word 文档（用于存储所有文本数据）
        word_doc = Document()
        word_doc.add_heading('HDF5 数据转换', level=1)

        def save_data(name, obj):
            """ 处理 HDF5 数据集并保存 """
            if isinstance(obj, h5py.Dataset):  # 只处理数据集
                rel_path = name.replace("/", "_")  # 替换路径中的 `/`，以免创建非法文件名
                file_path = os.path.join(output_folder, rel_path)

                try:
                    data = obj[()]  # 读取数据
                except Exception as e:
                    print(f"❌ 无法读取 {name}: {e}")
                    return

                # 1️⃣ 处理数值数据 (int, float)
                if isinstance(data, np.ndarray) and data.dtype.kind in {"i", "f"}:
                    df = pd.DataFrame(data)

                    if save_format == "excel":
                        file_path += ".xlsx"
                        df.to_excel(file_path, index=False)
                    else:
                        file_path += ".csv"
                        df.to_csv(file_path, index=False)

                    print(f"✅ 数值数据已保存: {file_path}")

                # 2️⃣ 处理文本数据 (string)
                elif data.dtype.kind == "S":  # S = 字符串 (bytes)
                    text = data[()].tobytes().decode("utf-8", errors="ignore")
                    file_path += ".txt"

                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(text)

                    # 也写入 Word 文档
                    word_doc.add_heading(name, level=2)
                    word_doc.add_paragraph(text)

                    print(f"✅ 文本数据已保存: {file_path}")

                # 3️⃣ 处理结构化数据 (uint8, object)
                elif data.dtype.kind in {"u", "O"}:  # uint8, 复杂数据类型
                    try:
                        json_data = data.tolist()  # 转换为 Python 列表
                        file_path += ".json"

                        with open(file_path, "w", encoding="utf-8") as f:
                            json.dump(json_data, f, indent=4)

                        print(f"✅ 结构化数据已保存: {file_path}")
                    except Exception as e:
                        print(f"❌ 结构化数据转换失败 {name}: {e}")

        # ------------- 遍历 HDF5 文件 -------------
        with h5py.File(datx_file, "r") as f:
            f.visititems(save_data)

        # 保存 Word 文档
        word_path = os.path.join(output_folder, "HDF5_Text_Data.docx")
        word_doc.save(word_path)
        print(f"📄 Word 文档已保存: {word_path}")

        print(f"🎉 数据成功转换并保存到 {output_folder}")

    def test_read_and_save_datx_file_3(self):
        import h5py
        import os
        import pandas as pd
        from docx import Document
        import numpy as np

        # ------------- 配置 -------------
        datx_file = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\datx.datx"  # 你的 .datx 文件路径
        output_folder = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\001-datx_trans_output"  # 输出的根文件夹
        save_format = "excel"  # 可选："excel", "csv", "txt", "word"

        # 创建输出目录
        os.makedirs(output_folder, exist_ok=True)

        # 创建 Word 文档（用于存储所有文本数据）
        word_doc = Document()
        word_doc.add_heading('HDF5 数据转换', level=1)

        def save_data(name, obj):
            """ 处理 HDF5 数据集并保存 """
            if isinstance(obj, h5py.Dataset):  # 只处理数据集
                rel_path = name.replace("/", "_")  # 替换路径中的 `/`，以免创建非法文件名
                file_path = os.path.join(output_folder, rel_path)

                try:
                    data = obj[()]  # 读取数据
                except Exception as e:
                    print(f"❌ 无法读取 {name}: {e}")
                    return

                # 1️⃣ 处理数值数据 (int, float)
                if isinstance(data, np.ndarray) and data.dtype.kind in {"i", "f"}:
                    df = pd.DataFrame(data)

                    # 处理 #NULL! 作为空值
                    df.replace("#NULL!", np.nan, inplace=True)

                    # 根据保存格式选择保存方式
                    if save_format == "excel":
                        file_path += ".xlsx"
                        df.to_excel(file_path, index=False)
                    else:
                        file_path += ".csv"
                        df.to_csv(file_path, index=False)

                    print(f"✅ 数值数据已保存: {file_path}")

                # 2️⃣ 处理文本数据 (string)
                elif data.dtype.kind == "S":  # S = 字符串 (bytes)
                    text = data[()].tobytes().decode("utf-8", errors="ignore")
                    file_path += ".txt"

                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(text)

                    # 也写入 Word 文档
                    word_doc.add_heading(name, level=2)
                    word_doc.add_paragraph(text)

                    print(f"✅ 文本数据已保存: {file_path}")

        # ------------- 遍历 HDF5 文件 -------------
        with h5py.File(datx_file, "r") as f:
            f.visititems(save_data)

        # 保存 Word 文档
        word_path = os.path.join(output_folder, "HDF5_Text_Data.docx")
        word_doc.save(word_path)
        print(f"📄 Word 文档已保存: {word_path}")

        print(f"🎉 数据成功转换并保存到 {output_folder}")

    def test_read_and_save_datx_file_4(self):
        import h5py
        import os
        import pandas as pd
        from docx import Document
        import numpy as np

        # ------------- 配置 -------------
        datx_file = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\datx.datx"  # 你的 .datx 文件路径
        output_folder = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\001-datx_trans_output"  # 输出的根文件夹
        save_format = "excel"  # 可选："excel", "csv", "txt", "word"

        # 创建输出目录
        os.makedirs(output_folder, exist_ok=True)

        # 创建 Word 文档（用于存储所有文本数据）
        word_doc = Document()
        word_doc.add_heading('HDF5 数据转换', level=1)

        def save_data(name, obj):
            """ 处理 HDF5 数据集并保存 """
            if isinstance(obj, h5py.Dataset):  # 只处理数据集
                rel_path = name.replace("/", "_")  # 替换路径中的 `/`，以免创建非法文件名
                file_path = os.path.join(output_folder, rel_path)

                try:
                    data = obj[()]  # 读取数据
                except Exception as e:
                    print(f"❌ 无法读取 {name}: {e}")
                    return

                # 1️⃣ 处理数值数据 (int, float)
                if isinstance(data, np.ndarray) and data.dtype.kind in {"i", "f"}:
                    df = pd.DataFrame(data)

                    # 替换所有可能的无效值为 NaN
                    df.replace("#NULL!", np.nan, inplace=True)  # 将 #NULL! 替换为 NaN
                    df.replace("", np.nan, inplace=True)  # 将空字符串替换为 NaN
                    df.replace("NULL", np.nan, inplace=True)  # 将 "NULL" 替换为 NaN

                    # 根据保存格式选择保存方式
                    if save_format == "excel":
                        file_path += ".xlsx"
                        # 将 NaN 替换为空字符串，并写入 Excel
                        df.to_excel(file_path, index=False, na_rep="")
                    else:
                        file_path += ".csv"
                        # 将 NaN 替换为空字符串，并写入 CSV
                        df.to_csv(file_path, index=False, na_rep="")

                    print(f"✅ 数值数据已保存: {file_path}")

                # 2️⃣ 处理文本数据 (string)
                elif data.dtype.kind == "S":  # S = 字符串 (bytes)
                    text = data[()].tobytes().decode("utf-8", errors="ignore")
                    file_path += ".txt"

                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(text)

                    # 也写入 Word 文档
                    word_doc.add_heading(name, level=2)
                    word_doc.add_paragraph(text)

                    print(f"✅ 文本数据已保存: {file_path}")

        # ------------- 遍历 HDF5 文件 -------------
        with h5py.File(datx_file, "r") as f:
            f.visititems(save_data)

        # 保存 Word 文档
        word_path = os.path.join(output_folder, "HDF5_Text_Data.docx")
        word_doc.save(word_path)
        print(f"📄 Word 文档已保存: {word_path}")

        print(f"🎉 数据成功转换并保存到 {output_folder}")

    def test_cut_excel_data_and_save(self):

        # 读取 Excel 文件
        file_path = r"D:\002-project\005-面拟合\001-base_data\output_data.xlsx"  # 基础 Excel 文件路径
        df = pd.read_excel(file_path, index_col=0)  # 假设第一列是行索引

        # 设定需要的行列范围
        row_start, row_end = 260, 758  # 目标行范围
        col_start, col_end = 233, 731  # 目标列范围

        # **转换索引类型**
        df.index = df.index.astype(int)  # 确保行索引是整数
        df.columns = df.columns.astype(int)  # 确保列名是整数

        # **筛选数据**
        filtered_df = df.loc[row_start:row_end, col_start:col_end]

        # **保存提取的数据**
        filtered_df.to_excel(r"D:\002-project\005-面拟合\003-28#-AL-1218-CA435\filtered_data_CA435.xlsx", index=True)

        print("✅ 数据提取完成，已保存为 filtered_data.xlsx")

    def test_calculate_surface_values(self):
        # 参数定义
        current_roc = 1023.787
        current_conic = -2.75
        A4, A6, A8, A10, A12, A14, A16 = (0, 0, 0, 0, 0, 0, 0)  # 示例系数

        # 计算结果
        y_values = calculate_surface_values_2(start_row=234, start_col=207, row_count=551, col_count=551,
                                              current_roc=current_roc,
                                              current_conic=current_conic,
                                              A4=A4, A6=A6, A8=A8, A10=A10,
                                              A12=A12, A14=A14, A16=A16)

        # 转为 DataFrame 并保存到 Excel
        # df_result = pd.DataFrame(y_values)
        df_result = y_values
        df_result.to_excel(r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480\calculated_surface_CA480.xlsx", index=True,
                           header=True)

        print("✅ 计算完成，数据已保存为 'calculated_surface_CA480.xlsx'")

    def test_calculate_surface_values_modified(self):
        # 参数定义
        current_roc = 1023.787
        current_conic = -2.75
        A4, A6, A8, A10, A12, A14, A16 = (0, 0, 0, 0, 0, 0, 0)  # 示例系数
        A4, A6, A8, A10, A12, A14, A16 = (1, 1, 1, 1, 1, 1, 1)  # 示例系数
        # 计算结果
        y_values = calculate_surface_values_modified(start_row=234, start_col=207, row_count=551, col_count=551,
                                                     current_roc=current_roc,
                                                     current_conic=current_conic,
                                                     A4=A4, A6=A6, A8=A8, A10=A10,
                                                     A12=A12, A14=A14, A16=A16)

        # 转为 DataFrame 并保存到 Excel
        # df_result = pd.DataFrame(y_values)
        df_result = y_values
        df_result.to_excel(r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480\calculated_surface_by_middle_CA480.xlsx",
                           index=True,
                           header=True)

        print("✅ 计算完成，数据已保存为 'calculated_surface_CA480.xlsx'")

    def test_calculate_surface_values_modified_max(self):
        """
        1. 测试根据中心点为直径最大的点，然后算出其他位置的数据
        :return:
        """
        # 参数定义
        current_roc = 1023.787
        current_conic = -2.75
        max_r = round(0.87187 * 692 / 2, 3)
        # max_r = round(0.87187 * 692, 3)
        A4, A6, A8, A10, A12, A14, A16 = (0, 0, 0, 0, 0, 0, 0)  # 示例系数
        # A4, A6, A8, A10, A12, A14, A16 = (1, 1, 1, 1, 1, 1, 1)  # 示例系数
        # 计算结果
        y_values = calculate_surface_values_modified_max(start_row=234, start_col=207, row_count=551, col_count=551,
                                                         current_roc=current_roc,
                                                         current_conic=current_conic, max_r=max_r,
                                                         A4=A4, A6=A6, A8=A8, A10=A10,
                                                         A12=A12, A14=A14, A16=A16)

        # 转为 DataFrame 并保存到 Excel
        # df_result = pd.DataFrame(y_values)
        df_result = y_values
        df_result.to_excel(
            r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\calculated_surface_by_middle_CA480_scale.xlsx",
            index=True,
            header=True)

        print("✅ 计算完成，数据已保存为 'calculated_surface_CA480.xlsx'")

    def test_calculate_surface_values_modified_max_2(self):
        """
        1. 测试根据中心点为直径最大的点，然后算出其他位置的数据
        :return:
        """
        # 参数定义
        current_roc = 1023.787
        current_conic = -2.75
        # max_r = round(0.87187 * 692 / 2, 3)
        max_r = round(692 / 2, 3)
        # max_r = round(0.87187 * 692, 3)
        A4, A6, A8, A10, A12, A14, A16 = (0, 0, 0, 0, 0, 0, 0)  # 示例系数
        # A4, A6, A8, A10, A12, A14, A16 = (1, 1, 1, 1, 1, 1, 1)  # 示例系数
        # 计算结果
        y_values = calculate_surface_values_modified_max_3(start_row=234, start_col=207, row_count=551, col_count=551,
                                                           current_roc=current_roc,
                                                           current_conic=current_conic, max_r=max_r,
                                                           A4=A4, A6=A6, A8=A8, A10=A10,
                                                           A12=A12, A14=A14, A16=A16)

        # 转为 DataFrame 并保存到 Excel
        # df_result = pd.DataFrame(y_values)
        df_result = y_values
        df_result.to_excel(
            r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\calculated_surface_by_middle_CA480_change.xlsx",
            index=True,
            header=True)

        print("✅ 计算完成，数据已保存为 'calculated_surface_CA480.xlsx'")

    def test_subtract_data(self):
        """
        测试计算出的Z值和原Z的差值delta
        :return:
        """
        # 示例调用
        base_file = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\calculated_surface_by_middle_CA480_change_processed_del_nan_mean.xlsx"
        compare_file = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\base_filtered_data_CA480_processed_mean.xlsx"
        output_file = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\delta_data_middle_CA480_使用ZMAX减去距离_各行取平均值.xlsx"
        subtract_excel_files(base_file, compare_file, output_file)

    def test_align_to_reference(self):
        """
        将目标 Excel 文件调整为与基准 Excel 文件相同
        :param reference_path: 基准 Excel 文件路径
        :param target_path: 目标 Excel 文件路径
        :param output_path: 输出 Excel 文件路径
        """
        # 读取基准 Excel 文件
        reference_path = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\base_filtered_data_CA480_processed.xlsx"
        target_path = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\calculated_surface_by_middle_CA480_change_processed.xlsx"
        output_path = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\calculated_surface_by_middle_CA480_change_processed_del_nan.xlsx"
        reference_df = pd.read_excel(reference_path, header=None)

        # 读取目标 Excel 文件
        target_df = pd.read_excel(target_path, header=None)

        # 确保目标文件和基准文件的形状相同
        if reference_df.shape != target_df.shape:
            raise ValueError("基准文件和目标文件的形状不一致！")

        # 根据基准文件调整目标文件
        for i in range(reference_df.shape[0]):  # 遍历行
            for j in range(reference_df.shape[1]):  # 遍历列
                if pd.isna(reference_df.iloc[i, j]) or reference_df.iloc[i, j] == "":  # 基准文件无值
                    target_df.iloc[i, j] = np.nan  # 目标文件对应位置设置为无值

        # 保存调整后的 Excel 文件
        target_df.to_excel(output_path, index=False, header=False)
        print(f"✅ 已调整并保存文件: {output_path}")

    def test_excel_add(self):
        # ------------- 配置 -------------
        # 两个 Excel 文件的路径
        file1_path = r"D:\002-project\excel1.xlsx"  # 第一个 Excel 文件
        file2_path = r"D:\002-project\excel2.xlsx"  # 第二个 Excel 文件

        # 结果文件路径
        output_path = r"D:\002-project\excel_sum_result.xlsx"

        # 读取 Excel 文件（首行、首列作为索引）
        df1 = pd.read_excel(file1_path, header=0, index_col=0)
        df2 = pd.read_excel(file2_path, header=0, index_col=0)

        # 检查数据是否维度一致
        if df1.shape != df2.shape:
            raise ValueError("❌ 两个 Excel 文件的形状不匹配，无法进行加和操作！")

        # ------------- 数据处理 -------------
        # 仅对除首行、首列之外的数据进行加和
        result_df = df1.add(df2, fill_value=0)  # fill_value=0 处理 NaN 情况

        # ------------- 保存结果 -------------
        # 保存加和后的结果到新的 Excel 文件
        result_df.to_excel(output_path)

        print(f"✅ 数据加和完成，结果已保存到: {output_path}")


class PlotTestCase(unittest.TestCase):
    def test_process_3d_plot(self):
        # file_path = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\base_delta_data_XYZ_CA480.xlsx"
        file_path = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V4\002-plot_data\delta_data_CA480_V3_r=350_diff_mean.xlsx"
        # dat = pd.read_excel(file_path)

        # 1. 读取 Excel 文件
        # file_path = 'your_excel_file.xlsx'  # 修改为你的 Excel 文件路径
        # df = pd.read_excel(file_path, header=0, index_col=0)
        # 读取 Excel 文件
        # 读取 Excel 文件，替换 inf 和 NaN
        # df = pd.read_excel(file_path, header=0, index_col=0, na_values=['inf', '-inf', 'NaN'])
        df = pd.read_excel(file_path, header=0, index_col=0, na_values=['#NULL!'])
        # df = pd.read_excel(file_path, header=0, index_col=0)
        #
        # # 检查并替换无效数据
        # df.replace([np.inf, -np.inf, np.nan], 0, inplace=True)  # 替换为 0 或其他默认值

        # 2. 解析数据
        x = df.columns.values  # 读取 X 坐标
        y = df.index.values  # 读取 Y 坐标
        X, Y = np.meshgrid(x, y)  # 创建网格
        Z = df.values  # 读取 Z 数据

        # 3. 绘制 3D 图
        fig = plt.figure(figsize=(10, 8))
        ax = fig.add_subplot(111, projection='3d')

        # 🎨 修改 cmap 颜色映射
        cmap_choice = 'viridis'  # 这里可以更换成其他 colormap
        surf = ax.plot_surface(X, Y, Z, cmap=cmap_choice)

        # 4. 添加颜色条
        fig.colorbar(surf, shrink=0.5, aspect=5)

        # 5. 设置标签
        ax.set_xlabel('X Label')
        ax.set_ylabel('Y Label')
        ax.set_zlabel('Z Label')
        ax.set_title(f'delta data CA435')

        # 6. 显示图像
        plt.show()

    def test_process_3d_plot_all(self):
        import pandas as pd
        import numpy as np
        import matplotlib.pyplot as plt
        from mpl_toolkits.mplot3d import Axes3D

        # 1. 读取 Excel 文件路径
        # file_paths = ['file1.xlsx', 'file2.xlsx', 'file3.xlsx']  # 修改成你的 Excel 文件路径
        # file_paths = [R"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\002-plot_data\base_filtered_data_CA480.xlsx",
        #               R"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\002-plot_data\Data_Surface_CA480.xlsx",
        #               R"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\002-plot_data\base_delta_data_XYZ_CA480.xlsx",]
        file_paths = [R"D:\002-project\005-面拟合\003-28#-AL-1218-CA435\002-plot_data\filtered_data_CA435.xlsx",
                      R"D:\002-project\005-面拟合\003-28#-AL-1218-CA435\002-plot_data\Data_Surface_CA435.xlsx",
                      R"D:\002-project\005-面拟合\003-28#-AL-1218-CA435\002-plot_data\output_data_XYZ_CA435.xlsx", ]
        # base_file = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\calculated_surface_by_middle_CA480_change_processed.xlsx"
        # compare_file = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\base_filtered_data_CA480_processed.xlsx"
        # output_file = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\delta_data_middle_CA480_使用ZMAX减去距离.xlsx"
        base_file = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V4\002-plot_data\base_filtered_data_CA480_diff_max.xlsx"
        compare_file = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V4\002-plot_data\compute_data_CA480_diff_max_V2_2.xlsx"
        output_file = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V4\002-plot_data\delta_data_CA480_diff_max_V2_2.xlsx"
        file_paths = [base_file, compare_file, output_file]
        titles = ['DATA_SURFACE_caculate CA480', 'DATA_SURFACE_zygo CA480', 'delta_data CA480']  # 每个子图的标题
        cmap_list = ['viridis', 'coolwarm', 'plasma']  # 选择不同的 cmap 颜色

        # 2. 创建图形窗口
        fig = plt.figure(figsize=(15, 5))  # 设置图的大小

        # 3. 读取和绘制每个 Excel 的数据
        for i, file_path in enumerate(file_paths):
            # 读取 Excel 数据
            df = pd.read_excel(file_path, header=0, index_col=0)

            # 解析数据
            x = df.columns.values  # 读取 X 轴坐标
            y = df.index.values  # 读取 Y 轴坐标
            X, Y = np.meshgrid(x, y)  # 创建网格
            Z = df.values  # 读取 Z 数据

            # 4. 创建子图
            ax = fig.add_subplot(1, 3, i + 1, projection='3d')  # 1 行 3 列
            surf = ax.plot_surface(X, Y, Z, cmap=cmap_list[i])

            # 5. 设置标题和标签
            ax.set_title(titles[i])
            ax.set_xlabel('X Label')
            ax.set_ylabel('Y Label')
            ax.set_zlabel('Z Label')

            # 6. 添加颜色条
            fig.colorbar(surf, ax=ax, shrink=0.5, aspect=5)

        # 7. 调整布局，避免重叠
        plt.tight_layout()

        # 8. 显示图像
        plt.show()

    def test_process_3d_plot_all_2(self):
        import pandas as pd
        import numpy as np
        import matplotlib.pyplot as plt
        from mpl_toolkits.mplot3d import Axes3D

        # 1. 读取 Excel 文件路径
        # file_paths = ['file1.xlsx', 'file2.xlsx', 'file3.xlsx']  # 修改成你的 Excel 文件路径
        # file_paths = [R"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\002-plot_data\base_filtered_data_CA480.xlsx",
        #               R"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\002-plot_data\Data_Surface_CA480.xlsx",
        #               R"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\002-plot_data\base_delta_data_XYZ_CA480.xlsx",]
        file_paths = [
            R"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\calculated_surface_by_middle_CA480_change.xlsx",
            R"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\base_filtered_data_CA480.xlsx",
        ]
        titles = ['DATA_SURFACE CA480', 'zygo_DATA_SURFACE CA480']  # 每个子图的标题
        cmap_list = ['viridis', 'coolwarm']  # 选择不同的 cmap 颜色

        # 2. 创建图形窗口
        fig = plt.figure(figsize=(15, 5))  # 设置图的大小

        # 3. 读取和绘制每个 Excel 的数据
        for i, file_path in enumerate(file_paths):
            # 读取 Excel 数据
            df = pd.read_excel(file_path, header=0, index_col=0)

            # 解析数据
            x = df.columns.values  # 读取 X 轴坐标
            y = df.index.values  # 读取 Y 轴坐标
            X, Y = np.meshgrid(x, y)  # 创建网格
            Z = df.values  # 读取 Z 数据

            # 4. 创建子图
            ax = fig.add_subplot(1, 3, i + 1, projection='3d')  # 1 行 3 列
            surf = ax.plot_surface(X, Y, Z, cmap=cmap_list[i])

            # 5. 设置标题和标签
            ax.set_title(titles[i])
            ax.set_xlabel('X Label')
            ax.set_ylabel('Y Label')
            ax.set_zlabel('Z Label')

            # 6. 添加颜色条
            fig.colorbar(surf, ax=ax, shrink=0.5, aspect=5)

        # 7. 调整布局，避免重叠
        plt.tight_layout()

        # 8. 显示图像
        plt.show()

    def replace_null_in_excel(self, file_path):
        """
        直接处理 Excel 文件，将 #NULL! 替换为空单元格
        :param file_path: Excel 文件路径
        """
        # 加载 Excel 文件
        workbook = openpyxl.load_workbook(file_path)

        # 遍历每个工作表
        for sheet_name in workbook.sheetnames:
            sheet = workbook[sheet_name]

            # 遍历每个单元格
            for row in sheet.iter_rows():
                for cell in row:
                    # 检查单元格的值是否为 #NULL!
                    if cell.value == "#NULL!":
                        cell.value = None  # 替换为空值

        # 保存修改后的 Excel 文件
        workbook.save(file_path)
        print(f"✅ 已处理并保存文件: {file_path}")

    def test_handle_null_file(self):
        # 调用函数处理 Excel 文件
        excel_file_path = r"D:\002-project\005-面拟合\003-28#-AL-1218-CA435\001-datx_trans_output_data_CA435\Data_Surface_{563AD1E6-99EE-41CA-951E-1F392BA6B974}.xlsx"
        self.replace_null_in_excel(excel_file_path)

    def test_subtract_max_value_with_pandas(self):
        """
        使用 pandas 将 Excel 表格中除去首行和首列的数据全部减去全局最大值
        :param file_path: Excel 文件路径
        """
        file_path = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\calculated_surface_by_middle_CA480_change.xlsx"
        # 读取 Excel 文件
        df = pd.read_excel(file_path, header=None)  # 不将首行作为列名

        # 找到除去首行和首列的全局最大值
        data = df.iloc[1:, 1:]  # 跳过首行和首列
        max_value = data.max().max()  # 找到全局最大值

        print(f"📊 全局最大值为: {max_value}")

        # 减去全局最大值
        df.iloc[1:, 1:] = data - max_value

        # 保存修改后的 Excel 文件
        output_path = file_path.replace(".xlsx", "_processed.xlsx")  # 新文件名
        df.to_excel(output_path, index=False, header=False)  # 不保存索引和列名
        print(f"✅ 已处理并保存文件: {output_path}")

    def test_process_excel_data(self):
        # 读取Excel文件
        input_file = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\calculated_surface_by_middle_CA480_change_processed_del_nan.xlsx"
        output_file = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V3\calculated_surface_by_middle_CA480_change_processed_del_nan_mean.xlsx"

        # 读取Excel文件
        df = pd.read_excel(input_file)

        # 提取数值部分（去除第一列和第一行）
        # 假设第一列为行标识，第一行为列标题
        first_column = df.iloc[:, 0]  # 首列数据
        data = df.iloc[1:, 1:].values  # 数值部分，转换为numpy数组

        # 初始化一个与原数据相同大小的矩阵用于存储处理后的数据
        processed_data = np.zeros_like(data, dtype=float)

        # 遍历每一行，减去该行的平均值
        for i in range(data.shape[0]):  # 按行遍历
            row_mean = np.nanmean(data[i, :])  # 计算该行的平均值（忽略NaN）
            processed_data[i, :] = data[i, :] - row_mean  # 每行减去平均值

        # 创建一个新的DataFrame，包含处理后的数据和原始首行、首列
        processed_df = pd.DataFrame(processed_data, columns=df.columns[1:])  # 使用原始列标题
        processed_df.insert(0, df.columns[0], first_column[1:])  # 插入首列数据

        # 将处理后的数据保存到新的Excel文件
        processed_df.to_excel(output_file, index=False)

        print(f"处理完成，结果已保存到: {output_file}")


class FullTestCaseNew(unittest.TestCase):

    def test_calculate_surface_values_modified_max_new(self):
        """
        1. 读取 Excel 数据，根据有效区域计算 Y 值
        2. 计算完成后，将结果保存到 Excel 文件
        """
        # ---------------------------
        # 读取 Excel 文件，获取 mask
        # ---------------------------
        excel_path = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V4\base_filtered_data_CA480.xlsx"
        mask_df = pd.read_excel(excel_path, index_col=0)  # 读取 Excel 数据

        # ---------------------------
        # 参数定义
        # ---------------------------
        current_roc = 1023.787
        current_conic = -2.75
        # max_r = round(0.87187 * 692 / 2, 3)  # 计算最大半径
        max_r = 350
        A4, A6, A8, A10, A12, A14, A16 = (0, 0, 0, 0, 0, 0, 0)  # 高阶系数

        # ---------------------------
        # 计算表面 Y 值矩阵
        # ---------------------------
        df_result = self.calculate_surface_values_modified_max_2(
            mask_df=mask_df,
            current_roc=current_roc,
            current_conic=current_conic,
            max_r=max_r,
            A4=A4, A6=A6, A8=A8, A10=A10,
            A12=A12, A14=A14, A16=A16
        )

        # ---------------------------
        # 结果保存到 Excel
        # ---------------------------
        output_path = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V4\002-plot_data\compute_data_CA480_Negative_V3_r=350.xlsx"
        df_result.to_excel(output_path, index=True, header=True)

        print(f"✅ 计算完成，数据已保存为 '{output_path}'")

    def calculate_surface_values_modified_max_2(self, mask_df, current_roc, current_conic, max_r, A4, A6, A8, A10, A12,
                                                A14, A16):
        """
        根据 Excel 中有效位置的 mask 计算指定范围的 Y 值，并进行最大值反转处理

        :param mask_df: 读取的 Excel 数据 (DataFrame)，其中非空位置为有效计算点
        :param current_roc: 曲率半径 (ROC)
        :param current_conic: 二次曲率 (conic)
        :param max_r: 最大半径
        :param A4, A6, A8, A10, A12, A14, A16: 高阶系数
        :return: 计算后的 (row_count × col_count) 矩阵
        """
        # ---------------------------
        # 常数定义
        # ---------------------------
        scale_factor = 0.87187
        c = 1.0 / current_roc  # ROC 倒数

        # 获取有效的行、列索引
        valid_mask = ~mask_df.isna()  # 只有非空位置作为有效计算点
        # row_indices = mask_df.index.to_numpy()
        # col_indices = mask_df.columns.to_numpy()
        col_indices = mask_df.index.to_numpy()
        row_indices = mask_df.columns.to_numpy()
        # # 计算中位数
        # mid_row = (row_indices.max() + row_indices.min()) // 2
        # mid_col = (col_indices.max() + col_indices.min()) // 2
        max_value = np.nanmax(mask_df.values)
        print(f"🚀 全局最大值：{max_value}")

        # ---------------------------
        # 找到最大值的行、列索引
        # ---------------------------
        # 获取最大值的布尔掩码
        max_mask = mask_df == max_value

        # 找到第一个最大值的位置（行列索引）
        row_index, col_index = np.where(max_mask)
        mid_col = mask_df.index[row_index[0]]
        mid_row = mask_df.columns[col_index[0]]  # 获取列名
        # ---------------------------
        # 计算相对坐标 (以中位数为原点)
        # ---------------------------
        x_rel, y_rel = np.meshgrid(row_indices - mid_row, col_indices - mid_col, indexing='ij')

        # ---------------------------
        # 计算距离与半径
        # ---------------------------
        # 计算每个点到中心的距离
        distance_from_center = scale_factor * np.sqrt(x_rel ** 2 + y_rel ** 2)

        # 只计算有效 mask 范围内的点
        x_in_range = np.where(valid_mask, distance_from_center, np.nan)

        # ---------------------------
        # 计算 y 值 (表面高度)
        # ---------------------------
        y_values = np.full(x_in_range.shape, np.nan)  # 初始化 y 值矩阵

        # 有效区域进行计算
        mask_valid = np.logical_and(~np.isnan(x_in_range), x_in_range <= max_r)

        # 计算 Y 的值 (仅对 mask 有效区域进行计算)
        y_values[mask_valid] = -(
                (c * (x_in_range[mask_valid] ** 2)) / (
                    1 + np.sqrt(1 - (1 + current_conic) * c ** 2 * x_in_range[mask_valid] ** 2))
                + A4 * (x_in_range[mask_valid] ** 4) * 1e-12
                + A6 * (x_in_range[mask_valid] ** 6) * 1e-18
                + A8 * (x_in_range[mask_valid] ** 8) * 1e-24
                + A10 * (x_in_range[mask_valid] ** 10) * 1e-30
                + A12 * (x_in_range[mask_valid] ** 12) * 1e-36
                + A14 * (x_in_range[mask_valid] ** 14) * 1e-42
                + A16 * (x_in_range[mask_valid] ** 16) * 1e-48
        )

        # ---------------------------
        # 反转 y 值：最大值处理
        # ---------------------------
        # if np.any(mask_valid):
        #     maximum = np.nanmax(y_values[mask_valid])
        #     y_values[mask_valid] = y_values[mask_valid]- maximum

        # ---------------------------
        # 转换为 DataFrame
        # ---------------------------
        df_result = pd.DataFrame(y_values, index=col_indices, columns=row_indices)
        df_result.index.name = "Row_Index"
        df_result.columns.name = "Col_Index"

        return df_result

    def test_process_excel_and_update_values(self):
        """
        读取 Excel 数据，计算全局最大值，并更新所有有效位置的数据

        :param input_path: 输入 Excel 文件路径
        :param output_path: 处理后保存的 Excel 文件路径
        """
        input_path = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V4\base_filtered_data_CA480.xlsx"
        output_path = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V4\002-plot_data\base_filtered_data_CA480_diff_max.xlsx"
        # ---------------------------
        # 读取 Excel 数据
        # ---------------------------
        df = pd.read_excel(input_path, index_col=0)  # 读取 Excel 数据
        print("✅ 数据读取完成")

        # ---------------------------
        # 计算全局最大值（忽略 NaN）
        # ---------------------------
        global_max = np.nanmax(df.values)  # 计算最大值，忽略 NaN
        print(f"🚀 全局最大值：{global_max}")

        # ---------------------------
        # 数据更新：减去全局最大值
        # ---------------------------
        updated_df = df.applymap(lambda x: x - global_max if not pd.isna(x) else np.nan)

        # ---------------------------
        # 保存到新 Excel 文件
        # ---------------------------
        updated_df.to_excel(output_path, index=True, header=True)
        print(f"✅ 数据处理完成，已保存到：{output_path}")

    def subtract_excel_files(self,base_file, compare_file, output_file, sheet_name=0):
        """
        读取两个 Excel 文件，对应位置作差，确保 base 表为空时，仍返回空值
        :param base_file: 基准 Excel 文件路径
        :param compare_file: 比较 Excel 文件路径
        :param output_file: 输出 Excel 文件路径
        :param sheet_name: 读取的表单名或索引，默认第一个表单
        """
        # 读取 Excel 文件
        base_df = pd.read_excel(base_file, sheet_name=sheet_name, index_col=0)
        compare_df = pd.read_excel(compare_file, sheet_name=sheet_name, index_col=0)

        # 确保数据尺寸一致（如果 compare_df 比 base_df 大，截取相同范围）
        compare_df = compare_df.reindex_like(base_df)

        # 计算作差，并保留 base_df 的空值
        result_df = compare_df - base_df
        result_df[base_df.isna()] = None  # base_df 为空的地方，结果仍为空

        # 保存结果到 Excel
        result_df.to_excel(output_file)

        print(f"✅ 计算完成，结果已保存至 {output_file}")

    def test_subtract_data(self):
        """
        测试计算出的Z值和原Z的差值delta
        :return:
        """
        # 示例调用
        base_file = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V4\002-plot_data\base_filtered_data_CA480_diff_max.xlsx"
        compare_file = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V4\002-plot_data\compute_data_CA480_Negative_V3_r=350.xlsx"
        output_file = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V4\002-plot_data\delta_data_CA480_V3_r=350.xlsx"
        subtract_excel_files(base_file, compare_file, output_file)


    def test_process_excel_data(self):
        """
        将delta数据做全局减去平均值的处理
        :return:
        """
        input_path = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V4\002-plot_data\delta_data_CA480_V3_r=350.xlsx"
        output_path = r"D:\002-project\005-面拟合\002-28#-AL-1218-CA480_V4\002-plot_data\delta_data_CA480_V3_r=350_diff_mean.xlsx"
        # ---------------------------
        # 读取 Excel 数据
        # ---------------------------
        df = pd.read_excel(input_path, index_col=0)  # 读取 Excel 数据
        print("✅ 数据读取完成")

        # 计算数据区域的均值（忽略首行首列）
        mean_value = np.nanmean(df.values)

        # 将数据区域的每个数据点减去均值
        df_processed = df - mean_value

        # 将处理后的数据保存为新的Excel文件
        df_processed.to_excel(output_path, index=True, header=True)

        print(f"✅ 数据处理完成，已保存为 '{output_path}'")



if __name__ == '__main__':
    unittest.main()
