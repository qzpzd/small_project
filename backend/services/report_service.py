"""
报告生成服务
支持生成包含图片、表格的多种格式报告
"""

import os
import uuid
from pathlib import Path
from typing import List, Dict, Optional, Any
from datetime import datetime
import json
import markdown
from io import BytesIO
import zipfile

try:
    from docx import Document
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml.ns import qn
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
    from openpyxl.drawing.image import Image as ExcelImage
    EXCEL_AVAILABLE = True
except ImportError:
    EXCEL_AVAILABLE = False


class ReportService:
    """报告生成服务"""
    
    def __init__(self):
        # 使用绝对路径，避免路径问题
        base_dir = Path(__file__).resolve().parent.parent
        self.reports_dir = base_dir / "backend" / "reports"
        self.reports_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_report(self, report_data: Dict[str, Any], format: str = "docx") -> Dict[str, Any]:
        """生成报告
        
        Args:
            report_data: 报告数据
                {
                    "title": "报告标题",
                    "content": "报告内容",
                    "sections": [
                        {
                            "title": "章节标题",
                            "content": "章节内容",
                            "images": ["图片路径1", "图片路径2"],
                            "tables": [["表头1", "表头2"], ["数据1", "数据2"]]
                        }
                    ],
                    "metadata": {"作者": "...", "日期": "..."}
                }
            format: 报告格式 (docx/html/pdf/markdown)
            
        Returns:
            生成结果
        """
        try:
            report_id = str(uuid.uuid4())[:8]
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            if format == "docx":
                if not DOCX_AVAILABLE:
                    return {"success": False, "message": "需要安装python-docx库"}
                file_path = self._generate_docx_report(report_data, report_id, timestamp)
            elif format == "html":
                file_path = self._generate_html_report(report_data, report_id, timestamp)
            elif format == "markdown":
                file_path = self._generate_markdown_report(report_data, report_id, timestamp)
            elif format == "pdf":
                # PDF生成需要额外的依赖，这里先返回HTML并提示用户
                file_path = self._generate_html_report(report_data, report_id, timestamp)
                return {
                    "success": True,
                    "message": "PDF生成需要额外的依赖，已生成HTML文件，可使用浏览器打印为PDF",
                    "data": {
                        "report_id": report_id,
                        "file_path": str(file_path),
                        "download_url": f"/reports/{file_path.name}",
                        "format": "html",
                        "note": "PDF生成需要安装wkhtmltopdf或类似工具"
                    }
                }
            else:
                return {"success": False, "message": f"不支持的格式: {format}"}
            
            return {
                "success": True,
                "message": "报告生成成功",
                "data": {
                    "report_id": report_id,
                    "file_path": str(file_path),
                    "download_url": f"/reports/{file_path.name}",
                    "format": format,
                    "timestamp": timestamp
                }
            }
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"success": False, "message": f"报告生成失败: {str(e)}"}
    
    def _generate_docx_report(self, report_data: Dict[str, Any], report_id: str, 
                             timestamp: str) -> Path:
        """生成Word文档报告"""
        doc = Document()
        
        # 设置默认字体（支持中文）
        doc.styles['Normal'].font.name = '宋体'
        doc.styles['Normal']._element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
        doc.styles['Normal'].font.size = Pt(12)
        
        # 添加标题
        title = report_data.get('title', '分析报告')
        heading = doc.add_heading(title, 0)
        heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # 添加元数据
        metadata = report_data.get('metadata', {})
        if metadata:
            doc.add_paragraph()
            p = doc.add_paragraph()
            p.add_run(f"报告ID: {report_id}").font.size = Pt(10)
            p.add_run(f"\n生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}").font.size = Pt(10)
            if 'author' in metadata:
                p.add_run(f"\n作者: {metadata['author']}").font.size = Pt(10)
        
        # 添加内容
        if 'content' in report_data:
            doc.add_paragraph(report_data['content'])
        
        # 添加章节
        sections = report_data.get('sections', [])
        for i, section in enumerate(sections, 1):
            # 章节标题
            doc.add_heading(section.get('title', f'第{i}章'), level=1)
            
            # 章节内容
            if 'content' in section:
                doc.add_paragraph(section['content'])
            
            # 添加图片
            images = section.get('images', [])
            for img_path in images:
                try:
                    img_path = Path(img_path)
                    if img_path.exists():
                        # 图片宽度设置为6英寸
                        doc.add_picture(str(img_path), width=Inches(6))
                        # 添加图片说明
                        doc.add_paragraph(f"图 {i}-{images.index(img_path)+1}: {img_path.name}", 
                                        style='Caption')
                except Exception as e:
                    doc.add_paragraph(f"[图片加载失败: {img_path}, 错误: {str(e)}]")
            
            # 添加表格
            tables = section.get('tables', [])
            for j, table_data in enumerate(tables, 1):
                if table_data and len(table_data) > 0:
                    # 创建表格
                    table = doc.add_table(rows=len(table_data), cols=len(table_data[0]))
                    table.style = 'Light Grid Accent 1'
                    
                    # 填充表格数据
                    for row_idx, row_data in enumerate(table_data):
                        for col_idx, cell_data in enumerate(row_data):
                            cell = table.rows[row_idx].cells[col_idx]
                            cell.text = str(cell_data)
                            
                            # 第一行作为表头
                            if row_idx == 0:
                                # 安全地设置字体加粗
                                if cell.paragraphs and cell.paragraphs[0].runs:
                                    cell.paragraphs[0].runs[0].font.bold = True
                                else:
                                    # 如果没有runs，创建一个新的run并设置加粗
                                    run = cell.paragraphs[0].add_run(cell.text)
                                    run.font.bold = True
                                    cell.text = ''  # 清除原文本，避免重复
                                cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
                    
                    # 添加表格说明
                    doc.add_paragraph(f"表 {i}-{j}: {section.get('title', '')}", 
                                    style='Caption')
        
        # 保存文件
        filename = f"{report_id}_{timestamp}.docx"
        file_path = self.reports_dir / filename
        doc.save(str(file_path))
        
        return file_path
    
    def _generate_html_report(self, report_data: Dict[str, Any], report_id: str,
                             timestamp: str) -> Path:
        """生成HTML报告"""
        html_parts = []
        
        # HTML头部
        html_parts.append("""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{
            font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        h1 {{
            text-align: center;
            color: #333;
            border-bottom: 2px solid #1890ff;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #1890ff;
            border-left: 4px solid #1890ff;
            padding-left: 10px;
            margin-top: 30px;
        }}
        .metadata {{
            background-color: #f0f0f0;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }}
        .metadata p {{
            margin: 5px 0;
            color: #666;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        table th {{
            background-color: #1890ff;
            color: white;
            padding: 12px;
            text-align: left;
        }}
        table td {{
            border: 1px solid #ddd;
            padding: 10px;
        }}
        table tr:nth-child(even) {{
            background-color: #f9f9f9;
        }}
        img {{
            max-width: 100%;
            height: auto;
            margin: 20px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
        }}
        .caption {{
            text-align: center;
            color: #666;
            font-style: italic;
            margin-bottom: 20px;
        }}
        .print-btn {{
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #1890ff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }}
        .print-btn:hover {{
            background-color: #096dd9;
        }}
        @media print {{
            .print-btn {{
                display: none;
            }}
            body {{
                background-color: white;
            }}
            .container {{
                box-shadow: none;
            }}
        }}
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">打印/保存为PDF</button>
    <div class="container">
""")
        
        # 标题
        title = report_data.get('title', '分析报告')
        html_parts.append(f'        <h1>{title}</h1>')
        
        # 元数据
        metadata = report_data.get('metadata', {})
        if metadata:
            html_parts.append('        <div class="metadata">')
            html_parts.append(f'            <p><strong>报告ID:</strong> {report_id}</p>')
            html_parts.append(f'            <p><strong>生成时间:</strong> {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>')
            if 'author' in metadata:
                html_parts.append(f'            <p><strong>作者:</strong> {metadata["author"]}</p>')
            html_parts.append('        </div>')
        
        # 内容
        if 'content' in report_data:
            html_parts.append(f'        <p>{report_data["content"]}</p>')
        
        # 章节
        sections = report_data.get('sections', [])
        for i, section in enumerate(sections, 1):
            # 章节标题
            section_title = section.get('title', f'第{i}章')
            html_parts.append(f'        <h2>{section_title}</h2>')
            
            # 章节内容
            if 'content' in section:
                html_parts.append(f'        <p>{section["content"]}</p>')
            
            # 图片
            images = section.get('images', [])
            for j, img_path in enumerate(images, 1):
                img_path = Path(img_path)
                if img_path.exists():
                    # 获取相对路径
                    relative_path = str(img_path).split('backend/')[-1] if 'backend/' in str(img_path) else str(img_path)
                    html_parts.append(f'        <img src="/{relative_path}" alt="{img_path.name}">')
                    html_parts.append(f'        <p class="caption">图 {i}-{j}: {img_path.name}</p>')
            
            # 表格
            tables = section.get('tables', [])
            for j, table_data in enumerate(tables, 1):
                if table_data and len(table_data) > 0:
                    html_parts.append('        <table>')
                    # 表头
                    html_parts.append('            <tr>')
                    for cell in table_data[0]:
                        html_parts.append(f'                <th>{cell}</th>')
                    html_parts.append('            </tr>')
                    # 数据行
                    for row_data in table_data[1:]:
                        html_parts.append('            <tr>')
                        for cell in row_data:
                            html_parts.append(f'                <td>{cell}</td>')
                        html_parts.append('            </tr>')
                    html_parts.append('        </table>')
                    html_parts.append(f'        <p class="caption">表 {i}-{j}: {section_title}</p>')
        
        # HTML尾部
        html_parts.append("""
    </div>
</body>
</html>
""")
        
        # 保存文件
        filename = f"{report_id}_{timestamp}.html"
        file_path = self.reports_dir / filename
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(html_parts))
        
        return file_path
    
    def _generate_markdown_report(self, report_data: Dict[str, Any], report_id: str,
                                 timestamp: str) -> Path:
        """生成Markdown报告"""
        md_parts = []
        
        # 标题
        title = report_data.get('title', '分析报告')
        md_parts.append(f"# {title}\n")
        
        # 元数据
        metadata = report_data.get('metadata', {})
        if metadata:
            md_parts.append("---\n")
            md_parts.append(f"**报告ID:** {report_id}\n")
            md_parts.append(f"**生成时间:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            if 'author' in metadata:
                md_parts.append(f"**作者:** {metadata['author']}\n")
            md_parts.append("---\n\n")
        
        # 内容
        if 'content' in report_data:
            md_parts.append(f"{report_data['content']}\n\n")
        
        # 章节
        sections = report_data.get('sections', [])
        for i, section in enumerate(sections, 1):
            # 章节标题
            section_title = section.get('title', f'第{i}章')
            md_parts.append(f"## {section_title}\n\n")
            
            # 章节内容
            if 'content' in section:
                md_parts.append(f"{section['content']}\n\n")
            
            # 图片
            images = section.get('images', [])
            for j, img_path in enumerate(images, 1):
                img_path = Path(img_path)
                if img_path.exists():
                    relative_path = str(img_path).split('backend/')[-1] if 'backend/' in str(img_path) else str(img_path)
                    md_parts.append(f"![图 {i}-{j}: {img_path.name}](/{relative_path})\n\n")
            
            # 表格（Markdown表格）
            tables = section.get('tables', [])
            for j, table_data in enumerate(tables, 1):
                if table_data and len(table_data) > 0:
                    # 表头
                    md_parts.append("| " + " | ".join(str(cell) for cell in table_data[0]) + " |\n")
                    # 分隔线
                    md_parts.append("| " + " | ".join("---" for _ in table_data[0]) + " |\n")
                    # 数据行
                    for row_data in table_data[1:]:
                        md_parts.append("| " + " | ".join(str(cell) for cell in row_data) + " |\n")
                    md_parts.append(f"\n*表 {i}-{j}: {section_title}*\n\n")
        
        # 保存文件
        filename = f"{report_id}_{timestamp}.md"
        file_path = self.reports_dir / filename
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(md_parts))
        
        return file_path
    
    def generate_excel_report(self, data: List[Dict[str, Any]], 
                             sheet_name: str = "数据表") -> Dict[str, Any]:
        """生成Excel报告
        
        Args:
            data: 数据列表
            sheet_name: 工作表名称
            
        Returns:
            生成结果
        """
        if not EXCEL_AVAILABLE:
            return {"success": False, "message": "需要安装openpyxl库"}
        
        try:
            report_id = str(uuid.uuid4())[:8]
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            wb = Workbook()
            ws = wb.active
            ws.title = sheet_name
            
            if not data:
                return {"success": False, "message": "数据为空"}
            
            # 获取所有列名
            columns = list(data[0].keys())
            
            # 写入表头
            for col_idx, column in enumerate(columns, 1):
                cell = ws.cell(row=1, column=col_idx, value=column)
                cell.font = Font(bold=True, color="FFFFFF")
                cell.fill = PatternFill(start_color="1890FF", end_color="1890FF", fill_type="solid")
                cell.alignment = Alignment(horizontal="center", vertical="center")
            
            # 写入数据
            for row_idx, row_data in enumerate(data, 2):
                for col_idx, column in enumerate(columns, 1):
                    value = row_data.get(column, "")
                    ws.cell(row=row_idx, column=col_idx, value=value)
            
            # 自动调整列宽
            for col_idx, column in enumerate(columns, 1):
                max_length = len(column)
                for row_data in data:
                    value = str(row_data.get(column, ""))
                    if len(value) > max_length:
                        max_length = len(value)
                ws.column_dimensions[chr(64 + col_idx)].width = max_length + 2
            
            # 添加边框
            thin_border = Border(
                left=Side(style='thin'),
                right=Side(style='thin'),
                top=Side(style='thin'),
                bottom=Side(style='thin')
            )
            
            for row in ws.iter_rows():
                for cell in row:
                    cell.border = thin_border
            
            # 保存文件
            filename = f"{report_id}_{timestamp}.xlsx"
            file_path = self.reports_dir / filename
            wb.save(str(file_path))
            
            return {
                "success": True,
                "message": "Excel报告生成成功",
                "data": {
                    "report_id": report_id,
                    "file_path": str(file_path),
                    "download_url": f"/reports/{file_path.name}",
                    "format": "excel",
                    "timestamp": timestamp,
                    "row_count": len(data),
                    "column_count": len(columns)
                }
            }
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"success": False, "message": f"Excel报告生成失败: {str(e)}"}
    
    def list_reports(self, limit: int = 50) -> Dict[str, Any]:
        """列出所有报告
        
        Args:
            limit: 返回的最大记录数
            
        Returns:
            报告列表
        """
        try:
            reports = []
            for file_path in self.reports_dir.glob("*.*"):
                if file_path.is_file():
                    reports.append({
                        "filename": file_path.name,
                        "file_path": str(file_path),
                        "download_url": f"/reports/{file_path.name}",
                        "size": file_path.stat().st_size,
                        "modified": file_path.stat().st_mtime,
                        "format": file_path.suffix.lower().replace('.', '')
                    })
            
            # 按修改时间排序
            reports.sort(key=lambda x: x['modified'], reverse=True)
            
            return {
                "success": True,
                "data": reports[:limit],
                "total": len(reports)
            }
        except Exception as e:
            return {"success": False, "message": f"获取报告列表失败: {str(e)}"}
    
    def delete_report(self, filename: str) -> Dict[str, Any]:
        """删除报告
        
        Args:
            filename: 文件名
            
        Returns:
            删除结果
        """
        try:
            file_path = self.reports_dir / filename
            if file_path.exists():
                file_path.unlink()
                return {"success": True, "message": "报告删除成功"}
            else:
                return {"success": False, "message": "报告不存在"}
        except Exception as e:
            return {"success": False, "message": f"删除失败: {str(e)}"}


# 全局服务实例
report_service = ReportService()
