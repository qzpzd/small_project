import dash
from dash import html, Input, Output, State, dcc
import feffery_antd_components as fac
import feffery_utils_components as fuc

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


def get_div_layout():
    home_div =html.Div(
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
    return home_div