// 工具函数 - 颜色转换和生成
export const rgbToRgba = (rgbColor, alpha) => {
  if (!rgbColor) return `#808080${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
  
  if (rgbColor.startsWith('#')) {
    // 十六进制颜色
    const hex = rgbColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
  } else if (rgbColor.startsWith('rgb(')) {
    // RGB颜色
    const match = rgbColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
    }
  }
  // 默认返回灰色
  return `#808080${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
};

// HSL转RGB辅助函数
export const hslToRgb = (h, s, l) => {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `rgb(${Math.floor(255 * f(0))}, ${Math.floor(255 * f(8))}, ${Math.floor(255 * f(4))})`;
};

// 生成随机颜色（RGB格式），确保与现有颜色不同
export const generateRandomColor = (existingColors) => {
  const colors = existingColors.map(l => l.color.toLowerCase());
  let newColor;
  let attempts = 0;
  do {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.floor(Math.random() * 30);
    const lightness = 45 + Math.floor(Math.random() * 25);
    newColor = hslToRgb(hue, saturation, lightness);
    attempts++;
  } while (colors.some(c => c.toLowerCase() === newColor.toLowerCase()) && attempts < 100);
  return newColor;
};

// 生成唯一ID
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};