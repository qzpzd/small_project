import os
import argparse
import yaml
import random
import cv2
import numpy as np
import torch
import torch.nn.functional as F
from ultralytics import YOLO
from ultralytics.data import build_dataloader, build_yolo_dataset
from ultralytics.models.yolo.detect import DetectionTrainer
from ultralytics.cfg import get_cfg, DEFAULT_CFG, cfg2dict

# -------------------------- 1. 兼容工具函数（适配官方API） --------------------------
def get_valid_kwargs(cfg_data):
    """过滤出官方支持的参数（兼容新旧版本DEFAULT_CFG）"""
    if hasattr(DEFAULT_CFG, '__dict__'):
        valid_keys = vars(DEFAULT_CFG).keys()
    else:
        valid_keys = DEFAULT_CFG.keys()

    # 过滤掉字典类型的参数，只保留简单类型的参数
    # 但保留data参数，即使它是字符串
    valid_kwargs = {}
    for k, v in cfg_data.items():
        if k in valid_keys and not isinstance(v, dict):
            valid_kwargs[k] = v
    return valid_kwargs

# -------------------------- 2. 数据集验证函数 --------------------------
def validate_dataset(data_yaml_path):
    """
    验证数据集配置是否正确
    
    Args:
        data_yaml_path: 数据集配置文件路径
        
    Returns:
        bool: 数据集是否有效
    """
    print("\n" + "="*80)
    print("🔍 数据集验证")
    print("="*80)
    
    if not os.path.exists(data_yaml_path):
        print(f"❌ 错误: 数据集配置文件 {data_yaml_path} 不存在！")
        return False
    
    with open(data_yaml_path, 'r', encoding='utf-8') as f:
        data_config = yaml.safe_load(f)
    
    nc = data_config.get('nc', 0)
    names = data_config.get('names', [])
    path = data_config.get('path', '')
    train_dir = data_config.get('train', '')
    val_dir = data_config.get('val', '')
    
    # 构建完整路径
    if not path:
        path = os.path.dirname(data_yaml_path)
    
    train_images_path = os.path.join(path, train_dir)
    val_images_path = os.path.join(path, val_dir)
    train_labels_path = train_images_path.replace('images', 'labels')
    val_labels_path = val_images_path.replace('images', 'labels')
    
    print(f"\n📋 配置信息:")
    print(f"   - 数据集根目录: {path}")
    print(f"   - 类别数量: {nc}")
    print(f"   - 类别名称: {names}")
    
    print(f"\n📁 训练集:")
    print(f"   - 图像目录: {train_images_path}")
    print(f"   - 标签目录: {train_labels_path}")
    
    print(f"\n📁 验证集:")
    print(f"   - 图像目录: {val_images_path}")
    print(f"   - 标签目录: {val_labels_path}")
    
    # 检查目录是否存在
    errors = []
    
    if not os.path.exists(train_images_path):
        errors.append(f"训练集图像目录不存在: {train_images_path}")
    else:
        train_images = [f for f in os.listdir(train_images_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
        print(f"   - 图像文件数量: {len(train_images)}")
        if len(train_images) == 0:
            errors.append(f"训练集图像目录为空: {train_images_path}")
    
    if not os.path.exists(train_labels_path):
        errors.append(f"训练集标签目录不存在: {train_labels_path}")
    else:
        train_labels = [f for f in os.listdir(train_labels_path) if f.endswith('.txt')]
        print(f"   - 标签文件数量: {len(train_labels)}")
        if len(train_labels) == 0:
            errors.append(f"训练集标签目录为空: {train_labels_path}")
    
    if not os.path.exists(val_images_path):
        errors.append(f"验证集图像目录不存在: {val_images_path}")
    else:
        val_images = [f for f in os.listdir(val_images_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
        print(f"   - 图像文件数量: {len(val_images)}")
        if len(val_images) == 0:
            errors.append(f"验证集图像目录为空: {val_images_path}")
    
    if not os.path.exists(val_labels_path):
        errors.append(f"验证集标签目录不存在: {val_labels_path}")
    else:
        val_labels = [f for f in os.listdir(val_labels_path) if f.endswith('.txt')]
        print(f"   - 标签文件数量: {len(val_labels)}")
        if len(val_labels) == 0:
            errors.append(f"验证集标签目录为空: {val_labels_path}")
    
    # 检查图像和标签是否匹配
    if os.path.exists(train_images_path) and os.path.exists(train_labels_path):
        train_images = set([os.path.splitext(f)[0] for f in os.listdir(train_images_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))])
        train_labels = set([os.path.splitext(f)[0] for f in os.listdir(train_labels_path) if f.endswith('.txt')])
        
        missing_labels = train_images - train_labels
        missing_images = train_labels - train_images
        
        if missing_labels:
            print(f"\n⚠️  训练集中有 {len(missing_labels)} 个图像缺少标签文件")
            for img in list(missing_labels)[:5]:
                print(f"      - {img}")
            if len(missing_labels) > 5:
                print(f"      ... 还有 {len(missing_labels) - 5} 个")
        
        if missing_images:
            print(f"\n⚠️  训练集中有 {len(missing_images)} 个标签缺少对应的图像文件")
            for lbl in list(missing_images)[:5]:
                print(f"      - {lbl}")
            if len(missing_images) > 5:
                print(f"      ... 还有 {len(missing_images) - 5} 个")
    
    if os.path.exists(val_images_path) and os.path.exists(val_labels_path):
        val_images = set([os.path.splitext(f)[0] for f in os.listdir(val_images_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))])
        val_labels = set([os.path.splitext(f)[0] for f in os.listdir(val_labels_path) if f.endswith('.txt')])
        
        missing_labels = val_images - val_labels
        missing_images = val_labels - val_images
        
        if missing_labels:
            print(f"\n⚠️  验证集中有 {len(missing_labels)} 个图像缺少标签文件")
            for img in list(missing_labels)[:5]:
                print(f"      - {img}")
            if len(missing_labels) > 5:
                print(f"      ... 还有 {len(missing_labels) - 5} 个")
        
        if missing_images:
            print(f"\n⚠️  验证集中有 {len(missing_images)} 个标签缺少对应的图像文件")
            for lbl in list(missing_images)[:5]:
                print(f"      - {lbl}")
            if len(missing_images) > 5:
                print(f"      ... 还有 {len(missing_images) - 5} 个")
    
    # 输出错误信息
    if errors:
        print(f"\n❌ 发现 {len(errors)} 个错误:")
        for i, error in enumerate(errors, 1):
            print(f"   {i}. {error}")
        print("\n" + "="*80)
        return False
    
    print("\n✅ 数据集验证通过！")
    print("="*80 + "\n")
    return True

# -------------------------- 3. 分析数据集类别分布函数 --------------------------
def get_class_distribution_from_yolo(txt_file):
    """从单个YOLO格式的标注文件获取类别信息"""
    try:
        if not os.path.exists(txt_file):
            return []
        with open(txt_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        class_ids = []
        for line in lines:
            parts = line.strip().split()
            if len(parts) >= 1:
                class_ids.append(int(parts[0]))
        return class_ids
    except Exception as e:
        return []

def analyze_dataset_distribution(data_yaml_path):
    """
    分析数据集中的类别分布，确定少数类和权重

    Args:
        data_yaml_path: 数据集配置文件路径

    Returns:
        tuple: (nc, names, minority_cls_ids, cls_weights, class_distribution)
            - nc: 类别数量
            - names: 类别名称列表
            - minority_cls_ids: 少数类ID列表
            - cls_weights: 类别权重列表
            - class_distribution: 类别标注数量字典
    """
    if not os.path.exists(data_yaml_path):
        print(f"❌ 错误: 数据集配置文件 {data_yaml_path} 不存在！")
        return None, None, None, None, None

    with open(data_yaml_path, 'r', encoding='utf-8') as f:
        data_config = yaml.safe_load(f)

    nc = data_config.get('nc', 0)
    names = data_config.get('names', [])
    path = data_config.get('path', '')
    train_dir = data_config.get('train', '')

    if nc == 0 or len(names) != nc:
        print(f"❌ 错误: 数据集配置文件格式不正确！")
        return None, None, None, None, None

    # 构建训练集图像目录路径
    if not path:
        path = os.path.dirname(data_yaml_path)
    train_images_path = os.path.join(path, train_dir)

    # 构建对应的标签目录路径（将images替换为labels）
    train_labels_path = train_images_path.replace('images', 'labels')

    # 查找所有标注文件
    print(f"\n🔍 正在分析数据集...")
    print(f"📁 图像目录: {train_images_path}")
    print(f"🏷️  标签目录: {train_labels_path}")
    class_distribution = {i: 0 for i in range(nc)}

    # 只查找TXT格式的标注文件
    txt_files = []

    # 检查标签目录是否存在
    if os.path.exists(train_labels_path):
        # 遍历标签目录
        for root, dirs, files in os.walk(train_labels_path):
            for file in files:
                if file.endswith('.txt'):
                    txt_files.append(os.path.join(root, file))
    else:
        print(f"❌ 错误: 标签目录 {train_labels_path} 不存在！")
        return None, None, None, None, None

    # 处理TXT文件
    if txt_files:
        print(f"📁 发现 {len(txt_files)} 个YOLO格式标注文件")
        for txt_file in txt_files:
            class_ids = get_class_distribution_from_yolo(txt_file)
            for class_id in class_ids:
                if class_id in class_distribution:
                    class_distribution[class_id] += 1
                else:
                    class_distribution[class_id] = 1
    else:
        # 如果找不到标注文件，使用经验规则
        print("⚠️  找不到标注文件，使用经验规则确定少数类")

        # 如果只有1-2个类别，默认所有都是少数类
        if nc <= 2:
            minority_cls_ids = list(range(nc))
            cls_weights = [4.0] * nc
            print(f"📊 数据集分析: {nc}个类别，全部作为少数类处理")
        else:
            # 假设后20%是少数类
            minority_count = max(1, nc // 5)
            minority_cls_ids = list(range(nc - minority_count, nc))

            # 设置权重：少数类权重4.0，多数类权重1.0
            cls_weights = [1.0] * nc
            for cls_id in minority_cls_ids:
                if cls_id < nc:
                    cls_weights[cls_id] = 4.0

            print(f"📊 数据分析: {nc}个类别，少数类为ID {minority_cls_ids}")

        print(f"📊 类别名称: {names}")
        print(f"📊 少数类ID: {minority_cls_ids}")
        print(f"📊 类别权重: {cls_weights}")

        return nc, names, minority_cls_ids, cls_weights, class_distribution
    
    # 显示类别分布
    print("\n📊 类别标注数量统计:")
    for class_id in sorted(class_distribution.keys()):
        count = class_distribution.get(class_id, 0)
        class_name = names[class_id] if class_id < len(names) else f"class{class_id}"
        print(f"   - {class_name} (ID {class_id}): {count} 个标注")
    
    # 计算权重
    total_count = sum(class_distribution.values())
    if total_count == 0:
        print("⚠️  没有发现标注，使用默认权重")
        minority_cls_ids = list(range(nc)) if nc <= 2 else [1, 3, 4]
        cls_weights = [4.0] * nc if nc <= 2 else [1.0, 4.0, 1.0, 4.0, 4.0, 0.5]
        return nc, names, minority_cls_ids, cls_weights, class_distribution
    
    # 计算每个类别的频率
    class_frequencies = {class_id: count / total_count for class_id, count in class_distribution.items()}
    
    # 找到少数类（标注数量少于平均值的50%）
    avg_count = total_count / nc
    minority_cls_ids = []
    for class_id, count in class_distribution.items():
        if count < avg_count * 0.5:  # 数量少于平均值50%的为少数类
            minority_cls_ids.append(class_id)
    
    # 如果没有少数类（所有类别分布较均衡），则选择数量最少的20%类别
    if not minority_cls_ids:
        sorted_classes = sorted(class_distribution.items(), key=lambda x: x[1])
        minority_count = max(1, len(sorted_classes) // 5)  # 选数量最少的20%
        minority_cls_ids = [cls_id for cls_id, _ in sorted_classes[:minority_count]]
    
    print(f"\n🎯 少数类识别完成:")
    for class_id in minority_cls_ids:
        class_name = names[class_id] if class_id < len(names) else f"class{class_id}"
        count = class_distribution.get(class_id, 0)
        print(f"   - {class_name} (ID {class_id}): {count} 个标注（少数类）")
    
    # 计算权重：基于类别频率的倒数，进行归一化
    # 少数类权重 = max(4.0, 1/频率 * 缩放因子)
    # 多数类权重 = 1.0
    cls_weights = []
    max_weight = 4.0  # 少数类最大权重
    scale_factor = 2.0  # 缩放因子
    
    for class_id in range(nc):
        count = class_distribution.get(class_id, 0)
        freq = class_frequencies.get(class_id, 0.001)  # 防止除以0，使用最小频率
        
        # 如果类别标注数量为0，使用默认权重
        if count == 0:
            weight = 0.0  # 默认权重
            print(f"   ⚠️  类别 {class_id} ({names[class_id] if class_id < len(names) else f'class{class_id}'}) 标注数量为0，使用默认权重 {weight}")
        else:
            weight = min(max_weight, 1.0 / freq * scale_factor)
        
            if class_id in minority_cls_ids:
                # 少数类权重再加码
                weight = min(8.0, weight * 1.5)
        
        cls_weights.append(weight)
    
    # 归一化权重，使最大权重为max_weight
    if max(cls_weights) > 0:
        weight_scale = max_weight / max(cls_weights)
        cls_weights = [w * weight_scale for w in cls_weights]
    
    print(f"\n⚖️  类别权重计算完成:")
    for class_id in range(nc):
        class_name = names[class_id] if class_id < len(names) else f"class{class_id}"
        count = class_distribution.get(class_id, 0)
        status = f" ({count}个标注)" if count > 0 else " (无标注)"
        print(f"   - {class_name} (ID {class_id}): 权重 {cls_weights[class_id]:.2f}{status}")
    
    return nc, names, minority_cls_ids, cls_weights, class_distribution

# -------------------------- 4. 少数类增强函数（适配多少数类） --------------------------
def augment_minority_roi(img, boxes, cls_ids, minority_cls_ids=[1,3,4]):
    """单图内多少数类目标局部增强"""
    if boxes is None or cls_ids is None or len(boxes) == 0:
        return img
    
    # 适配不同格式的boxes/cls_ids
    if isinstance(boxes, torch.Tensor):
        boxes = boxes.cpu().numpy()
    if isinstance(cls_ids, torch.Tensor):
        cls_ids = cls_ids.cpu().numpy()
    
    for box, cls_id in zip(boxes, cls_ids):
        cls_id_int = int(cls_id)
        if cls_id_int in minority_cls_ids:
            # 解析box坐标（x1,y1,x2,y2）
            x1, y1, x2, y2 = map(int, box[:4])
            # 严格边界检查
            h, w = img.shape[:2]
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w - 1, x2), min(h - 1, y2)
            if (x2 - x1) < 5 or (y2 - y1) < 5:
                continue
            
            # 局部增强：亮度+对比度+小旋转
            roi = img[y1:y2, x1:x2]
            roi = cv2.convertScaleAbs(roi, alpha=1.4, beta=15)
            angle = np.random.randint(-12, 12)
            M = cv2.getRotationMatrix2D(((x2-x1)//2, (y2-y1)//2), angle, 1)
            roi = cv2.warpAffine(roi, M, (x2-x1, y2-y1))
            img[y1:y2, x1:x2] = roi
    return img

# -------------------------- 5. 自定义训练器（适配动态少数类） --------------------------
class BalancedTrainer(DetectionTrainer):
    """
    自定义训练器：支持根据数据集配置自动确定少数类和权重
    
    Attributes:
        minority_cls_ids: 少数类ID列表
        cls_weights: 类别权重tensor
        class_distribution: 类别标注数量字典
        resample_factors: 类别重采样因子
    """
    def __init__(self, cfg=DEFAULT_CFG, overrides=None, _callbacks=None, 
                 minority_cls_ids=None, cls_weights=None, class_distribution=None):
        super().__init__(cfg, overrides, _callbacks)
        
        # 动态设置少数类ID和权重
        self.minority_cls_ids = minority_cls_ids if minority_cls_ids is not None else [1, 3, 4]
        self.class_distribution = class_distribution if class_distribution is not None else {}
        
        if cls_weights is not None:
            self.cls_weights = torch.tensor(cls_weights).to(self.device)
        else:
            # 默认值（兼容旧配置）
            self.cls_weights = torch.tensor([1.0, 4.0, 1.0, 4.0, 4.0, 0.5]).to(self.device)
        
        # 计算重采样因子
        self.resample_factors = {}
        if self.class_distribution:
            max_count = max(self.class_distribution.values()) if self.class_distribution else 1
            for class_id, count in self.class_distribution.items():
                if count > 0:
                    # 少数类重采样因子 = max(1.0, max_count / count)
                    resample_factor = max(1.0, max_count / count)
                    if class_id in self.minority_cls_ids:
                        # 少数类重采样因子再加码
                        resample_factor = min(4.0, resample_factor * 1.5)
                    self.resample_factors[class_id] = resample_factor
        
        print(f"\n🎯 少数类配置完成: {self.minority_cls_ids}")
        print(f"⚖️  类别权重配置完成: {self.cls_weights.tolist()}")
        if self.resample_factors:
            print(f"🔄 重采样因子配置完成: {self.resample_factors}")

    def build_dataset(self, img_path, mode="train", batch=None):
        """重写官方build_dataset：多少数类动态采样 + 重采样"""
        dataset = super().build_dataset(img_path, mode, batch)
        
        if mode == "train" and hasattr(dataset, 'annotations'):
            # 筛选含任意少数类的图片索引
            minority_indices = []
            majority_indices = []
            minority_class_images = {cls_id: [] for cls_id in self.minority_cls_ids}
            
            for idx, ann in enumerate(dataset.annotations):
                cls_list = ann.get("cls", [])
                if len(cls_list) > 0:
                    has_minority = any(int(c) in self.minority_cls_ids for c in cls_list)
                    
                    if has_minority:
                        minority_indices.append(idx)
                        # 记录每个少数类的图片索引
                        for c in cls_list:
                            c_id = int(c)
                            if c_id in self.minority_cls_ids and idx not in minority_class_images[c_id]:
                                minority_class_images[c_id].append(idx)
                    else:
                        majority_indices.append(idx)
            
            print(f"📊 训练集统计：总图片={len(dataset.annotations)}")
            print(f"   - 含少数类图片: {len(minority_indices)}")
            for cls_id in self.minority_cls_ids:
                class_name = self.class_distribution.get(cls_id, f"class{cls_id}")
                print(f"   - 含 {class_name} (ID {cls_id}) 的图片: {len(minority_class_images[cls_id])}")
            print(f"   - 仅含多数类图片: {len(majority_indices)}")
            
            # 动态采样 + 重采样：
            # 多数类：概率 = 1.0
            # 少数类：概率 = resample_factor
            # 总概率归一化
            total_weight = len(majority_indices)
            for cls_id in self.minority_cls_ids:
                # 检查该类别是否有图片
                if len(minority_class_images[cls_id]) == 0:
                    print(f"   ⚠️  类别 {cls_id} {self.class_distribution.get(cls_id, f'class{cls_id}')} 没有训练图片，跳过重采样")
                    continue
                
                if cls_id in self.resample_factors:
                    total_weight += len(minority_class_images[cls_id]) * self.resample_factors[cls_id]
                else:
                    total_weight += len(minority_class_images[cls_id]) * 2.0  # 默认重采样因子2.0
            
            original_getitem = dataset.__getitem__
            def balanced_getitem(idx):
                # 根据重采样因子计算选择概率
                r = random.random() * total_weight
                
                if r < len(majority_indices):
                    # 选多数类图片
                    if majority_indices:
                        idx = random.choice(majority_indices)
                else:
                    # 选少数类图片
                    r -= len(majority_indices)
                    selected = False
                    
                    for cls_id in self.minority_cls_ids:
                        # 跳过没有图片的类别
                        if len(minority_class_images[cls_id]) == 0:
                            continue
                        
                        if cls_id in self.resample_factors:
                            cls_weight = len(minority_class_images[cls_id]) * self.resample_factors[cls_id]
                        else:
                            cls_weight = len(minority_class_images[cls_id]) * 2.0
                        
                        if r < cls_weight:
                            if minority_class_images[cls_id]:
                                idx = random.choice(minority_class_images[cls_id])
                            selected = True
                            break
                        else:
                            r -= cls_weight
                    
                    if not selected and minority_indices:
                        idx = random.choice(minority_indices)
                
                idx = min(idx, len(dataset.annotations) - 1)
                
                img, target = original_getitem(idx)
                # 多少数类增强
                if target.get("cls") is not None and len(target["cls"]) > 0:
                    img = augment_minority_roi(
                        img, target["bboxes"], target["cls"], self.minority_cls_ids
                    )
                return img, target
            
            dataset.__getitem__ = balanced_getitem
            print(f"🔄 训练集均衡化完成：重采样策略已应用")
        
        return dataset

    def compute_loss(self, preds, batch):
        """重写损失计算：多少数类加权"""
        loss = super().compute_loss(preds, batch)
        
        if batch.get("cls") is None or preds[1] is None:
            return loss
        
        batch_cls = batch["cls"].squeeze(-1)
        
        # 确保类别ID在有效范围内
        valid_mask = (batch_cls >= 0) & (batch_cls < len(self.cls_weights))
        
        # 如果没有有效的类别，直接返回原始损失
        if not valid_mask.any():
            return loss
        
        # 多少数类加权分类损失
        cls_pred = preds[1][valid_mask]
        cls_target = batch_cls[valid_mask].long()
        
        # 确保目标类别ID也在有效范围内
        cls_target = torch.clamp(cls_target, 0, len(self.cls_weights) - 1)
        
        weighted_cls_loss = F.cross_entropy(
            cls_pred, cls_target, weight=self.cls_weights, reduction="mean"
        )
        
        loss["cls"] = weighted_cls_loss
        loss["loss"] = loss["box"] + loss["cls"] + loss["dfl"]
        return loss

# -------------------------- 6. 主函数（支持动态少数类） --------------------------
def main():
    """YOLOv8 训练主函数：支持动态少数类"""
    DEFAULT_CFG_PATH = "config/train_config.yaml"
    DEFAULT_MODEL = "yolo26n.pt"
    DEFAULT_DATA_YAML = "datasets/data.yaml"

    parser = argparse.ArgumentParser(description="YOLOv8 训练（支持动态少数类）")
    parser.add_argument("--cfg", type=str, default=DEFAULT_CFG_PATH, help="官方训练配置文件路径")
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL, help="预训练模型路径")
    parser.add_argument("--data", type=str, default=DEFAULT_DATA_YAML, help="数据集配置文件路径")
    parser.add_argument("--dry-run", action="store_true", help="仅验证配置，不训练")
    parser.add_argument("--skip-validate", action="store_true", help="跳过数据集验证")
    args = parser.parse_args()

    # 验证配置文件
    if not os.path.isfile(args.cfg):
        print(f"❌ 配置文件不存在：{args.cfg}")
        return

    # 验证数据集配置文件
    if not os.path.isfile(args.data):
        print(f"❌ 数据集配置文件不存在：{args.data}")
        return

    # 数据集验证
    if not args.skip_validate:
        if not validate_dataset(args.data):
            print("\n❌ 数据集验证失败！请检查数据集配置和文件路径。")
            print("\n💡 解决方案：")
            print("   1. 确保数据集配置文件中的路径正确")
            print("   2. 确保图像和标签文件都存在")
            print("   3. 确保图像和标签文件名匹配（不含扩展名）")
            print("   4. 如果不需要验证，可以使用 --skip-validate 参数跳过")
            return

    # 加载并过滤配置文件
    with open(args.cfg, "r", encoding="utf-8") as f:
        cfg_data = yaml.safe_load(f)
    valid_cfg = get_valid_kwargs(cfg_data)

    # 确定模型路径
    if args.model:
        model_path = args.model
    elif "model" in cfg_data:
        # 处理model字段可能是字典或字符串的情况
        model_config = cfg_data["model"]
        if isinstance(model_config, dict):
            # 如果是字典，使用pretrained字段
            model_path = model_config.get("pretrained", "yolov8n.pt")
        else:
            # 如果是字符串，直接使用
            model_path = model_config
    else:
        model_path = DEFAULT_MODEL

    # 分析数据集分布，确定少数类和权重
    print("\n" + "="*80)
    print("🔍 分析数据集类别分布...")
    nc, names, minority_cls_ids, cls_weights, class_distribution = analyze_dataset_distribution(args.data)
    
    if nc is None or names is None:
        print("❌ 数据分析失败！")
        return
    
    # 加载模型
    model = YOLO(model_path)
    print("\n🚀 YOLO26 训练启动")
    print(f"📋 配置文件：{args.cfg}")
    print(f"📊 数据集配置：{args.data}")
    print(f"🤖 预训练模型：{model_path}")
    print(f"📝 Dry Run：{'✅' if args.dry_run else '❌'}")
    
    print(f"\n🎯 少数类识别：")
    for class_id in minority_cls_ids:
        class_name = names[class_id] if class_id < len(names) else f"class{class_id}"
        count = class_distribution.get(class_id, 0)
        print(f"   - {class_name} (ID {class_id}): {count} 个标注")
    
    print(f"\n⚖️  类别权重：")
    for class_id in range(nc):
        class_name = names[class_id] if class_id < len(names) else f"class{class_id}"
        print(f"   - {class_name} (ID {class_id}): {cls_weights[class_id]:.2f}")
    
    print("\n" + "="*80 + "\n")

    if args.dry_run:
        print("\n✅ 配置验证通过！无无效参数，可执行正式训练。")
        return

    # 构建官方训练参数
    train_kwargs = {
        **valid_cfg,
        "data": args.data,  # 确保data参数被传递
        "agnostic_nms": True,  # 类别无关NMS，避免少数类框被抑制
        "plots": False,  # 禁用绘图功能，避免字体加载错误
    }

    # 创建自定义训练器，传递少数类信息
    class CustomBalancedTrainer(BalancedTrainer):
        def __init__(self, cfg=DEFAULT_CFG, overrides=None, _callbacks=None):
            super().__init__(cfg, overrides, _callbacks, 
                           minority_cls_ids=minority_cls_ids, 
                           cls_weights=cls_weights,
                           class_distribution=class_distribution)

    # 指定自定义训练器
    model.trainer_cls = CustomBalancedTrainer

    # 执行训练
    try:
        results = model.train(**train_kwargs)
        print("\n🎉 训练完成！")
        print(f"📁 结果保存路径：{model.trainer.save_dir}")
        print(f"🏆 最佳模型：{os.path.join(model.trainer.save_dir, 'weights', 'best.pt')}")
    except Exception as e:
        print(f"\n❌ 训练异常：{str(e)}")
        import traceback
        traceback.print_exc()

# -------------------------- 7. 推理函数（支持动态少数类） --------------------------
def predict_balanced(model_path, source, data_yaml_path=None, conf=0.2, cls_conf=None):
    """
    推理函数：支持动态少数类阈值调整
    
    Args:
        model_path: 模型路径
        source: 推理源
        data_yaml_path: 数据集配置文件路径（用于确定少数类）
        conf: 全局置信度阈值
        cls_conf: 自定义少数类阈值（可选）
    """
    # 分析数据集，确定少数类
    minority_cls_ids = [1, 3, 4]  # 默认值
    if data_yaml_path and os.path.exists(data_yaml_path):
        nc, names, minority_cls_ids, _ = analyze_dataset_distribution(data_yaml_path)
    
    # 默认少数类阈值（可外部覆盖）
    default_cls_conf = {}
    for cls_id in minority_cls_ids:
        default_cls_conf[cls_id] = 0.15  # 少数类阈值0.15
    
    if cls_conf is None:
        cls_conf = default_cls_conf
    else:
        # 合并用户传入的阈值与默认阈值
        default_cls_conf.update(cls_conf)
        cls_conf = default_cls_conf

    model = YOLO(model_path)
    results = model.predict(
        source=source,
        conf=conf,
        iou=0.45,
        agnostic_nms=True,
        show=False,
        save=False
    )

    # 多少数类阈值调整
    for r in results:
        if r.boxes is None:
            continue
        boxes = r.boxes
        keep = []
        for i, box in enumerate(boxes):
            cls_id = int(box.cls.item())
            thres = cls_conf.get(cls_id, conf)  # 非少数类用全局阈值
            if box.conf.item() >= thres:
                keep.append(i)
        r.boxes = boxes[keep] if keep else None
    return results

# -------------------------- 8. 入口函数 --------------------------
if __name__ == "__main__":
    main()

    # 推理示例（按需启用）
    # predict_balanced(
    #     model_path="runs/detect/train/weights/best.pt",
    #     source="test.jpg",
    #     data_yaml_path="datasets/data.yaml",
    #     conf=0.2
    # )
