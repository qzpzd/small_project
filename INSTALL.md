# 安装指南

## 环境准备

### 1. 系统要求

- Python 3.8+
- Node.js 16+
- 8GB+ 内存
- NVIDIA GPU（推荐，用于加速）

### 2. 安装 Python 依赖

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

### 3. 安装 Node.js 依赖

```bash
cd frontend

# 安装依赖
npm install
```

## 首次运行

### 使用启动脚本（推荐）

```bash
# 在项目根目录
./START.sh
```

### 手动启动

#### 启动后端

```bash
cd backend
source venv/bin/activate
python main.py
```

#### 启动前端

```bash
cd frontend
npm run dev
```

## 访问应用

- 前端: http://localhost:5173
- 后端: http://localhost:8000
- API 文档: http://localhost:8000/docs

## 停止服务

```bash
./STOP.sh
```

## 注意事项

1. 首次运行会下载 YOLO 预训练模型，需要网络连接
2. 训练和推理需要 GPU 加速以获得更好性能
3. 如需使用 LLM 分析功能，请先安装 Ollama: https://ollama.com/download