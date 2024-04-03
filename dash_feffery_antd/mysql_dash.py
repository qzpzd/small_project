import dash
from dash import  html, dcc, dash_table
from dash.dependencies import Input, Output, State
import pymysql.cursors
import pandas as pd
import plotly.express as px

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
app.layout = html.Div([
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
    html.Button('绘制图表', id='draw-chart-button'),

    # 图表展示区域
    html.Div(id='chart-container')
])

# 图表绘制回调函数
@app.callback(Output('chart-container', 'children'),
              [Input('draw-chart-button', 'n_clicks')])
def update_chart(n_clicks):
    if n_clicks is None:
        return html.Div("等待点击按钮")
    
    fig = px.scatter(df_data, x='age', y='score')  # 替换成实际的列名
    return dcc.Graph(id='chart', figure=fig)

if __name__ == '__main__':
    app.run_server(debug=True)