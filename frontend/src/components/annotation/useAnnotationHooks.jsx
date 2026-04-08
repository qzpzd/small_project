import { useState, useRef, useCallback, useEffect } from 'react';

// 自定义hooks - 状态管理
export const useAnnotationState = () => {
  // 颜色选择器状态
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [colorPickerLabelId, setColorPickerLabelId] = useState(null);
  
  // 标注框状态
  const [boxes, setBoxes] = useState([]);
  const [mouse, setMouse] = useState({ x: -100, y: -100 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRect, setCurrentRect] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [selectedBox, setSelectedBox] = useState(null);
  const [draggingHandle, setDraggingHandle] = useState(null);
  const [draggingBox, setDraggingBox] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // 图像状态
  const [imgSize, setImgSize] = useState({ width: 0, height: 0, top: 0, left: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [naturalImageSize, setNaturalImageSize] = useState({ width: 0, height: 0 });
  const [displayImageSize, setDisplayImageSize] = useState({ width: 0, height: 0 });
  const [imageScaleFactor, setImageScaleFactor] = useState(1);
  
  // UI控制状态
  const [showLabels, setShowLabels] = useState(true);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showAllLabels, setShowAllLabels] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showLabelText, setShowLabelText] = useState(true);
  const [showControls, setShowControls] = useState(true);
  
  // Label管理状态
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#0052FF');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [editingLabelName, setEditingLabelName] = useState('');
  
  // 历史记录状态
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // 其他状态
  const [hasMoved, setHasMoved] = useState(false);
  const [lastImageId, setLastImageId] = useState(null);
  
  // Refs
  const imgRef = useRef(null);
  const svgRef = useRef(null);

  return {
    // 颜色选择器
    colorPickerVisible, setColorPickerVisible,
    colorPickerLabelId, setColorPickerLabelId,
    
    // 标注框
    boxes, setBoxes,
    mouse, setMouse,
    isDrawing, setIsDrawing,
    currentRect, setCurrentRect,
    startPoint, setStartPoint,
    selectedBox, setSelectedBox,
    draggingHandle, setDraggingHandle,
    draggingBox, setDraggingBox,
    dragOffset, setDragOffset,
    
    // 图像
    imgSize, setImgSize,
    imgLoaded, setImgLoaded,
    naturalImageSize, setNaturalImageSize,
    displayImageSize, setDisplayImageSize,
    imageScaleFactor, setImageScaleFactor,
    imgRef, svgRef,
    
    // UI控制
    showLabels, setShowLabels,
    showBoxes, setShowBoxes,
    showAllLabels, setShowAllLabels,
    showShortcuts, setShowShortcuts,
    showLabelText, setShowLabelText,
    showControls, setShowControls,
    
    // Label管理
    newLabelName, setNewLabelName,
    newLabelColor, setNewLabelColor,
    searchQuery, setSearchQuery,
    editingLabelId, setEditingLabelId,
    editingLabelName, setEditingLabelName,
    
    // 历史记录
    history, setHistory,
    historyIndex, setHistoryIndex,
    
    // 其他
    hasMoved, setHasMoved,
    lastImageId, setLastImageId,
  };
};

// SVG尺寸更新hook
export const useSvgSize = (imgRef, ctx) => {
  const [naturalImageSize, setNaturalImageSize] = useState({ width: 0, height: 0 });
  const [displayImageSize, setDisplayImageSize] = useState({ width: 0, height: 0 });
  const [imageScaleFactor, setImageScaleFactor] = useState(1);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0, top: 0, left: 0 });

  const updateSvgSize = useCallback(() => {
    if (!imgRef.current) return;
    
    const img = imgRef.current;
    const imgRect = img.getBoundingClientRect();
    
    // 获取原始图像尺寸
    const naturalWidth = img.naturalWidth || 800;
    const naturalHeight = img.naturalHeight || 600;
    
    // 保存原始图像尺寸
    setNaturalImageSize({ width: naturalWidth, height: naturalHeight });
    
    // 使用实际显示的图像尺寸
    const displayWidth = imgRect.width;
    const displayHeight = imgRect.height;
    
    // 设置显示图像尺寸
    setDisplayImageSize({ width: displayWidth, height: displayHeight });
    
    // 计算图像缩放因子
    const scaleFactor = displayWidth / naturalWidth;
    setImageScaleFactor(scaleFactor);
    
    // 设置SVG位置和尺寸
    setImgSize({
      width: displayWidth,
      height: displayHeight,
      top: 0,
      left: 0
    });
  }, [imgRef]);

  // 监听图片尺寸变化
  useEffect(() => {
    if (imgRef.current && ctx.selectedImage) {
      const updateSize = () => {
        updateSvgSize();
      };
      
      updateSize();
      
      const handleResize = () => {
        updateSize();
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [ctx.selectedImage, updateSvgSize]);

  return {
    naturalImageSize,
    displayImageSize,
    imageScaleFactor,
    imgSize,
    updateSvgSize
  };
};