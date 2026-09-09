//! 在标注图上叠加端到端耗时：预处理 / 纯推理 / 后处理 / 合计 / FPS。
//! 仅绘制文字（无黑底面板）。

use ab_glyph::{FontRef, PxScale};
use image::{DynamicImage, Rgb, RgbImage};
use imageproc::drawing::draw_text_mut;
use ultralytics_inference::annotate::check_font;
use ultralytics_inference::results::Speed;

/// 格式化单帧 speed 文本行。
pub fn format_speed_lines(speed: &Speed) -> Vec<String> {
    let pre = speed.preprocess.unwrap_or(0.0);
    let infer = speed.inference.unwrap_or(0.0);
    let post = speed.postprocess.unwrap_or(0.0);
    let total = speed.total();
    let fps = if total > 1e-6 { 1000.0 / total } else { 0.0 };
    vec![
        format!("pre   {pre:6.1} ms"),
        format!("infer {infer:6.1} ms"),
        format!("post  {post:6.1} ms"),
        format!("e2e   {total:6.1} ms  {fps:5.1} FPS"),
    ]
}

/// 在图像左上角仅叠加耗时文字（无背景块）。
pub fn overlay_speed(image: &DynamicImage, speed: &Speed) -> DynamicImage {
    let mut rgb: RgbImage = image.to_rgb8();
    let lines = format_speed_lines(speed);

    let font_data = check_font("Arial.ttf").and_then(|path| std::fs::read(path).ok());
    let font = font_data
        .as_ref()
        .and_then(|data| FontRef::try_from_slice(data).ok());

    let scale = PxScale::from(18.0);
    let line_h = 22i32;
    let x = 10i32;
    let y0 = 8i32;

    if let Some(font) = font.as_ref() {
        let colors = [
            Rgb([180, 220, 255]),
            Rgb([120, 255, 160]),
            Rgb([255, 210, 120]),
            Rgb([255, 255, 255]),
        ];
        // 1px 深色描边，保证亮底上可读，但不画黑底矩形
        let outline = Rgb([20, 20, 20]);
        let offsets = [
            (-1, 0),
            (1, 0),
            (0, -1),
            (0, 1),
            (-1, -1),
            (1, -1),
            (-1, 1),
            (1, 1),
        ];
        for (i, line) in lines.iter().enumerate() {
            let y = y0 + i as i32 * line_h;
            for (dx, dy) in offsets {
                draw_text_mut(&mut rgb, outline, x + dx, y + dy, scale, font, line);
            }
            let color = colors.get(i).copied().unwrap_or(Rgb([255, 255, 255]));
            draw_text_mut(&mut rgb, color, x, y, scale, font, line);
        }
    } else {
        eprintln!("timing (no font): {}", lines.join(" | "));
    }

    DynamicImage::ImageRgb8(rgb)
}

/// 控制台单行摘要。
pub fn speed_summary_line(speed: &Speed) -> String {
    format_speed_lines(speed).join(" | ")
}
