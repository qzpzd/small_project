#!/bin/bash

# YOLO + LLM + SAM 一体化视觉平台启动脚本

echo "================================"
echo "YOLO + LLM + SAM 一体化视觉平台"
echo "================================"
echo ""

# 检查 Python 环境
echo "检查 Python 环境..."
python3 --version || {
    echo "错误: 未找到 Python 3"
    exit 1
}

# 检查 Node.js 环境
echo "检查 Node.js 环境..."
node --version || {
    echo "错误: 未找到 Node.js"
    exit 1
}

# 创建必要的目录
echo "创建必要的目录..."
mkdir -p models datasets runs outputs uploads/images uploads/videos

# 启动后端
echo ""
echo "启动后端服务..."
cd backend
if [ ! -d "venv" ]; then
    echo "创建 Python 虚拟环境..."
    python3 -m venv venv
fi

echo "激活虚拟环境..."
source venv/bin/activate

echo "安装后端依赖..."
pip install -r requirements.txt -q

echo "启动 FastAPI 服务器..."
# 清理可能占用的端口
PORT=8000
PID=$(lsof -ti:$PORT 2>/dev/null)
if [ ! -z "$PID" ]; then
    echo "端口 $PORT 被占用 (PID: $PID)，正在清理..."
    kill -9 $PID 2>/dev/null || true
    sleep 2
fi

# 检查端口是否仍然被占用
if lsof -Pi:$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "错误: 端口 $PORT 仍然被占用，请手动清理"
    exit 1
fi

python main.py &
BACKEND_PID=$!
echo "后端服务已启动 (PID: $BACKEND_PID)"
echo "后端地址: http://localhost:8000"
echo "API 文档: http://localhost:8000/docs"

# 等待后端启动
sleep 5

# 启动前端
echo ""
echo "启动前端服务..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

echo "启动 Vite 开发服务器..."
npm run dev &
FRONTEND_PID=$!
echo "前端服务已启动 (PID: $FRONTEND_PID)"
echo "前端地址: http://localhost:5173"

# 保存 PID
cd ..
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

echo ""
echo "================================"
echo "所有服务已启动！"
echo "================================"
echo "后端: http://localhost:8000"
echo "前端: http://localhost:5173"
echo "API 文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待中断信号
trap "kill $BACKEND_PID $FRONTEND_PID; rm -f .backend.pid .frontend.pid; exit" INT TERM

wait