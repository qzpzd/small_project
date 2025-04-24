import os


def get_xyz_row_col_info(num, base_dir, keyword):
    """
    从指定目录下的包含特定关键字的 txt 文件中获取行列信息
    :param num: 要匹配的数字
    :param base_dir: 基础目录
    :param keyword: 文件名中包含的关键字
    :return: 行和列信息，如果未找到则返回 None, None
    """
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if keyword in file and file.endswith('.txt') and (keyword == 'sequence' or 'subsequence' in file):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r') as f:
                        lines = f.readlines()[1:]  # 跳过表头
                        for line in lines:
                            parts = line.strip().split()
                            if len(parts) == 3 and int(parts[0]) == num:
                                return int(parts[1]), int(parts[2])
                except (IndexError, ValueError) as e:
                    print(f"Error processing file {file_path}: {e}")
                    # continue
    return None, None
