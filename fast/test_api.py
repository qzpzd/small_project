from fastapi import FastAPI, File, UploadFile
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request
from starlette.templating import Jinja2Templates
from website import websites 
from fastapi.responses import FileResponse
# from detection import DynamicModelLoader, detect
from pathlib import Path

app = FastAPI()
  
# Mount static files (for CSS, JS, etc.)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize Jinja2 templates
templates = Jinja2Templates(directory="templates")

# Route for the home page
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request, "websites": websites})

# New route for the about page
@app.get("/about", response_class=HTMLResponse)
async def about(request: Request):
    return templates.TemplateResponse("about.html", {"request": request})

# New route for the about page
@app.get("/pdfjs", response_class=HTMLResponse)
async def about(request: Request):
    return templates.TemplateResponse("viewer.html", {"request": request})
    # return FileResponse("viewer.html")

# Route for the contact page
@app.get("/contact", response_class=HTMLResponse)
async def contact(request: Request):
    return templates.TemplateResponse("contact.html", {"request": request})

# Route for redirecting to external websites or internal pages
@app.get("/{website}", response_class=HTMLResponse)
async def redirect_to_website(website: str):
    if website.lower() in ["about", "contact", "pdfjs"]:  
        return RedirectResponse(url=f"/{website}", status_code=302)  # 注意：这里可能需要更改为实际页面路由
    elif website.lower() == "api/websites":
        return websites
    website_info = websites.get(website.lower())
    if website_info:
        return RedirectResponse(url=website_info['url'], status_code=302)
    else:
        return HTMLResponse(content=f"<h1>Website '{website}' not found</h1>", status_code=404)

# New route for returning the list of websites as JSON
@app.get("/api/websites", response_class=JSONResponse)
async def get_websites():
    return websites

@app.post("/uploadfile/")
async def create_upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    with open(file.filename, "wb") as f:
        f.write(contents)
    return {"filename": file.filename}

@app.get("/loadfile/{filename}")
async def load_file(filename: str):
    try:
        with open(filename, "r", encoding="utf-8") as f:
            content = f.read()
        return {"content": content}
    except FileNotFoundError:
        return {"error": "File not found"}

@app.post("/savefile/")
async def save_file(content: str, filename: str):
    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
    return {"message": "File saved successfully"}

    
from PIL import Image
import io
import base64
import numpy as np
from ultralytics import YOLO


def detect(file, model_path):
    # 将上传的文件读取为字节流
    contents = file.file.read()
    # 使用PIL将字节流转为Image对象
    image = Image.open(io.BytesIO(contents))
    # 使用YOLOv8模型进行预测
    model = YOLO(model_path)  # 加载模型
    results = model.predict(image)  # 使用模型进行预测
    # 处理YOLOv8的results对象
    plot_results = results[0].plot()  # 这里得到的是带有标注的图像，类型为numpy.ndarray
    # 将numpy.ndarray转换为PIL Image对象
    pil_image = Image.fromarray(plot_results)
    # 将预测结果转换为Base64编码的图片字符串
    buffered = io.BytesIO()
    pil_image.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return {"image": img_str}

@app.post("/contact/detect")
async def run_detection(file: UploadFile = File(...), model: UploadFile = File(...)):
    try:
        # 保存模型文件到临时位置
        models_dir = Path("temp_models")
        models_dir.mkdir(exist_ok=True)
        model_path = models_dir / model.filename
        with model_path.open("wb") as buffer:
            buffer.write(await model.read())

        # 检查模型文件是否有效
        if not model_path.is_file():
            raise ValueError("Model file is invalid.")

        # 检查上传的图像文件是否有效
        if not file.content_type.startswith('image'):
            raise ValueError("Uploaded file is not an image.")

        # 进行检测
        result = detect(file, str(model_path))
        
        # 清理临时模型文件
        model_path.unlink()

        return result
    except Exception as e:
        # 返回一个错误响应，其中包含错误信息
        print(f"Error occurred: {e}")
        return JSONResponse(status_code=422, content={"detail": str(e)})