import { useCallback } from 'react';
import { message } from 'antd';
import { generateId } from './useAnnotationUtils';

// 事件处理函数
export const useAnnotationHandlers = (ctx, state, setState) => {
  const {
    imgRef,
    svgRef,
    boxes,
    mouse,
    isDrawing,
    currentRect,
    startPoint,
    selectedBox,
    history,
    historyIndex,
    hasMoved,
    naturalImageSize,
    colorPickerLabelId,
    colorPickerVisible,
  } = state;

  const {
    setBoxes,
    setMouse,
    setIsDrawing,
    setCurrentRect,
    setStartPoint,
    setSelectedBox,
    setHistory,
    setHistoryIndex,
    setHasMoved,
    setColorPickerVisible,
    setColorPickerLabelId,
  } = setState;

  // 保存标注框
  const saveAnnotationBoxes = (imageId, boxes) => {
    ctx.updateImageBoxes(imageId, boxes);
  };

  // 更新鼠标位置
  const updateMouse = useCallback((e) => {
    if (!svgRef.current || !imgRef.current) return;
    
    const svg = svgRef.current;
    const img = imgRef.current;
    const svgRect = svg.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    
    // 检查鼠标是否在SVG区域内
    if (e.clientX < svgRect.left || e.clientX > svgRect.right ||
        e.clientY < svgRect.top || e.clientY > svgRect.bottom) {
      setMouse({ x: -1, y: -1 });
      return;
    }
    
    // 检查鼠标是否在图像实际显示区域内
    if (e.clientX < imgRect.left || e.clientX > imgRect.right ||
        e.clientY < imgRect.top || e.clientY > imgRect.bottom) {
      setMouse({ x: -1, y: -1 });
      return;
    }
    
    // 使用SVG的坐标转换方法
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    
    // 转换为SVG坐标系
    const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    
    // 确保坐标在有效范围内
    const clampedX = Math.max(0, Math.min(svgPoint.x, naturalImageSize.width));
    const clampedY = Math.max(0, Math.min(svgPoint.y, naturalImageSize.height));
    
    setMouse({ x: clampedX, y: clampedY });
  }, [svgRef, imgRef, naturalImageSize, setMouse]);

  // 处理鼠标按下事件
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    
    const svg = svgRef.current;
    const img = imgRef.current;
    if (!svg || !img) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // 检查鼠标是否在图像实际显示区域内
    const imgRect = img.getBoundingClientRect();
    if (e.clientX < imgRect.left || e.clientX > imgRect.right ||
        e.clientY < imgRect.top || e.clientY > imgRect.bottom) {
      return;
    }
    
    // 使用SVG的坐标转换方法
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    
    // 转换为SVG坐标系
    const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    
    // 限制坐标在图像范围内
    const clampedX = Math.max(0, Math.min(svgPoint.x, naturalImageSize.width));
    const clampedY = Math.max(0, Math.min(svgPoint.y, naturalImageSize.height));
    
    // 记录起始点
    setStartPoint({ x: clampedX, y: clampedY });
    
    // 开始绘制
    setIsDrawing(true);
    
    // 初始化当前矩形
    setCurrentRect({
      x: clampedX,
      y: clampedY,
      width: 0,
      height: 0
    });
  }, [svgRef, imgRef, naturalImageSize, setStartPoint, setIsDrawing, setCurrentRect]);

  // 处理鼠标移动事件
  const handleMouseMove = useCallback((e) => {
    if (!isDrawing || !svgRef.current || !imgRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // 检查鼠标是否在图像实际显示区域内
    const imgRect = imgRef.current.getBoundingClientRect();
    if (e.clientX < imgRect.left || e.clientX > imgRect.right ||
        e.clientY < imgRect.top || e.clientY > imgRect.bottom) {
      return;
    }
    
    // 使用SVG的坐标转换方法
    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    
    // 转换为SVG坐标系
    const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    
    // 限制坐标在图像范围内
    const clampedX = Math.max(0, Math.min(svgPoint.x, naturalImageSize.width));
    const clampedY = Math.max(0, Math.min(svgPoint.y, naturalImageSize.height));
    
    // 更新当前矩形
    setCurrentRect({
      x: Math.min(startPoint.x, clampedX),
      y: Math.min(startPoint.y, clampedY),
      width: Math.abs(clampedX - startPoint.x),
      height: Math.abs(clampedY - startPoint.y)
    });
    
    // 标记鼠标已移动
    setHasMoved(true);
  }, [isDrawing, svgRef, imgRef, startPoint, naturalImageSize, setCurrentRect, setHasMoved]);

  // 处理鼠标抬起事件
  const handleMouseUp = useCallback((e) => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    // 如果鼠标没有移动，不创建矩形
    if (!hasMoved) {
      setHasMoved(false);
      return;
    }
    
    // 计算最终矩形
    const rect = currentRect || {
      x: Math.min(startPoint.x, mouse.x),
      y: Math.min(startPoint.y, mouse.y),
      width: Math.abs(mouse.x - startPoint.x),
      height: Math.abs(mouse.y - startPoint.y)
    };
    
    // 只有当矩形有尺寸时才创建
    if (rect.width > 5 && rect.height > 5 && ctx.selectedImage) {
      const newBox = {
        id: generateId(),
        x: rect.x,
        y: rect.y,
        w: rect.width,
        h: rect.height,
        labelId: ctx.selectedLabel?.id || ctx.labels[0]?.id,
        label: ctx.selectedLabel?.name || ctx.labels[0]?.name,
        color: ctx.selectedLabel?.color || ctx.labels[0]?.color
      };
      
      setBoxes([...boxes, newBox]);
      
      // 保存到历史记录
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...boxes, newBox]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      // 保存标注
      saveAnnotationBoxes(ctx.selectedImage.id, [...boxes, newBox]);
    }
    
    // 重置状态
    setCurrentRect(null);
    setStartPoint(null);
    setHasMoved(false);
  }, [isDrawing, hasMoved, currentRect, startPoint, mouse, boxes, history, historyIndex, ctx, setIsDrawing, setBoxes, setHistory, setHistoryIndex, setCurrentRect, setStartPoint, setHasMoved]);

  // 处理颜色按钮点击
  const handleColorButtonClick = useCallback((e, labelId) => {
    e.stopPropagation();
    setColorPickerLabelId(labelId);
    setColorPickerVisible(true);
  }, [setColorPickerLabelId, setColorPickerVisible]);

  // 处理颜色选择
  const handleColorSelect = useCallback((color) => {
    if (colorPickerLabelId) {
      const updatedLabels = ctx.labels.map(l =>
        l.id === colorPickerLabelId ? { ...l, color } : l
      );
      ctx.setLabels(updatedLabels);
    }
    setColorPickerVisible(false);
    setColorPickerLabelId(null);
  }, [colorPickerLabelId, ctx, setColorPickerVisible, setColorPickerLabelId]);

  // 处理删除标注框
  const handleDeleteBox = useCallback(() => {
    if (selectedBox && ctx.selectedImage) {
      const updated = boxes.filter(b => b.id !== selectedBox.id);
      setBoxes(updated);
      setSelectedBox(null);
      saveAnnotationBoxes(ctx.selectedImage.id, updated);
    }
  }, [selectedBox, boxes, ctx.selectedImage, setBoxes, setSelectedBox]);

  // 处理撤销
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setBoxes(history[prevIndex]);
    }
  }, [historyIndex, history, setHistoryIndex, setBoxes]);

  // 处理重做
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setBoxes(history[nextIndex]);
    }
  }, [historyIndex, history, setHistoryIndex, setBoxes]);

  // 处理上一张图片
  const handlePrev = useCallback(() => {
    if (!ctx.selectedImage) return;
    
    const currentIndex = ctx.allImages.findIndex(img => img.id === ctx.selectedImage.id);
    if (currentIndex > 0) {
      const prevImage = ctx.allImages[currentIndex - 1];
      ctx.selectImage(prevImage.id);
    }
  }, [ctx]);

  // 处理下一张图片
  const handleNext = useCallback(() => {
    if (!ctx.selectedImage) return;
    
    const currentIndex = ctx.allImages.findIndex(img => img.id === ctx.selectedImage.id);
    if (currentIndex < ctx.allImages.length - 1) {
      const nextImage = ctx.allImages[currentIndex + 1];
      ctx.selectImage(nextImage.id);
    }
  }, [ctx]);

  return {
    updateMouse,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleColorButtonClick,
    handleColorSelect,
    handleDeleteBox,
    handleUndo,
    handleRedo,
    handlePrev,
    handleNext,
    saveAnnotationBoxes,
  };
};