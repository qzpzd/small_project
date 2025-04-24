import numpy as np
import pandas as pd

def scancsv(filename):
    # 打开并读取 CSV 文件
    df = pd.read_csv(filename, header=None, skiprows=1, usecols=[0, 1], names=['x', 'z'])
    
    # 提取 x 和 z 列
    x = df['x'].values
    z = df['z'].values
    
    # 将数据合并为一个二维数组，并删除包含 NaN 的行
    xz = np.column_stack((x, z))
    xz = xz[~np.isnan(xz).any(axis=1)]
    
    # 分离 x 和 z
    x = xz[:, 0]
    z = xz[:, 1]
    
    # 找到 z 的最大值及其索引
    zmax_idx = np.argmax(z)
    zmax = z[zmax_idx]
    
    # 对 x 和 z 进行平移
    x = x - x[zmax_idx]
    z = z - zmax
    
    return x, z

# 示例调用
# if __name__ == '__main__':
#     filename = 'path/to/your/file.csv'
#     x, z = scancsv(filename)
    
#     print("X data:", x[:5])  # 打印前5个元素作为示例
#     print("Z data:", z[:5])  # 打印前5个元素作为示例