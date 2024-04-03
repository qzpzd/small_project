import dash
from dash import html, Input, Output, State, dcc
import feffery_antd_components as fac
import feffery_utils_components as fuc
from src import home, image
import plotly.express as px
from src.mysql_data import layout as mysql_layout, mysql_callback



app = dash.Dash(__name__,suppress_callback_exceptions=True)

# 主页布局
layout_home =  html.Div([home.get_div_layout()])

# 定义云上传页面布局
layout_cloud_upload = html.Div([image.get_image_div_layout()])

# 定义图表页面布局
layout_mysql_upload = html.Div([mysql_layout()])

# 创建页面布局字典
page_layouts = {
    'antd-home': layout_home,
    'antd-cloud-upload': layout_cloud_upload,
    'antd-bar-chart': layout_mysql_upload,
}
# 假设有这样一个字典列表，键是图标名，值是对应的标题
menu_titles = {
    'antd-home': '首页',
    'antd-cloud-upload': '云上传',
    'antd-bar-chart': '柱状图',
    'antd-pie-chart': '饼图',
    'antd-dot-chart': '点状图',
    'antd-line-chart': '折线图',
    'antd-apartment': '公寓管理',
    'antd-app-store': '应用商店',
    'antd-app-store-add': '添加应用',
    'antd-bell': '通知中心',
    'antd-calculator': '计算器',
    'antd-calendar': '日历',
    'antd-database': '数据库',
    'antd-history': '历史记录',
}
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
                                            # src=dash.get_asset_url(
                                            #     './images/image.jpg'
                                            # ),#从本地获取
                                            src='https://tupian.qqw21.com/article/UploadPic/2020-10/202010112114585399.jpg',#从远程获取
                                            height=54,
                                            preview=False
                                        ),
                                        fac.AntdText(
                                            '古月哥欠的数据平台',
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
                                        'title': menu_titles[icon],  # 使用字典获取对应标题
                                        'icon': icon,
                                    }
                                }
                                for icon in menu_titles.keys()  # 遍历字典的键（即所有图标名）
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

def main_callback(app):
# 页面切换回调函数
    @app.callback(
        Output('page-content', 'children'),
        [Input('url', 'pathname')],
    )
    def display_page(pathname):
        # 根据URL解析出页面名
        page_name = pathname.split('/')[-1] if pathname else 'home'
        
        # 返回对应页面的布局
        return page_layouts.get(page_name,layout_home)  # 若没有匹配的页面布局，返回默认主页布局

    return main_callback
# 注册回调函数
for callback_func in [mysql_callback, main_callback]:
    callback_func(app)





if __name__ == '__main__':
    app.run(debug=True)