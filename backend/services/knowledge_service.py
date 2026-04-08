"""
知识库和对话记忆服务
"""

import os
import uuid
from pathlib import Path
from typing import List, Dict, Optional, Any
from datetime import datetime
import json
import shutil

from models.database import db_manager


class KnowledgeService:
    """知识库服务"""
    
    def __init__(self):
        # 使用绝对路径，避免路径问题
        base_dir = Path(__file__).resolve().parent.parent
        self.knowledge_dir = base_dir / "backend" / "uploads" / "knowledge"
        self.knowledge_dir.mkdir(parents=True, exist_ok=True)
    
    async def upload_document(self, file_path: str, content: str = None) -> Dict[str, Any]:
        """上传文档到知识库
        
        Args:
            file_path: 文件路径
            content: 文件内容（可选）
            
        Returns:
            上传结果
        """
        try:
            file_path = Path(file_path)
            if not file_path.exists():
                return {"success": False, "message": "文件不存在"}
            
            # 提取文件内容
            if content is None:
                content = await self._extract_content(file_path)
            
            if not content:
                return {"success": False, "message": "无法提取文件内容"}
            
            # 复制文件到知识库目录
            target_path = self.knowledge_dir / file_path.name
            shutil.copy2(file_path, target_path)
            
            # 分块处理（简化版，实际应用中可以使用更复杂的分块策略）
            chunks = self._chunk_content(content)
            
            # 保存到数据库
            doc_id = db_manager.add_document(
                filename=file_path.name,
                file_type=file_path.suffix.lower(),
                content=content,
                file_path=str(target_path),
                chunks=chunks
            )
            
            return {
                "success": True,
                "message": "文档上传成功",
                "data": {
                    "id": doc_id,
                    "filename": file_path.name,
                    "file_type": file_path.suffix.lower(),
                    "chunk_count": len(chunks),
                    "upload_time": datetime.now().isoformat()
                }
            }
        except Exception as e:
            return {"success": False, "message": f"上传失败: {str(e)}"}
    
    async def _extract_content(self, file_path: Path) -> str:
        """提取文件内容
        
        Args:
            file_path: 文件路径
            
        Returns:
            文件内容
        """
        file_type = file_path.suffix.lower()
        
        try:
            if file_type == '.txt':
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            
            elif file_type in ['.docx', '.doc']:
                try:
                    from docx import Document
                    doc = Document(file_path)
                    return '\n'.join([para.text for para in doc.paragraphs if para.text.strip()])
                except ImportError:
                    return "请安装python-docx库来处理Word文档"
            
            elif file_type in ['.xlsx', '.xls']:
                try:
                    import pandas as pd
                    df = pd.read_excel(file_path)
                    return df.to_string()
                except ImportError:
                    return "请安装openpyxl和pandas库来处理Excel文件"
            
            elif file_type == '.pdf':
                try:
                    import fitz
                    doc = fitz.open(file_path)
                    text = ""
                    for page in doc:
                        text += page.get_text()
                    return text
                except ImportError:
                    return "请安装pymupdf库来处理PDF文件"
            
            elif file_type in ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp']:
                # 图片文件，后续使用OCR处理
                return f"[图片文件: {file_path.name}]"
            
            else:
                return f"不支持的文件类型: {file_type}"
        
        except Exception as e:
            return f"提取内容失败: {str(e)}"
    
    def _chunk_content(self, content: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """将内容分块
        
        Args:
            content: 内容
            chunk_size: 块大小
            overlap: 重叠大小
            
        Returns:
            分块列表
        """
        chunks = []
        start = 0
        
        while start < len(content):
            end = start + chunk_size
            chunk = content[start:end]
            chunks.append(chunk)
            start = end - overlap
        
        return chunks
    
    def search_documents(self, keyword: str, limit: int = 20) -> Dict[str, Any]:
        """搜索文档
        
        Args:
            keyword: 搜索关键词
            limit: 返回的最大记录数
            
        Returns:
            搜索结果
        """
        try:
            results = db_manager.search_documents(keyword, limit)
            return {
                "success": True,
                "data": results,
                "total": len(results)
            }
        except Exception as e:
            return {"success": False, "message": f"搜索失败: {str(e)}"}
    
    def list_documents(self, limit: int = 100) -> Dict[str, Any]:
        """列出所有文档
        
        Args:
            limit: 返回的最大记录数
            
        Returns:
            文档列表
        """
        try:
            docs = db_manager.list_documents(limit)
            return {
                "success": True,
                "data": docs,
                "total": len(docs)
            }
        except Exception as e:
            return {"success": False, "message": f"获取文档列表失败: {str(e)}"}
    
    def delete_document(self, doc_id: int) -> Dict[str, Any]:
        """删除文档
        
        Args:
            doc_id: 文档ID
            
        Returns:
            删除结果
        """
        try:
            doc = db_manager.get_document(doc_id)
            if not doc:
                return {"success": False, "message": "文档不存在"}
            
            # 删除文件
            file_path = Path(doc['file_path'])
            if file_path.exists():
                file_path.unlink()
            
            # 删除数据库记录
            db_manager.delete_document(doc_id)
            
            return {"success": True, "message": "文档删除成功"}
        except Exception as e:
            return {"success": False, "message": f"删除失败: {str(e)}"}


class ConversationService:
    """对话记忆服务"""
    
    def __init__(self):
        pass
    
    def add_message(self, session_id: str, role: str, content: str, 
                   metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """添加对话消息
        
        Args:
            session_id: 会话ID
            role: 角色 (user/assistant)
            content: 消息内容
            metadata: 额外元数据
            
        Returns:
            添加结果
        """
        try:
            msg_id = db_manager.add_conversation(session_id, role, content, metadata)
            return {
                "success": True,
                "message": "消息添加成功",
                "data": {
                    "id": msg_id,
                    "session_id": session_id,
                    "role": role,
                    "content": content
                }
            }
        except Exception as e:
            return {"success": False, "message": f"添加消息失败: {str(e)}"}
    
    def get_history(self, session_id: str, limit: int = 20) -> Dict[str, Any]:
        """获取对话历史
        
        Args:
            session_id: 会话ID
            limit: 返回的最大记录数
            
        Returns:
            对话历史
        """
        try:
            history = db_manager.get_conversation_history(session_id, limit)
            # 按时间正序排列（最早的在前）
            history = list(reversed(history))
            return {
                "success": True,
                "data": history,
                "total": len(history)
            }
        except Exception as e:
            return {"success": False, "message": f"获取对话历史失败: {str(e)}"}
    
    def clear_history(self, session_id: str) -> Dict[str, Any]:
        """清除对话历史
        
        Args:
            session_id: 会话ID
            
        Returns:
            清除结果
        """
        try:
            success = db_manager.clear_conversation(session_id)
            return {
                "success": success,
                "message": "对话历史已清除" if success else "清除失败"
            }
        except Exception as e:
            return {"success": False, "message": f"清除失败: {str(e)}"}
    
    def format_history_for_llm(self, session_id: str, limit: int = 10) -> str:
        """格式化对话历史供LLM使用
        
        Args:
            session_id: 会话ID
            limit: 包含的历史记录数
            
        Returns:
            格式化的对话历史字符串
        """
        result = self.get_history(session_id, limit)
        if not result['success']:
            return ""
        
        history = result['data']
        formatted = []
        for msg in history:
            role = msg['role']
            content = msg['content']
            if role == 'user':
                formatted.append(f"用户: {content}")
            else:
                formatted.append(f"助手: {content}")
        
        return '\n'.join(formatted)


class ImageAnalysisService:
    """图片解析服务"""
    
    def __init__(self):
        # 使用绝对路径，避免路径问题
        base_dir = Path(__file__).resolve().parent.parent
        self.image_dir = base_dir / "backend" / "uploads" / "images"
        self.image_dir.mkdir(parents=True, exist_ok=True)
    
    async def analyze_image(self, file_path: str, analysis_type: str = "general",
                           use_ocr: bool = True, use_llm: bool = True) -> Dict[str, Any]:
        """分析图片
        
        Args:
            file_path: 图片路径
            analysis_type: 分析类型 (ocr/chart/table/general)
            use_ocr: 是否使用OCR
            use_llm: 是否使用LLM分析
            
        Returns:
            分析结果
        """
        try:
            file_path = Path(file_path)
            if not file_path.exists():
                return {"success": False, "message": "图片文件不存在"}
            
            # 复制图片到图片目录
            target_path = self.image_dir / file_path.name
            shutil.copy2(file_path, target_path)
            
            ocr_result = None
            chart_data = None
            table_data = None
            llm_summary = None
            
            # OCR识别
            if use_ocr and analysis_type in ['ocr', 'general']:
                ocr_result = await self._perform_ocr(target_path)
            
            # 图表识别（简化版）
            if analysis_type in ['chart', 'general']:
                chart_data = await self._detect_chart(target_path)
            
            # 表格识别（简化版）
            if analysis_type in ['table', 'general']:
                table_data = await self._detect_table(target_path)
            
            # LLM分析
            if use_llm:
                llm_summary = await self._generate_summary(target_path, ocr_result, chart_data, table_data)
            
            # 保存到数据库
            analysis_id = db_manager.add_image_analysis(
                filename=file_path.name,
                file_path=str(target_path),
                analysis_type=analysis_type,
                ocr_result=ocr_result,
                chart_data=chart_data,
                table_data=table_data,
                llm_summary=llm_summary
            )
            
            return {
                "success": True,
                "message": "图片分析完成",
                "data": {
                    "id": analysis_id,
                    "filename": file_path.name,
                    "analysis_type": analysis_type,
                    "ocr_result": ocr_result,
                    "chart_data": chart_data,
                    "table_data": table_data,
                    "llm_summary": llm_summary,
                    "analysis_time": datetime.now().isoformat()
                }
            }
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"success": False, "message": f"图片分析失败: {str(e)}"}
    
    async def _perform_ocr(self, image_path: Path) -> str:
        """执行OCR识别
        
        Args:
            image_path: 图片路径
            
        Returns:
            OCR结果
        """
        try:
            import pytesseract
            from PIL import Image
            import shutil
            
            # 检查tesseract是否可用
            tesseract_cmd = shutil.which('tesseract')
            if not tesseract_cmd:
                print("[OCR] Tesseract未安装，OCR功能不可用")
                return "OCR功能需要安装Tesseract-OCR: sudo apt-get install tesseract-ocr tesseract-ocr-chi-sim"
            
            # 设置tesseract路径
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
            
            img = Image.open(image_path)
            
            # 尝试使用中英文识别
            try:
                text = pytesseract.image_to_string(img, lang='chi_sim+eng')
            except Exception as lang_error:
                print(f"[OCR] 中文识别失败: {lang_error}，尝试英文识别")
                try:
                    text = pytesseract.image_to_string(img, lang='eng')
                except Exception as eng_error:
                    print(f"[OCR] 英文识别也失败: {eng_error}")
                    return f"OCR识别失败: {str(eng_error)}"
            
            text = text.strip()
            if text:
                print(f"[OCR] 成功识别到 {len(text)} 个字符")
                return text
            else:
                print("[OCR] 图片中未检测到文字")
                return "图片中未检测到文字"
                
        except ImportError:
            print("[OCR] pytesseract未安装")
            return "OCR功能需要安装pytesseract: pip install pytesseract"
        except Exception as e:
            print(f"[OCR] OCR识别失败: {e}")
            return f"OCR识别失败: {str(e)}"
    
    async def _detect_chart(self, image_path: Path) -> Dict[str, Any]:
        """检测图表
        
        Args:
            image_path: 图片路径
            
        Returns:
            图表数据
        """
        # 简化实现，实际应用中可以使用专门的图表识别库
        try:
            from PIL import Image
            img = Image.open(image_path)
            
            return {
                "detected": True,
                "type": "unknown",
                "description": "图表识别功能已启用，但需要更高级的模型来准确识别图表类型和数据",
                "image_size": {
                    "width": img.width,
                    "height": img.height
                }
            }
        except Exception as e:
            return {"detected": False, "error": str(e)}
    
    async def _detect_table(self, image_path: Path) -> Dict[str, Any]:
        """检测表格
        
        Args:
            image_path: 图片路径
            
        Returns:
            表格数据
        """
        # 简化实现，实际应用中可以使用专门的表格识别库
        try:
            from PIL import Image
            img = Image.open(image_path)
            
            return {
                "detected": True,
                "rows": 0,
                "columns": 0,
                "description": "表格识别功能已启用，但需要更高级的模型来准确提取表格数据",
                "image_size": {
                    "width": img.width,
                    "height": img.height
                }
            }
        except Exception as e:
            return {"detected": False, "error": str(e)}
    
    async def _generate_summary(self, image_path: Path, ocr_result: str,
                               chart_data: Dict, table_data: Dict) -> str:
        """生成摘要
        
        Args:
            image_path: 图片路径
            ocr_result: OCR结果
            chart_data: 图表数据
            table_data: 表格数据
            
        Returns:
            摘要文本
        """
        summary_parts = []
        summary_parts.append(f"图片名称: {image_path.name}")
        
        if ocr_result:
            summary_parts.append(f"\nOCR识别结果:\n{ocr_result}")
        
        if chart_data and chart_data.get('detected'):
            summary_parts.append(f"\n图表信息:\n检测到图表，类型: {chart_data.get('type', 'unknown')}")
        
        if table_data and table_data.get('detected'):
            summary_parts.append(f"\n表格信息:\n检测到表格，需要进一步处理以提取具体数据")
        
        summary_parts.append("\n\n提示: 要获得更详细的分析，可以使用专业的图像分析模型。")
        
        return '\n'.join(summary_parts)
    
    def list_analysis(self, limit: int = 50) -> Dict[str, Any]:
        """列出所有图片分析记录
        
        Args:
            limit: 返回的最大记录数
            
        Returns:
            分析记录列表
        """
        try:
            records = db_manager.list_image_analysis(limit)
            return {
                "success": True,
                "data": records,
                "total": len(records)
            }
        except Exception as e:
            return {"success": False, "message": f"获取分析记录失败: {str(e)}"}
    
    def get_analysis(self, analysis_id: int) -> Dict[str, Any]:
        """获取图片分析记录详情
        
        Args:
            analysis_id: 分析记录ID
            
        Returns:
            分析记录详情
        """
        try:
            record = db_manager.get_image_analysis(analysis_id)
            if record:
                # 解析JSON字段
                if record.get('chart_data'):
                    record['chart_data'] = json.loads(record['chart_data'])
                if record.get('table_data'):
                    record['table_data'] = json.loads(record['table_data'])
                return {"success": True, "data": record}
            else:
                return {"success": False, "message": "分析记录不存在"}
        except Exception as e:
            return {"success": False, "message": f"获取分析记录失败: {str(e)}"}
    
    def delete_analysis(self, analysis_id: int) -> Dict[str, Any]:
        """删除图片分析记录
        
        Args:
            analysis_id: 分析记录ID
            
        Returns:
            删除结果
        """
        try:
            # 获取分析记录
            record = db_manager.get_image_analysis(analysis_id)
            if not record:
                return {"success": False, "message": "分析记录不存在"}
            
            # 删除图片文件
            if record.get('file_path'):
                img_path = Path(record['file_path'])
                if img_path.exists():
                    img_path.unlink()
            
            # 从数据库删除记录
            success = db_manager.delete_image_analysis(analysis_id)
            
            if success:
                return {"success": True, "message": "删除成功"}
            else:
                return {"success": False, "message": "删除失败"}
        except Exception as e:
            return {"success": False, "message": f"删除失败: {str(e)}"}


# 全局服务实例
knowledge_service = KnowledgeService()
conversation_service = ConversationService()
image_analysis_service = ImageAnalysisService()
