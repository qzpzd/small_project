"""
FastAPI 后端主程序
YOLO + LLM + SAM 一体化视觉平台
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response
from pathlib import Path
import uvicorn
import sys
import shutil
import datetime
import json
from typing import Optional

# 添加项目根目录到 Python 路径
sys.path.append(str(Path(__file__).parent.parent))

from api import train, inference, annotation, llm, knowledge

# 创建 FastAPI 应用
app = FastAPI(
    title="YOLO + LLM + SAM 一体化视觉平台 API",
    description="集成 YOLO 训练、推理和智能标注功能",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该指定具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 创建必要的目录
base_dir = Path(__file__).resolve().parent
Path(base_dir / "models").mkdir(exist_ok=True)
Path(base_dir / "datasets").mkdir(exist_ok=True)
Path(base_dir / "runs").mkdir(exist_ok=True)
Path(base_dir / "outputs").mkdir(exist_ok=True)
Path(base_dir / "uploads").mkdir(exist_ok=True)
Path(base_dir / "uploads" / "images").mkdir(exist_ok=True)
Path(base_dir / "uploads" / "videos").mkdir(exist_ok=True)
Path(base_dir / "uploads" / "datasets").mkdir(exist_ok=True)
Path(base_dir / "uploads" / "datasets" / "images").mkdir(exist_ok=True)
Path(base_dir / "uploads" / "datasets" / "compressed").mkdir(exist_ok=True)
Path(base_dir / "uploads" / "knowledge").mkdir(exist_ok=True)
Path(base_dir / "uploads" / "temp").mkdir(exist_ok=True)
Path(base_dir / "reports").mkdir(exist_ok=True)
Path(base_dir / "data").mkdir(exist_ok=True)
Path("uploads/knowledge").mkdir(exist_ok=True)
Path("uploads/temp").mkdir(exist_ok=True)
Path("reports").mkdir(exist_ok=True)
Path("data").mkdir(exist_ok=True)

# 注册路由
app.include_router(train.router, prefix="/api/train", tags=["训练"])
app.include_router(inference.router, prefix="/api/inference", tags=["推理"])
app.include_router(annotation.router, prefix="/api/annotation", tags=["标注"])
app.include_router(llm.router, prefix="/api/llm", tags=["LLM分析"])
app.include_router(knowledge.router, prefix="/api", tags=["知识库"])

# 创建静态文件服务器，支持CORS
class CORSStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        if hasattr(response, 'headers'):
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = '*'
            response.headers['Access-Control-Allow-Headers'] = '*'
        return response

# 挂载静态文件目录
app.mount("/uploads", CORSStaticFiles(directory="uploads"), name="uploads")
app.mount("/datasets", CORSStaticFiles(directory="datasets"), name="datasets")
app.mount("/runs", CORSStaticFiles(directory="runs"), name="runs")
app.mount("/models", CORSStaticFiles(directory="models"), name="models")
app.mount("/reports", CORSStaticFiles(directory="reports"), name="reports")


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "YOLO + LLM + SAM 一体化视觉平台 API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}


@app.post("/api/upload/extract-dataset")
async def extract_dataset(request: dict):
    """解压数据集压缩包并返回图片列表"""
    try:
        import os
        import zipfile
        import tarfile
        import shutil

        # 获取项目根目录（backend目录的父目录）
        project_root = Path(__file__).parent.parent

        path_str = request.get("path", "")
        dataset_id = request.get("dataset_id", "bottle")  # 获取数据集ID
        
        print(f"[解压] 收到解压请求，路径: {path_str}, 数据集ID: {dataset_id}")
        print(f"[解压] 项目根目录: {project_root}")

        # 处理路径,支持相对路径和绝对路径
        if path_str.startswith("/uploads/"):
            # 相对路径，转换为完整路径
            # 文件实际保存在backend目录下
            relative_path = path_str.lstrip("/")
            file_path = project_root / "backend" / relative_path
            print(f"[解压] 相对路径解析: {file_path}")
        else:
            # 已经是完整路径或相对路径
            file_path = Path(path_str)
            if not file_path.is_absolute():
                # 相对路径，相对于backend目录
                file_path = project_root / "backend" / file_path
            print(f"[解压] 绝对路径解析: {file_path}")

        print(f"[解压] 文件路径: {file_path}, 存在: {file_path.exists()}, 大小: {file_path.stat().st_size if file_path.exists() else 'N/A'}")

        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"文件不存在: {file_path}")

        # 获取backend目录的绝对路径
        backend_dir = Path(__file__).parent
        
        # 创建解压目录（使用绝对路径）
        extract_dir = backend_dir / "uploads" / "datasets" / "extracted"

        # 清理解压目录（先删除已存在的目录）
        if extract_dir.exists():
            print(f"[解压] 删除已存在的解压目录: {extract_dir}")
            shutil.rmtree(extract_dir)
        extract_dir.mkdir(parents=True, exist_ok=True)
        print(f"[解压] 创建解压目录: {extract_dir}")

        # 创建图片目标目录（使用绝对路径，保存到指定数据集的images/train目录）
        images_dir = backend_dir / "datasets" / dataset_id / "images" / "train"
        images_dir.mkdir(parents=True, exist_ok=True)
        print(f"[解压] 目标图片目录: {images_dir}")

        # 根据文件类型解压
        if file_path.suffix == '.zip':
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
        elif file_path.suffix in ['.tar', '.gz', '.tgz']:
            with tarfile.open(file_path, 'r:*') as tar_ref:
                tar_ref.extractall(extract_dir)
        else:
            raise HTTPException(status_code=400, detail="不支持的文件类型")

        # 扫描图片文件
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}
        images = []

        print(f"[解压] 开始扫描解压目录: {extract_dir}")

        # 扫描整个extracted目录并复制图片到对应数据集的images目录
        for img_file in extract_dir.rglob("*"):
            if img_file.suffix.lower() in image_extensions:
                print(f"[解压] 找到图片: {img_file.name}, 路径: {img_file}")

                # 保持原始文件名
                original_filename = img_file.name
                target_path = images_dir / original_filename

                # 复制文件到可访问目录（覆盖已存在的文件）
                shutil.copy2(img_file, target_path)

                # 获取图像信息
                image_info = {}
                try:
                    from PIL import Image
                    img = Image.open(target_path)
                    image_info = {
                        "width": img.width,
                        "height": img.height,
                        "size": target_path.stat().st_size
                    }
                except Exception as e:
                    print(f"[解压] 获取图像信息失败: {e}")

                # 生成HTTP访问路径（包含train子目录）
                http_path = f"/datasets/{dataset_id}/images/train/{target_path.name}"

                images.append({
                    "name": target_path.name,
                    "path": target_path.name,
                    "fullPath": http_path,
                    **image_info
                })
                print(f"[解压] 已添加图片: {target_path.name}, 总数: {len(images)}")

        print(f"[解压] 扫描完成，共找到 {len(images)} 张图片")

        return {
            "success": True,
            "message": f"成功解压并找到 {len(images)} 张图片",
            "data": {
                "extract_dir": str(extract_dir),
                "images": images,
                "dataset_id": dataset_id
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload/file")
async def upload_file(
    file: UploadFile = File(...),
    type: str = Form("image"),
    dataset_id: str = Form("default"),
    dataset_name: str = Form("")
):
    """
    上传文件到对应目录
    - image: 上传单个图片到datasets/{dataset_id}/images
    - directory: 上传目录中的所有图片到datasets/{dataset_id}/images
    - archive: 上传压缩文件到uploads/archives
    """
    try:
        print(f"收到上传请求: file={file.filename}, type={type}, dataset_id={dataset_id}")
        
        # 获取backend目录的绝对路径
        backend_dir = Path(__file__).parent
        
        if type == "image":
            # 上传到指定数据集的images/train目录（默认到train）
            if dataset_id and dataset_id != "default":
                save_dir = backend_dir / "datasets" / dataset_id / "images" / "train"
            else:
                # 默认上传到bottle数据集的train目录
                save_dir = backend_dir / "datasets" / "bottle" / "images" / "train"
        elif type == "archive":
            # 压缩文件上传到uploads/archives
            save_dir = backend_dir / "uploads" / "archives"
        elif type == "directory":
            # 上传到指定数据集的images/train目录（默认到train）
            if dataset_id and dataset_id != "default":
                save_dir = backend_dir / "datasets" / dataset_id / "images" / "train"
            else:
                # 默认上传到bottle数据集的train目录
                save_dir = backend_dir / "datasets" / "bottle" / "images" / "train"
        else:
            save_dir = backend_dir / "datasets" / dataset_id / "images" / "train"

        # 确保目录存在
        save_dir.mkdir(parents=True, exist_ok=True)
        print(f"上传目录: {save_dir}")

        # 提取文件名（去掉路径部分）
        import os
        actual_filename = os.path.basename(file.filename)
        
        # 保存文件
        file_path = save_dir / actual_filename
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        print(f"文件已保存: {file_path}")

        # 获取图像信息（如果是图片文件）
        image_info = {}
        if type in ["image", "directory"]:
            try:
                from PIL import Image
                img = Image.open(file_path)
                image_info = {
                    "width": img.width,
                    "height": img.height,
                    "size": file_path.stat().st_size
                }
                print(f"图像信息: {image_info}")
            except Exception as e:
                print(f"获取图像信息失败: {e}")

        # 根据类型返回正确的相对路径
        if type == "archive":
            relative_path = f"/uploads/archives/{actual_filename}"
        else:
            # 返回数据集路径（用于访问，包含train子目录）
            relative_path = f"/datasets/{dataset_id}/images/train/{actual_filename}"

        return {
            "success": True,
            "path": relative_path,
            "filename": actual_filename,
            **image_info
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dataset/download")
async def download_dataset(request: dict):
    """
    下载整个数据集，包括图片、JSON标注和YOLO标注
    """
    try:
        import zipfile
        import io
        
        dataset_id = request.get("dataset_id", "bottle")
        
        # 创建内存中的zip文件
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # 添加JSON标注文件
            annotations_dir = Path("datasets") / dataset_id
            if annotations_dir.exists():
                for json_file in annotations_dir.glob("*.json"):
                    zipf.write(json_file, f"annotations/{json_file.name}")
            
            # 添加YOLO标注文件
            labels_dir = Path("datasets/labels")
            if labels_dir.exists():
                for label_file in labels_dir.glob("*.txt"):
                    zipf.write(label_file, f"labels/{label_file.name}")
            
            # 添加图片文件 - 从多个可能的目录
            image_dirs = [
                Path("uploads/images"),
                Path("uploads/datasets/extracted"),
                Path("uploads/datasets/images")
            ]
            
            for img_dir in image_dirs:
                if img_dir.exists():
                    for img_file in img_dir.rglob("*.*"):
                        if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp']:
                            # 保持相对路径结构
                            relative_path = img_file.relative_to(img_dir.parent)
                            zipf.write(img_file, str(relative_path))
            
            # 添加README说明文件
            readme_content = f"""数据集: {dataset_id}
