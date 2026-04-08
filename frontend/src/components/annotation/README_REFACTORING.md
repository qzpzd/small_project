# AnnotationView 组件重构说明

## 文件结构

重构后的 `AnnotationView` 组件被拆分成多个模块，提高代码的可维护性和可读性：

### 核心文件

1. **AnnotationView.jsx** - 主组件
   - 整合所有子组件
   - 管理组件间的数据流
   - 处理全局事件（键盘事件等）

2. **useAnnotationUtils.jsx** - 工具函数
   - `rgbToRgba()` - RGB颜色转RGBA
   - `hslToRgb()` - HSL颜色转RGB
   - `generateRandomColor()` - 生成随机颜色
   - `generateId()` - 生成唯一ID

3. **useAnnotationHooks.jsx** - 自定义Hooks
   - `useAnnotationState()` - 状态管理Hook
   - `useSvgSize()` - SVG尺寸管理Hook

4. **useAnnotationHandlers.jsx** - 事件处理函数
   - `updateMouse()` - 更新鼠标位置
   - `handleMouseDown()` - 处理鼠标按下
   - `handleMouseMove()` - 处理鼠标移动
   - `handleMouseUp()` - 处理鼠标抬起
   - `handleColorButtonClick()` - 处理颜色按钮点击
   - `handleColorSelect()` - 处理颜色选择
   - `handleDeleteBox()` - 处理删除标注框
   - `handleUndo()` - 处理撤销
   - `handleRedo()` - 处理重做
   - `handlePrev()` - 处理上一张图片
   - `handleNext()` - 处理下一张图片

### UI组件文件

5. **AnnotationCanvas.jsx** - 图像标注画布
   - 图像显示
   - SVG标注层
   - 十字光标
   - 矩形框绘制
   - 导航按钮

6. **AnnotationToolbar.jsx** - 工具栏
   - 绘制按钮
   - 自动标注按钮
   - 撤销/重做按钮
   - 删除按钮
   - 快捷键按钮

7. **LabelPanel.jsx** - 标签面板
   - 标签列表
   - 搜索功能
   - 标签编辑
   - 标签删除
   - 颜色选择器
   - 新增标签

## 模块化优势

1. **代码组织清晰** - 每个文件负责单一功能
2. **易于维护** - 修改某个功能时只需关注对应文件
3. **可重用性** - 工具函数和Hooks可以在其他组件中重用
4. **测试友好** - 每个模块可以独立测试
5. **团队协作** - 多人可以同时修改不同模块

## 数据流

```
AnnotationView (主组件)
    ↓
useAnnotationState (状态管理)
    ↓
useAnnotationHandlers (事件处理)
    ↓
AnnotationCanvas + AnnotationToolbar + LabelPanel (UI组件)
```

## 状态管理

所有状态通过 `useAnnotationState` Hook 统一管理，包括：

- 颜色选择器状态
- 标注框状态
- 图像状态
- UI控制状态
- Label管理状态
- 历史记录状态

## 事件处理

所有事件处理函数集中在 `useAnnotationHandlers` 中，通过参数接收状态和状态更新函数。

## 备份文件

原始文件已备份为：
- `AnnotationView.jsx.backup2` - 重构前的原始文件
- `AnnotationView.jsx.backup` - 之前的备份

## 迁移说明

如果需要回退到原始版本：

```bash
cp AnnotationView.jsx.backup2 AnnotationView.jsx
```

## 注意事项

1. 保持各模块之间的接口稳定
2. 新增功能时考虑模块化设计
3. 避免在主组件中直接操作状态
4. 使用自定义Hooks封装重复逻辑