"""
推理 API 路由
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from pathlib import Path
import sys
import shutil
import zipfile
import tarfile
import os
import uuid

sys.path.append(str(Path(__file__).parent.parent.parent))

from services.inference_service import InferenceService

router = APIRouter()
inference_service = InferenceService()


class LoadModelRequest(BaseModel):
    """加载模型请求"""
    model_path: str


class PredictRequest(BaseModel):
    """推理请求"""
    conf: float = 0.25
    iou: float = 0.45


@router.get("/model-directory")
async def get_model_directory():
    """获取模型目录列表"""
    try:
        project_root = Path(__file__).parent.parent.parent
        
        models = []
        
        # 遍历多个可能的训练输出目录
        possible_train_dirs = [
            project_root / "backend" / "runs" / "detect",  # 主要训练目录
            project_root / "runs" / "detect",              # 备用训练目录
        ]
        
        for detect_dir in possible_train_dirs:
            if detect_dir.exists():
                for dataset_dir in detect_dir.iterdir():
                    if dataset_dir.is_dir():
                        # 遍历每个数据集目录下的实验目录
                        for exp_dir in dataset_dir.iterdir():
                            if exp_dir.is_dir():
                                weights_file = exp_dir / "weights" / "best.pt"
                                if weights_file.exists():
                                    models.append({
                                        "name": f"{dataset_dir.name}/{exp_dir.name} (best)",
                                        "path": str(weights_file),
                                        "type": "trained",
                                        "dataset": dataset_dir.name,
                                        "experiment": exp_dir.name
                                    })
        
        # 遍历models目录（预训练模型和上传的模型）
        models_dir = project_root / "models"
        if models_dir.exists():
            for model_file in models_dir.glob("*.pt"):
                models.append({
                    "name": model_file.name,
                    "path": str(model_file),
                    "type": "pretrained"
                })
        
        return {"success": True, "data": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/load-model")
async def load_model(request: LoadModelRequest):
    """加载模型"""
    try:
        result = inference_service.load_model(request.model_path)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-model")
async def upload_model(model: UploadFile = File(...)):
    """上传模型文件"""
    try:
        project_root = Path(__file__).parent.parent.parent
        upload_dir = project_root / "models"
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = upload_dir / model.filename
        with open(file_path, "wb") as f:
            shutil.copyfileobj(model.file, f)
        
        return {
            "success": True,
            "message": "模型文件上传成功",
            "data": {"model_path": str(file_path)}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict-image")
async def predict_image(
    image: UploadFile = File(None),
    conf: float = Form(0.25),
    iou: float = Form(0.45),
    base64_image: str = Form(None)
):
    """图片推理"""
    try:
        upload_dir = Path("uploads/datasets/images")
        upload_dir.mkdir(parents=True, exist_ok=True)

        image_path = None

        if image:
            # 从上传的文件读取
            image_path = upload_dir / image.filename
            with open(image_path, "wb") as f:
                f.write(await image.read())
        elif base64_image:
            # 从base64数据读取
            image_data = base64.b64decode(base64_image)
            image_path = upload_dir / f"camera_{uuid.uuid4().hex[:8]}.jpg"
            with open(image_path, "wb") as f:
                f.write(image_data)
        else:
            raise HTTPException(status_code=400, detail="请提供图片或base64数据")

        result = inference_service.predict_image(
            image_path=str(image_path),
            conf=conf,
            iou=iou
        )

        return {"success": True, "data": result}
    except Exception as e:
        import traceback
        print(f"推理错误: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


class PredictImageJSON(BaseModel):
    """JSON格式的图片推理请求"""
    image: str  # base64编码的图片
    conf: float = 0.25
    iou: float = 0.45


@router.post("/predict-image-json")
async def predict_image_json(request: PredictImageJSON):
    """图片推理（JSON格式）"""
    try:
        import base64
        upload_dir = Path("uploads/datasets/images")
        upload_dir.mkdir(parents=True, exist_ok=True)

        # 从base64数据读取
        image_data = base64.b64decode(request.image)
        image_path = upload_dir / f"camera_{uuid.uuid4().hex[:8]}.jpg"
        with open(image_path, "wb") as f:
            f.write(image_data)

        result = inference_service.predict_image(
            image_path=str(image_path),
            conf=request.conf,
            iou=request.iou
        )

        return {"success": True, "data": result}
    except Exception as e:
        import traceback
        print(f"推理错误: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict-video")
async def predict_video(
    video: UploadFile = File(...),
    conf: float = Form(0.25),
    iou: float = Form(0.45)
):
    """视频推理"""
    try:
        upload_dir = Path("uploads/videos")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        video_path = upload_dir / video.filename
        with open(video_path, "wb") as f:
            f.write(await video.read())
        
        result = inference_service.predict_video(
            video_path=str(video_path),
            conf=conf,
            iou=iou
        )
        
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict-directory")
async def predict_directory(
    directory: UploadFile = File(...),
    conf: float = Form(0.25),
    iou: float = Form(0.45)
):
    """批量推理"""
    try:
        project_root = Path(__file__).parent.parent.parent
        upload_dir = project_root / "uploads" / "directories"
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        archive_path = upload_dir / directory.filename
        with open(archive_path, "wb") as f:
            f.write(await directory.read())
        
        # 解压
        extract_dir = upload_dir / archive_path.stem
        extract_dir.mkdir(exist_ok=True)
        
        if directory.filename.endswith('.zip'):
            with zipfile.ZipFile(archive_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
        elif directory.filename.endswith('.tar.gz') or directory.filename.endswith('.tgz'):
            with tarfile.open(archive_path, 'r:*') as tar_ref:
                tar_ref.extractall(extract_dir)
        else:
            return {"success": False, "message": "不支持的压缩格式"}
        
        # 批量推理
        result = inference_service.predict_directory(
            directory_path=str(extract_dir),
            conf=conf,
            iou=iou
        )
        
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/camera-devices")
async def get_camera_devices():
    """获取摄像头设备列表"""
    try:
        devices = inference_service.get_camera_devices()
        return {"success": True, "data": devices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start-camera")
async def start_camera_inference(
    device_id: int = Form(0),
    conf: float = Form(0.25),
    iou: float = Form(0.45)
):
    """开始摄像头推理"""
    try:
        result = inference_service.start_camera_inference(
            device_id=device_id,
            conf=conf,
            iou=iou
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop-camera")
async def stop_camera_inference():
    """停止摄像头推理"""
    try:
        inference_service.stop_camera_inference()
        return {"success": True, "message": "摄像头推理已停止"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/camera-frame")
async def get_camera_frame():
    """获取摄像头当前帧"""
    try:
        frame_data = inference_service.get_camera_frame()
        if frame_data:
            return {"success": True, "data": frame_data}
        else:
            return {"success": False, "message": "没有可用的摄像头帧"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download/{result_id}")
async def download_result(result_id: str):
    """下载推理结果"""
    try:
        result = inference_service.get_result(result_id)
        if not result:
            raise HTTPException(status_code=404, detail="结果不存在")
        
        # 视频推理：返回视频文件
        if 'video_path' in result:
            video_path = Path(result['video_path'])
            if video_path.exists():
                return FileResponse(
                    str(video_path),
                    media_type='video/mp4',
                    filename=f"result_{result_id}.mp4"
                )
        
        # 批量推理：打包整个目录为zip
        if 'output_dir' in result:
            output_dir = Path(result['output_dir'])
            if output_dir.exists() and output_dir.is_dir():
                # 创建临时zip文件
                zip_path = Path("outputs") / f"batch_result_{result_id}.zip"
                zip_path.parent.mkdir(parents=True, exist_ok=True)
                
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for root, dirs, files in os.walk(output_dir):
                        for file in files:
                            file_path = Path(root) / file
                            arcname = file_path.relative_to(output_dir)
                            zipf.write(file_path, arcname)
                
                return FileResponse(
                    str(zip_path),
                    media_type='application/zip',
                    filename=f"batch_result_{result_id}.zip"
                )
        
        raise HTTPException(status_code=404, detail="结果文件不存在")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/result/{result_id}")
async def get_inference_result(result_id: str):
    """获取推理结果"""
    try:
        result = inference_service.get_result(result_id)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))