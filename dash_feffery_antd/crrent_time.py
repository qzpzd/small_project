import dash
import time
import diskcache
from dash import html, dcc, Input, Output
import feffery_antd_components as fac
from dash.dependencies import  ClientsideFunction
from dash.exceptions import PreventUpdate
from dash.long_callback import DiskcacheLongCallbackManager


app = dash.Dash(__name__)

cache = diskcache.Cache("./cache")
long_callback_manager = DiskcacheLongCallbackManager(cache)

app.layout = html.Div(
    [
        dcc.Interval(
            id='interval',
            interval=1000
        ),
        fac.AntdButton(
            '模态框',
            id='open-modal',
            shape='circle',
            type='primary',
            icon=fac.AntdIcon(
                icon='antd-reload'
            )
        ),
        fac.AntdSlider(
            id='my-slider',
            min=0,
            max=100,
            step=1,
            defaultValue=50
        ),
        fac.AntdStatistic(
            id='current-datetime',
            title='当前时间'
        ),
        html.Div(id='output-text'), 
        html.Div([
        fac.AntdSpace([
            fac.AntdButton(
                '请点击',
                id='button-auto-loading-demo',
                type='primary',
                icon=fac.AntdIcon(
                icon='md-power-settings-new'
            ),
                loadingChildren='运算中',
                autoSpin=True
            ),
            fac.AntdText(
                id='new-message-container'
            )
            ],
            align='center'
        )
        ])
        # html.Div(id='new-message-container'),
    ],
    style={
        'padding': '50px 100px'
    }
)

# 更新时间的客户端回调（注释掉了，稍后补充）
app.clientside_callback(
    ClientsideFunction(
        namespace='clientside',
        function_name='update_current_datetime'
    ),
    Output('current-datetime', 'value'),
    Input('interval', 'n_intervals'),
)

# 输出文本的客户端回调（这里暂不处理时间更新）
app.clientside_callback(
    ClientsideFunction(
        namespace='clientside',
        function_name='update_output_text_open_modal'
    ),
    Output('output-text', 'children'),
    [Input('open-modal', 'nClicks'), Input('my-slider', 'value')],
)


# 长回调机制
@app.long_callback(
    [Output('new-message-container', 'children'),Output('button-auto-loading-demo', 'loading')],
    Input('button-auto-loading-demo', 'nClicks'),
    manager=long_callback_manager,
)

def button_auto_loading_demo(n_clicks):
    
    time.sleep(2.0)
    output_text = f'Clicked {n_clicks} times'
    loading_status = False  # 假设点击后加载状态变为False

    return output_text, loading_status

if __name__ == '__main__':
    app.run(debug=True)