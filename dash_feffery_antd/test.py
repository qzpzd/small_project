import dash
from dash import html
import feffery_antd_components as fac

from dash.dependencies import Input, Output

app = dash.Dash(__name__)

# 添加初始化页面内容
app.layout = html.Div(
    fac.AntdCard(
        [
            # 输入表单
            fac.AntdForm(
                [
                    fac.AntdFormItem(
                        fac.AntdInputNumber(
                            id='target-value',
                            style={
                                'width': '100%'
                            }
                        ),
                        label='目标值'
                    ),
                    fac.AntdFormItem(
                        fac.AntdInputNumber(
                            id='actual-value',
                            style={
                                'width': '100%'
                            }
                        ),
                        label='实际值'
                    )
                ],
                layout='inline',
                style={
                    'marginBottom': 25,
                    'width': '100%'
                }
            ),
            # 输出目标容器
            html.Div(
                id='output-container',
                style={
                    # 基于css中的flex布局实现水平垂直居中
                    'width': '100%',
                    'display': 'flex',
                    'justifyContent': 'center',
                    'alignItems': 'center'
                }
            )
        ],
        title='dash+fac应用示例',
        hoverable=True,
        style={
            # 这里利用到css中的fixed布局
            'position': 'fixed',
            'top': '40%',
            'left': '50%',
            'transform': 'translate(-50%, -50%)',
            'width': 540,
            'height': 350
        }
    )
)

# 定义回调函数串起相关交互逻辑
@app.callback(
    Output('output-container', 'children'),
    [Input('target-value', 'value'),
     Input('actual-value', 'value')]
)
def handle_progress_render(target_value, actual_value):

    # 判断传入的目标值和实际值是否有效
    if target_value and actual_value:

        return fac.AntdProgress(
            percent=round(100 * actual_value / target_value, 2),
            type='dashboard'
        )

    return fac.AntdResult(
        subTitle='请输入有效的目标值和实际值',
        status='warning'
    )


if __name__ == '__main__':
    app.run(debug=False)
