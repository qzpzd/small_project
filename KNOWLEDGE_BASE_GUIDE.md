# 知识库和对话记忆功能使用指南

## 功能概述

本平台新增了以下功能：

1. **对话记忆功能** - 支持多轮对话，AI会记住对话历史
2. **知识库功能** - 可以上传文档并进行检索问答
3. **图片解析功能** - 支持OCR文字识别、图表检测、表格提取
4. **报告生成功能** - 可以生成包含图片、表格的报告并下载
5. **API配置管理** - 前端配置API密钥和端点

## 安装依赖

### 后端依赖

进入backend目录，安装新增的依赖：

```bash
cd backend
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

新增的依赖包括：
- `langchain` - 大语言模型应用框架
- `faiss-cpu` - 向量数据库（用于知识库检索）
- `sentence-transformers` - 文本向量化
- `python-docx` - Word文档处理
- `openpyxl` - Excel文档处理
- `pymupdf` - PDF文档处理
- `markdown` - Markdown文档处理
- `pytesseract` - OCR文字识别
- `pillow` - 图片处理

### OCR配置

如果要使用OCR功能，需要安装Tesseract-OCR：

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
sudo apt-get install tesseract-ocr-chi-sim  # 中文支持
```

**Windows:**
1. 下载Tesseract-OCR安装包：https://github.com/UB-Mannheim/tesseract/wiki
2. 安装后，将安装路径添加到系统环境变量PATH中
3. 下载中文语言包并放到tessdata目录

**macOS:**
```bash
brew install tesseract
brew install tesseract-lang  # 包含中文支持
```

## 启动服务

### 后端服务

```bash
cd backend
source venv/bin/activate
python main.py
```

后端地址: `http://localhost:8000`  
API文档: `http://localhost:8000/docs`

### 前端服务

```bash
cd frontend
npm install  # 首次运行
npm run dev
```

前端地址: `http://localhost:5173`

## 功能使用说明

### 1. 对话记忆功能

**功能特点：**
- 自动保存对话历史到数据库
- 支持多轮对话，AI会记住上下文
- 可以清除对话历史重新开始

**使用步骤：**
1. 在首页"智能对话"标签页
2. 输入问题并点击发送
3. AI会根据对话历史回答问题
4. 点击"清除历史"可以清空当前会话

**API端点：**
- `POST /api/conversation/chat-with-memory` - 带记忆的聊天
- `GET /api/conversation/history?session_id=xxx` - 获取对话历史
- `DELETE /api/conversation/clear?session_id=xxx` - 清除对话历史

### 2. 知识库功能

**功能特点：**
- 支持上传多种格式的文档
- 自动提取文档内容并存储
- 支持关键词搜索文档
- 基于知识库的问答

**支持的文件格式：**
- TXT - 纯文本文件
- DOC/DOCX - Word文档
- XLS/XLSX - Excel文档
- PDF - PDF文档

**使用步骤：**
1. 在首页"知识库"标签页
2. 点击"选择文档上传"按钮
3. 选择要上传的文档
4. 等待上传完成，文档会显示在列表中
5. 在搜索框输入关键词搜索文档
6. 在"智能对话"中开启"使用知识库"，AI会基于知识库回答问题

**API端点：**
- `POST /api/knowledge/upload` - 上传文档
- `GET /api/knowledge/list` - 列出所有文档
- `GET /api/knowledge/search?keyword=xxx` - 搜索文档
- `DELETE /api/knowledge/{doc_id}` - 删除文档
- `POST /api/knowledge/chat` - 基于知识库的聊天

### 3. 图片解析功能

**功能特点：**
- 支持OCR文字识别
- 图表检测（简化版）
- 表格提取（简化版）
- AI智能摘要

**支持的图片格式：**
- JPG, JPEG, PNG, BMP, GIF, WEBP

**使用步骤：**
1. 在首页"图片分析"标签页
2. 点击"选择图片分析"按钮
3. 选择要分析的图片
4. 等待分析完成
5. 查看OCR识别结果和AI摘要
6. 分析历史会显示在右侧

**注意：**
- OCR功能需要安装Tesseract-OCR
- 图表和表格识别目前是简化版本，需要更高级的模型来准确识别

**API端点：**
- `POST /api/image/upload-and-analyze` - 上传并分析图片
- `GET /api/image/analysis/list` - 列出分析记录
- `GET /api/image/analysis/{analysis_id}` - 获取分析详情

### 4. 报告生成功能

**功能特点：**
- 支持多种报告格式（DOCX、HTML、Markdown）
- 自动包含对话历史
- 自动包含图片分析结果
- 支持下载报告

**支持的报告格式：**
- DOCX - Word文档
- HTML - 网页格式（可打印为PDF）
- Markdown - Markdown格式

**使用步骤：**
1. 进行对话或图片分析
2. 在首页"报告管理"标签页
3. 点击"生成报告"按钮
4. 等待报告生成完成
5. 点击"下载"按钮下载报告
6. 可以删除不需要的报告

