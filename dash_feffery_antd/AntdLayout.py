import dash
from dash import html, Input, Output, State, dcc
import feffery_antd_components as fac
import feffery_utils_components as fuc
# import dash_bootstrap_components as dbc


# 定义一个函数来生成重复使用的卡片
def generate_card(text_content, title_text):
    return fac.AntdCard(
        text_content,
        title=title_text,
        extraLink={
            'content': '转到',
            'href': 'https://zh.wikipedia.org/zh-hans/国际歌'
        },
        style={
            'width': 300,
            'height': 200,
            'marginBottom': 10
        }
    )

# 主页布局
layout_home = html.Div(
    className="container",
    style={
        'borderRadius': 5,
        'background': 'white',
        'padding': 20
    },
    children=[
        # 标题
        fac.AntdCenter(
            html.H1("欢迎来到数据分析平台", className="text-center mb-4")),
        
        # 多个卡片布局
        fac.AntdCenter(
            html.Div(
                fac.AntdRow([
                    fac.AntdCol(
                        fac.AntdRibbon(
                            html.Div(
                                generate_card(
                                    '''
                                        从来就没有什么救世主，
                                        也不靠神仙皇帝。
                                        要创造人类的幸福，
                                        全靠我们自己。
                                        ...
                                        英特纳雄耐尔就一定要实现。
                                    ''',
                                    '卡片示例1'
                                ),
                            ),
                            text='缎带示例',
                            placement='end',
                            color='#ff4d4f'
                        ),
                    ),
                    fac.AntdCol(
                        html.Div(                   
                            generate_card(
                                '''
                                    从来就没有什么救世主，
                                    也不靠神仙皇帝。
                                    ...
                                    英特纳雄耐尔就一定要实现。
                                ''',
                                '卡片示例2'
                            ),
                        ),
                    ),
                    fac.AntdCol(
                        html.Div(
                            generate_card(
                                '''
                                    从来就没有什么救世主，
                                    也不靠神仙皇帝。
                                    ...
                                    英特纳雄耐尔就一定要实现。
                                ''',
                                '卡片示例3'
                            ),
                        ), 
                    ), 
                    fac.AntdCol(
                        html.Div(
                            generate_card(
                                '''
                                    从来就没有什么救世主，
                                    也不靠神仙皇帝。
                                    ...
                                    英特纳雄耐尔就一定要实现。
                                ''',
                                '卡片示例4'
                            ),
                        ), 
                    ),   
                ],
                gutter=[10, 10],
                ),
            ),
        ),
        # Ant Design 风格的日历组件
        html.Div(
            fac.AntdCalendar(
                id='calendar-demo',
                style={
                    'width': '300px'
                }
            ),
        ),
    ],
)

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

