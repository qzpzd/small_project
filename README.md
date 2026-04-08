# YOLO + LLM + SAM 一体化视觉平台

基于 **React + Vite + FastAPI** 的现代化 YOLO 训练、推理和智能标注平台

## 📋 项目简介

这是一个功能完整的计算机视觉平台，集成了：
- 🚀 YOLO 模型训练（支持检测、分割、分类、姿态、OBB）
- 🔍 智能推理和可视化
- ✏️ AI 自动标注工具
- 🤖 LLM 智能分析报告

## 🏗️ 技术架构

### 后端 (FastAPI)
- **Web 框架**: FastAPI
- **深度学习**: Ultralytics YOLO + PyTorch
- **计算机视觉**: OpenCV
- **LLM**: Ollama (可选)

### 前端 (React + Vite)
- **UI 框架**: React 18
- **构建工具**: Vite
- **组件库**: Ant Design
- **HTTP 客户端**: Axios
- **路由**: React Router

## 📁 项目结构

```
llm_auto_train/
├── backend/                    # FastAPI 后端
│   ├── api/                   # API 路由
│   │   ├── train.py          # 训练 API
│   │   ├── inference.py      # 推理 API
│   │   ├── annotation.py     # 标注 API
│   │   └── llm.py            # LLM 分析 API
│   ├── services/             # 业务逻辑层
│   │   ├── train_service.py
│   │   ├── inference_service.py
│   │   ├── annotation_service.py
│   │   └── llm_service.py
│   ├── models/               # 数据模型
│   ├── utils/                # 工具函数
│   ├── main.py              # FastAPI 主程序
│   └── requirements.txt     # Python 依赖
│
├── frontend/                  # React + Vite 前端
│   ├── src/
│   │   ├── components/      # React 组件
│   │   │   └── Layout.jsx   # 布局组件
│   │   ├── pages/          # 页面组件
│   │   │   ├── Train.jsx     # 训练页面
│   │   │   ├── Inference.jsx # 推理页面
│   │   │   └── Annotation.jsx # 标注页面
│   │   ├── services/       # API 服务
│   │   │   └── api.js      # API 调用封装
│   │   ├── utils/          # 工具函数
│   │   ├── App.jsx         # 主应用
│   │   ├── App.css         # 全局样式
│   │   └── main.jsx        # 入口文件
│   ├── package.json        # Node 依赖
│   └── vite.config.js      # Vite 配置
│
├── models/                  # 模型存放目录
├── datasets/                # 数据集目录
├── runs/                    # 训练/推理输出
├── uploads/                 # 上传文件目录
├── outputs/                 # 输出目录
├── START.sh                 # 启动脚本
├── STOP.sh                  # 停止脚本
└── README.md               # 项目文档
```

## 🚀 快速开始

### 方式一：使用启动脚本（推荐）

```bash
# 启动所有服务
./START.sh

# 停止所有服务
./STOP.sh
```

### 方式二：手动启动

#### 1. 启动后端

```bash
cd backend

# 创建虚拟环境（首次运行）
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

后端地址: `http://localhost:8000`  
API 文档: `http://localhost:8000/docs`

#### 2. 启动前端

```bash
cd frontend

# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev
```

前端地址: `http://localhost:5173`

## 📋 功能说明

### 1. 训练模块 (`/train`)

**功能特性**：
- ✅ 准备 YOLO 格式数据集
- ✅ 支持 5 种任务类型：检测、分割、分类、姿态、OBB
- ✅ 可视化参数配置（epochs、batch、img_size、lr）
- ✅ 实时训练进度监控
- ✅ 训练曲线可视化
- ✅ 自动保存最佳模型

**使用步骤**：
1. 输入数据集名称和类别名称
2. 点击"准备数据集"
3. 配置训练参数
4. 点击"开始训练"
5. 查看实时训练状态和曲线

### 2. 推理模块 (`/inference`)

**功能特性**：
- ✅ 加载自定义 YOLO 模型
- ✅ 图片推理和可视化
- ✅ 视频推理（带可视化输出）
- ✅ 可调节置信度和 IoU 阈值
- ✅ LLM 智能分析检测结果
- ✅ 下载推理结果

