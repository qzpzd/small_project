import os
def find_filedir_xz(folder_path,suf='.xz'):
    all_files = []
    for subdir, _, files in os.walk(folder_path):
        for file in files:
            if file.endswith(suf):  # 假设数据文件为文本文件
                all_files.append(os.path.join(subdir, file))
    new_all_files = [s.replace('/', '\\') for s in all_files]
    return new_all_files

# def find_filedir_xzyz(folder_path):
#     new_all_files = []
#     # 遍历 folder_path 下的所有子目录
#     for root, dirs, _ in os.walk(folder_path):
#         for sub_dir in dirs:
#             # 构建 xz 目录路径
#             xz_dir = os.path.join(root, sub_dir, 'xz')
#             if os.path.isdir(xz_dir):
#                 for sub_xz_dir, _, files in os.walk(xz_dir):
#                     for file in files:
#                         if file.endswith('.xz'):
#                             new_all_files.append(os.path.join(sub_xz_dir, file).replace('/', '\\'))

#             # 构建 yz 目录路径
#             yz_dir = os.path.join(root, sub_dir, 'yz')
#             if os.path.isdir(yz_dir):
#                 for sub_yz_dir, _, files in os.walk(yz_dir):
#                     for file in files:
#                         if file.endswith('.yz'):
#                             new_all_files.append(os.path.join(sub_yz_dir, file).replace('/', '\\'))

#     return new_all_files

import os


def find_filedir_xzyz(folder_path):
    result = []
    # 分别存储 .xz 和 .yz 文件
    xz_files = {}
    yz_files = {}

    # 遍历 folder_path 下的所有子目录
    for root, dirs, _ in os.walk(folder_path):
        for sub_dir in dirs:
            # 构建 xz 目录路径
            xz_dir = os.path.join(root, sub_dir, 'xz')
            if os.path.isdir(xz_dir):
                for sub_xz_dir, _, files in os.walk(xz_dir):
                    for file in files:
                        if file.endswith('.xz'):
                            # 提取文件名（去除扩展名）
                            base_name = os.path.splitext(file)[0]
                            file_path = os.path.join(sub_xz_dir, file).replace('/', '\\')
                            xz_files[base_name] = file_path

            # 构建 yz 目录路径
            yz_dir = os.path.join(root, sub_dir, 'yz')
            if os.path.isdir(yz_dir):
                for sub_yz_dir, _, files in os.walk(yz_dir):
                    for file in files:
                        if file.endswith('.yz'):
                            # 提取文件名（去除扩展名）
                            base_name = os.path.splitext(file)[0]
                            file_path = os.path.join(sub_yz_dir, file).replace('/', '\\')
                            yz_files[base_name] = file_path

    # 合并相同文件名的 .xz 和 .yz 文件列表
    all_base_names = set(xz_files.keys()).union(set(yz_files.keys()))
    for base_name in all_base_names:
        xz_file = xz_files.get(base_name)
        yz_file = yz_files.get(base_name)
        pair = []
        if xz_file:
            pair.append(xz_file)
        if yz_file:
            pair.append(yz_file)
        if pair:
            result.append(pair)

    return result
