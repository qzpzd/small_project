#!/usr/bin/env python3
"""
简单的天气信息查询程序
"""
import requests
import os
import json

def get_weather(location, api_key):
    """获取天气信息"""
    # 定义备选天气信息，使用模拟的上海天气数据
    fallback_weather = {
        "success": True,
        "location": "上海, 中国 (备选数据)", # 直接显示备选城市
        "temperature": 23.0,  # 上海示例温度
        "condition": "多云",   # 上海示例天气
        "humidity": 75,      # 上海示例湿度
        "wind_speed": 15.0   # 备选风速 (km/h)
    }

    try:
        response = requests.get(
            "https://api.weatherapi.com/v1/current.json",
            params={
                "key": api_key,
                "q": location,
                "aqi": "no"
            },
            timeout=10
        )
        response.raise_for_status()
        
        data = response.json()
        return {
            "success": True,
            "location": f"{data['location']['name']}, {data['location']['country']}",
            "temperature": data['current']['temp_c'],
            "condition": data['current']['condition']['text'],
            "humidity": data['current']['humidity'],
            "wind_speed": data['current']['wind_kph'] # 添加风速信息
        }
    except Exception as e:
        print(f"警告: 获取天气信息失败，将使用备选数据。错误: {e}")
        return fallback_weather

def main():
    """主函数"""
    api_key = os.getenv('WEATHER_API_KEY', 'demo-key')
    location = os.getenv('WEATHER_LOCATION', 'Beijing')
    
    weather = get_weather(location, api_key)
    
    if weather['success']:
        print("\n=== 今日天气速览 ===") # 更友好的标题
        if "备选数据" in weather['location']: # 检查是否是备选数据
            print("⚠️  注意：此为备选天气数据，非实时信息。")
        print(f"📍 地点: {weather['location']}")
        print(f"🌡️  温度: {weather['temperature']}°C")
        print(f"☁️  天气: {weather['condition']}")
        print(f"💧 湿度: {weather['humidity']}%")
        print(f"�� 风速: {weather['wind_speed']} km/h") # 添加风速输出
        print("===================\n") # 结束符
    else:
        print(f"❌ 获取天气失败: {weather['error']}")

if __name__ == "__main__":
    main()