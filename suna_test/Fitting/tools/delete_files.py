import os
import glob
def delete_csv_files_in_parent_dir(file_path):
        # 获取 self.file_path 的上一级目录
        parent_dir = os.path.dirname(os.path.dirname(file_path))
        # 构建用于匹配该目录下所有 CSV 文件的模式
        csv_pattern = os.path.join(parent_dir, '*.csv')
        # 使用 glob 模块查找所有匹配的 CSV 文件
        csv_files = glob.glob(csv_pattern)

        for csv_file in csv_files:
            try:
                # 尝试删除每个 CSV 文件
                os.remove(csv_file)
                print(f"已成功删除文件: {csv_file}")
            except FileNotFoundError:
                print(f"错误: 文件 {csv_file} 未找到。")
            except PermissionError:
                print(f"错误: 没有权限删除文件 {csv_file}。")
            except Exception as e:
                print(f"发生未知错误: {e}")