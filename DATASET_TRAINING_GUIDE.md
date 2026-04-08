# 数据集上传和训练指南

## 📋 数据集结构要求

YOLO 训练需要以下目录结构：

```
datasets/
└── my_dataset/
    ├── images/
    │   ├── train/          # 训练图片
    │   │   ├── image1.jpg
    │   │   └── image2.jpg
    │   ├── val/            # 验证图片
    │   │   ├── image1.jpg
    │   │   └── image2.jpg
    │   └── test/           # 测试图片（可选）
    │       └── image1.jpg
    └── labels/             # 标注文件
        ├── train/
        │   ├── image1.txt
        │   └── image2.txt
        ├── val/
        │   ├── image1.txt
        │   └── image2.txt
        └── test/
            └── image1.txt
```

## 📝 YAML 配置文件格式

```yaml
# 数据集根目录（绝对路径）
path: /home/star/qzp/llm_auto_train/datasets/my_dataset

# 图片相对路径
train: images/train
val: images/val
test: images/test  # 可选

# 类别数量
nc: 5

# 类别名称映射
names:
  0: person
  1: car
  2: dog
  3: cat
  4: bicycle
```

## 🏷️ 标注文件格式

每个标注文件（.txt）对应一张图片，格式为：

```
<class_id> <x_center> <y_center> <width> <height>
```

其中：
- `class_id`: 类别 ID（从 0 开始）
- `x_center`, `y_center`: 边界框中心坐标（归一化到 0-1）
- `width`, `height`: 边界框宽度和高度（归一化到 0-1）

示例：
```
0 0.5 0.5 0.3 0.4  # person 类别，中心在 (0.5, 0.5)，宽 0.3，高 0.4
1 0.2 0.8 0.15 0.2 # car 类别
```

## 📤 上传数据集步骤

### 方法 1：使用前端界面

1. **准备数据集**
   - 在本地创建数据集目录结构
   - 准备图片和标注文件
   - 创建 YAML 配置文件

2. **上传 YAML 文件**
   - 打开训练页面
   - 切换到"上传新文件"
   - 选择 YAML 文件
   - 点击上传

3. **上传数据集文件**
   - 使用 SCP/SFTP 将数据集目录上传到服务器
   ```bash
   scp -r my_dataset user@server:/home/star/qzp/llm_auto_train/datasets/
   ```

### 方法 2：直接上传到服务器

使用以下命令上传整个数据集：

```bash
# 从 Windows 使用 WinSCP 或 FileZilla
# 或使用命令行
scp -r C:\path\to\my_dataset user@server:/home/star/qzp/llm_auto_train/datasets/
```

## 🚀 开始训练

### 前端界面训练

1. **选择数据集**
   - 从项目目录选择 YAML 文件
   - 或上传新的 YAML 文件

2. **选择模型**（可选）
   - 从项目目录选择预训练模型
   - 或上传新的模型文件

3. **调整参数**
   - 训练轮数（epochs）
   - 批次大小（batch_size）
   - 图像大小（img_size）
   - 学习率（lr0, lr）
   - 设备（device）

4. **开始训练**
   - 点击"开始训练"按钮
   - 观察训练状态和进度

### 训练参数说明

| 参数 | 说明 | 默认值 | 范围 |
|------|------|--------|------|
| task | 任务类型 | detect | detect, segment, classify, pose, obb |
| epochs | 训练轮数 | 100 | 1-500 |
| batch_size | 批次大小 | 16 | 1-64 |
| img_size | 图像大小 | 640 | 320-1280 |
| lr0 | 初始学习率 | 0.01 | 0.0001-0.1 |
| lr | 最终学习率 | 0.01 | 0.0001-0.1 |
| momentum | 动量 | 0.937 | 0-1 |
| weight_decay | 权重衰减 | 0.0005 | 0-0.01 |
| warmup_epochs | 预热轮数 | 3 | 0-10 |
| device | 设备 | 0 | 0, 1, -1 (CPU) |

## 📊 训练输出

训练完成后，模型保存在：

```
runs/train/<task_id>/weights/
├── best.pt     # 最佳模型
└── last.pt     # 最后一个 epoch 的模型
```

训练曲线图：
```
runs/train/<task_id>/results.png
```

## 🐛 常见问题

### 1. 训练失败：数据集不存在

**原因**：YAML 文件中的路径不正确

**解决**：
- 检查 YAML 文件中的 `path` 是否为绝对路径
- 确保数据集目录存在于服务器上
- 确保图片和标注文件在正确的子目录中

### 2. 训练失败：找不到图片

**原因**：图片路径配置错误

**解决**：
- 检查 YAML 文件中的 `train` 和 `val` 路径
- 确保路径相对于 `path` 目录
- 确保图片文件名与标注文件名对应（扩展名除外）

### 3. 训练失败：类别数量不匹配

**原因**：YAML 文件中的 `nc` 与 `names` 数量不一致

**解决**：
- 确保 `nc` 等于 `names` 中的类别数量
- 确保 `names` 中的 ID 从 0 开始连续编号

### 4. 上传文件后目录不更新

**原因**：前端缓存问题

**解决**：
- 刷新浏览器页面
- 或重新上传文件

## 📁 示例数据集

项目包含一个示例数据集：

```
datasets/my_dataset/
├── images/
│   ├── train/sample.jpg
│   └── val/sample.jpg
└── labels/
    ├── train/sample.txt
    └── val/sample.txt
```

对应的 YAML 配置文件：

```
config/datasets/default.yaml
```

## 🔗 相关文件

- YAML 配置：`/home/star/qzp/llm_auto_train/config/datasets/default.yaml`
- 示例数据集：`/home/star/qzp/llm_auto_train/datasets/my_dataset/`
- 训练输出：`/home/star/qzp/llm_auto_train/runs/train/`
- 模型文件：`/home/star/qzp/llm_auto_train/models/`

## 💡 提示

1. **数据集大小**：建议至少 100 张训练图片和 20 张验证图片
2. **类别平衡**：确保每个类别都有足够的样本
3. **图片质量**：使用清晰、分辨率一致的图片
4. **标注质量**：确保边界框准确覆盖目标
5. **训练时间**：取决于数据集大小、epochs 和硬件配置