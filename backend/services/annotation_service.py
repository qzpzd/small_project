"""
标注服务
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Dict, List, Any
import yaml

try:
    from ultralytics import YOLO
except ImportError:
    raise ImportError("请安装 ultralytics: pip install ultralytics")


class AnnotationService:
    """标注服务"""
    
    def auto_annotate(self, model_path: str, image_dir: str,
                     conf: float = 0.5) -> Dict[str, Any]:
        """AI 自动标注
        
        Args:
            model_path: 模型路径
            image_dir: 图片目录
            conf: 置信度阈值
            
        Returns:
            标注结果
        """
        try:
            # 加载模型
            model = YOLO(model_path)
            
            image_dir = Path(image_dir)
            if not image_dir.exists():
                raise Exception(f"图片目录不存在: {image_dir}")
            
            # 创建标签目录
            label_dir = Path('datasets/labels') / image_dir.name
            label_dir.mkdir(parents=True, exist_ok=True)
            
            # 获取所有图片
            extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.webp']
            image_files = [f for f in image_dir.iterdir() if f.suffix.lower() in extensions]
            
            stats = {
                'total': len(image_files),
                'annotated': 0,
                'failed': 0,
                'label_dir': str(label_dir)
            }
            
            # 批量标注
            for image_file in image_files:
                try:
                    # 推理
                    results = model.predict(str(image_file), conf=conf, verbose=False)
                    
                    # 读取图片获取尺寸
                    img = cv2.imread(str(image_file))
                    img_height, img_width = img.shape[:2]
                    
                    # 保存 YOLO 格式标签
                    label_path = label_dir / f"{image_file.stem}.txt"
                    lines = []
                    
                    if results[0].boxes is not None:
                        for box in results[0].boxes:
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            cls_id = int(box.cls[0])
                            
                            # 转换为 YOLO 格式 (归一化)
                            x_center = (x1 + x2) / 2 / img_width
                            y_center = (y1 + y2) / 2 / img_height
                            width = (x2 - x1) / img_width
                            height = (y2 - y1) / img_height
                            
                            line = f"{cls_id} {x_center} {y_center} {width} {height}"
                            lines.append(line)
                    
                    with open(label_path, 'w') as f:
                        f.write('\n'.join(lines))
                    
                    stats['annotated'] += 1
                    
                except Exception as e:
                    stats['failed'] += 1
            
            return stats
            
        except Exception as e:
            raise Exception(f"自动标注失败: {str(e)}")
    
    def export_dataset(self, image_dir: str, label_dir: str,
                      class_names: List[str]) -> Dict[str, Any]:
        """导出数据集
        
        Args:
            image_dir: 图片目录
            label_dir: 标签目录
            class_names: 类别名称列表
            
        Returns:
            导出结果
        """
        try:
            # 创建 YAML 配置
            yaml_path = Path('datasets/data.yaml')
            data_config = {
                'path': str(Path(image_dir).parent.absolute()),
                'train': 'images/train',
                'val': 'images/val',
                'test': 'images/test',
                'names': {i: name for i, name in enumerate(class_names)},
                'nc': len(class_names)
            }
            
            with open(yaml_path, 'w', encoding='utf-8') as f:
                yaml.dump(data_config, f, default_flow_style=False, allow_unicode=True)
            
            return {
                'yaml_path': str(yaml_path),
                'class_names': class_names,
                'nc': len(class_names)
            }
            
        except Exception as e:
            raise Exception(f"导出数据集失败: {str(e)}")
