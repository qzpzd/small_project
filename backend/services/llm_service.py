"""
LLM 分析服务
"""

from typing import Dict, List, Any, Optional

try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False


class LLMService:
    """LLM 分析服务"""
    
    def __init__(self):
        self.use_ollama = OLLAMA_AVAILABLE
        self.default_model = "deepseek-coder:6.7b"  # 使用响应更快的DeepSeek模型
    
    async def chat(self, message: str, chat_type: str = "local", 
                  api_url: Optional[str] = None) -> str:
        """LLM聊天接口
        
        Args:
            message: 用户消息
            chat_type: 聊天类型 ("api" 或 "local")
            api_url: API URL (当chat_type为"api"时使用)
            
        Returns:
            LLM回复
        """
        if chat_type == "local":
            return await self._local_chat(message)
        elif chat_type == "api":
            return await self._api_chat(message, api_url)
        else:
            return "不支持的聊天类型"
    
    async def _local_chat(self, message: str) -> str:
        """本地Ollama聊天"""
        if not self.use_ollama:
            return "Ollama未安装或未配置，无法使用本地模型"
        
        try:
            response = ollama.chat(
                model=self.default_model,
                messages=[{'role': 'user', 'content': message}]
            )
            return response['message']['content']
        except Exception as e:
            return f"本地Ollama调用失败: {str(e)}\n请确保Ollama服务正在运行，并且已安装{self.default_model}模型"
    
    async def _api_chat(self, message: str, api_url: Optional[str]) -> str:
        """API聊天"""
        if not api_url:
            return "请提供API URL"
        
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                # 假设使用OpenAI兼容的API格式
                response = await client.post(
                    api_url,
                    json={
                        "model": "gpt-3.5-turbo",  # 默认模型，可根据实际情况调整
                        "messages": [{"role": "user", "content": message}],
                        "temperature": 0.7
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get('choices', [{}])[0].get('message', {}).get('content', '无法获取回复')
                else:
                    return f"API调用失败 (状态码: {response.status_code}): {response.text}"
        except Exception as e:
            return f"API调用错误: {str(e)}"
    
    def analyze(self, detections: List[Dict], image_info: Optional[Dict] = None,
               use_llm: bool = True) -> Dict[str, Any]:
        """分析检测结果
        
        Args:
            detections: 检测结果列表
            image_info: 图片信息
            use_llm: 是否使用 LLM
            
        Returns:
            分析结果
        """
        # 统计信息
        stats = self._generate_statistics(detections)
        
        # 异常检测
        anomalies = self._detect_anomalies(detections)
        
        # LLM 分析
        llm_analysis = None
        if use_llm and self.use_ollama:
            try:
                llm_analysis = self._ollama_analyze(detections, image_info)
            except Exception as e:
                print(f"LLM 分析失败: {e}")
                llm_analysis = "LLM 分析暂时不可用"
        
        # 生成报告
        report = self._format_report(stats, anomalies, llm_analysis)
        
        return {
            'statistics': stats,
            'anomalies': anomalies,
            'llm_analysis': llm_analysis,
            'report': report
        }
    
    def generate_report(self, detections: List[Dict], image_info: Optional[Dict] = None,
                       use_llm: bool = True) -> Dict[str, Any]:
        """生成分析报告
        
        Args:
            detections: 检测结果列表
            image_info: 图片信息
            use_llm: 是否使用 LLM
            
        Returns:
            报告
        """
        return self.analyze(detections, image_info, use_llm)
    
    def _generate_statistics(self, detections: List[Dict]) -> Dict[str, Any]:
        """生成统计信息"""
        if not detections:
            return {
                'total': 0,
                'classes': {},
                'avg_confidence': 0
            }
        
        total = len(detections)
        class_counts = {}
        class_confs = {}
        
        for det in detections:
            class_name = det.get('class', 'unknown')
            conf = det.get('confidence', 0)
            
            class_counts[class_name] = class_counts.get(class_name, 0) + 1
            
            if class_name not in class_confs:
                class_confs[class_name] = []
            class_confs[class_name].append(conf)
        
        avg_confidence = sum(det.get('confidence', 0) for det in detections) / total
        
        class_avg_conf = {}
        for class_name, confs in class_confs.items():
            class_avg_conf[class_name] = sum(confs) / len(confs)
        
        return {
            'total': total,
            'classes': class_counts,
            'avg_confidence': avg_confidence,
            'class_avg_confidence': class_avg_conf
        }
    
    def _detect_anomalies(self, detections: List[Dict],
                         low_conf_threshold: float = 0.3) -> List[Dict]:
        """检测异常"""
        anomalies = []
        
        for det in detections:
            conf = det.get('confidence', 0)
            
            if conf < low_conf_threshold:
                anomalies.append({
                    'type': 'low_confidence',
                    'detection': det,
                    'message': f"低置信度检测: {det.get('class', 'unknown')} (conf={conf:.2f})"
                })
        
        return anomalies
    
    def _ollama_analyze(self, detections: List[Dict],
                       image_info: Optional[Dict] = None) -> str:
        """使用 Ollama 分析"""
        prompt = self._build_prompt(detections, image_info)
        
        try:
            response = ollama.chat(
                model=self.default_model,
                messages=[{'role': 'user', 'content': prompt}]
            )
            return response['message']['content']
        except Exception as e:
            return f"Ollama 分析失败: {str(e)}"
    
    def _build_prompt(self, detections: List[Dict],
                     image_info: Optional[Dict] = None) -> str:
        """构建提示词"""
        prompt = "请分析以下图片的检测结果，并生成一份详细的分析报告。\n\n"
        
        if image_info:
            prompt += f"图片信息:\n"
            prompt += f"- 图片尺寸: {image_info.get('width', '未知')} x {image_info.get('height', '未知')}\n\n"
        
        prompt += "检测结果统计:\n"
        prompt += f"- 检测到目标总数: {len(detections)}\n\n"
        
        # 按类别统计
        class_counts = {}
        for det in detections:
            class_name = det.get('class', 'unknown')
            class_counts[class_name] = class_counts.get(class_name, 0) + 1
        
        prompt += "各类别检测数量:\n"
        for class_name, count in sorted(class_counts.items(), key=lambda x: x[1], reverse=True):
            prompt += f"- {class_name}: {count} 个\n"
        
        prompt += "\n请根据以上信息，生成一份包含以下内容的分析报告:\n"
        prompt += "1. 目标数量统计\n"
        prompt += "2. 各类别分布情况\n"
        prompt += "3. 置信度分析\n"
        prompt += "4. 可能的异常检测\n"
        prompt += "5. 整体评估和建议\n"
        
        return prompt
    
    def _format_report(self, stats: Dict[str, Any], anomalies: List[Dict],
                      llm_analysis: Optional[str] = None) -> str:
        """格式化报告"""
        report = "=" * 80 + "\n"
        report += "YOLO 检测分析报告\n"
        report += "=" * 80 + "\n\n"
        
        # 基本统计
        report += "一、基本统计\n"
        report += "-" * 80 + "\n"
        report += f"检测目标总数: {stats['total']}\n\n"
        
        report += "各类别检测数量:\n"
        for class_name, count in sorted(stats['classes'].items(), key=lambda x: x[1], reverse=True):
            avg_conf = stats['class_avg_confidence'].get(class_name, 0)
            report += f"  - {class_name}: {count} 个 (平均置信度: {avg_conf:.2f})\n"
        
        report += f"\n整体平均置信度: {stats['avg_confidence']:.2f}\n\n"
        
        # 异常检测
        if anomalies:
            report += "二、异常检测\n"
            report += "-" * 80 + "\n"
            report += f"发现 {len(anomalies)} 个潜在异常:\n\n"
            for anomaly in anomalies:
                report += f"  - {anomaly['message']}\n"
            report += "\n"
        
        # LLM 分析
        if llm_analysis:
            report += "三、AI 智能分析\n"
            report += "-" * 80 + "\n"
            report += llm_analysis
            report += "\n"
        
        report += "=" * 80 + "\n"
        
        return report