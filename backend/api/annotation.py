"""
标注 API 路由
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
import sys
import zipfile
import shutil
import os
import json

sys.path.append(str(Path(__file__).parent.parent.parent))

from services.annotation_service import AnnotationService

router = APIRouter()
annotation_service = AnnotationService()


class AutoAnnotateRequest(BaseModel):
    """自动标注请求"""
    model_path: str
    image_dir: str
    conf: float = 0.5


class ExportDatasetRequest(BaseModel):
    """导出数据集请求"""
    image_dir: str
    label_dir: str
    class_names: List[str]


class SaveAnnotationRequest(BaseModel):
    """保存标注请求"""
    image_id: str
    annotation_data: dict
    save_dir: str


class SaveYOLORequest(BaseModel):
    """保存YOLO label请求"""
    image_id: str
    yolo_content: str
    labels_dir: str
    image_path: Optional[str] = None  # 添加图片路径，用于确定标签保存位置


@router.post("/save-annotation")
async def save_annotation(request: SaveAnnotationRequest):
    """保存JSON标注到annotations目录"""
    try:
        # 获取backend目录的绝对路径
        backend_dir = Path(__file__).parent.parent
        
        # 从save_dir中提取dataset_id
        # save_dir格式: datasets/{dataset_id}/annotations
        parts = request.save_dir.split('/')
        dataset_id = parts[1] if len(parts) > 1 else 'default'
        
        # 确保保存到annotations目录
        annotations_dir = backend_dir / "datasets" / dataset_id / "annotations"
        annotations_dir.mkdir(parents=True, exist_ok=True)
        
        # 使用传入的image_id作为文件名
        annotation_path = annotations_dir / f"{request.image_id}.json"
        with open(annotation_path, 'w', encoding='utf-8') as f:
            json.dump(request.annotation_data, f, indent=2, ensure_ascii=False)
        
        print(f"[保存JSON] 文件已保存: {annotation_path}")
        
        return {
            "success": True,
            "data": {
                "path": str(annotation_path),
                "message": f"标注文件已保存到 {annotation_path}"
            }
        }
    except Exception as e:
        print(f"[保存JSON] 错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save-yolo")
async def save_yolo_label(request: SaveYOLORequest):
    """保存YOLO label到labels目录"""
    try:
        # 获取backend目录的绝对路径
        backend_dir = Path(__file__).parent.parent
        
        # 确定标签保存位置
        if request.image_path:
            # 根据图片路径确定标签保存位置
            image_full_path = backend_dir / request.image_path
            images_dir = image_full_path.parent
            
            # 获取split目录（train/val/test）
            split = images_dir.name if images_dir.name in ['train', 'val', 'test'] else ''
            
            # 构建标签目录
            if split:
                labels_dir = backend_dir / request.labels_dir / split
            else:
                labels_dir = backend_dir / request.labels_dir
        else:
            # 如果没有提供图片路径，使用默认的labels_dir
            labels_dir = backend_dir / request.labels_dir
        
        labels_dir.mkdir(parents=True, exist_ok=True)
        
        # 直接使用传入的image_id作为文件名（已经包含正确的文件名）
        yolo_path = labels_dir / f"{request.image_id}.txt"
        with open(yolo_path, 'w', encoding='utf-8') as f:
            f.write(request.yolo_content)
        
        print(f"[保存YOLO] 文件已保存: {yolo_path}, 内容长度: {len(request.yolo_content)}")
        
        return {
            "success": True,
            "data": {
                "path": str(yolo_path),
                "message": f"YOLO label已保存到 {yolo_path}"
            }
        }
    except Exception as e:
        print(f"[保存YOLO] 错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/delete-yolo")
async def delete_yolo_label(request: dict):
    """删除YOLO label文件"""
    try:
        # 获取backend目录的绝对路径
        backend_dir = Path(__file__).parent.parent
        
        yolo_path_str = request.get("yolo_path", "")
        yolo_path = backend_dir / yolo_path_str
        
        if yolo_path.exists():
            yolo_path.unlink()
            print(f"[删除YOLO] 文件已删除: {yolo_path}")
            return {
                "success": True,
                "data": {
                    "path": str(yolo_path),
                    "message": f"YOLO label文件已删除: {yolo_path}"
                }
            }
        else:
            return {
                "success": False,
                "message": "YOLO label文件不存在"
            }
    except Exception as e:
        print(f"[删除YOLO] 错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/delete-annotation")
async def delete_annotation_file(request: dict):
    """删除JSON标注文件"""
    try:
        # 获取backend目录的绝对路径
        backend_dir = Path(__file__).parent.parent
        
        json_path_str = request.get("json_path", "")
        json_path = backend_dir / json_path_str
        
        if json_path.exists():
            json_path.unlink()
            print(f"[删除JSON] 文件已删除: {json_path}")
            return {
                "success": True,
                "data": {
                    "path": str(json_path),
                    "message": f"JSON标注文件已删除: {json_path}"
                }
            }
        else:
            return {
                "success": False,
                "message": "JSON标注文件不存在"
            }
    except Exception as e:
        print(f"[删除JSON] 错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save-all-yolo")
async def save_all_yolo_labels(request: dict):
    """保存所有YOLO labels到labels目录"""
    try:
        labels_dir = Path(request.get("labels_dir", "datasets/labels"))
        labels_dir.mkdir(parents=True, exist_ok=True)
        
        yolo_labels = request.get("labels", {})
        saved_files = []
        
        for image_id, yolo_content in yolo_labels.items():
            yolo_path = labels_dir / f"{image_id}.txt"
            with open(yolo_path, 'w', encoding='utf-8') as f:
                f.write(yolo_content)
            saved_files.append(str(yolo_path))
        
        return {
            "success": True,
            "data": {
                "saved_count": len(saved_files),
                "files": saved_files,
                "message": f"已保存 {len(saved_files)} 个YOLO label文件到 {labels_dir}"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/load-annotation")
async def load_annotation(image_id: str = Form(...), dataset_dir: str = Form(...)):
    """加载标注（优先JSON格式，其次YOLO格式）"""
    try:
        # 获取backend目录的绝对路径
        backend_dir = Path(__file__).parent.parent
        dataset_path = backend_dir / "datasets" / dataset_dir
        
        # 优先从annotations目录加载JSON格式
        # 支持两种格式：{image_id}.json 和 {image_id}.jpg.json
        json_path = dataset_path / "annotations" / f"{image_id}.json"
        
        if not json_path.exists():
            # 尝试带图片扩展名的格式
            for ext in ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp']:
                json_path = dataset_path / "annotations" / f"{image_id}{ext}.json"
                if json_path.exists():
                    break
        
        if json_path.exists():
            with open(json_path, 'r', encoding='utf-8') as f:
                annotation_data = json.load(f)
            
            return {
                "success": True,
                "data": annotation_data,
                "format": "json"
            }
        
        # 如果JSON文件不存在，尝试加载YOLO格式的txt文件
        yolo_path = dataset_path / "labels" / f"{image_id}.txt"
        
        if yolo_path.exists():
            with open(yolo_path, 'r', encoding='utf-8') as f:
                yolo_lines = f.readlines()
            
            # 解析YOLO格式：class x_center y_center width height
            boxes = []
            for line in yolo_lines:
                line = line.strip()
                if line:
                    parts = line.split()
                    if len(parts) >= 5:
                        boxes.append({
                            "class_id": int(parts[0]),
                            "x_center": float(parts[1]),
                            "y_center": float(parts[2]),
                            "width": float(parts[3]),
                            "height": float(parts[4])
                        })
            
            return {
                "success": True,
                "data": {
                    "boxes": boxes,
                    "format": "yolo"
                }
            }
        
        return {
            "success": False,
            "message": "标注文件不存在"
        }
    except Exception as e:
        import traceback
        error_detail = f"加载标注失败: {str(e)}\n{traceback.format_exc()}"
        print(f"[加载标注] 错误: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))