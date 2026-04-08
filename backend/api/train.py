"""
训练 API 路由
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
import yaml
import json
import shutil
import sys

sys.path.append(str(Path(__file__).parent.parent.parent))

from services.train_service import TrainService

router = APIRouter()
train_service = TrainService()


class PrepareDatasetRequest(BaseModel):
    """准备数据集请求"""
    dataset_name: str
    class_names: List[str]


class StartTrainingRequest(BaseModel):
    """开始训练请求"""
    dataset_yaml: str
    task: str = "detect"
    epochs: int = 100
    batch_size: int = 16
    img_size: int = 640
    lr: float = 0.01
    device: str = "0"
    project: str = "train"
    name: str = "exp"
    yaml_config: Optional[dict] = None  # 高级YAML配置参数
    workers: int = 8  # 数据加载线程数
    model: Optional[str] = None  # 模型文件路径


@router.post("/prepare-dataset")
async def prepare_dataset(request: PrepareDatasetRequest):
    """准备数据集"""
    try:
        result = train_service.prepare_dataset(
            dataset_name=request.dataset_name,
            class_names=request.class_names
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start")
async def start_training(request: StartTrainingRequest, background_tasks: BackgroundTasks):
    """开始训练"""
    try:
        task_id = train_service.start_training(
            dataset_yaml=request.dataset_yaml,
            task=request.task,
            epochs=request.epochs,
            batch_size=request.batch_size,
            img_size=request.img_size,
            lr=request.lr,
            device=request.device,
            project=request.project,
            name=request.name,
            workers=request.workers,
            yaml_config=request.yaml_config,
            model=request.model
        )
        return {"success": True, "task_id": task_id, "message": "训练已开始"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{task_id}")
async def get_training_status(task_id: str):
    """获取训练状态"""
    try:
        status = train_service.get_status(task_id)
        return {"success": True, "data": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/curves/{task_id}")
async def get_training_curves(task_id: str):
    """获取训练曲线"""
    try:
        curves = train_service.get_curves(task_id)
        if curves and Path(curves).exists():
            return FileResponse(curves)
        else:
            raise HTTPException(status_code=404, detail="训练曲线不存在")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"获取训练曲线失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@router.post("/stop/{task_id}")
async def stop_training(task_id: str):
    """停止训练"""
    try:
        result = train_service.stop_training(task_id)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models")
async def list_models():
    """列出所有模型"""
    try:
        models = train_service.list_models()
        
        # 过滤掉路径格式不正确的旧模型
        valid_models = []
        for model in models:
            # 只保留路径格式正确的模型
            if model['type'] == 'manual':
                # 手动模型直接保留
                valid_models.append(model)
            elif model['type'] == 'trained':
                # 训练模型需要检查路径格式
                path_parts = Path(model['path']).parts
                
                # 跳过旧的错误路径 runs/detect/runs/detect/...
                if 'runs' in path_parts and path_parts.count('runs') <= 1:
                    # 确保有足够的数据集名称信息
                    # 路径格式应该是: runs/detect/{dataset_name}/{train_name}/weights/{weight_type}.pt
                    # 或者: runs/detect/train/{dataset_name}/weights/{weight_type}.pt (旧格式)
                    
                    # 对于旧格式 runs/detect/train/{dataset_name}/...
                    if len(path_parts) >= 4 and path_parts[2] == 'train':
                        # 修正dataset_name
                        model['dataset_name'] = path_parts[3]  # 使用实际的目录名
                    
                    # 只保留best模型
                    if model.get('weight_type') == 'best':
                        valid_models.append(model)
        
        return {"success": True, "data": valid_models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download-model")
async def download_model(model_path: str):
    """下载模型文件"""
    try:
        from fastapi.responses import FileResponse
        from pathlib import Path
        from urllib.parse import unquote
        
        # 解码路径
        decoded_path = unquote(model_path)
        
        # 解析模型路径
        model_file = Path(decoded_path)
        
        if not model_file.exists():
            raise HTTPException(status_code=404, detail=f"模型文件不存在: {decoded_path}")
        
        # 返回文件
        return FileResponse(
            path=str(model_file.absolute()),
            filename=model_file.name,
            media_type="application/octet-stream"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-yaml")
async def upload_yaml(yaml: UploadFile = File(...)):
    """上传 YAML 文件"""
    try:
        # 使用项目根目录的配置目录
        project_root = Path(__file__).parent.parent.parent
        upload_dir = project_root / "config" / "datasets"
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # 保存文件
        file_path = upload_dir / yaml.filename
        with open(file_path, "wb") as f:
            shutil.copyfileobj(yaml.file, f)
        
        return {
            "success": True,
            "message": "YAML 文件上传成功",
            "data": {"yaml_path": str(file_path.absolute())}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-model")
async def upload_model(model: UploadFile = File(...)):
    """上传模型文件"""
    try:
        # 使用项目根目录的模型目录
        project_root = Path(__file__).parent.parent.parent
        upload_dir = project_root / "models"
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # 保存文件
        file_path = upload_dir / model.filename
        with open(file_path, "wb") as f:
            shutil.copyfileobj(model.file, f)
        
        return {
            "success": True,
            "message": "模型文件上传成功",
            "data": {"model_path": str(file_path.absolute())}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scan-directory")
async def scan_directory(request: dict):
    """扫描目录中的文件"""
    try:
        path = Path(request.get("path", ""))
        file_type = request.get("file_type", "")
        
        if not path.exists():
            return {"success": True, "data": {"files": []}}
        
        files = []
        if file_type == "yaml":
            for file in path.glob("*.yaml"):
                files.append({
                    "name": file.name,
                    "path": str(file.absolute())
                })
            for file in path.glob("*.yml"):
                files.append({
                    "name": file.name,
                    "path": str(file.absolute())
                })
        elif file_type == "model":
            for file in path.glob("*.pt"):
                files.append({
                    "name": file.name,
                    "path": str(file.absolute())
                })
            for file in path.glob("*.pth"):
                files.append({
                    "name": file.name,
                    "path": str(file.absolute())
                })
        
        return {"success": True, "data": {"files": files}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/yaml-directory")
async def get_yaml_directory():
    """获取YAML目录列表"""
    try:
        # 使用项目根目录的配置目录
        project_root = Path(__file__).parent.parent.parent
        yaml_dir = project_root / "config" / "datasets"
        
        if not yaml_dir.exists():
            return {"success": True, "data": []}
        
        yaml_files = []
        for file in yaml_dir.glob("*.yaml"):
            yaml_files.append({
                "name": file.name,
                "path": str(file.absolute())
            })
        for file in yaml_dir.glob("*.yml"):
            yaml_files.append({
                "name": file.name,
                "path": str(file.absolute())
            })
        
        return {"success": True, "data": yaml_files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model-directory")
async def get_model_directory():
    """获取模型目录列表"""
    try:
        # 使用项目根目录的模型目录
        project_root = Path(__file__).parent.parent.parent
        model_dir = project_root / "models"
        
        if not model_dir.exists():
            return {"success": True, "data": []}
        
        model_files = []
        for file in model_dir.glob("*.pt"):
            model_files.append({
                "name": file.name,
                "path": str(file.absolute())
            })
        for file in model_dir.glob("*.pth"):
            model_files.append({
                "name": file.name,
                "path": str(file.absolute())
            })
        
        return {"success": True, "data": model_files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-dataset")
async def upload_dataset(dataset: UploadFile = File(...)):
    """上传数据集压缩包"""
    try:
        # 使用项目根目录的数据集目录
        project_root = Path(__file__).parent.parent.parent
        upload_dir = project_root / "datasets"
        upload_dir.mkdir(parents=True, exist_ok=True)

        # 保存压缩包
        file_path = upload_dir / dataset.filename
        with open(file_path, "wb") as f:
            shutil.copyfileobj(dataset.file, f)

        # 解压数据集
        import zipfile
        import tarfile
        import os
        import tempfile

        # 确定数据集名称（去除压缩包扩展名）
        if dataset.filename.endswith('.tar.gz'):
            dataset_name = dataset.filename[:-7]
        elif dataset.filename.endswith('.tgz'):
            dataset_name = dataset.filename[:-4]
        elif dataset.filename.endswith('.tar'):
            dataset_name = dataset.filename[:-4]
        elif dataset.filename.endswith('.zip'):
            dataset_name = dataset.filename[:-4]
        else:
            dataset_name = dataset.filename

        dataset_path = upload_dir / dataset_name

        # 如果目录已存在，先删除
        if dataset_path.exists():
            shutil.rmtree(dataset_path)

        # 创建临时目录用于解压
        temp_dir = upload_dir / f"temp_{dataset_name}"
        temp_dir.mkdir(parents=True, exist_ok=True)

        if dataset.filename.endswith('.zip'):
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
        elif dataset.filename.endswith('.tar') or dataset.filename.endswith('.tar.gz') or dataset.filename.endswith('.tgz'):
            with tarfile.open(file_path, 'r:*') as tar_ref:
                tar_ref.extractall(temp_dir)
        else:
            return {
                "success": False,
                "message": "不支持的压缩格式，请上传 .zip 或 .tar.gz 文件"
            }

        # 检查解压后的内容
        contents = list(temp_dir.iterdir())

        # 如果只有一个子目录，则将内容移动到目标目录
        if len(contents) == 1 and contents[0].is_dir():
            shutil.move(str(contents[0]), str(dataset_path))
        else:
            shutil.move(str(temp_dir), str(dataset_path))

        # 清理临时目录
        if temp_dir.exists():
            shutil.rmtree(temp_dir)

        # 删除压缩包
        os.remove(file_path)

        return {
            "success": True,
            "message": "数据集上传并解压成功",
            "data": {
                "dataset_name": dataset_name,
                "dataset_path": str(dataset_path.absolute())
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/delete-file")
async def delete_file(request: dict):
    """删除文件"""
    try:
        file_path_str = request.get("file_path", "")
        file_type = request.get("file_type", "")
        
        # 转换为绝对路径（相对于backend目录）
        backend_root = Path(__file__).parent.parent  # backend目录（api的父目录）
        file_path = (backend_root / file_path_str).resolve()  # 解析为绝对路径
        
        if not file_path.exists():
            return {
                "success": False,
                "message": f"文件不存在: {file_path}"
            }
        
        # 安全检查：确保文件在backend目录内
        try:
            file_path.relative_to(backend_root)
        except ValueError:
            return {
                "success": False,
                "message": "不能删除项目目录外的文件"
            }
        
        # 删除文件或目录
        if file_path.is_dir():
            shutil.rmtree(file_path)
        else:
            file_path.unlink()
        
        return {
            "success": True,
            "message": f"{'目录' if file_path.is_dir() else '文件'}删除成功"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dataset-directory")
async def get_dataset_directory():
    """获取数据集目录列表"""
    try:
        # 使用项目根目录的数据集目录
        project_root = Path(__file__).parent.parent.parent
        dataset_dir = project_root / "datasets"
        
        if not dataset_dir.exists():
            return {"success": True, "data": []}
        
        datasets = []
        for item in dataset_dir.iterdir():
            if item.is_dir():
                # 检查是否是有效的数据集目录（包含 images 和 labels 目录）
                images_dir = item / "images"
                labels_dir = item / "labels"
                is_valid_dataset = images_dir.exists() and labels_dir.exists()
                
                datasets.append({
                    "name": item.name,
                    "path": str(item.absolute()),
                    "is_valid": is_valid_dataset
                })
        
        return {"success": True, "data": datasets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fix-yaml-path")
async def fix_yaml_path(request: dict):
    """修正YAML文件中的数据集路径"""
    try:
        yaml_path = Path(request.get("yaml_path", ""))
        dataset_path = request.get("dataset_path", "")

        if not yaml_path.exists():
            return {
                "success": False,
                "message": f"YAML文件不存在: {yaml_path}"
            }

        # 获取项目根目录
        project_root = Path(__file__).parent.parent.parent
        backend_dir = Path(__file__).parent.parent
        datasets_dir = project_root / "datasets"  # 项目根目录下的datasets文件夹（训练界面使用）

        # 处理数据集路径
        if dataset_path:
            # 检查路径是否存在（支持多种路径格式）
            dataset_abs_path = None
            
            # 尝试多种可能的路径解析方式
            possible_paths = []
            
            # 1. 优先在项目根目录的datasets文件夹中查找（训练界面使用）
            possible_paths.append(datasets_dir / dataset_path)
            
            # 2. 尝试直接路径
            if Path(dataset_path).exists():
                possible_paths.append(Path(dataset_path).absolute())
            # 3. 尝试相对于backend目录的路径（标注使用）
            elif (backend_dir / dataset_path).exists():
                possible_paths.append((backend_dir / dataset_path).absolute())
            # 4. 尝试相对于项目根目录的路径
            elif (project_root / dataset_path).exists():
                possible_paths.append((project_root / dataset_path).absolute())
            
            # 尝试找到第一个存在的路径
            for possible_path in possible_paths:
                if possible_path and possible_path.exists():
                    dataset_abs_path = possible_path
                    break
            
            if not dataset_abs_path:
                # 如果路径不存在，尝试基于当前数据集列表推断正确路径
                dataset_name = Path(dataset_path).name
                if dataset_name.endswith('_dataset'):
                    dataset_name = dataset_name[:-8]  # 移除_dataset后缀
                
                # 尝试找到匹配的数据集目录（优先在项目根目录datasets）
                inferred_paths = [
                    datasets_dir / dataset_name,  # 优先：项目根目录datasets
                    datasets_dir / f"{dataset_name}_dataset",  # 项目根目录datasets + _dataset后缀
                    backend_dir / "datasets" / dataset_name,  # backend目录datasets
                    backend_dir / "datasets" / f"{dataset_name}_dataset",  # backend目录datasets + _dataset后缀
                ]
                
                for inferred_path in inferred_paths:
                    if inferred_path.exists():
                        dataset_abs_path = inferred_path
                        break
                
                if not dataset_abs_path:
                    return {
                        "success": False,
                        "message": f"数据集路径不存在: {dataset_path} (尝试了多个可能的位置)"
                    }

            # 将绝对路径转换为相对于项目根目录的路径
            try:
                dataset_rel_path = dataset_abs_path.relative_to(project_root)
                yaml_dataset_path = str(dataset_rel_path)
            except ValueError:
                # 如果无法转换为相对路径，使用绝对路径
                yaml_dataset_path = str(dataset_abs_path)
        else:
            # 没有提供数据集路径，不进行修改
            return {
                "success": False,
                "message": "未提供数据集路径"
            }

        # 读取YAML文件
        with open(yaml_path, 'r', encoding='utf-8') as f:
            yaml_content = yaml.safe_load(f)

        # 修正路径
        yaml_content['path'] = yaml_dataset_path

        # 写回YAML文件
        with open(yaml_path, 'w', encoding='utf-8') as f:
            yaml.dump(yaml_content, f, default_flow_style=False, allow_unicode=True)

        return {
            "success": True,
            "message": "YAML路径修正成功",
            "data": {
                "yaml_path": str(yaml_path.absolute()),
                "dataset_path": yaml_dataset_path
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results/{task_id}")
async def get_training_results(task_id: str):
    """获取训练结果的所有图片"""
    try:
        # 定义项目根目录，确保在整个函数中都可用
        project_root = Path(__file__).parent.parent.parent
        results_dir = None

        # 首先尝试从任务状态中获取
        task = train_service.get_status(task_id)
        if task:
            # 优先使用保存的实际输出目录
            if 'save_dir' in task:
                save_dir_path = Path(task['save_dir'])
                if save_dir_path.exists():
                    results_dir = save_dir_path

            # 备用方案：尝试多个可能的路径
            if not results_dir:
                config = task.get('config', {})
                project = config.get('project', 'train')
                name = config.get('name', 'exp')

                possible_dirs = [
                    project_root / project / name,
                    project_root / 'runs/detect/train' / name,
                    project_root / 'runs/detect/runs/train' / name,
                    project_root / 'backend/runs/detect/train' / name,
                    project_root / 'backend/runs/detect/runs/train' / name,
                    project_root / 'train' / name,
                ]

                for dir_path in possible_dirs:
                    if dir_path.exists():
                        results_dir = dir_path
                        break

        # 如果任务不存在或没找到目录，使用用户配置的name查找
        if not results_dir:
            config = task.get('config', {}) if task else {}
            name = config.get('name', 'exp') if config else 'exp'
            project = config.get('project', 'train') if config else 'train'

            name_dirs = [
                project_root / project / name,
                project_root / 'runs/detect/runs/train' / name,
                project_root / 'backend/runs/detect/runs/train' / name,
                project_root / 'runs/detect/train' / name,
                project_root / 'train' / name,
            ]
            for dir_path in name_dirs:
                if dir_path.exists():
                    results_dir = dir_path
                    break

            # 如果还是找不到，尝试常见的训练名称
            if not results_dir:
                common_names = ['exp', 'exp2', 'exp3', 'bottle', 'bottle1', 'bottle2']
                for common_name in common_names:
                    for base_dir in [
                        project_root / 'backend/runs/detect/train' / common_name,
                        project_root / 'runs/detect/runs/train' / common_name,
                        project_root / 'runs/detect/train' / common_name,
                        project_root / 'train' / common_name,
                    ]:
                        if base_dir.exists():
                            results_dir = base_dir
                            break
                    if results_dir:
                        break

        # 最后尝试直接使用task_id作为目录名（兼容旧版本）
        if not results_dir:
            task_id_dirs = [
                project_root / 'runs/detect/runs/train' / task_id,
                project_root / 'backend/runs/detect/runs/train' / task_id,
                project_root / 'backend/runs/detect/train' / task_id,
                project_root / 'runs/detect/train' / task_id,
                project_root / 'train' / task_id,
            ]
            for dir_path in task_id_dirs:
                if dir_path.exists():
                    results_dir = dir_path
                    break

        if not results_dir:
            return {"success": True, "data": {"images": []}}

        # 收集所有图片文件
        image_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp']
        images = []

        # 按文件类型分组
        category_map = {
            'results.png': '训练曲线',
            'confusion_matrix.png': '混淆矩阵',
            'confusion_matrix_normalized.png': '混淆矩阵',
            'F1_curve.png': '性能指标曲线',
            'P_curve.png': '性能指标曲线',
            'R_curve.png': '性能指标曲线',
            'PR_curve.png': '性能指标曲线',
            'BoxF1_curve.png': '性能指标曲线',
            'BoxP_curve.png': '性能指标曲线',
            'BoxR_curve.png': '性能指标曲线',
            'BoxPR_curve.png': '性能指标曲线',
            'labels_correlogram.jpg': '标签分析',
            'labels.jpg': '标签分析',
        }

        for img_file in sorted(results_dir.glob('*')):
            if img_file.suffix.lower() in image_extensions:
                category = category_map.get(img_file.name, '其他')
                images.append({
                    'name': img_file.name,
                    'path': str(img_file.relative_to(project_root)),
                    'category': category,
                    'size': img_file.stat().st_size
                })

        return {
            "success": True,
            "data": {
                "images": images,
                "results_dir": str(results_dir.relative_to(project_root))
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/result-image/{task_id}/{filename}")
async def get_result_image(task_id: str, filename: str):
    """获取训练结果图片"""
    try:
        # 定义项目根目录
        project_root = Path(__file__).parent.parent.parent
        image_path = None

        # 首先尝试从任务状态中获取
        task = train_service.get_status(task_id)
        if task:
            # 优先使用保存的实际输出目录
            if 'save_dir' in task:
                potential_path = Path(task['save_dir']) / filename
                if potential_path.exists():
                    image_path = potential_path

            # 备用方案：尝试多个可能的路径
            if not image_path:
                config = task.get('config', {})
                project = config.get('project', 'train')
                name = config.get('name', 'exp')

                possible_dirs = [
                    project_root / project / name,
                    project_root / 'runs/detect/train' / name,
                    project_root / 'runs/detect/runs/train' / name,
                    project_root / 'backend/runs/detect/train' / name,
                    project_root / 'backend/runs/detect/runs/train' / name,
                    project_root / 'train' / name,
                ]

                for dir_path in possible_dirs:
                    potential_path = dir_path / filename
                    if potential_path.exists():
                        image_path = potential_path
                        break

        # 如果任务不存在或没找到图片，使用用户配置的name查找
        if not image_path:
            config = task.get('config', {}) if task else {}
            name = config.get('name', 'exp') if config else 'exp'
            project = config.get('project', 'train') if config else 'train'

            name_dirs = [
                project_root / project / name / filename,
                project_root / 'runs/detect/runs/train' / name / filename,
                project_root / 'backend/runs/detect/runs/train' / name / filename,
                project_root / 'runs/detect/train' / name / filename,
                project_root / 'train' / name / filename,
            ]
            for potential_path in name_dirs:
                if potential_path.exists():
                    image_path = potential_path
                    break

            # 如果还是找不到，尝试常见的训练名称
            if not image_path:
                common_names = ['exp', 'exp2', 'exp3', 'bottle', 'bottle1', 'bottle2']
                for common_name in common_names:
                    for base_dir in [
                        project_root / 'backend/runs/detect/train' / common_name / filename,
                        project_root / 'runs/detect/runs/train' / common_name / filename,
                        project_root / 'runs/detect/train' / common_name / filename,
                        project_root / 'train' / common_name / filename,
                    ]:
                        if base_dir.exists():
                            image_path = base_dir
                            break
                    if image_path:
                        break

        # 最后尝试直接使用task_id作为目录名（兼容旧版本）
        if not image_path:
            task_id_dirs = [
                project_root / 'runs/detect/runs/train' / task_id / filename,
                project_root / 'backend/runs/detect/runs/train' / task_id / filename,
                project_root / 'backend/runs/detect/train' / task_id / filename,
                project_root / 'runs/detect/train' / task_id / filename,
                project_root / 'train' / task_id / filename,
            ]
            for potential_path in task_id_dirs:
                if potential_path.exists():
                    image_path = potential_path
                    break
            for potential_path in task_id_dirs:
                if potential_path.exists():
                    image_path = potential_path
                    break

        if not image_path:
            raise HTTPException(status_code=404, detail=f"图片不存在: {filename}")

        return FileResponse(image_path)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"获取训练结果图片失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


class GenerateDataYamlRequest(BaseModel):
    """生成data.yaml请求"""
    dataset_id: str
    train_ratio: float = 0.8
    val_ratio: float = 0.2
    test_ratio: float = 0.0


class SplitDatasetRequest(BaseModel):
    """划分数据集请求"""
    dataset_id: str
    split: str  # train, val, test
    image_ids: List[str]


@router.post("/generate-data-yaml")
async def generate_data_yaml(request: GenerateDataYamlRequest):
    """生成data.yaml文件"""
    try:
        # 使用backend目录下的datasets
        backend_dir = Path(__file__).parent.parent
        dataset_dir = backend_dir / "datasets" / request.dataset_id
        
        if not dataset_dir.exists():
            return {"success": False, "message": f"数据集不存在: {request.dataset_id}"}
        
        # 检查类别
        labels_dir = dataset_dir / "labels"
        class_ids = set()
        
        if labels_dir.exists():
            for label_file in labels_dir.glob("*.txt"):
                with open(label_file, 'r') as f:
                    for line in f:
                        if line.strip():
                            class_id = int(line.split()[0])
                            class_ids.add(class_id)
        
        # 生成类别名称
        class_ids = sorted(list(class_ids))
        class_names = [f"class_{cid}" for cid in class_ids]
        
        # 生成data.yaml内容
        data_yaml_content = {
            'path': f'../datasets/{request.dataset_id}',
            'train': 'images/train',
            'val': 'images/val',
            'test': 'images/test',
            'nc': len(class_names),
            'names': class_names
        }
        
        # 保存data.yaml
        yaml_path = dataset_dir / "data.yaml"
        with open(yaml_path, 'w', encoding='utf-8') as f:
            yaml.dump(data_yaml_content, f, default_flow_style=False, allow_unicode=True)
        
        return {
            "success": True,
            "message": "data.yaml生成成功",
            "data": {
                "yaml_path": str(yaml_path),
                "content": data_yaml_content
            }
        }
    except Exception as e:
        import traceback
        error_detail = f"生成data.yaml失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@router.post("/split-dataset-by-ratio")
async def split_dataset_by_ratio(request: GenerateDataYamlRequest):
    """按比例划分数据集"""
    try:
        # 使用backend目录下的datasets
        backend_dir = Path(__file__).parent.parent
        dataset_dir = backend_dir / "datasets" / request.dataset_id
        
        if not dataset_dir.exists():
            return {"success": False, "message": f"数据集不存在: {request.dataset_id}"}
        
        images_dir = dataset_dir / "images"
        labels_dir = dataset_dir / "labels"
        
        if not images_dir.exists():
            return {"success": False, "message": "images目录不存在"}
        
        # 获取所有图片 - 只从根目录获取，不包括子目录
        image_files = []
        for ext in ['*.jpg', '*.jpeg', '*.png', '*.bmp']:
            image_files.extend(images_dir.glob(ext))
        
        # 如果根目录没有图片，尝试从子目录收集
        if not image_files:
            for split in ['train', 'val', 'test']:
                split_dir = images_dir / split
                if split_dir.exists():
                    for ext in ['*.jpg', '*.jpeg', '*.png', '*.bmp']:
                        image_files.extend(split_dir.glob(ext))
        
        if not image_files:
            return {"success": False, "message": "没有找到图片文件"}
        
        # 创建train/val/test目录
        for split in ['train', 'val', 'test']:
            (images_dir / split).mkdir(exist_ok=True)
            (labels_dir / split).mkdir(exist_ok=True)
        
        # 随机打乱
        import random
        random.shuffle(image_files)
        
        # 计算划分数量
        total = len(image_files)
        
        # 对于数据集较少的情况，采用智能分配策略
        if total <= 3:
            # 数据集很少时，至少保证train有图片
            train_count = max(1, total - 1)
            val_count = 1 if total > 1 else 0
            test_count = 0
        elif total <= 5:
            # 5张或更少时，保证train至少3张，val和test各1张
            train_count = max(3, total - 2)
            val_count = 1
            test_count = total - train_count - val_count
        else:
            # 数据集较多时，按比例分配
            train_count = int(total * request.train_ratio)
            val_count = int(total * request.val_ratio)
            test_count = total - train_count - val_count
        
        # 确保至少每个划分都有1张图片（如果可能）
        if total >= 3 and val_count == 0:
            val_count = 1
            train_count -= 1
        if total >= 4 and test_count == 0:
            test_count = 1
            train_count -= 1
        
        # 划分数据集
        train_images = image_files[:train_count]
        val_images = image_files[train_count:train_count + val_count]
        test_images = image_files[train_count + val_count:]
        
        # 移动文件
        def move_files(image_list, split_name):
            for img_file in image_list:
                # 检查文件是否已经在目标目录中
                if str(img_file.parent) == str(images_dir / split_name):
                    continue  # 已经在目标目录中，跳过
                
                # 移动图片
                img_target = images_dir / split_name / img_file.name
                if img_target.exists():
                    img_target.unlink()
                shutil.move(str(img_file), str(img_target))
                
                # 移动对应的标签文件（从根目录或任何子目录）
                label_file = None
                # 先在根目录查找
                potential_label = labels_dir / f"{img_file.stem}.txt"
                if potential_label.exists():
                    label_file = potential_label
                else:
                    # 在子目录中查找
                    for split in ['train', 'val', 'test']:
                        potential_label = labels_dir / split / f"{img_file.stem}.txt"
                        if potential_label.exists():
                            label_file = potential_label
                            break
                
                if label_file:
                    # 检查标签文件是否已经在目标目录中
                    if str(label_file.parent) == str(labels_dir / split_name):
                        continue  # 已经在目标目录中，跳过
                    
                    label_target = labels_dir / split_name / label_file.name
                    if label_target.exists():
                        label_target.unlink()
                    shutil.move(str(label_file), str(label_target))
        
        move_files(train_images, 'train')
        move_files(val_images, 'val')
        move_files(test_images, 'test')
        
        # 生成data.yaml
        await generate_data_yaml(request)
        
        return {
            "success": True,
            "message": f"数据集划分完成: train={len(train_images)}, val={len(val_images)}, test={len(test_images)}",
            "data": {
                "train": len(train_images),
                "val": len(val_images),
                "test": len(test_images)
            }
        }
    except Exception as e:
        import traceback
        error_detail = f"划分数据集失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@router.post("/move-image-to-split")
async def move_image_to_split(request: SplitDatasetRequest):
    """移动图片到指定分割"""
    try:
        # 使用backend目录下的datasets
        backend_dir = Path(__file__).parent.parent
        dataset_dir = backend_dir / "datasets" / request.dataset_id
        
        if not dataset_dir.exists():
            return {"success": False, "message": f"数据集不存在: {request.dataset_id}"}
        
        images_dir = dataset_dir / "images"
        labels_dir = dataset_dir / "labels"
        
        moved_count = 0
        failed_images = []
        
        for image_id in request.image_ids:
            # 查找图片文件
            img_file = None
            for split in ['train', 'val', 'test']:
                potential_img = images_dir / split / image_id
                if potential_img.exists():
                    img_file = potential_img
                    break
            
            if img_file is None:
                # 尝试在根目录查找
                potential_img = images_dir / image_id
                if potential_img.exists():
                    img_file = potential_img
            
            if img_file is None:
                failed_images.append(image_id)
                continue
            
            # 移动图片
            target_dir = images_dir / request.split
            target_dir.mkdir(exist_ok=True)
            target_img = target_dir / img_file.name
            
            if target_img.exists():
                target_img.unlink()
            shutil.move(str(img_file), str(target_img))
            
            # 移动对应的标签文件（从根目录或任何子目录）
            label_file = None
            # 先在根目录查找
            potential_label = labels_dir / f"{img_file.stem}.txt"
            if potential_label.exists():
                label_file = potential_label
            else:
                # 在子目录中查找
                for split in ['train', 'val', 'test']:
                    potential_label = labels_dir / split / f"{img_file.stem}.txt"
                    if potential_label.exists():
                        label_file = potential_label
                        break
            
            if label_file:
                target_label_dir = labels_dir / request.split
                target_label_dir.mkdir(exist_ok=True)
                target_label = target_label_dir / label_file.name
                
                if target_label.exists():
                    target_label.unlink()
                shutil.move(str(label_file), str(target_label))
            
            moved_count += 1
        
        return {
            "success": True,
            "message": f"成功移动{moved_count}张图片到{request.split}",
            "data": {
                "moved_count": moved_count,
                "failed_images": failed_images
            }
        }
    except Exception as e:
        import traceback
        error_detail = f"移动图片失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@router.post("/update-data-yaml")
async def update_data_yaml(request: dict):
    """更新data.yaml文件，使用前端传递的label列表"""
    try:
        dataset_id = request.get("dataset_id", "")
        label_names = request.get("label_names", [])  # 前端传递的label列表
        
        if not dataset_id:
            return {"success": False, "message": "数据集ID不能为空"}
        
        # 使用backend目录下的datasets
        backend_dir = Path(__file__).parent.parent
        dataset_dir = backend_dir / "datasets" / dataset_id
        
        if not dataset_dir.exists():
            return {"success": False, "message": f"数据集不存在: {dataset_id}"}
        
        # 如果前端传递了label列表，直接使用
        if label_names is not None:  # 区分空列表和未传递
            if len(label_names) == 0:
                # 如果传递了空列表，设置为默认值
                class_names = []  # 空列表表示没有类别
            else:
                class_names = label_names
        else:
            # 如果前端没有传递label列表，从JSON标注文件中提取
            annotations_dir = dataset_dir / "annotations"
            label_names_map = {}  # 存储标签名称到索引的映射
            
            if annotations_dir.exists():
                for json_file in annotations_dir.glob("*.json"):
                    try:
                        with open(json_file, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                            if 'boxes' in data and isinstance(data['boxes'], list):
                                for box in data['boxes']:
                                    if 'label' in box and box['label']:
                                        label_name = box['label']
                                        if label_name not in label_names_map:
                                            # 按照出现的顺序分配索引
                                            label_names_map[label_name] = len(label_names_map)
                    except Exception as e:
                        print(f"[更新data.yaml] 读取JSON文件失败 {json_file}: {e}")
                        continue
            
            # 如果从JSON文件中提取到了标签，使用这些标签
            if label_names_map:
                # 按索引排序标签名称
                class_names = [name for name, idx in sorted(label_names_map.items(), key=lambda x: x[1])]
            else:
                # 如果没有JSON文件，从YOLO标签文件中提取类别信息
                labels_dir = dataset_dir / "labels"
                class_ids = set()
                
                if labels_dir.exists():
                    for label_file in labels_dir.rglob("*.txt"):
                        try:
                            with open(label_file, 'r') as f:
                                for line in f:
                                    if line.strip():
                                        class_id = int(line.split()[0])
                                        class_ids.add(class_id)
                        except Exception as e:
                            print(f"[更新data.yaml] 读取YOLO文件失败 {label_file}: {e}")
                            continue
                
                # 生成类别名称
                class_ids = sorted(list(class_ids))
                class_names = [f"class_{cid}" for cid in class_ids]
        
        # 更新或创建data.yaml
        yaml_path = dataset_dir / "data.yaml"
        
        if yaml_path.exists():
            with open(yaml_path, 'r', encoding='utf-8') as f:
                yaml_content = yaml.safe_load(f) or {}
        else:
            # 如果data.yaml不存在，创建默认配置
            yaml_content = {
                'path': str(dataset_dir.absolute()),
                'train': 'images/train',
                'val': 'images/val',
                'test': 'images/test'
            }
        
        yaml_content['nc'] = len(class_names)
        yaml_content['names'] = class_names
        
        with open(yaml_path, 'w', encoding='utf-8') as f:
            yaml.dump(yaml_content, f, default_flow_style=False, allow_unicode=True)
        
        return {
            "success": True,
            "message": f"data.yaml已更新: {len(class_names)}个类别",
            "data": {
                "nc": len(class_names),
                "names": class_names
            }
        }
    except Exception as e:
        import traceback
        error_detail = f"更新data.yaml失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@router.get("/dataset-splits/{dataset_id}")
async def get_dataset_splits(dataset_id: str):
    """获取数据集划分信息"""
    try:
        project_root = Path(__file__).parent.parent.parent
        dataset_dir = project_root / "datasets" / dataset_id
        
        if not dataset_dir.exists():
            return {"success": False, "message": f"数据集不存在: {dataset_id}"}
        
        images_dir = dataset_dir / "images"
        
        splits = {}
        for split in ['train', 'val', 'test']:
            split_dir = images_dir / split
            if split_dir.exists():
                image_count = len(list(split_dir.glob("*.jpg")) + list(split_dir.glob("*.jpeg")) + 
                               list(split_dir.glob("*.png")) + list(split_dir.glob("*.bmp")))
                splits[split] = image_count
            else:
                splits[split] = 0
        
        return {
            "success": True,
            "data": splits
        }
    except Exception as e:
        import traceback
        error_detail = f"获取数据集划分失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)