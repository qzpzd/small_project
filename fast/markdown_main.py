from fastapi import FastAPI, UploadFile, File
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI()

# 配置静态文件目录
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.post("/uploadfile/")
async def create_upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    with open(f"static/{file.filename}", "wb") as f:
        f.write(contents)
    return {"filename": file.filename}

@app.get("/loadfile/{filename}")
async def load_file(filename: str):
    try:
        with open(f"static/{filename}", "r", encoding="utf-8") as f:
            content = f.read()
        return {"content": content}
    except FileNotFoundError:
        return {"error": "File not found"}

@app.post("/savefile/")
async def save_file(content: str, filename: str):
    try:
        with open(f"static/{filename}", "w", encoding="utf-8") as f:
            f.write(content)
        return {"message": "File saved successfully"}
    except Exception as e:
        return {"error": f"Failed to save file: {str(e)}"}

# 添加一个路由来处理 HTML 页面的请求
@app.get("/")
async def serve_html():
    return FileResponse("static/index.html")