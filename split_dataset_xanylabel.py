import os
import random
import shutil
from collections import defaultdict

def parse_label_file(label_file_path):
    """
    解析标签文件，获取该图片包含的类别列表
    
    Args:
        label_file_path: 标签文件路径
        
    Returns:
        list: 类别ID列表
    """
    if not os.path.exists(label_file_path):
        return []
    
    class_ids = []
    try:
        with open(label_file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    parts = line.split()
                    if len(parts) >= 1:
                        class_id = int(parts[0])
                        if class_id not in class_ids:
                            class_ids.append(class_id)
    except Exception as e:
        print(f"⚠️  读取标签文件失败: {label_file_path}, 错误: {e}")
    
    return class_ids

def detect_directory_structure(base_dir):
    """
    检测目录结构
    
    Args:
        base_dir: 基础目录路径
        
    Returns:
        dict: 包含目录结构信息的字典
            {
                'structure': 'single' or 'separate',
                'image_dir': 图片目录路径,
                'label_dir': 标签目录路径
            }
    """
    has_images_dir = os.path.isdir(os.path.join(base_dir, "images"))
    has_labels_dir = os.path.isdir(os.path.join(base_dir, "labels"))
    
    if has_images_dir and has_labels_dir:
        return {
            'structure': 'separate',
            'image_dir': os.path.join(base_dir, "images"),
            'label_dir': os.path.join(base_dir, "labels")
        }
    else:
        return {
            'structure': 'single',
            'image_dir': base_dir,
            'label_dir': base_dir
        }

def split_xanylabel_dataset():
    """
    数据划分脚本（分层抽样）
    将源目录中的图片和对应的txt标签文件按照类别分层划分到train和val目录中
    确保训练集和验证集中各类别比例一致
    
    支持两种目录结构：
    1. 图片和标签在同一个目录
    2. 图片在images目录，标签在labels目录
    """
    # 设置参数
    data_dir = "./original_data/base/labels"  # 源数据目录
    output_dir = "./datasets/base"  # 输出目录
    train_ratio = 0.8  # 训练集比例
    random_seed = 42  # 随机种子，保证结果可复现
    
    # 检测目录结构
    dir_info = detect_directory_structure(data_dir)
    image_dir = dir_info['image_dir']
    label_dir = dir_info['label_dir']
    
    print(f"🔍 检测到目录结构: {'分离式 (images + labels)' if dir_info['structure'] == 'separate' else '单一目录'}")
    print(f"📁 图片目录: {image_dir}")
    print(f"📁 标签目录: {label_dir}")
    
    # 获取所有图片文件
    image_files = []
    if os.path.exists(image_dir):
        for file in os.listdir(image_dir):
            if file.lower().endswith((".jpg", ".jpeg", ".png", ".bmp")):
                image_files.append(file)
    
    print(f"找到 {len(image_files)} 张图片")
    
    # 按类别分组图片
    # class_images[class_id] = [image_file1, image_file2, ...]
    class_images = defaultdict(list)
    
    for image_file in image_files:
        # 获取对应的标签文件
        label_file = os.path.splitext(image_file)[0] + ".txt"
        label_file_path = os.path.join(label_dir, label_file)
        
        # 解析标签文件，获取类别
        class_ids = parse_label_file(label_file_path)
        print(f"   图片 {image_file} 包含类别: {class_ids}")
        
        if not class_ids:
            print(f"⚠️  警告: {image_file} 的标签文件为空或不存在")
            continue
        
        # 将图片添加到每个类别中
        for class_id in class_ids:
            class_images[class_id].append(image_file)
    
    # 打印类别分布
    print("\n📊 类别分布:")
    total_images = 0
    for class_id in sorted(class_images.keys()):
        count = len(class_images[class_id])
        total_images += count
        print(f"   类别 {class_id}: {count} 张图片")
    
    print(f"   总计: {total_images} 张图片")
    
    # 对每个类别分别进行训练集和验证集划分
    train_files = set()
    val_files = set()
    
    print(f"\n🔄 开始分层划分（训练集比例: {train_ratio}）...")
    
    for class_id in sorted(class_images.keys()):
        images = class_images[class_id]
        random.seed(random_seed + class_id)  # 为每个类别设置不同的随机种子
        random.shuffle(images)
        
        # 计算该类别的训练集数量
        class_train_count = int(len(images) * train_ratio)
        
        # 划分训练集和验证集
        class_train = images[:class_train_count]
        class_val = images[class_train_count:]
        
        # 添加到总集合中（使用set避免重复，因为一张图片可能包含多个类别）
        train_files.update(class_train)
        val_files.update(class_val)
        
        print(f"   类别 {class_id}: 训练集 {len(class_train)} 张, 验证集 {len(class_val)} 张")
    
    # 转换为列表
    train_files = list(train_files)
    val_files = list(val_files)
    
    print(f"\n📊 最终划分结果:")
    print(f"   训练集: {len(train_files)} 张图片")
    print(f"   验证集: {len(val_files)} 张图片")
    
    # 验证各类别在训练集和验证集中的比例
    print(f"\n📊 验证类别比例:")
    
    train_class_counts = defaultdict(int)
    val_class_counts = defaultdict(int)
    
    for image_file in train_files:
        label_file = os.path.splitext(image_file)[0] + ".txt"
        label_file_path = os.path.join(label_dir, label_file)
        class_ids = parse_label_file(label_file_path)
        for class_id in class_ids:
            train_class_counts[class_id] += 1
    
    for image_file in val_files:
        label_file = os.path.splitext(image_file)[0] + ".txt"
        label_file_path = os.path.join(label_dir, label_file)
        class_ids = parse_label_file(label_file_path)
        for class_id in class_ids:
            val_class_counts[class_id] += 1
    
    all_classes = set(train_class_counts.keys()) | set(val_class_counts.keys())
    
    for class_id in sorted(all_classes):
        train_count = train_class_counts.get(class_id, 0)
        val_count = val_class_counts.get(class_id, 0)
        total = train_count + val_count
        
        if total > 0:
            train_ratio_actual = train_count / total
            val_ratio_actual = val_count / total
            print(f"   类别 {class_id}: 训练集 {train_count} ({train_ratio_actual:.1%}), 验证集 {val_count} ({val_ratio_actual:.1%})")
        else:
            print(f"   类别 {class_id}: 训练集 {train_count}, 验证集 {val_count}")
    
    # 创建输出目录结构
    train_image_dir = os.path.join(output_dir, "images", "train")
    val_image_dir = os.path.join(output_dir, "images", "val")
    train_label_dir = os.path.join(output_dir, "labels", "train")
    val_label_dir = os.path.join(output_dir, "labels", "val")
    
    for dir_path in [train_image_dir, val_image_dir, train_label_dir, val_label_dir]:
        os.makedirs(dir_path, exist_ok=True)
    
    # 复制文件到训练集
    print("\n📁 复制训练集文件...")
    train_copied = 0
    for image_file in train_files:
        # 复制图片文件
        src_image = os.path.join(image_dir, image_file)
        dst_image = os.path.join(train_image_dir, image_file)
        shutil.copy(src_image, dst_image)
        
        # 复制对应的标签文件
        label_file = os.path.splitext(image_file)[0] + ".txt"
        src_label = os.path.join(label_dir, label_file)
        if os.path.exists(src_label):
            dst_label = os.path.join(train_label_dir, label_file)
            shutil.copy(src_label, dst_label)
            train_copied += 1
        else:
            print(f"⚠️  警告: {label_file} 不存在！")
    
    print(f"✓ 训练集: 复制了 {train_copied} 个标签文件")
    
    # 复制文件到验证集
    print("\n📁 复制验证集文件...")
    val_copied = 0
    for image_file in val_files:
        # 复制图片文件
        src_image = os.path.join(image_dir, image_file)
        dst_image = os.path.join(val_image_dir, image_file)
        shutil.copy(src_image, dst_image)
        
        # 复制对应的标签文件
        label_file = os.path.splitext(image_file)[0] + ".txt"
        src_label = os.path.join(label_dir, label_file)
        if os.path.exists(src_label):
            dst_label = os.path.join(val_label_dir, label_file)
            shutil.copy(src_label, dst_label)
            val_copied += 1
        else:
            print(f"⚠️  警告: {label_file} 不存在！")
    
    print(f"✓ 验证集: 复制了 {val_copied} 个标签文件")
    
    print("\n🎉 数据划分完成！")
    print(f"📁 训练集图片: {train_image_dir}")
    print(f"📁 训练集标签: {train_label_dir}")
    print(f"📁 验证集图片: {val_image_dir}")
    print(f"📁 验证集标签: {val_label_dir}")
    print(f"\n💡 提示: 训练集和验证集中各类别比例已保持一致")

if __name__ == "__main__":
    # 设置工作目录为脚本所在目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    split_xanylabel_dataset()
