from PIL import Image
import io
import base64
import numpy as np
from ultralytics import YOLO

def DynamicModelLoader(file_path):
    # 动态加载YOLOv8模型
    return YOLO(file_path)

def detect(model_loader, file):
    # 将上传的文件读取为字节流
    contents = file.file.read() 
    # 使用PIL将字节流转为Image对象
    image = Image.open(io.BytesIO(contents))
    # 使用YOLOv8模型进行预测
    results = model_loader.predict(image)  # 注意：使用predict方法而非直接调用模型
    # 处理YOLOv8的results对象
    plot_results = results[0].plot()  # 这里得到的是带有标注的图像，类型为numpy.ndarray
    # 将numpy.ndarray转换为PIL Image对象
    pil_image = Image.fromarray(plot_results)
    # 将预测结果转换为Base64编码的图片字符串
    buffered = io.BytesIO()
    pil_image.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return {"image": img_str}