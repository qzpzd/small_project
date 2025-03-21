import os
import re
def get_row_col_info(file_path):
    # 解析文件名，获取P字符后面的数字
    base_name = os.path.basename(file_path)
    print(file_path)
    str_split = base_name.split('_')
    p_index = str_split[0].find('P')
    if p_index == -1:
        raise ValueError(f"File name {base_name} does not contain 'P' character.")
    number_after_p = int(str_split[0][p_index + 1:])
    
    # 构造父目录路径
    parent_dir = os.path.dirname(os.path.dirname(file_path))
    
    # 查找目录中所有的 .txt 文件
    txt_files = [f for f in os.listdir(parent_dir) if f.endswith('.txt')]
    
    if not txt_files:
        raise FileNotFoundError(f"No .txt files found in directory {parent_dir}.")
    
    # 假设只有一个 .txt 文件符合要求，或者你可以根据需要选择特定的文件
    row_col_file_path = None
    for txt_file in txt_files:
        # 这里可以根据具体需求添加更多的文件名匹配规则
        if re.match(r'^ARL\d{3}-\d_rowcol\.txt$', txt_file):
            row_col_file_path = os.path.join(parent_dir, txt_file)
            break
    
    if not row_col_file_path:
        raise FileNotFoundError(f"No matching .txt file found in directory {parent_dir}.")
    
    # 读取文本文档并提取行和列信息
    with open(row_col_file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 假设每行包含三个或更多数值，我们提取第三个和第四个数值
    try:
        relevant_line = lines[number_after_p]  # 数组索引从0开始，所以减1
        values = relevant_line.strip().split()
        row = int(values[2])  # 第三个数值
        col = int(values[3])  # 第四个数值
    except IndexError:
        raise ValueError(f"Invalid format or index out of range in rowcol file for number {number_after_p}.")
    return row, col