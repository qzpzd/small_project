// 更新当前时间
// window.dash_clientside = Object.assign({}, window.dash_clientside, {
//     clientside: {
//         update_current_datetime: (n_intervals) => {
//             return `${new Date().toLocaleDateString().replaceAll("/", "-")} ${new Date().toLocaleTimeString()}`
//         },
//     }
// });

function getTriggerDetails() {
    const ctx = dash_clientside.callback_context;
    if (!ctx || !ctx.triggered || ctx.triggered.length === 0) {
        console.warn('Callback context is not available or triggered events are empty');
        return null;
    }
    return ctx.triggered[0];
}

// 根据按钮点击和滑动滑块输出文本
window.dash_clientside = Object.assign({}, window.dash_clientside, {
    clientside: {
        update_current_datetime: (n_intervals) => {
            return `${new Date().toLocaleDateString().replaceAll("/", "-")} ${new Date().toLocaleTimeString()}`;
        },
        update_output_text_open_modal: (n_clicks, slider_value) => {
            const triggeredEvent = getTriggerDetails();
            if (triggeredEvent && triggeredEvent.prop_id === 'open-modal.nClicks') {
                return `Button was clicked! ${n_clicks}`;
            } 
            else if (triggeredEvent && triggeredEvent.prop_id === 'my-slider.value') {
                if (slider_value < 50) {
                    // 如果滑块值小于50，更新输出内容
                    return `Slider value changed to: ${slider_value}`;
                } else {
                    // 否则阻止更新输出
                    // return window.dash_clientside.PreventUpdate;//阻断更新
                    return window.dash_clientside.no_update; //不显示更新
                }
            } else {
                return '';
            }

            // return outputText;
        }
    }
});