**使用步骤**：
1. 输入模型路径并加载
2. 上传图片或视频
3. 调整置信度和 IoU 阈值
4. 点击"推理"
5. （可选）启用 LLM 分析

### 3. 标注模块 (`/annotation`)

**功能特性**：
- ✅ 批量上传图片
- ✅ AI 自动标注（基于 YOLO 模型）
- ✅ 生成 YOLO 格式标签
- ✅ 导出完整数据集
- ✅ 下载数据集压缩包

**使用步骤**：
1. 批量上传需要标注的图片
2. 配置模型路径和置信度阈值
3. 点击"开始批量标注"
4. 导出数据集
5. （可选）下载数据集

## 🔌 API 端点

### 训练 API
- `POST /api/train/prepare-dataset` - 准备数据集
- `POST /api/train/start` - 开始训练
- `GET /api/train/status/{task_id}` - 获取训练状态
- `GET /api/train/curves/{task_id}` - 获取训练曲线
- `POST /api/train/stop/{task_id}` - 停止训练
- `GET /api/train/models` - 列出所有模型

### 推理 API
- `POST /api/inference/load-model` - 加载模型
- `POST /api/inference/predict-image` - 图片推理
- `POST /api/inference/predict-video` - 视频推理
- `GET /api/inference/result/{result_id}` - 获取推理结果

### 标注 API
- `POST /api/annotation/auto-annotate` - AI 自动标注
- `POST /api/annotation/batch-upload` - 批量上传
- `POST /api/annotation/export` - 导出数据集
- `GET /api/annotation/download/{dataset_name}` - 下载数据集

### LLM API
- `POST /api/llm/analyze` - 分析检测结果
- `POST /api/llm/generate-report` - 生成分析报告

## 🔧 环境要求

### 系统要求
- **操作系统**: Linux / macOS / Windows
- **Python**: 3.8+
- **Node.js**: 16+
- **内存**: 8GB+
- **GPU**: NVIDIA GPU（推荐，用于加速训练和推理）

### 依赖安装

**后端依赖**：
```bash
pip install -r backend/requirements.txt
```

主要依赖：
- fastapi
- uvicorn
- ultralytics
- opencv-python
- torch
- ollama (可选)

**前端依赖**：
```bash
cd frontend
npm install
```

主要依赖：
- react
- vite
- antd
- axios
- react-router-dom

## 🛠️ 开发说明

### 后端开发

```bash
cd backend
source venv/bin/activate

# 使用热重载启动
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 前端开发

```bash
cd frontend

# 开发模式
npm run dev

# 生产构建
npm run build

# 预览构建
npm run preview
```

## 📦 生产部署

### 后端部署

使用 Gunicorn + Uvicorn Workers：

```bash
cd backend
source venv/bin/activate

gunicorn main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  -b 0.0.0.0:8000 \
  --timeout 300
```

### 前端部署

```bash
cd frontend

# 构建生产版本
npm run build

# 部署 dist 目录到 Web 服务器
# 例如: Nginx、Apache 等
```

## 🐛 常见问题

### 1. 后端启动失败

**问题**: 端口 8000 被占用

**解决**:
```bash
# 查找占用端口的进程
lsof -i :8000  # Linux/Mac
netstat -ano | findstr :8000  # Windows

# 杀死进程
kill -9 <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows
```

### 2. 前端启动失败

**问题**: 依赖安装失败

**解决**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 3. 训练失败

**问题**: CUDA 不可用

**解决**:
```bash
# 检查 CUDA
python -c "import torch; print(torch.cuda.is_available())"

# 使用 CPU 训练
# 在前端界面选择 device 为 "CPU"
```

### 4. 推理结果为空

**问题**: 置信度阈值过高

**解决**:
- 降低置信度阈值（例如从 0.25 改为 0.1）
- 检查模型是否正确加载
- 确认图片格式正确

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题，请通过以下方式联系：
- 提交 Issue
- 发送邮件

---

**祝您使用愉快！** 🎉