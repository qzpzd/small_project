import dash
from dash import  html, dcc, dash_table
from dash.dependencies import Input, Output, State
import pymysql.cursors
import pandas as pd
import plotly.express as px
import seaborn as sns
import feffery_antd_components as fac
import matplotlib.pyplot as plt
import io
import base64
import diskcache
from dash.long_callback import DiskcacheLongCallbackManager

cache = diskcache.Cache("./cache")
long_callback_manager = DiskcacheLongCallbackManager(cache)
# 数据库连接配置
DB_HOST = 'localhost'
DB_USER = 'root'
DB_PASSWORD = '123456'
DB_NAME = 'conference_room'
port = 3336           
charset = 'utf8'    

# 连接数据库
def get_data_from_db():
    connection = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, db=DB_NAME, port=port, charset=charset)
    try:
        with connection.cursor() as cursor:
            query = "SELECT * FROM student"
            cursor.execute(query)
            data = cursor.fetchall()
        df = pd.DataFrame(data, columns=[i[0] for i in cursor.description])
        connection.commit()
    finally:
        connection.close()
    return df

# 获取数据库数据并初始化数据表
df_data = get_data_from_db()

app = dash.Dash(__name__)

# 主页面布局
def layout():
    return html.Div([
        # 数据表格
        dash_table.DataTable(
            id='student-table',
            columns=[
                {'name': 'ID', 'id': 'id', 'type': 'numeric'},
                {'name': '姓名', 'id': 'name', 'type': 'text'},
                {'name': '年龄', 'id': 'age', 'type': 'numeric'},
                {'name': '分数', 'id': 'score', 'type': 'numeric'},
                {'name': '生日', 'id': 'birthday', 'type': 'datetime'},
                {'name': '插入时间', 'id': 'insert_time', 'type': 'datetime'}
            ],
            data=df_data.to_dict('records'),
            style_header={'backgroundColor': 'paleturquoise'},
            style_cell={'textAlign': 'left'},
        ),
        
        # 按钮
        html.Button('散点图!', id='draw-chart-button'),
        html.Button('seaborn折线图!', id='chart-button'),

        # 图表展示区域
        html.Div(id='chart-container'),
        
        html.Div(id='image-container')
        
    ])
 

# 详情页特有的回调函数
# def mysql_callback(app):
#     # 图表绘制回调函数
#     @app.callback(Output('chart-container', 'children'),
#                 [Input('draw-chart-button', 'n_clicks')])
#     @app.callback(Output('image-container', 'children'),
#                 [Input('chart-button', 'n_clicks')])
#     def update_chart(n_clicks):
#         if n_clicks is None:
#             return html.Div("等待点击按钮")
#         fig = px.scatter(df_data, x='age', y='score')  # 替换成实际的列名
#         return dcc.Graph(id='chart', figure=fig)
#     def display_image(n_clicks):
#         import matplotlib.pyplot as plt
#         # 使用Seaborn绘制图形
#         sns_fig = sns.lineplot(x='age', y='score', data=df_data)
#         # 保存为临时图像文件
#         plt.savefig("temp_plot.png")
        
#     return mysql_callback


def mysql_callback(app):

    @app.callback(Output('chart-container', 'children'),
                  Input('draw-chart-button', 'n_clicks'))
    def update_scatter_chart(n_clicks):
        if n_clicks is not None:
            fig = px.scatter(df_data, x='age', y='score')
            return dcc.Graph(id='chart', figure=fig)
        else:
            return html.Div("等待点击散点图按钮")

    @app.long_callback(Output('image-container', 'children'),
                  Input('chart-button', 'n_clicks'),manager=long_callback_manager,)
   
    def update_line_image(n_clicks):
        if n_clicks is not None:
            sns_fig = sns.lineplot(x='age', y='score', data=df_data)
            # plt.figure(figsize=(10, 5))
            img_buffer = io.BytesIO()
            sns_fig.get_figure().savefig(img_buffer, format='png')
            img_buffer.seek(0)
            image_url = base64.b64encode(img_buffer.getvalue()).decode()

            return fac.AntdImage(src='data:image/png;base64,{}'.format(image_url))
        else:
            return html.Div("等待点击线图按钮")

    return mysql_callback

# if __name__ == '__main__':
#     app.run_server(debug=True)