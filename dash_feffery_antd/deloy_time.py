import time
import dash
from dash import html, dcc, Input, Output
import diskcache
import feffery_antd_components as fac
from dash.long_callback import DiskcacheLongCallbackManager

app = dash.Dash(__name__)

cache = diskcache.Cache("./cache")
long_callback_manager = DiskcacheLongCallbackManager(cache)

app.layout = html.Div([
    fac.AntdSpace(
    [
        fac.AntdButton(
            '请点击',
            id='button-auto-loading-demo',
            type='primary',
            loadingChildren='运算中',
            autoSpin=True
        ),
        fac.AntdText(
            id='button-auto-loading-demo-output'
        )
    ],
    align='center'
)
])

@app.long_callback(
    [Output('button-auto-loading-demo-output', 'children'),Output('button-auto-loading-demo', 'loading')],
    Input('button-auto-loading-demo', 'nClicks'),
    manager=long_callback_manager,
    # prevent_initial_call=True,
)
def button_auto_loading_demo(n_clicks):
    time.sleep(2.0)
    output_text = f'Clicked {n_clicks} times'
    loading_status = False  # 假设点击后加载状态变为False

    return output_text, loading_status
if __name__ == '__main__':
    app.run(debug=True)