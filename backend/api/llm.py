"""
LLM 分析 API 路由
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))

from services.llm_service import LLMService

router = APIRouter()
llm_service = LLMService()


class AnalyzeRequest(BaseModel):
    """分析请求"""
    detections: List[dict]
    image_info: Optional[dict] = None
    use_llm: bool = True


class ChatRequest(BaseModel):
    """聊天请求"""
    message: str
    type: str = "local"  # "api" 或 "local"
    api_url: Optional[str] = None


@router.post("/chat")
async def chat(request: ChatRequest):
    """LLM聊天接口"""
    try:
        result = await llm_service.chat(
            message=request.message,
            chat_type=request.type,
            api_url=request.api_url
        )
        return {"success": True, "response": result}
    except Exception as e:
        return {"success": False, "response": f"LLM服务错误: {str(e)}"}


@router.post("/analyze")
async def analyze_detections(request: AnalyzeRequest):
    """分析检测结果"""
    try:
        result = llm_service.analyze(
            detections=request.detections,
            image_info=request.image_info,
            use_llm=request.use_llm
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-report")
async def generate_report(request: AnalyzeRequest):
    """生成分析报告"""
    try:
        result = llm_service.generate_report(
            detections=request.detections,
            image_info=request.image_info,
            use_llm=request.use_llm
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))