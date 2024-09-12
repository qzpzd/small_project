import cv2
import numpy as np

# 原始图像
img = cv2.imread('path/to/image.jpg')

# 目标尺寸
target_size = (128, 128)

# 计算缩放比例
scale = min(target_size[0] / img.shape[1], target_size[1] / img.shape[0])

# 缩放图像
resized_img = cv2.resize(img, None, fx=scale, fy=scale)

# 计算填充
top_pad = int((target_size[1] - resized_img.shape[0]) / 2)
bottom_pad = target_size[1] - resized_img.shape[0] - top_pad
left_pad = int((target_size[0] - resized_img.shape[1]) / 2)
right_pad = target_size[0] - resized_img.shape[1] - left_pad

# 应用填充
padded_img = cv2.copyMakeBorder(resized_img, top_pad, bottom_pad, left_pad, right_pad, cv2.BORDER_CONSTANT, value=[0, 0, 0])

cv2.imshow("img",padded_img)
# 归一化和转换格式
# padded_img = padded_img / 255.0
# padded_img = padded_img.transpose((2, 0, 1))