**API端点：**
- `POST /api/report/generate` - 生成报告
- `GET /api/report/list` - 列出所有报告
- `GET /api/report/download/{filename}` - 下载报告
- `DELETE /api/report/{filename}` - 删除报告

### 5. API配置管理

**功能特点：**
- 支持多种API类型（Ollama、OpenAI、自定义）
- 可以添加、编辑、删除配置
- 可以设置默认配置
- 配置保存在数据库中

**支持的API类型：**
- Ollama - 本地部署的大模型
- OpenAI - OpenAI API
- 自定义 - 任何兼容OpenAI格式的API端点

**使用步骤：**
1. 在首页点击"API配置"按钮
2. 填写配置信息：
   - 配置名称：用于标识配置
   - API类型：选择Ollama、OpenAI或自定义
   - API地址：API端点URL
   - API密钥：如果需要的话
   - 模型名称：要使用的模型
3. 点击"添加配置"
4. 点击"设为默认"激活配置
5. 可以编辑或删除配置

**API端点：**
- `POST /api/config/api` - 保存API配置
- `GET /api/config/api` - 获取所有配置
- `GET /api/config/api/active` - 获取激活的配置
- `DELETE /api/config/api/{config_name}` - 删除配置

## 数据库结构

系统使用SQLite数据库存储数据，数据库文件位于 `backend/data/app.db`

### 主要表结构：

1. **conversations** - 对话历史表
   - id: 主键
   - session_id: 会话ID
   - role: 角色（user/assistant）
   - content: 对话内容
   - timestamp: 时间戳
   - metadata: 元数据（JSON）

2. **knowledge_base** - 知识库文档表
   - id: 主键
   - filename: 文件名
   - file_type: 文件类型
   - content: 文档内容
   - file_path: 文件路径
   - chunks: 文档分块（JSON）
   - upload_time: 上传时间
   - metadata: 元数据（JSON）

3. **image_analysis** - 图片解析记录表
   - id: 主键
   - filename: 文件名
   - file_path: 文件路径
   - analysis_type: 分析类型
   - ocr_result: OCR结果
   - chart_data: 图表数据（JSON）
   - table_data: 表格数据（JSON）
   - llm_summary: LLM摘要
   - analysis_time: 分析时间
   - metadata: 元数据（JSON）

4. **api_config** - API配置表
   - id: 主键
   - config_name: 配置名称
   - api_type: API类型
   - api_url: API地址
   - api_key: API密钥
   - model_name: 模型名称
   - is_active: 是否激活
   - created_at: 创建时间
   - updated_at: 更新时间

## 常见问题

### 1. OCR功能无法使用

**问题：** 上传图片后OCR识别失败

**解决方案：**
- 确认已安装Tesseract-OCR
- 确认Tesseract已添加到系统PATH
- 如果是中文图片，确认已安装中文语言包
- 检查后端日志查看具体错误信息

### 2. 知识库上传失败

**问题：** 上传文档时提示失败

**解决方案：**
- 确认文件格式是否支持
- 检查文件大小是否过大
- 确认已安装相应的文档处理库
- 检查后端日志查看具体错误信息

### 3. 对话记忆不生效

**问题：** AI不记得之前的对话

**解决方案：**
- 确认使用的是"智能对话"功能，而不是原来的LLM知识库
- 检查session_id是否一致
- 查看数据库中是否有对话记录

### 4. API配置不生效

**问题：** 配置API后对话失败

**解决方案：**
- 确认已设置为默认配置
- 检查API地址是否正确
- 确认API密钥是否正确
- 测试API是否可以正常访问

### 5. 报告生成失败

**问题：** 点击生成报告后失败

**解决方案：**
- 确认已安装python-docx库
- 确认是否有对话或图片分析结果
- 检查后端日志查看具体错误信息

## 技术架构

### 后端技术栈

- **FastAPI** - Web框架
- **SQLite** - 数据库
- **Ollama** - 本地大模型
- **PyTesseract** - OCR识别
- **Python-docx** - Word文档处理
- **Openpyxl** - Excel文档处理
- **PyMuPDF** - PDF文档处理

### 前端技术栈

- **React 18** - UI框架
- **Ant Design** - UI组件库
- **Axios** - HTTP客户端
- **React Router** - 路由管理

## 未来改进方向

1. **知识库向量化** - 使用更先进的向量检索技术
2. **多模态理解** - 支持图片、视频、音频等多模态输入
3. **高级图表识别** - 使用专门的图表识别模型
4. **表格结构化提取** - 准确提取表格结构和数据
5. **报告模板** - 支持自定义报告模板
6. **批量处理** - 支持批量上传和分析
7. **权限管理** - 添加用户权限管理
8. **多语言支持** - 支持多种语言

## 联系支持

如有问题或建议，请通过以下方式联系：
- 提交Issue
- 发送邮件

---

**祝您使用愉快！** 🎉