"""
训练服务
"""

import uuid
from pathlib import Path
from typing import Dict, List, Any, Optional
import yaml
import json
import time

try:
    from ultralytics import YOLO
except ImportError:
    raise ImportError("请安装 ultralytics: pip install ultralytics")


class TrainService:
    """训练服务"""
    
    def __init__(self):
        self.tasks = {}  # 存储训练任务状态
        
    def prepare_dataset(self, dataset_name: str, class_names: List[str]) -> Dict[str, Any]:
        """准备数据集
        
        Args:
            dataset_name: 数据集名称
            class_names: 类别名称列表
            
        Returns:
            准备结果
        """
        dataset_path = Path("datasets") / dataset_name
        dataset_path.mkdir(parents=True, exist_ok=True)
        
        # 创建必要的子目录
        for split in ['train', 'val', 'test']:
            (dataset_path / 'images' / split).mkdir(parents=True, exist_ok=True)
            (dataset_path / 'labels' / split).mkdir(parents=True, exist_ok=True)
        
        # 创建 YAML 配置文件
        yaml_path = dataset_path / "data.yaml"
        data_config = {
            'path': str(dataset_path.absolute()),
            'train': 'images/train',
            'val': 'images/val',
            'test': 'images/test',
            'names': {i: name for i, name in enumerate(class_names)},
            'nc': len(class_names)
        }
        
        with open(yaml_path, 'w', encoding='utf-8') as f:
            yaml.dump(data_config, f, default_flow_style=False, allow_unicode=True)
        
        return {
            'dataset_path': str(dataset_path),
            'yaml_path': str(yaml_path),
            'class_names': class_names
        }
    
    def start_training(self, dataset_yaml: str, task: str = 'detect',
                      epochs: int = 100, batch_size: int = 16,
                      img_size: int = 640, lr: float = 0.01,
                      device: str = '0', project: str = 'runs/train',
                      name: str = 'exp', yaml_config: dict = None,
                      model: str = None, workers: int = 8) -> str:
        """开始训练
        
        Args:
            dataset_yaml: 数据集 YAML 路径
            task: 任务类型
            epochs: 训练轮数
            batch_size: 批次大小
            img_size: 图像大小
            lr: 学习率
            device: 设备
            project: 项目目录
            name: 实验名称
            yaml_config: 高级YAML配置参数
            model: 自定义模型路径
            
        Returns:
            任务 ID
        """
        task_id = str(uuid.uuid4())
        
        # 验证并解析 YAML 文件路径
        print(f"🔍 [训练调试] 接收到的YAML路径: {dataset_yaml}")
        
        # 解析YAML文件路径（支持相对路径）
        yaml_path = Path(dataset_yaml)
        
        # 如果不是绝对路径，尝试多个可能的位置
        if not yaml_path.is_absolute():
            backend_root = Path(__file__).parent.parent  # backend目录
            project_root = Path(__file__).parent.parent.parent  # 项目根目录
            config_root = project_root / "config"  # 配置目录
            
            possible_paths = [
                yaml_path.absolute(),  # 尝试作为相对路径解析
                backend_root / dataset_yaml,  # 相对于backend目录
                project_root / dataset_yaml,  # 相对于项目根目录
                config_root / dataset_yaml,  # 相对于config目录
            ]
            
            for possible_path in possible_paths:
                if possible_path.exists():
                    yaml_path = possible_path
                    print(f"🔍 [训练调试] 找到YAML文件: {yaml_path}")
                    break
        
        if not yaml_path.exists():
            raise FileNotFoundError(f"YAML 文件不存在: {dataset_yaml}")
        
        print(f"🔍 [训练调试] 最终YAML文件路径: {yaml_path}")
        print(f"🔍 [训练调试] YAML文件是否存在: {yaml_path.exists()}")

        # 读取 YAML 配置
        with open(yaml_path, 'r', encoding='utf-8') as f:
            yaml_config = yaml.safe_load(f)

        print(f"🔍 [训练调试] 读取到的YAML配置:")
        print(f"🔍 [训练调试]   path: {yaml_config.get('path')}")
        print(f"🔍 [训练调试]   nc: {yaml_config.get('nc')}")
        print(f"🔍 [训练调试]   names: {yaml_config.get('names')}")
        print(f"🔍 [训练调试]   train: {yaml_config.get('train')}")
        print(f"🔍 [训练调试]   val: {yaml_config.get('val')}")

        # 获取项目根目录
        project_root = Path(__file__).parent.parent.parent
        backend_root = Path(__file__).parent.parent  # backend目录
        datasets_root = project_root / "datasets"  # 项目根目录下的datasets文件夹（训练界面使用）

        # 验证数据集路径（支持相对路径）
        dataset_path_str = yaml_config.get('path', '')
        dataset_path = Path(dataset_path_str)

        # 如果是相对路径，转换为绝对路径
        if not dataset_path.is_absolute():
            # 尝试多种可能的路径解析方式
            possible_paths = []
            
            # 1. 优先在项目根目录的datasets文件夹中查找（训练界面使用）
            possible_paths.append(datasets_root / dataset_path)
            
            # 2. 处理 ../datasets 格式的路径（相对于backend目录）
            if str(dataset_path).startswith('../datasets/'):
                # 去掉 ../ 并基于backend目录解析
                possible_paths.append(backend_root / str(dataset_path)[3:])
            # 3. datasets/ 格式的路径（相对于backend目录，标注使用）
            elif str(dataset_path).startswith('datasets/'):
                possible_paths.append(backend_root / dataset_path)
            
            # 4. 相对于项目根目录的路径
            possible_paths.append(project_root / dataset_path)
            # 5. 相对于YAML文件所在目录
            yaml_dir = yaml_path.parent
            possible_paths.append(yaml_dir / dataset_path)
            
            # 尝试找到第一个存在的路径
            dataset_path = None
            for possible_path in possible_paths:
                if possible_path.exists():
                    dataset_path = possible_path
                    break
            
            # 如果所有路径都不存在，尝试基于数据集名称推断
            if dataset_path is None:
                dataset_name = Path(dataset_path_str).name
                if dataset_name.endswith('_dataset'):
                    dataset_name = dataset_name[:-8]  # 移除_dataset后缀
                
                # 尝试找到匹配的数据集目录
                inferred_paths = [
                    backend_root / "datasets" / dataset_name,
                    backend_root / "datasets" / f"{dataset_name}_dataset",
                    project_root / "datasets" / dataset_name,
                    project_root / "datasets" / f"{dataset_name}_dataset",
                ]
                
                for inferred_path in inferred_paths:
                    if inferred_path.exists():
                        dataset_path = inferred_path
                        break
            
            if dataset_path is None:
                raise FileNotFoundError(f"数据集路径不存在: {dataset_path_str} (尝试了多个可能的位置)")

        if not dataset_path.exists():
            raise FileNotFoundError(f"数据集路径不存在: {dataset_path}")

        # 验证训练图片
        train_images_path = dataset_path / yaml_config.get('train', 'images/train')
        val_images_path = dataset_path / yaml_config.get('val', 'images/val')

        if not train_images_path.exists():
            raise FileNotFoundError(f"训练图片路径不存在: {train_images_path}")

        if not val_images_path.exists():
            raise FileNotFoundError(f"验证图片路径不存在: {val_images_path}")
        
        # 提取数据集名称
        dataset_name = dataset_path.name if dataset_path else 'unknown'

        # 修改project路径，使用数据集名称来区分不同训练
        # YOLO会自动在project前面添加runs/detect，所以只需要提供数据集名称
        project = dataset_name

        # 保存任务配置
        self.tasks[task_id] = {
            'status': 'running',
            'progress': 0,
            'epoch': 0,
            'total_epochs': epochs,
            'loss': 0.0,
            'map50': 0.0,
            'map50_95': 0.0,
            'lr': lr,
            'config': {
                'dataset_yaml': dataset_yaml,
                'task': task,
                'epochs': epochs,
                'batch_size': batch_size,
                'img_size': img_size,
                'lr': lr,
                'device': device,
                'project': project,
                'name': name,
                'dataset_path': str(dataset_path),
                'train_images': str(train_images_path),
                'val_images': str(val_images_path),
                'yaml_config': yaml_config or {},
                'model': model,
                'dataset_name': dataset_name  # 保存数据集名称
            }
        }

        # 🔧 关键修复：在创建临时YAML文件之前，先删除数据集缓存文件
        print(f"🧹 [训练调试] 清理数据集缓存文件...")
        cache_files = list(dataset_path.glob('**/*.cache'))
        if cache_files:
            print(f"🧹 [训练调试] 找到 {len(cache_files)} 个缓存文件，正在删除:")
            for cache_file in cache_files:
                print(f"🧹 [训练调试]   删除: {cache_file}")
                try:
                    cache_file.unlink()
                except Exception as e:
                    print(f"🧹 [训练调试]   删除失败: {e}")
        else:
            print(f"🧹 [训练调试] 没有找到缓存文件")

        # 创建临时YAML文件，将相对路径转换为绝对路径（避免修改原文件）
        import tempfile

        # 创建临时目录
        temp_dir = Path(tempfile.mkdtemp())
        temp_yaml_path = temp_dir / "data.yaml"

        # 修改YAML配置，使用绝对路径
        yaml_config_with_abs_path = yaml_config.copy()
        yaml_config_with_abs_path['path'] = str(dataset_path.absolute())

        # 确保names字段是字典格式，避免YOLO只识别一个类别
        print(f"🔍 [训练调试] 修改YAML配置:")
        print(f"🔍 [训练调试]   原始nc: {yaml_config.get('nc')}")
        print(f"🔍 [训练调试]   原始names: {yaml_config.get('names')}")
        print(f"🔍 [训练调试]   原始names类型: {type(yaml_config.get('names'))}")

        if 'names' in yaml_config_with_abs_path and isinstance(yaml_config_with_abs_path['names'], list):
            print(f"🔍 [训练调试]   检测到names是列表格式，转换为字典格式")
            yaml_config_with_abs_path['names'] = {i: name for i, name in enumerate(yaml_config_with_abs_path['names'])}
            print(f"🔍 [训练调试]   转换后的names: {yaml_config_with_abs_path['names']}")

        # 写入临时YAML文件
        with open(temp_yaml_path, 'w', encoding='utf-8') as f:
            yaml.dump(yaml_config_with_abs_path, f, default_flow_style=False, allow_unicode=True)

        # 验证写入的临时文件
        with open(temp_yaml_path, 'r', encoding='utf-8') as f:
            verify_config = yaml.safe_load(f)
        print(f"🔍 [训练调试] 临时YAML文件验证:")
        print(f"🔍 [训练调试]   文件路径: {temp_yaml_path}")
        print(f"🔍 [训练调试]   nc: {verify_config.get('nc')}")
        print(f"🔍 [训练调试]   names: {verify_config.get('names')}")
        print(f"🔍 [训练调试]   names类型: {type(verify_config.get('names'))}")
        print(f"🔍 [训练调试]   path: {verify_config.get('path')}")
        print(f"🔍 [训练调试]   实际类别数: {len(verify_config.get('names', {}))}")

        # 保存临时YAML路径到任务配置
        self.tasks[task_id]['config']['temp_yaml'] = str(temp_yaml_path)
        self.tasks[task_id]['config']['temp_dir'] = str(temp_dir)

        # 实际训练逻辑
        self._run_training(task_id)

        return task_id
    
    def _run_training(self, task_id: str):
        """执行训练"""
        import threading
        
        def train():
            try:
                config = self.tasks[task_id]['config']
                
                # 加载模型
                model_map = {
                    'detect': 'yolov8n.pt',
                    'segment': 'yolov8n-seg.pt',
                    'classify': 'yolov8n-cls.pt',
                    'pose': 'yolov8n-pose.pt',
                    'obb': 'yolov8n-obb.pt'
                }
                
                # 优先使用用户指定的模型
                if config.get('model') and Path(config['model']).exists():
                    model_name = config['model']
                else:
                    model_name = model_map.get(config['task'], 'yolov8n.pt')
                    
                model = YOLO(model_name)
                
                # 自定义回调函数
                def on_train_epoch_end(trainer):
                    """每个 epoch 结束时的回调"""
                    epoch = trainer.epoch
                    metrics = trainer.metrics

                    # 更新任务状态
                    self.tasks[task_id]['epoch'] = epoch
                    self.tasks[task_id]['progress'] = int((epoch / config['epochs']) * 100)

                    if hasattr(metrics, 'keys'):
                        # YOLOv8 metrics键名通常是 'metrics/mAP50(B)' 和 'metrics/mAP50-95(B)'
                        for key in metrics.keys():
                            if 'loss' in str(key).lower():
                                self.tasks[task_id]['loss'] = float(metrics[key])
                            if 'mAP50(B)' in str(key):
                                self.tasks[task_id]['map50'] = float(metrics[key])
                            if 'mAP50-95(B)' in str(key):
                                self.tasks[task_id]['map50_95'] = float(metrics[key])

                    # 更新学习率
                    if hasattr(trainer, 'optimizer'):
                        self.tasks[task_id]['lr'] = trainer.optimizer.param_groups[0]['lr']
                
                # 添加回调
                model.add_callback('on_train_epoch_end', on_train_epoch_end)

                # 使用临时YAML文件进行训练
                yaml_to_use = config.get('temp_yaml', config['dataset_yaml'])

                # 🔍 关键调试：打印实际使用的YAML文件
                print(f"🔍 [训练调试] ====== 关键调试信息 ======")
                print(f"🔍 [训练调试] 实际使用的YAML文件: {yaml_to_use}")
                print(f"🔍 [训练调试] YAML文件是否存在: {Path(yaml_to_use).exists()}")

                # 验证YAML文件内容
                if Path(yaml_to_use).exists():
                    with open(yaml_to_use, 'r', encoding='utf-8') as f:
                        actual_yaml = yaml.safe_load(f)
                    print(f"🔍 [训练调试] 实际YAML内容:")
                    print(f"🔍 [训练调试]   nc: {actual_yaml.get('nc')}")
                    print(f"🔍 [训练调试]   names: {actual_yaml.get('names')}")
                    print(f"🔍 [训练调试]   names类型: {type(actual_yaml.get('names'))}")
                    print(f"🔍 [训练调试]   path: {actual_yaml.get('path')}")
                    print(f"🔍 [训练调试]   实际类别数: {len(actual_yaml.get('names', {}))}")
                print(f"🔍 [训练调试] ====== 调试信息结束 ======")

                # 构建训练参数
                train_args = {
                    'data': yaml_to_use,
                    'epochs': config['epochs'],
                    'batch': config['batch_size'],
                    'imgsz': config['img_size'],
                    'lr0': config['lr'],
                    'device': config['device'],
                    'project': config['project'],
                    'name': config['name'],
                    'exist_ok': True,
                    'verbose': True,
                    'cache': False,  # 强制不使用缓存，确保类别识别正确
                    'workers': config.get('workers', 8)  # 使用配置的workers参数，默认为8
                }
                
                # 添加高级YAML配置参数
                yaml_config = config.get('yaml_config', {})
                if yaml_config:
                    # 定义有效的训练参数（排除数据集配置参数）
                    valid_train_params = {
                        'lr0', 'lrf', 'momentum', 'weight_decay', 'warmup_epochs', 'warmup_momentum',
                        'warmup_bias_lr', 'box', 'cls', 'dfl', 'hsv_h', 'hsv_s', 'hsv_v', 'degrees',
                        'translate', 'scale', 'shear', 'perspective', 'flipud', 'fliplr', 'mosaic',
                        'mixup', 'workers', 'cache', 'conf', 'iou', 'max_det', 'vid_stride', 'plots',
                        'show', 'save_json', 'save_hybrid', 'patience', 'save', 'save_period'
                    }
                    # 排除数据集配置参数，避免覆盖临时YAML配置
                    excluded_params = {'path', 'train', 'val', 'test', 'nc', 'names', 'data'}

                    for key, value in yaml_config.items():
                        if key in valid_train_params and key not in train_args and key not in excluded_params:
                            train_args[key] = value
                
                # 训练
                results = model.train(**train_args)

                # 更新最终状态
                self.tasks[task_id]['status'] = 'completed'
                self.tasks[task_id]['progress'] = 100
                self.tasks[task_id]['save_dir'] = str(results.save_dir)
                self.tasks[task_id]['model_path'] = str(results.save_dir / 'weights' / 'best.pt')

                if hasattr(results, 'results_dict'):
                    self.tasks[task_id]['map50'] = results.results_dict.get('metrics/mAP50(B)', 0)
                    self.tasks[task_id]['map50_95'] = results.results_dict.get('metrics/mAP50-95(B)', 0)

            except Exception as e:
                self.tasks[task_id]['status'] = 'failed'
                self.tasks[task_id]['error'] = str(e)
                import traceback
                self.tasks[task_id]['traceback'] = traceback.format_exc()
            finally:
                # 清理临时文件
                import shutil
                temp_dir = config.get('temp_dir')
                if temp_dir and Path(temp_dir).exists():
                    try:
                        shutil.rmtree(temp_dir)
                    except Exception as e:
                        print(f"清理临时目录失败: {e}")
        
        thread = threading.Thread(target=train)
        thread.daemon = True
        thread.start()
    
    def get_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """获取训练状态
        
        Args:
            task_id: 任务 ID
            
        Returns:
            任务状态
        """
        return self.tasks.get(task_id)
    
    def get_curves(self, task_id: str) -> Optional[str]:
        """获取训练曲线

        Args:
            task_id: 任务 ID

        Returns:
            曲线图片路径
        """
        task = self.tasks.get(task_id)
        if task and task['status'] == 'completed':
            # 优先使用保存的实际输出目录
            if 'save_dir' in task:
                curve_path = Path(task['save_dir']) / 'results.png'
                if curve_path.exists():
                    return str(curve_path)

            # 备用方案：尝试多个可能的路径，使用用户配置的name作为目录名
            config = task.get('config', {})
            project = config.get('project', 'train')
            name = config.get('name', 'exp')

            possible_paths = [
                # 尝试用户配置的project路径，使用用户配置的name作为目录名
                Path(project) / name / 'results.png',
                # 尝试YOLO默认路径，使用用户配置的name作为目录名
                Path('runs/detect/train') / name / 'results.png',
                Path('runs/detect/runs/train') / name / 'results.png',
                Path('backend/runs/detect/train') / name / 'results.png',
                Path('backend/runs/detect/runs/train') / name / 'results.png',
                Path('train') / name / 'results.png',
            ]

            for curve_path in possible_paths:
                if curve_path.exists():
                    return str(curve_path)

            # 如果都没找到，尝试在当前目录下搜索
            import glob
            for pattern in ['**/results.png', '**/*results.png']:
                for file in glob.glob(pattern, recursive=True):
                    if task_id in file:
                        return str(Path(file).absolute())

        return None
    
    def stop_training(self, task_id: str) -> Dict[str, Any]:
        """停止训练
        
        Args:
            task_id: 任务 ID
            
        Returns:
            停止结果
        """
        if task_id in self.tasks:
            self.tasks[task_id]['status'] = 'stopped'
            return {'task_id': task_id, 'status': 'stopped'}
        return {'error': 'Task not found'}
    
    def list_models(self) -> List[str]:
        """列出所有模型
        
        Returns:
            模型信息列表
        """
        models = []
        
        # 1. 查找models目录中的模型
        models_dir = Path('models')
        if models_dir.exists():
            for model_file in models_dir.glob('*.pt'):
                models.append({
                    'name': model_file.name,
                    'path': str(model_file),
                    'size': model_file.stat().st_size if model_file.exists() else 0,
                    'type': 'manual'
                })
        
        # 2. 查找runs目录中的训练模型
        runs_dir = Path('runs')
        if runs_dir.exists():
            for task_dir in runs_dir.rglob('weights'):
                if task_dir.is_dir():
                    # 查找best.pt和last.pt
                    for model_file in task_dir.glob('*.pt'):
                        # 获取数据集名称和训练名称
                        path_parts = model_file.parts
                        dataset_name = 'unknown'
                        train_name = 'unknown'
                        
                        # 解析路径: runs/detect/{dataset_name}/{train_name}/weights/best.pt
                        for i, part in enumerate(path_parts):
                            if part == 'runs' and i + 3 < len(path_parts):
                                dataset_name = path_parts[i + 2]
                                train_name = path_parts[i + 3]
                                break
                        
                        models.append({
                            'name': f"{dataset_name}_{train_name}_{model_file.name}",
                            'path': str(model_file),
                            'size': model_file.stat().st_size if model_file.exists() else 0,
                            'type': 'trained',
                            'dataset_name': dataset_name,
                            'train_name': train_name,
                            'weight_type': model_file.stem  # best 或 last
                        })
        
        return models