导出时间: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

目录说明:
- annotations/: JSON格式的标注文件
- labels/: YOLO格式的标注文件
- uploads/: 原始图片文件
"""
            zipf.writestr("README.txt", readme_content)
        
        zip_buffer.seek(0)
        
        return Response(
            content=zip_buffer.getvalue(),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={dataset_id}_dataset.zip"}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/images/list")
async def get_images_list(dataset_id: str = "bottle"):
    """获取指定数据集的图片列表，包括子目录（train/val等）中的图片"""
    try:
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}
        # 获取backend目录的绝对路径
        backend_dir = Path(__file__).parent
        # 从指定数据集的images目录获取图片
        images_dir = backend_dir / "datasets" / dataset_id / "images"
        
        if not images_dir.exists():
            return {
                "success": True,
                "data": {
                    "images": [],
                    "count": 0
                }
            }
        
        images = []
        # 递归扫描 images 目录及其子目录中的所有图片
        for img_file in images_dir.rglob("*"):
            if img_file.is_file() and img_file.suffix.lower() in image_extensions:
                # 获取相对于 images 目录的路径（例如：train/image.jpg 或 val/image.jpg）
                relative_path = img_file.relative_to(images_dir)
                # 构建访问路径（例如：/datasets/bottle/images/train/image.jpg）
                access_path = f"/datasets/{dataset_id}/images/{relative_path.as_posix()}"
                # 获取子目录名称（train/val等）
                subfolder = relative_path.parts[0] if len(relative_path.parts) > 1 else ""
                
                images.append({
                    "name": img_file.name,
                    "path": access_path,
                    "relative_path": relative_path.as_posix(),
                    "subfolder": subfolder,
                    "size": img_file.stat().st_size,
                    "modified": img_file.stat().st_mtime
                })
        
        # 按修改时间排序
        images.sort(key=lambda x: x['modified'], reverse=True)
        
        return {
            "success": True,
            "data": {
                "images": images,
                "count": len(images)
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload/dataset")
async def upload_dataset(
    dataset_file: UploadFile = File(...),
    dataset_type: str = Form("images")
):
    """
    上传数据集文件到uploads/datasets目录
    - images: 上传单个图片到uploads/datasets/images
    - compressed: 上传压缩文件到uploads/datasets/compressed
    """
    try:
        # 获取backend目录的绝对路径
        backend_dir = Path(__file__).parent
        
        # 根据类型确定保存目录
        if dataset_type == "images":
            save_dir = backend_dir / "uploads" / "datasets" / "images"
        elif dataset_type == "compressed":
            save_dir = backend_dir / "uploads" / "datasets" / "compressed"
        else:
            raise HTTPException(status_code=400, detail="无效的数据集类型")

        save_dir.mkdir(parents=True, exist_ok=True)
        
        # 保存文件
        file_path = save_dir / dataset_file.filename
        with open(file_path, "wb") as f:
            shutil.copyfileobj(dataset_file.file, f)
        
        # 返回相对于backend目录的路径
        relative_path = file_path.relative_to(backend_dir)
        
        return {
            "success": True,
            "message": f"文件上传成功: {file_path}",
            "path": str(relative_path)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/delete/image")
async def delete_image(path: str):
    """删除指定路径的图片文件"""
    try:
        # 获取backend目录的绝对路径
        backend_dir = Path(__file__).parent
        # 解析路径，确保是相对于backend目录的绝对路径
        file_path = backend_dir / path
        
        print(f"[删除] 收到删除请求，路径参数: {path}")
        print(f"[删除] backend目录: {backend_dir}")
        print(f"[删除] 解析后的完整路径: {file_path}")
        print(f"[删除] 文件是否存在: {file_path.exists()}")
        
        if file_path.exists():
            file_path.unlink()
            print(f"[删除] 文件已删除: {file_path}")
            return {
                "success": True,
                "message": f"文件删除成功: {path}"
            }
        else:
            print(f"[删除] 文件不存在: {file_path}")
            return {
                "success": False,
                "message": f"文件不存在: {path}"
            }
    except Exception as e:
        print(f"[删除] 删除文件时出错: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/images/info")
async def get_images_info(dataset_id: str = "bottle"):
    """获取指定数据集中所有图片的详细信息"""
    try:
        backend_dir = Path(__file__).parent
        images_info = []
        
        # 遍历数据集目录
        datasets_base = backend_dir / "datasets"
        if not datasets_base.exists():
            return {
                "success": True,
                "data": {
                    "images": []
                }
            }
        
        # 查找指定数据集或所有数据集
        if dataset_id == "all":
            dataset_dirs = [d for d in datasets_base.iterdir() if d.is_dir()]
        else:
            target_dir = datasets_base / dataset_id
            dataset_dirs = [target_dir] if target_dir.exists() else []
        
        print(f"[图片信息] 查找数据集: {dataset_id}, 找到 {len(dataset_dirs)} 个数据集目录")
        
        for dataset_dir in dataset_dirs:
            images_dir = dataset_dir / "images"
            if not images_dir.exists():
                continue
            
            # 遍历图片文件（包括子目录）
            print(f"[图片信息] 开始扫描目录: {images_dir}")
            for img_file in images_dir.rglob("*"):
                if img_file.is_file() and img_file.suffix.lower() in {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}:
                    try:
                        from PIL import Image
                        img = Image.open(img_file)
                        
                        # 获取相对于 images 目录的路径
                        relative_path = img_file.relative_to(images_dir)
                        subfolder = relative_path.parts[0] if len(relative_path.parts) > 1 else ""
                        
                        images_info.append({
                            "filename": img_file.name,
                            "relative_path": relative_path.as_posix(),
                            "subfolder": subfolder,
                            "dataset_id": dataset_dir.name,
                            "width": img.width,
                            "height": img.height,
                            "size": img_file.stat().st_size
                        })
                        print(f"[图片信息] 成功获取图片信息: {img_file.name}, 尺寸: {img.width}x{img.height}, 子目录: {subfolder}")
                    except Exception as e:
                        print(f"[图片信息] 获取图片信息失败: {img_file.name}, 错误: {e}")
                        # 即使读取失败，也记录文件名和大小
                        try:
                            relative_path = img_file.relative_to(images_dir)
                            subfolder = relative_path.parts[0] if len(relative_path.parts) > 1 else ""
                            
                            images_info.append({
                                "filename": img_file.name,
                                "relative_path": relative_path.as_posix(),
                                "subfolder": subfolder,
                                "dataset_id": dataset_dir.name,
                                "width": 0,
                                "height": 0,
                                "size": img_file.stat().st_size
                            })
                            print(f"[图片信息] 记录失败图片的基本信息: {img_file.name}")
                        except Exception as stat_error:
                            print(f"[图片信息] 获取文件统计信息也失败: {img_file.name}, 错误: {stat_error}")
        
        print(f"[图片信息] 找到 {len(images_info)} 张图片")
        
        return {
            "success": True,
            "data": {
                "images": images_info
            }
        }
        
    except Exception as e:
        print(f"[图片信息] 获取图片信息时出错: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/dataset/images")
async def delete_dataset_images(request: dict):
    """批量删除图片文件及其对应的标签文件"""
    try:
        backend_dir = Path(__file__).parent
        image_ids = request.get("image_ids", [])
        dataset_id = request.get("dataset_id", "bottle")
        
        print(f"[批量删除] 收到删除请求，图片数量: {len(image_ids)}, 数据集: {dataset_id}")
        
        if not image_ids:
            return {
                "success": False,
                "message": "没有指定要删除的图片"
            }
        
        deleted_count = 0
        failed_count = 0
        
        # 遍历每个图片ID进行删除
        for image_id in image_ids:
            try:
                # 直接使用image_id作为文件名（前端传递的已经是文件名）
                filename = image_id
                
                # 查找图片文件（在指定数据集目录的子目录中）
                image_file = None
                image_dir = None
                
                # 搜索指定数据集目录
                datasets_base = backend_dir / "datasets"
                target_dataset_dir = datasets_base / dataset_id
                
                if target_dataset_dir.exists() and target_dataset_dir.is_dir():
                    # 在images目录及其子目录（train/val/test）中查找图片
                    images_base = target_dataset_dir / "images"
                    if images_base.exists():
                        # 先尝试直接查找
                        potential_image = images_base / filename
                        if potential_image.exists():
                            image_file = potential_image
                            image_dir = target_dataset_dir
                        else:
                            # 如果直接查找失败，递归搜索子目录
                            for found_image in images_base.rglob(filename):
                                if found_image.is_file():
                                    image_file = found_image
                                    image_dir = target_dataset_dir
                                    break
                
                if not image_file:
                    print(f"[批量删除] 图片文件不存在: {filename}, 数据集: {dataset_id}")
                    failed_count += 1
                    continue
                
                # 删除图片文件
                image_file.unlink()
                print(f"[批量删除] 已删除图片文件: {image_file}")
                
                # 获取图片相对于images目录的路径（例如：train/image.jpg 或 val/image.jpg）
                relative_path = image_file.relative_to(images_base)
                subfolder = relative_path.parts[0] if len(relative_path.parts) > 1 else ""
                
                # 删除对应的JSON标注文件
                json_file = image_dir / "annotations" / f"{filename}.json"
                if json_file.exists():
                    json_file.unlink()
                    print(f"[批量删除] 已删除JSON标注文件: {json_file}")
                
                # 删除对应的YOLO标注文件（考虑子目录）
                if subfolder:
                    yolo_file = image_dir / "labels" / subfolder / f"{Path(filename).stem}.txt"
                else:
                    yolo_file = image_dir / "labels" / f"{Path(filename).stem}.txt"
                
                if yolo_file.exists():
                    yolo_file.unlink()
                    print(f"[批量删除] 已删除YOLO标注文件: {yolo_file}")
                
                deleted_count += 1
                
            except Exception as e:
                print(f"[批量删除] 删除图片 {image_id} 失败: {e}")
                failed_count += 1
        
        result_message = f"成功删除 {deleted_count} 张图片"
        if failed_count > 0:
            result_message += f"，失败 {failed_count} 张"
        
        return {
            "success": True,
            "message": result_message,
            "data": {
                "deleted_count": deleted_count,
                "failed_count": failed_count
            }
        }
        
    except Exception as e:
        print(f"[批量删除] 删除图片时出错: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dataset/create")
async def create_dataset(request: dict):
    """创建新数据集"""
    try:
        dataset_name = request.get("name", "").strip()
        task_type = request.get("task", "detect")
        description = request.get("description", "")
        
        if not dataset_name:
            raise HTTPException(status_code=400, detail="数据集名称不能为空")
        
        # 获取backend目录的绝对路径
        backend_dir = Path(__file__).parent
        
        # 创建数据集目录结构
        dataset_dir = backend_dir / "datasets" / dataset_name
        dataset_dir.mkdir(parents=True, exist_ok=True)
        
        # 创建子目录
        (dataset_dir / "images").mkdir(exist_ok=True)
        (dataset_dir / "labels").mkdir(exist_ok=True)
        (dataset_dir / "annotations").mkdir(exist_ok=True)
        
        # 创建train/val/test子目录
        for split in ['train', 'val', 'test']:
            (dataset_dir / "images" / split).mkdir(exist_ok=True)
            (dataset_dir / "labels" / split).mkdir(exist_ok=True)
        
        # 创建data.yaml文件（YOLO训练配置）
        data_yaml_content = {
            'path': f'../datasets/{dataset_name}',
            'train': 'images/train',
            'val': 'images/val',
            'test': 'images/test',
            'nc': 0,
            'names': []
        }
        
        import yaml
        data_yaml_file = dataset_dir / "data.yaml"
        with open(data_yaml_file, 'w', encoding='utf-8') as f:
            yaml.dump(data_yaml_content, f, allow_unicode=True, default_flow_style=False)
        
        print(f"[创建数据集] 数据集 '{dataset_name}' 创建成功，包含data.yaml文件")
        
        return {
            "success": True,
            "message": f"数据集 '{dataset_name}' 创建成功",
            "data": {
                "name": dataset_name,
                "id": dataset_name.lower().replace(" ", "-"),
                "task": task_type,
                "description": description,
                "path": str(dataset_dir.relative_to(backend_dir)),
                "image_count": 0
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dataset/list")
async def list_datasets():
    """获取所有数据集列表"""
    try:
        backend_dir = Path(__file__).parent
        datasets_dir = backend_dir / "datasets"
        
        datasets = []
        if datasets_dir.exists():
            for dataset_dir in datasets_dir.iterdir():
                if dataset_dir.is_dir():
                    # 检查是否是有效的数据集目录（有images和labels目录）
                    images_dir = dataset_dir / "images"
                    labels_dir = dataset_dir / "labels"
                    
                    if images_dir.exists() and labels_dir.exists():
                        # 统计图片数量
                        image_count = 0
                        if images_dir.exists():
                            image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}
                            # 只扫描images目录下的直接子目录和文件，避免无限递归
                            for img_file in images_dir.glob('**/*'):
                                if img_file.is_file() and img_file.suffix.lower() in image_extensions:
                                    image_count += 1
                        
                        # 转换创建时间为ISO格式
                        created_at = ""
                        if dataset_dir.exists():
                            ctime = dataset_dir.stat().st_ctime
                            created_at = datetime.datetime.fromtimestamp(ctime).isoformat()

                        # 读取描述文件
                        description = ""
                        description_file = dataset_dir / "description.txt"
                        if description_file.exists():
                            with open(description_file, 'r', encoding='utf-8') as f:
                                description = f.read().strip()

                        datasets.append({
                            "id": dataset_dir.name,
                            "name": dataset_dir.name,
                            "task": "detect",  # 默认任务类型
                            "description": description,
                            "image_count": image_count,
                            "created_at": created_at
                        })
        
        # 按创建时间排序
        datasets.sort(key=lambda x: x['created_at'], reverse=True)
        
        return {
            "success": True,
            "data": datasets
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dataset/get-labels")
async def get_dataset_labels(dataset_id: str = "bottle"):
    """获取指定数据集的标签列表"""
    try:
        # 获取backend目录的绝对路径
        backend_dir = Path(__file__).parent
        annotations_dir = backend_dir / "datasets" / dataset_id / "annotations"
        
        if not annotations_dir.exists():
            return {
                "success": True,
                "data": []
            }
        
        labels = set()  # 使用集合去重
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}
        
        # 扫描所有JSON标注文件，提取标签
        for json_file in annotations_dir.glob("*.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if 'boxes' in data and isinstance(data['boxes'], list):
                        for box in data['boxes']:
                            if 'label' in box and box['label']:
                                labels.add(box['label'])
            except Exception as e:
                print(f"[获取标签] 读取JSON文件失败 {json_file}: {e}")
                continue
        
        # 转换为标签列表格式
        label_list = []
        for i, label_name in enumerate(sorted(labels)):
            # 为每个标签生成一个颜色
            colors = ['#0052FF', '#00D4FF', '#52C41A', '#FA8C16', '#F5222D', '#722ED1', '#EB2F96', '#FAAD14']
            color = colors[i % len(colors)]
            
            label_list.append({
                "id": i + 1,
                "name": label_name,
                "color": color,
                "count": 0,  # 初始计数，后续可以统计
                "shortcut": str(i + 1)
            })
        
        print(f"[获取标签] 数据集 {dataset_id} 的标签: {label_list}")
        
        return {
            "success": True,
            "data": label_list
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/dataset/update")
async def update_dataset(request: dict):
    """更新数据集信息"""
    try:
        dataset_id = request.get("dataset_id", "")
        description = request.get("description", "")
        
        if not dataset_id:
            raise HTTPException(status_code=400, detail="数据集ID不能为空")
        
        # 获取backend目录的绝对路径
        backend_dir = Path(__file__).parent
        dataset_dir = backend_dir / "datasets" / dataset_id
        
        if not dataset_dir.exists():
            raise HTTPException(status_code=404, detail="数据集不存在")
        
        # 创建或更新描述文件
        description_file = dataset_dir / "description.txt"
        with open(description_file, 'w', encoding='utf-8') as f:
            f.write(description)
        
        return {
            "success": True,
            "message": "数据集描述已更新"
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dataset/delete")
async def delete_dataset(request: dict):
    """删除数据集及其所有内容"""
    try:
        dataset_id = request.get("dataset_id", "")
        
        if not dataset_id:
            raise HTTPException(status_code=400, detail="数据集ID不能为空")
        
        # 获取backend目录的绝对路径
        backend_dir = Path(__file__).parent
        dataset_dir = backend_dir / "datasets" / dataset_id
        
        if not dataset_dir.exists():
            raise HTTPException(status_code=404, detail=f"数据集 '{dataset_id}' 不存在")
        
        print(f"[删除数据集] 开始删除数据集: {dataset_id}")
        print(f"[删除数据集] 数据集目录: {dataset_dir}")
        
        # 统计删除的文件数量
        deleted_count = {
            "total": 0
        }
        
        # 统计文件数量
        if dataset_dir.exists():
            for item in dataset_dir.rglob("*"):
                if item.is_file():
                    deleted_count["total"] += 1
        
        # 直接删除整个数据集目录
        if dataset_dir.exists():
            shutil.rmtree(str(dataset_dir), ignore_errors=True)
            print(f"[删除数据集] 已删除目录: {dataset_dir}")
        
        print(f"[删除数据集] 删除完成: {deleted_count}")
        
        return {
            "success": True,
            "message": f"数据集 '{dataset_id}' 已删除",
            "data": {
                "dataset_id": dataset_id,
                "deleted_count": deleted_count
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dataset/move-image")
async def move_image_to_split(request: dict):
    """移动单个图片到指定的split目录（train/val/test）"""
    try:
        backend_dir = Path(__file__).parent
        image_filename = request.get("image_filename", "")
        dataset_id = request.get("dataset_id", "bottle")
        target_split = request.get("target_split", "train")
        
        print(f"[移动图片] 收到移动请求: {image_filename} -> {target_split}, 数据集: {dataset_id}")
        
        if not image_filename:
            return {
                "success": False,
                "message": "没有指定要移动的图片"
            }
        
        if target_split not in ['train', 'val', 'test']:
            return {
                "success": False,
                "message": f"无效的目标split: {target_split}，必须是 train、val 或 test"
            }
        
        # 查找图片文件
        datasets_base = backend_dir / "datasets"
        target_dataset_dir = datasets_base / dataset_id
        images_base = target_dataset_dir / "images"
        
        source_image_file = None
        current_split = None
        
        # 在images目录及其子目录中查找图片
        if images_base.exists():
            for found_image in images_base.rglob(image_filename):
                if found_image.is_file():
                    source_image_file = found_image
                    # 获取当前split（父目录名）
                    relative_path = source_image_file.relative_to(images_base)
                    if len(relative_path.parts) > 1:
                        current_split = relative_path.parts[0]
                    break
        
        if not source_image_file:
            print(f"[移动图片] 图片文件不存在: {image_filename}")
            return {
                "success": False,
                "message": f"图片文件不存在: {image_filename}"
            }
        
        # 如果已经在目标split，不需要移动
        if current_split == target_split:
            print(f"[移动图片] 图片已经在目标split: {target_split}")
            return {
                "success": True,
                "message": f"图片已经在 {target_split} 目录中"
            }
        
        # 创建目标目录
        target_dir = images_base / target_split
        target_dir.mkdir(parents=True, exist_ok=True)
        
        # 移动图片文件
        target_image_file = target_dir / image_filename
        shutil.move(str(source_image_file), str(target_image_file))
        print(f"[移动图片] 已移动图片: {source_image_file} -> {target_image_file}")
        
        # 移动对应的YOLO标注文件
        image_stem = Path(image_filename).stem
        labels_base = target_dataset_dir / "labels"
        
        if labels_base.exists() and current_split:
            # 查找并移动YOLO文件（尝试两种格式：.txt 和 .jpg.txt）
            yolo_files = []
            for yolo_name in [f"{image_stem}.txt", f"{image_filename}.txt"]:
                source_yolo_file = labels_base / current_split / yolo_name
                if source_yolo_file.exists():
                    yolo_files.append(source_yolo_file)
            
            if yolo_files:
                target_yolo_dir = labels_base / target_split
                target_yolo_dir.mkdir(parents=True, exist_ok=True)
                
                for source_yolo_file in yolo_files:
                    target_yolo_file = target_yolo_dir / source_yolo_file.name
                    shutil.move(str(source_yolo_file), str(target_yolo_file))
                    print(f"[移动图片] 已移动YOLO标注文件: {source_yolo_file} -> {target_yolo_file}")
        
        return {
            "success": True,
            "message": f"图片已成功移动到 {target_split} 目录"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        workers=1
    )