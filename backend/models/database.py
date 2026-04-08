"""
数据库模型定义
使用SQLite存储对话历史、知识库文档和图片解析记录
"""

import sqlite3
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Any
import json


class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self, db_path: str = None):
        """初始化数据库
        
        Args:
            db_path: 数据库文件路径，如果为None则使用默认路径
        """
        if db_path is None:
            # 使用绝对路径，避免路径问题
            # __file__ 是 /home/star/qzp/llm_auto_train/backend/models/database.py
            # parent 是 /home/star/qzp/llm_auto_train/backend/models
            # parent.parent 是 /home/star/qzp/llm_auto_train/backend
            base_dir = Path(__file__).resolve().parent.parent
            db_path = str(base_dir / "data" / "app.db")
        
        self.db_path = db_path
        # 确保数据目录存在
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self._init_database()
    
    def _get_connection(self) -> sqlite3.Connection:
        """获取数据库连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # 支持字典式访问
        return conn
    
    def _init_database(self):
        """初始化数据库表结构"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # 对话历史表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    metadata TEXT
                )
            """)
            
            # 知识库文档表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS knowledge_base (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    filename TEXT NOT NULL,
                    file_type TEXT NOT NULL,
                    content TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    chunks TEXT,
                    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                    metadata TEXT
                )
            """)
            
            # 图片解析记录表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS image_analysis (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    filename TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    analysis_type TEXT NOT NULL,
                    ocr_result TEXT,
                    chart_data TEXT,
                    table_data TEXT,
                    llm_summary TEXT,
                    analysis_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                    metadata TEXT
                )
            """)
            
            # API配置表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS api_config (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    config_name TEXT NOT NULL UNIQUE,
                    api_type TEXT NOT NULL,
                    api_url TEXT,
                    api_key TEXT,
                    model_name TEXT,
                    is_active BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # 创建索引
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_knowledge_base_filename ON knowledge_base(filename)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_image_analysis_filename ON image_analysis(filename)")
            
            conn.commit()
    
    # ========== 对话历史管理 ==========
    
    def add_conversation(self, session_id: str, role: str, content: str, 
                        metadata: Optional[Dict] = None) -> int:
        """添加对话记录
        
        Args:
            session_id: 会话ID
            role: 角色 (user/assistant)
            content: 对话内容
            metadata: 额外元数据
            
        Returns:
            插入的记录ID
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO conversations (session_id, role, content, metadata)
                VALUES (?, ?, ?, ?)
            """, (session_id, role, content, json.dumps(metadata) if metadata else None))
            conn.commit()
            return cursor.lastrowid
    
    def get_conversation_history(self, session_id: str, limit: int = 20) -> List[Dict]:
        """获取对话历史
        
        Args:
            session_id: 会话ID
            limit: 返回的最大记录数
            
        Returns:
            对话历史列表
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM conversations
                WHERE session_id = ?
                ORDER BY timestamp DESC
                LIMIT ?
            """, (session_id, limit))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def clear_conversation(self, session_id: str) -> bool:
        """清除指定会话的对话历史
        
        Args:
            session_id: 会话ID
            
        Returns:
            是否成功
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM conversations WHERE session_id = ?", (session_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    # ========== 知识库管理 ==========
    
    def add_document(self, filename: str, file_type: str, content: str, 
                    file_path: str, chunks: Optional[List] = None,
                    metadata: Optional[Dict] = None) -> int:
        """添加文档到知识库
        
        Args:
            filename: 文件名
            file_type: 文件类型
            content: 文档内容
            file_path: 文件路径
            chunks: 文档分块
            metadata: 额外元数据
            
        Returns:
            插入的记录ID
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO knowledge_base 
                (filename, file_type, content, file_path, chunks, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (filename, file_type, content, file_path, 
                 json.dumps(chunks) if chunks else None,
                 json.dumps(metadata) if metadata else None))
            conn.commit()
            return cursor.lastrowid
    
    def get_document(self, doc_id: int) -> Optional[Dict]:
        """获取文档详情
        
        Args:
            doc_id: 文档ID
            
        Returns:
            文档信息
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM knowledge_base WHERE id = ?", (doc_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def list_documents(self, limit: int = 100) -> List[Dict]:
        """列出所有文档
        
        Args:
            limit: 返回的最大记录数
            
        Returns:
            文档列表
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, filename, file_type, upload_time
                FROM knowledge_base
                ORDER BY upload_time DESC
                LIMIT ?
            """, (limit,))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def search_documents(self, keyword: str, limit: int = 20) -> List[Dict]:
        """搜索文档
        
        Args:
            keyword: 搜索关键词
            limit: 返回的最大记录数
            
        Returns:
            匹配的文档列表
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM knowledge_base
                WHERE content LIKE ?
                ORDER BY upload_time DESC
                LIMIT ?
            """, (f"%{keyword}%", limit))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def delete_document(self, doc_id: int) -> bool:
        """删除文档
        
        Args:
            doc_id: 文档ID
            
        Returns:
            是否成功
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM knowledge_base WHERE id = ?", (doc_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    # ========== 图片解析记录管理 ==========
    
    def add_image_analysis(self, filename: str, file_path: str, analysis_type: str,
                          ocr_result: Optional[str] = None, chart_data: Optional[Dict] = None,
                          table_data: Optional[Dict] = None, llm_summary: Optional[str] = None,
                          metadata: Optional[Dict] = None) -> int:
        """添加图片解析记录
        
        Args:
            filename: 文件名
            file_path: 文件路径
            analysis_type: 解析类型 (ocr/chart/table/general)
            ocr_result: OCR结果
            chart_data: 图表数据
            table_data: 表格数据
            llm_summary: LLM摘要
            metadata: 额外元数据
            
        Returns:
            插入的记录ID
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO image_analysis
                (filename, file_path, analysis_type, ocr_result, chart_data, 
                 table_data, llm_summary, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (filename, file_path, analysis_type, ocr_result,
                 json.dumps(chart_data) if chart_data else None,
                 json.dumps(table_data) if table_data else None,
                 llm_summary,
                 json.dumps(metadata) if metadata else None))
            conn.commit()
            return cursor.lastrowid
    
    def get_image_analysis(self, analysis_id: int) -> Optional[Dict]:
        """获取图片解析记录
        
        Args:
            analysis_id: 解析记录ID
            
        Returns:
            解析记录
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM image_analysis WHERE id = ?", (analysis_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def list_image_analysis(self, limit: int = 50) -> List[Dict]:
        """列出所有图片解析记录
        
        Args:
            limit: 返回的最大记录数
            
        Returns:
            解析记录列表
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, filename, analysis_type, analysis_time
                FROM image_analysis
                ORDER BY analysis_time DESC
                LIMIT ?
            """, (limit,))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def delete_image_analysis(self, analysis_id: int) -> bool:
        """删除图片解析记录
        
        Args:
            analysis_id: 解析记录ID
            
        Returns:
            是否成功
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM image_analysis WHERE id = ?", (analysis_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    # ========== API配置管理 ==========
    
    def save_api_config(self, config_name: str, api_type: str, api_url: str,
                       api_key: Optional[str] = None, model_name: Optional[str] = None,
                       is_active: bool = True) -> int:
        """保存API配置
        
        Args:
            config_name: 配置名称
            api_type: API类型 (openai/ollama/custom)
            api_url: API地址
            api_key: API密钥
            model_name: 模型名称
            is_active: 是否激活
            
        Returns:
            插入的记录ID
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # 如果设置为激活，先将其他配置设为非激活
            if is_active:
                cursor.execute("UPDATE api_config SET is_active = 0")
            
            # 检查是否已存在
            cursor.execute("""
                SELECT id FROM api_config WHERE config_name = ?
            """, (config_name,))
            existing = cursor.fetchone()
            
            if existing:
                # 更新现有配置
                cursor.execute("""
                    UPDATE api_config
                    SET api_type = ?, api_url = ?, api_key = ?, 
                        model_name = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE config_name = ?
                """, (api_type, api_url, api_key, model_name, is_active, config_name))
                conn.commit()
                return existing['id']
            else:
                # 插入新配置
                cursor.execute("""
                    INSERT INTO api_config 
                    (config_name, api_type, api_url, api_key, model_name, is_active)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (config_name, api_type, api_url, api_key, model_name, is_active))
                conn.commit()
                return cursor.lastrowid
    
    def get_active_api_config(self) -> Optional[Dict]:
        """获取激活的API配置
        
        Returns:
            API配置信息
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM api_config WHERE is_active = 1
            """)
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def list_api_configs(self) -> List[Dict]:
        """列出所有API配置
        
        Returns:
            API配置列表
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM api_config ORDER BY created_at DESC")
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def delete_api_config(self, config_name: str) -> bool:
        """删除API配置
        
        Args:
            config_name: 配置名称
            
        Returns:
            是否成功
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM api_config WHERE config_name = ?", (config_name,))
            conn.commit()
            return cursor.rowcount > 0


# 全局数据库实例
db_manager = DatabaseManager()