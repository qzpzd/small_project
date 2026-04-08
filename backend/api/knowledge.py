"""
知识库、对话记忆和报告生成 API 路由
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from pathlib import Path
import json

from services.knowledge_service import knowledge_service, conversation_service, image_analysis_service
from services.report_service import report_service

router = APIRouter()


# ========== 对话记忆 API ==========

class AddMessageRequest(BaseModel):
    """添加消息请求"""
    session_id: str
    role: str  # "user" 或 "assistant"
    content: str
    metadata: Optional[Dict] = None


@router.post("/conversation/add-message")
async def add_message(request: AddMessageRequest):
    """添加对话消息"""
    try:
        result = conversation_service.add_message(
            session_id=request.session_id,
            role=request.role,
            content=request.content,
            metadata=request.metadata
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversation/history")
async def get_conversation_history(session_id: str, limit: int = 20):
    """获取对话历史"""
    try:
        result = conversation_service.get_history(session_id, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversation/clear")
async def clear_conversation_history(session_id: str):
    """清除对话历史"""
    try:
        result = conversation_service.clear_history(session_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ChatWithMemoryRequest(BaseModel):
    """带记忆的聊天请求"""
    session_id: str
    message: str
    model_type: str = "local"  # "local" 或 "api"
    api_url: Optional[str] = None


@router.post("/conversation/chat-with-memory")
async def chat_with_memory(request: ChatWithMemoryRequest):
    """带记忆的聊天"""
    try:
        from services.llm_service import LLMService
        llm_service = LLMService()
        
        # 保存用户消息
        conversation_service.add_message(request.session_id, "user", request.message)
        
        # 获取对话历史
        history = conversation_service.format_history_for_llm(request.session_id, limit=10)
        
        # 构建带上下文的提示词
        prompt = f"以下是我们的对话历史:\n{history}\n\n用户的新问题: {request.message}\n\n请根据对话历史回答用户的问题。"
        
        # 调用LLM
        if request.model_type == "local":
            response_text = await llm_service._local_chat(prompt)
        else:
            response_text = await llm_service._api_chat(prompt, request.api_url)
        
        # 保存助手回复
        conversation_service.add_message(request.session_id, "assistant", response_text)
        
        return {
            "success": True,
            "message": "回复成功",
            "data": {
                "response": response_text,
                "session_id": request.session_id
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ========== 知识库 API ==========

@router.post("/knowledge/upload")
async def upload_knowledge_document(
    file: UploadFile = File(...),
    content: Optional[str] = Form(None)
):
    """上传文档到知识库"""
    try:
        # 保存上传的文件
        uploads_dir = Path("uploads/temp")
        uploads_dir.mkdir(parents=True, exist_ok=True)
        file_path = uploads_dir / file.filename
        
        with open(file_path, "wb") as f:
            import shutil
            shutil.copyfileobj(file.file, f)
        
        # 上传到知识库
        result = await knowledge_service.upload_document(str(file_path), content)
        
        # 删除临时文件
        file_path.unlink()
        
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge/list")
async def list_knowledge_documents(limit: int = 100):
    """列出知识库文档"""
    try:
        result = knowledge_service.list_documents(limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge/search")
async def search_knowledge_documents(keyword: str, limit: int = 20):
    """搜索知识库文档"""
    try:
        result = knowledge_service.search_documents(keyword, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/knowledge/{doc_id}")
async def delete_knowledge_document(doc_id: int):
    """删除知识库文档"""
    try:
        result = knowledge_service.delete_document(doc_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class KnowledgeChatRequest(BaseModel):
    """知识库聊天请求"""
    session_id: str
    message: str
    use_knowledge: bool = True


@router.post("/knowledge/chat")
async def knowledge_chat(request: KnowledgeChatRequest):
    """基于知识库的聊天"""
    try:
        from services.llm_service import LLMService
        llm_service = LLMService()
        
        # 保存用户消息
        conversation_service.add_message(request.session_id, "user", request.message)
        
        # 获取对话历史
        history = conversation_service.format_history_for_llm(request.session_id, limit=10)
        
        # 如果启用知识库，搜索相关文档
        context = ""
        if request.use_knowledge:
            # 使用消息的前几个关键词进行搜索
            keywords = request.message.split()[:5]
            search_results = []
            for keyword in keywords:
                if keyword.strip():  # 跳过空关键词
                    result = knowledge_service.search_documents(keyword, limit=3)
                    if result.get('success') and result.get('data'):
                        search_results.extend(result.get('data', []))
            
            if search_results:
                # 去重
                unique_docs = {doc['id']: doc for doc in search_results}.values()
                context = "\n\n相关知识库内容:\n"
                for doc in list(unique_docs)[:5]:  # 最多使用5个文档
                    doc_content = doc.get('content', '')
                    # 限制内容长度，避免token过多
                    content_preview = doc_content[:800] if len(doc_content) > 800 else doc_content
                    context += f"\n--- 文件: {doc['filename']} ---\n{content_preview}\n"
        
        # 构建提示词
        prompt = f"你是专业的AI助手。请根据以下信息回答用户问题。\n\n{context}\n\n用户问题: {request.message}"
        
        # 调用LLM
        response_text = await llm_service._local_chat(prompt)
        
        # 保存助手回复
        conversation_service.add_message(request.session_id, "assistant", response_text)
        
        return {
            "success": True,
            "message": "回复成功",
            "data": {
                "response": response_text,
                "session_id": request.session_id,
                "used_knowledge": request.use_knowledge
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ========== 图片解析 API ==========

class AnalyzeImageRequest(BaseModel):
    """图片分析请求"""
    file_path: str
    analysis_type: str = "general"  # "ocr", "chart", "table", "general"
    use_ocr: bool = True
    use_llm: bool = True


@router.post("/image/analyze")
async def analyze_image(request: AnalyzeImageRequest):
    """分析图片"""
    try:
        result = await image_analysis_service.analyze_image(
            file_path=request.file_path,
            analysis_type=request.analysis_type,
            use_ocr=request.use_ocr,
            use_llm=request.use_llm
        )
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/image/upload-and-analyze")
async def upload_and_analyze_image(
    file: UploadFile = File(...),
    analysis_type: str = Form("general"),
    use_ocr: bool = Form(True),
    use_llm: bool = Form(True)
):
    """上传并分析图片"""
    try:
        # 保存上传的文件
        uploads_dir = Path("uploads/temp")
        uploads_dir.mkdir(parents=True, exist_ok=True)
        file_path = uploads_dir / file.filename
        
        with open(file_path, "wb") as f:
            import shutil
            shutil.copyfileobj(file.file, f)
        
        # 分析图片
        result = await image_analysis_service.analyze_image(
            file_path=str(file_path),
            analysis_type=analysis_type,
            use_ocr=use_ocr,
            use_llm=use_llm
        )
        
        # 删除临时文件
        file_path.unlink()
        
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/image/analysis/list")
async def list_image_analysis(limit: int = 50):
    """列出图片分析记录"""
    try:
        result = image_analysis_service.list_analysis(limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/image/analysis/{analysis_id}")
async def get_image_analysis(analysis_id: int):
    """获取图片分析记录详情"""
    try:
        result = image_analysis_service.get_analysis(analysis_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========== 报告生成 API ==========

class GenerateReportRequest(BaseModel):
    """生成报告请求"""
    title: str
    content: Optional[str] = ""
    sections: List[Dict[str, Any]] = []
    metadata: Optional[Dict[str, Any]] = None
    format: str = "docx"  # "docx", "html", "markdown", "pdf"


@router.post("/report/generate")
async def generate_report(request: GenerateReportRequest):
    """生成报告"""
    try:
        report_data = {
            "title": request.title,
            "content": request.content,
            "sections": request.sections,
            "metadata": request.metadata
        }
        
        result = report_service.generate_report(report_data, request.format)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/report/excel")
async def generate_excel_report(data: List[Dict[str, Any]], sheet_name: str = "数据表"):
    """生成Excel报告"""
    try:
        result = report_service.generate_excel_report(data, sheet_name)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/image/analysis/{analysis_id}")
async def delete_image_analysis(analysis_id: int):
    """删除图片分析记录"""
    try:
        result = image_analysis_service.delete_analysis(analysis_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/list")
async def list_reports(limit: int = 50):
    """列出所有报告"""
    try:
        result = report_service.list_reports(limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/download/{filename}")
async def download_report(filename: str):
    """下载报告"""
    try:
        reports_dir = Path("reports")
        file_path = reports_dir / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="报告不存在")
        
        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type='application/octet-stream'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/report/{filename}")
async def delete_report(filename: str):
    """删除报告"""
    try:
        result = report_service.delete_report(filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========== API配置管理 ==========

class ApiConfigRequest(BaseModel):
    """API配置请求"""
    config_name: str
    api_type: str  # "openai", "ollama", "custom"
    api_url: str
    api_key: Optional[str] = None
    model_name: Optional[str] = None
    is_active: bool = True


@router.post("/config/api")
async def save_api_config(request: ApiConfigRequest):
    """保存API配置"""
    try:
        from models.database import db_manager
        config_id = db_manager.save_api_config(
            config_name=request.config_name,
            api_type=request.api_type,
            api_url=request.api_url,
            api_key=request.api_key,
            model_name=request.model_name,
            is_active=request.is_active
        )
        
        return {
            "success": True,
            "message": "API配置保存成功",
            "data": {"id": config_id}
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config/api")
async def get_api_configs():
    """获取所有API配置"""
    try:
        from models.database import db_manager
        configs = db_manager.list_api_configs()
        return {
            "success": True,
            "data": configs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config/api/active")
async def get_active_api_config():
    """获取激活的API配置"""
    try:
        from models.database import db_manager
        config = db_manager.get_active_api_config()
        return {
            "success": True,
            "data": config
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/config/api/{config_name}")
async def delete_api_config(config_name: str):
    """删除API配置"""
    try:
        from models.database import db_manager
        success = db_manager.delete_api_config(config_name)
        return {
            "success": success,
            "message": "配置删除成功" if success else "删除失败"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
