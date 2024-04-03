import dash
from dash import html, Input, Output, State, dcc
import feffery_antd_components as fac
import feffery_utils_components as fuc

image_urls = [
    'https://www.4kbizhi.com/d/file/2024/03/25/small085305CbuGd1711327985.jpg',  # 替换为你的图片路径或URL
    'https://www.4kbizhi.com/d/file/2024/03/20/small170803Abngp1710925683.jpg',
    'https://www.4kbizhi.com/d/file/2024/03/13/small101638VBaRT1710296198.jpg',
]
carousel_items = [
    html.Div(
        fac.AntdImage(
            src=image_url,
            style= {
                'width': '100%',  # 图片宽度填充轮播区域
                'height': 'auto',  # 自动调整高度以保持原始宽高比
                }, 
        ),
    style={
            'display': 'flex',
            'justifyContent': 'center',
            'alignItems': 'center'
        }
    )
    for image_url in image_urls
]


def get_image_div_layout():
    image_div = html.Div(
        [fac.AntdCarousel(
            [
                html.Div(
                    f'子元素{i}',
                    style={
                        'color': 'white',
                        'fontSize': '36px',
                        'height': '400px',
                        'backgroundColor': color,
                        'display': 'flex',
                        'justifyContent': 'center',
                        'alignItems': 'center'
                    }
                )
                for i, color in
                enumerate(
                    [
                        '#0050b3', '#096dd9', '#1890ff',
                        # '#69c0ff', '#91d5ff'
                    ]
                )
            ],
            speed=2000,
            autoplay=True
        ),
        

        fac.AntdCarousel(
            carousel_items,
            speed=3000,
            autoplay=True,
            style={'width': '100%'},  # 设置轮播容器宽度为100%
        ),
        
            
        fac.AntdDivider(
        'multiImageMode="unfold"（默认）',
        innerTextOrientation='left'
        ),
        fac.AntdImage(
        src= ['https://www.4kbizhi.com/d/file/2024/03/25/small085305CbuGd1711327985.jpg',  # 替换为你的图片路径或URL
            'https://www.4kbizhi.com/d/file/2024/03/20/small170803Abngp1710925683.jpg',
            'https://www.4kbizhi.com/d/file/2024/03/13/small101638VBaRT1710296198.jpg',],

            multiImageMode='unfold',
            height=80,
            style={'width': '100%'},  # 图片宽度填充父容器
        )
        
        ]
    )
    return image_div