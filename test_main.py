#!/usr/bin/env python3
"""
测试文件
"""
import unittest
from unittest.mock import patch, Mock
from main import get_weather

class TestWeatherBot(unittest.TestCase):
    
    @patch('main.requests.get')
    def test_get_weather_success(self, mock_get):
        """测试成功获取天气"""
        # 模拟API响应
        mock_response = Mock()
        mock_response.json.return_value = {
            "location": {"name": "Beijing", "country": "China"},
            "current": {
                "temp_c": 25.0,
                "condition": {"text": "Sunny"},
                "humidity": 50
            }
        }
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response
        
        result = get_weather("Beijing", "test-key")
        
        self.assertTrue(result['success'])
        self.assertEqual(result['location'], "Beijing, China")
        self.assertEqual(result['temperature'], 25.0)
    
    @patch('main.requests.get')
    @patch('builtins.print') # 增加对内置print函数的mock
    def test_get_weather_failure(self, mock_print, mock_get): # mock_print作为第一个参数
        """测试获取天气失败时返回备选数据且不打印警告"""
        mock_get.side_effect = Exception("API error")
        
        result = get_weather("Beijing", "test-key")
        
        # 预期现在返回的是成功状态的备选数据，且数据内容已更新
        self.assertTrue(result['success'])
        self.assertEqual(result['location'], "上海, 中国 (备选数据)") # 更新为直接的备选城市名称
        self.assertEqual(result['temperature'], 23.0) 
        self.assertEqual(result['condition'], "多云")
        self.assertEqual(result['humidity'], 75)
        
        # 验证print函数被调用了，但实际不会打印到控制台
        mock_print.assert_called_once()
        self.assertIn("警告: 获取天气信息失败", mock_print.call_args[0][0]) # 验证打印内容包含警告信息

if __name__ == "__main__":
    unittest.main()