"""
推理服务
"""

import cv2
import numpy as np
import base64
import io
from pathlib import Path
from typing import Dict, List, Any, Optional
import uuid
import threading
import time
from PIL import Image

try:
    from ultralytics import YOLO
except ImportError:
    raise ImportError("请安装 ultralytics: pip install ultralytics")


class InferenceService:
    """推理服务"""
    
    def __init__(self):
        self.current_model = None  # 当前加载的模型
        self.current_model_info = None  # 当前模型信息
        self.results = {}  # 存储推理结果
        self.camera_running = False
        self.camera_thread = None
        self.camera_frame = None
        self.camera_lock = threading.Lock()
        
    def load_model(self, model_path: str) -> Dict[str, Any]:
        """加载模型
        
        Args:
            model_path: 模型路径
            
        Returns:
            加载结果
        """
        try:
            # 如果是相对路径，转换为绝对路径
            model_path_obj = Path(model_path)
            if not model_path_obj.is_absolute():
                project_root = Path(__file__).parent.parent.parent
                model_path_obj = project_root / model_path
            
            print(f"Loading model from: {model_path_obj}")
            
            # 清除旧模型
            self.current_model = None
            self.current_model_info = None
            
            # 加载新模型
            model = YOLO(str(model_path_obj))
            
            # 保存模型信息
            self.current_model = model
            self.current_model_info = {
                'path': str(model_path_obj),
                'task': model.task,
                'names': model.names
            }
            
            print(f"Model loaded successfully. Task: {model.task}, Names: {model.names}")
            
            return {
                'model_id': str(uuid.uuid4()),
                'task': model.task,
                'names': model.names,
                'message': '模型加载成功'
            }
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            raise Exception(f"模型加载失败: {str(e)}")
    
    def predict_image(self, image_path: str, conf: float = 0.25,
                     iou: float = 0.45) -> Dict[str, Any]:
        """图片推理
        
        Args:
            image_path: 图片路径
            conf: 置信度阈值
            iou: IoU 阈值
            
        Returns:
            推理结果
        """
        if self.current_model is None:
            raise Exception("请先加载模型")
        
        print(f"Predicting image: {image_path}")
        print(f"Using model with classes: {self.current_model_info['names']}")
        
        model = self.current_model
        
        img = cv2.imread(image_path)
        if img is None:
            raise Exception(f"无法读取图片: {image_path}")
        
        results = model.predict(image_path, conf=conf, iou=iou, verbose=False)
        
        detections = []
        for result in results:
            if result.boxes is not None:
                for box in result.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    cls_id = int(box.cls[0])
                    conf_score = float(box.conf[0])
                    
                    class_name = self.current_model_info['names'].get(cls_id, f'cls_{cls_id}')
                    
                    print(f"Detection: class={class_name}, conf={conf_score:.3f}")
                    
                    detections.append({
                        'class': class_name,
                        'class_id': cls_id,
                        'confidence': conf_score,
                        'bbox': [float(x1), float(y1), float(x2), float(y2)]
                    })
        
        annotated_img = self._visualize_results(img, results[0], self.current_model_info['names'])
        
        _, buffer = cv2.imencode('.jpg', annotated_img)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        result_id = str(uuid.uuid4())
        self.results[result_id] = {
            'detections': detections,
            'image_path': image_path
        }
        
        return {
            'result_id': result_id,
            'detections': detections,
            'image': img_base64
        }
    
    def predict_video(self, video_path: str, conf: float = 0.25,
                     iou: float = 0.45) -> Dict[str, Any]:
        """视频推理
        
        Args:
            video_path: 视频路径
            conf: 置信度阈值
            iou: IoU 阈值
            
        Returns:
            推理结果
        """
        if self.current_model is None:
            raise Exception("请先加载模型")
        
        model = self.current_model
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception(f"无法打开视频: {video_path}")
        
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        output_path = Path('outputs') / f"output_{uuid.uuid4().hex[:8]}.mp4"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))
        
        frame_count = 0
        total_detections = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            results = model.predict(frame, conf=conf, iou=iou, verbose=False)
            
            annotated_frame = self._visualize_results(frame, results[0], self.current_model_info['names'])
            out.write(annotated_frame)
            
            if results[0].boxes is not None:
                for box in results[0].boxes:
                    cls_id = int(box.cls[0])
                    conf_score = float(box.conf[0])
                    class_name = self.current_model_info['names'].get(cls_id, f'cls_{cls_id}')
                    total_detections.append({
                        'class': class_name,
                        'confidence': conf_score,
                        'frame': frame_count
                    })
            
            frame_count += 1
        
        cap.release()
        out.release()
        
        result_id = str(uuid.uuid4())
        self.results[result_id] = {
            'detections': total_detections,
            'video_path': str(output_path),
            'frame_count': frame_count
        }
        
        return {
            'result_id': result_id,
            'output_path': str(output_path),
            'frame_count': frame_count,
            'total_detections': len(total_detections)
        }
    
    def predict_directory(self, directory_path: str, conf: float = 0.25,
                        iou: float = 0.45) -> Dict[str, Any]:
        """批量推理
        
        Args:
            directory_path: 目录路径
            conf: 置信度阈值
            iou: IoU 阈值
            
        Returns:
            推理结果
        """
        if self.current_model is None:
            raise Exception("请先加载模型")
        
        model = self.current_model
        
        directory = Path(directory_path)
        if not directory.exists():
            raise Exception(f"目录不存在: {directory_path}")
        
        print(f"Processing directory: {directory_path}")
        
        # 创建输出目录
        output_dir = Path('outputs') / f"batch_{uuid.uuid4().hex[:8]}"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # 查找所有图片文件
        image_files = []
        for ext in ['*.jpg', '*.jpeg', '*.png', '*.bmp']:
            image_files.extend(directory.rglob(ext))  # 使用rglob递归查找
        
        print(f"Found {len(image_files)} images to process")
        
        results = []
        for img_file in image_files:
            try:
                print(f"Processing: {img_file}")
                
                # 读取图片
                img = cv2.imread(str(img_file))
                if img is None:
                    print(f"Failed to read: {img_file}")
                    continue
                
                # 推理
                results_list = model.predict(str(img_file), conf=conf, iou=iou, verbose=False)
                
                # 获取检测结果
                detections = []
                if results_list and results_list[0].boxes is not None:
                    for box in results_list[0].boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        cls_id = int(box.cls[0])
                        conf_score = float(box.conf[0])
                        class_name = self.current_model_info['names'].get(cls_id, f'cls_{cls_id}')
                        detections.append({
                            'class': class_name,
                            'confidence': conf_score
                        })
                
                # 可视化
                annotated_img = self._visualize_results(img, results_list[0], self.current_model_info['names'])
                
                # 保存标注后的图片
                output_path = output_dir / img_file.name
                cv2.imwrite(str(output_path), annotated_img)
                
                results.append({
                    'file_name': img_file.name,
                    'detections_count': len(detections),
                    'output_path': str(output_path)
                })
                
                print(f"Completed: {img_file}, detections: {len(detections)}")
                
            except Exception as e:
                print(f"处理 {img_file} 时出错: {e}")
        
        result_id = str(uuid.uuid4())
        self.results[result_id] = {
            'results': results,
            'output_dir': str(output_dir),
            'total_files': len(image_files),
            'processed_files': len(results)
        }
        
        print(f"Batch processing completed: {len(results)}/{len(image_files)} files processed")
        
        return {
            'result_id': result_id,
            'output_dir': str(output_dir),
            'total_files': len(image_files),
            'processed_files': len(results),
            'results': results
        }
    
    def get_camera_devices(self) -> List[Dict[str, Any]]:
        """获取摄像头设备列表"""
        devices = []
        print("开始检测摄像头设备...")
        for i in range(10):  # 检查前10个设备
            cap = cv2.VideoCapture(i)
            if cap.isOpened():
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                fps = int(cap.get(cv2.CAP_PROP_FPS))
                cap.release()
                device_info = {
                    'id': i,
                    'name': f"Camera {i}",
                    'resolution': f"{width}x{height}",
                    'fps': fps
                }
                devices.append(device_info)
                print(f"找到摄像头: {device_info}")
            else:
                cap.release()
        print(f"总共找到 {len(devices)} 个摄像头设备")
        return devices
    
    def start_camera_inference(self, device_id: int = 0, conf: float = 0.25,
                             iou: float = 0.45) -> Dict[str, Any]:
        """开始摄像头推理"""
        if self.current_model is None:
            raise Exception("请先加载模型")
        
        if self.camera_running:
            self.stop_camera_inference()
        
        self.camera_running = True
        model = self.current_model
        
        def camera_loop():
            cap = cv2.VideoCapture(device_id)
            if not cap.isOpened():
                self.camera_running = False
                raise Exception(f"无法打开摄像头设备 {device_id}，请检查设备是否连接")
            
            while self.camera_running:
                ret, frame = cap.read()
                if not ret:
                    print(f"无法从摄像头读取帧")
                    break
                
                results = model.predict(frame, conf=conf, iou=iou, verbose=False)
                annotated_frame = self._visualize_results(frame, results[0], self.current_model_info['names'])
                
                with self.camera_lock:
                    _, buffer = cv2.imencode('.jpg', annotated_frame)
                    self.camera_frame = base64.b64encode(buffer).decode('utf-8')
                
                time.sleep(0.03)  # 约30fps
            
            cap.release()
            self.camera_running = False
        
        try:
            self.camera_thread = threading.Thread(target=camera_loop)
            self.camera_thread.daemon = True
            self.camera_thread.start()
            
            return {
                'message': '摄像头推理已启动',
                'device_id': device_id
            }
        except Exception as e:
            self.camera_running = False
            raise e
    
    def stop_camera_inference(self):
        """停止摄像头推理"""
        self.camera_running = False
        if self.camera_thread:
            self.camera_thread.join(timeout=2)
        with self.camera_lock:
            self.camera_frame = None
    
    def get_camera_frame(self) -> Optional[str]:
        """获取摄像头当前帧"""
        with self.camera_lock:
            return self.camera_frame
    
    def _visualize_results(self, img: np.ndarray, result: Any,
                          names: Dict[int, str]) -> np.ndarray:
        """可视化结果"""
        annotated = img.copy()
        
        if result.boxes is not None:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                
                class_name = names.get(cls_id, f'cls_{cls_id}')
                
                color = (0, 255, 0)
                cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
                
                label = f"{class_name} {conf:.2f}"
                cv2.putText(annotated, label, (x1, y1 - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        return annotated
    
    def get_result(self, result_id: str) -> Optional[Dict[str, Any]]:
        """获取推理结果"""
        return self.results.get(result_id)