# 定义云上传页面布局
layout_cloud_upload = html.Div(
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

# 创建页面布局字典
page_layouts = {
    'antd-home': layout_home,
    'antd-cloud-upload': layout_cloud_upload,
}

app = dash.Dash(__name__)

app.layout = html.Div(
    [   
        # 粘性页首
        fac.AntdAffix(
            fuc.FefferyDiv(
                [   
                    # 利用fac中的网格系统进行页首元素的排布
                    fac.AntdRow(
                        [   
                            # logo+标题
                            fac.AntdCol(
                                fac.AntdSpace(
                                    [
                                        fac.AntdImage(
                                            src=dash.get_asset_url(
                                                './imgs/logo.png'
                                            ),
                                            height=54,
                                            preview=False
                                        ),
                                        fac.AntdText(
                                            'XX数据平台',
                                            strong=True,
                                            style={
                                                'fontSize': 32
                                            }
                                        )
                                    ]
                                ),
                                flex='none',
                                style={
                                    'height': 'auto'
                                }
                            ),

                            # 菜单栏
                            fac.AntdCol(
                                fac.AntdMenu(
                                    menuItems=[
                                        {
                                            'component': 'Item',
                                            'props': {
                                                'key': 'AntdMenu文档页',
                                                'title': 'AntdMenu文档页',
                                                'href': '/AntdMenu'
                                            }
                                        },
                                        {
                                            'component': 'Item',
                                            'props': {
                                                'key': 'fac仓库',
                                                'title': 'fac仓库',
                                                'href': 'https://github.com/CNFeffery/feffery-antd-components'
                                            }
                                        },
                                        {
                                            'component': 'Item',
                                            'props': {
                                                'key': 'fuc仓库',
                                                'title': 'fuc仓库',
                                                'href': 'https://github.com/CNFeffery/feffery-utils-components'
                                            }
                                        },
                                        {
                                            'component': 'Item',
                                            'props': {
                                                'key': 'fmc仓库',
                                                'title': 'fmc仓库',
                                                'href': 'https://github.com/CNFeffery/feffery-markdown-components'
                                            }
                                        },
                                        {
                                            'component': 'Item',
                                            'props': {
                                                'key': 'feffery博客园',
                                                'title': 'feffery博客园',
                                                'href': 'https://www.cnblogs.com/feffery/'
                                            }
                                        }
                                    ],
                                    defaultSelectedKey='AntdMenu文档页',
                                    mode='horizontal',
                                    style={
                                        'maxWidth': 600,
                                        'borderBottom': 'none'
                                    }
                                ),
                                flex='none',
                                style={
                                    'height': 'auto'
                                }
                            )
                        ],
                        align='middle',
                        justify='space-between',
                        wrap=False,  # 阻止自动换行
                        style={
                            'height': '100%'
                        }
                    )
                ],
                style={
                    'height': 64,
                    'padding': '0 25px',
                    'background': 'white',
                    'borderBottom': '1px solid #f0f0f0'
                }
            ),
            offsetTop=0
        ),
        
        # 固定侧边菜单+内容区
        fac.AntdRow(
            [
                fac.AntdSider(
                    [   
                        dcc.Location(id='url', refresh=True),  # 添加dcc.Location组件用于追踪URL
                        fac.AntdMenu(
                            menuItems=[
                                {
                                    'component': 'Link',
                                    'props': {
                                        'key': f'{icon}',
                                        'href': f'{icon}',  # 假设URL格式为/page_图标名
                                        'title': f'{icon}',
                                        'icon': icon,
                                    }
                                }
                                for icon in [
                                    'antd-home',
                                    'antd-cloud-upload',
                                    'antd-bar-chart',
                                    'antd-pie-chart',
                                    'antd-dot-chart',
                                    'antd-line-chart',
                                    'antd-apartment',
                                    'antd-app-store',
                                    'antd-app-store-add',
                                    'antd-bell',
                                    'antd-calculator',
                                    'antd-calendar',
                                    'antd-database',
                                    'antd-history'
                                ]
                            ],
                            mode='inline',
                            style={
                                'height': '100%',
                                'overflow': 'hidden auto'
                            }
                        )
                    ],
                    collapsible=True,
                    collapsedWidth=60,
                ),

                # 内容区
                fac.AntdCol(
                    [
                        html.Div(
                            id='page-content',  # 添加一个唯一的id
                            style={
                                'minHeight': 'calc(100vh - 64px)',
                                'background': '#f0f2f5',
                                'padding': 50
                            }
                        )
                    ],
                    flex='auto'
                )
            ],
            wrap=False,
        )
    ]
)


# 页面切换回调函数
@app.callback(
    Output('page-content', 'children'),
    [Input('url', 'pathname')],
)
# @app.callback(
#     Output('calendar-demo-output', 'children'),
#     Input('calendar-demo', 'value')
# )
def display_page(pathname):
    # 根据URL解析出页面名
    page_name = pathname.split('/')[-1] if pathname else 'home'
    
    # 返回对应页面的布局
    return page_layouts.get(page_name,layout_home)  # 若没有匹配的页面布局，返回默认主页布局

if __name__ == '__main__':
    app.run(debug=True)