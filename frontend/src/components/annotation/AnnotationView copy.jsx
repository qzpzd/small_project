import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { App } from 'antd';
import { Card, Form, Input, Button, Upload, Slider, message, Dropdown, Tag, Tooltip, Modal, ColorPicker, Select, Spin } from 'antd';
import { 
  PlusOutlined, UploadOutlined, DownloadOutlined, EyeOutlined, 
  LeftOutlined, RightOutlined, CloseOutlined, AppstoreOutlined, 
  BarsOutlined, DeleteOutlined, CheckCircleOutlined, EditOutlined,
  SyncOutlined, UndoOutlined, RedoOutlined, BookOutlined, SaveOutlined
} from '@ant-design/icons';
import { useDatasetContext, DatasetContext } from '../../context/DatasetContext';

const AnnotationView = () => {
  const ctx = useContext(DatasetContext);
  const { message } = App.useApp();

  // 将RGB颜色转换为RGBA（带透明度）
  const rgbToRgba = (rgbColor, alpha) => {
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
  const hslToRgb = (h, s, l) => {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return `rgb(${Math.floor(255 * f(0))}, ${Math.floor(255 * f(8))}, ${Math.floor(255 * f(4))})`;
  };

  // 生成随机颜色（RGB格式），确保与现有颜色不同
  const generateRandomColor = () => {
    const existingColors = ctx.labels.map(l => l.color.toLowerCase());
    let newColor;
    let attempts = 0;
    do {
      const hue = Math.floor(Math.random() * 360);
      const saturation = 70 + Math.floor(Math.random() * 30);
      const lightness = 45 + Math.floor(Math.random() * 25);
      newColor = hslToRgb(hue, saturation, lightness);
      attempts++;
    } while (existingColors.some(c => c.toLowerCase() === newColor.toLowerCase()) && attempts < 100);
    return newColor;
  };
  // 处理颜色按钮点击
  const handleColorButtonClick = (e, labelId) => {
    e.stopPropagation();
    setColorPickerLabelId(labelId);
    setColorPickerVisible(true);
  };

  // 处理颜色选择
  const handleColorSelect = (color) => {
    if (colorPickerLabelId) {
      const updatedLabels = ctx.labels.map(l =>
        l.id === colorPickerLabelId ? { ...l, color } : l
      );
      ctx.setLabels(updatedLabels);
    }
    setColorPickerVisible(false);
    setColorPickerLabelId(null);
  };

  // 处理生成随机颜色
  const handleGenerateRandomColor = () => {
    const newColor = generateRandomColor();
    handleColorSelect(newColor);
  };


  // 添加新label时的颜色选择
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [colorPickerLabelId, setColorPickerLabelId] = useState(null);

  const [boxes, setBoxes] = useState([]);
  const [mouse, setMouse] = useState({ x: -100, y: -100 });
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [selectedBox, setSelectedBox] = useState(null);
  const [draggingHandle, setDraggingHandle] = useState(null);
  const [draggingBox, setDraggingBox] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0, top: 0, left: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [naturalImageSize, setNaturalImageSize] = useState({ width: 0, height: 0 }); // 原始图像尺寸
  const [displayImageSize, setDisplayImageSize] = useState({ width: 0, height: 0 }); // 显示图像尺寸（1:1正方形）
  const [imageScaleFactor, setImageScaleFactor] = useState(1); // 图像缩放因子
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#0052FF');

  const [searchQuery, setSearchQuery] = useState('');
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [editingLabelName, setEditingLabelName] = useState('');
  const [showLabels, setShowLabels] = useState(true); // 控制label面板显示/隐藏
  const [showBoxes, setShowBoxes] = useState(true); // 控制显示标注框
  const [showAllLabels, setShowAllLabels] = useState(true); // 控制显示所有labels
  const [showShortcuts, setShowShortcuts] = useState(false); // 控制显示快捷键
  const [history, setHistory] = useState([]); // 撤销历史
  const [historyIndex, setHistoryIndex] = useState(-1); // 历史记录索引
  const [showLabelText, setShowLabelText] = useState(true); // 控制显示标注框label文字
  const [showControls, setShowControls] = useState(true); // 控制按钮栏显示/隐藏
  const [hasMoved, setHasMoved] = useState(false); // 跟踪鼠标是否真正移动

  const imgRef = useRef(null);
  const svgRef = useRef(null);

  // 辅助函数：保存标注框
  const saveAnnotationBoxes = (imageId, boxes) => {
    ctx.updateImageBoxes(imageId, boxes);
  };

// 更新 SVG 尺寸和位置的函数 - 基于实际图像显示尺寸
  const updateSvgSize = useCallback(() => {
    if (!imgRef.current) return;
    
    const img = imgRef.current;
    const imgRect = img.getBoundingClientRect();
    
    // 获取原始图像尺寸
    const naturalWidth = img.naturalWidth || 800;
    const naturalHeight = img.naturalHeight || 600;
    
    // 保存原始图像尺寸
    setNaturalImageSize({ width: naturalWidth, height: naturalHeight });
    
    // 使用实际显示的图像尺寸（保持长宽比）
    const displayWidth = imgRect.width;
    const displayHeight = imgRect.height;
    
    // 设置显示图像尺寸
    setDisplayImageSize({ width: displayWidth, height: displayHeight });
    
    // 计算图像缩放因子：显示尺寸 / 原始尺寸
    // 两个方向应该相同（因为保持长宽比）
    const scaleFactor = displayWidth / naturalWidth;
    setImageScaleFactor(scaleFactor);
    
    // 设置 SVG 位置和尺寸
    // SVG 是 absolute 定位，相对于图片容器，需要加上padding
    setImgSize({
      width: displayWidth,
      height: displayHeight,
      top: 10,  // 加上容器的 padding: 10px
      left: 10  // 加上容器的 padding: 10px
    });
  }, []);

  // 监听图片尺寸变化
    useEffect(() => {
      if (imgRef.current && ctx.selectedImage) {
        const updateSize = () => {
          if (imgRef.current) {
            const img = imgRef.current;
            const rect = img.getBoundingClientRect();
            
            // img的实际显示尺寸（考虑object-fit: contain）
            const naturalWidth = img.naturalWidth || 800;
            const naturalHeight = img.naturalHeight || 600;
            const displayedWidth = rect.width;
            const displayedHeight = rect.height;
            
            // 计算contain模式下的实际显示尺寸和偏移
            const displayRatio = displayedWidth / displayedHeight;
            const imageRatio = naturalWidth / naturalHeight;
            
            let actualWidth, actualHeight, offsetX, offsetY;
            
            if (imageRatio > displayRatio) {
              // 图像更宽，以宽度为准
              actualWidth = displayedWidth;
              actualHeight = displayedWidth / imageRatio;
              offsetX = 0;
              offsetY = (displayedHeight - actualHeight) / 2;
            } else {
              // 图像更高，以高度为准
              actualHeight = displayedHeight;
              actualWidth = displayedHeight * imageRatio;
              offsetX = (displayedWidth - actualWidth) / 2;
              offsetY = 0;
            }
            
            setImgSize({
              width: actualWidth,
              height: actualHeight,
              top: offsetY,
              left: offsetX
            });
          }
        };
        
        // 等待图片加载完成
        if (imgRef.current.complete) {
          updateSize();
        } else {
          imgRef.current.onload = updateSize;
        }
        
        window.addEventListener('resize', updateSize);
        return () => {
          window.removeEventListener('resize', updateSize);
        };
      }
    }, [ctx.selectedImage]);  // 当选择新图片时，重置状态
  useEffect(() => {
    if (ctx.selectedImage) {
      const img = ctx.allImages.find(i => i.id === ctx.selectedImage.id);
      setBoxes(img?.boxes || []);
      setImgLoaded(false);
      setImgSize({ width: 0, height: 0, top: 0, left: 0 });

      // 尝试加载对应的JSON标注文件
      loadAnnotationForImage(ctx.selectedImage);
    }
  }, [ctx.selectedImage]);

  // 加载图像对应的JSON标注文件
  const loadAnnotationForImage = async (image) => {
    try {
      // 使用当前数据集的name构建路径
      const datasetDir = `datasets/${ctx.currentDataset}`;
      const loadedBoxes = await ctx.loadAnnotationFromAPI(image.id, datasetDir);
      if (loadedBoxes) {
        setBoxes(loadedBoxes);
        
        // 为现有矩形框添加图像尺寸信息（如果缺失）
        if (imgRef.current) {
          const naturalWidth = imgRef.current.naturalWidth || 800;
          const naturalHeight = imgRef.current.naturalHeight || 600;
          
          const updatedBoxes = loadedBoxes.map(box => ({
            ...box,
            imgWidth: box.imgWidth || naturalWidth,
            imgHeight: box.imgHeight || naturalHeight
          }));
          
          // 检查是否需要更新
          const needsUpdate = loadedBoxes.some(box => !box.imgWidth || !box.imgHeight);
          if (needsUpdate) {
            saveAnnotationBoxes(image.id, updatedBoxes);
            setBoxes(updatedBoxes);
          }
        }
      }
    } catch (error) {
      console.error('加载标注文件失败:', error);
    }
  };

  // 图片加载完成事件
  const handleImageLoad = () => {
    setImgLoaded(true);
    // 增加延迟确保图片完全渲染后再更新SVG尺寸
    setTimeout(updateSvgSize, 200);
    // 再次更新确保尺寸正确
    setTimeout(updateSvgSize, 500);
  };

  // 核心：精准坐标计算 - 基于图像显示区域的坐标系
  const updateMouse = (e) => {
    if (!imgRef.current || !ctx.selectedImage) {
      setMouse({ x: -100, y: -100 });
      return;
    }

    const svg = svgRef.current;
    if (!svg) {
      setMouse({ x: -100, y: -100 });
      return;
    }

    const svgRect = svg.getBoundingClientRect();
    
    // 计算鼠标相对于SVG的坐标
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    
    // 检查是否在SVG范围内（即图像显示区域内）
    const inside = x >= 0 && x <= svgRect.width && y >= 0 && y <= svgRect.height;
    if (!inside) {
      setMouse({ x: -100, y: -100 });
      return;
    }

    // SVG viewBox使用原始图像尺寸，需要将显示坐标转换为原始图像坐标
    const naturalWidth = naturalImageSize.width || 800;
    const naturalHeight = naturalImageSize.height || 600;
    
    // 使用图像缩放因子进行转换
    const originalX = x / imageScaleFactor;
    const originalY = y / imageScaleFactor;

    // 检查坐标是否在原始图像范围内
    if (originalX < 0 || originalX > naturalWidth || originalY < 0 || originalY > naturalHeight) {
      setMouse({ x: -100, y: -100 });
      return;
    }

    // 转换为原始图像坐标（这是标注框存储的坐标系）
    setMouse({
      x: originalX,
      y: originalY
    });
  };

  useEffect(() => {
    // 禁用body滚动
    document.body.style.overflow = 'hidden';
    
    // 使用requestAnimationFrame优化性能
    let rafId = null;
    const handleMouseMove = (e) => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        updateMouse(e);
      });
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
    
    // 组件卸载时恢复body滚动
    return () => {
      document.body.style.overflow = '';
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [ctx.selectedImage, imageScaleFactor, naturalImageSize]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;

    const svgRect = svg.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    
    // SVG viewBox使用原始图像尺寸，需要将显示坐标转换为原始图像坐标
    const naturalWidth = naturalImageSize.width || 800;
    const naturalHeight = naturalImageSize.height || 600;
    
    // 使用图像缩放因子进行转换
    const originalX = x / imageScaleFactor;
    const originalY = y / imageScaleFactor;

    // 检查坐标是否在原始图像范围内
    if (originalX < 0 || originalX > naturalWidth || originalY < 0 || originalY > naturalHeight) {
      return;
    }

    setStartPoint({ x: Math.round(originalX), y: Math.round(originalY) });
    setHasMoved(false); // 重置移动标志
    // 不立即设置 drawing，等待鼠标移动
  };

  const handleMouseMove = (e) => {
    const svg = svgRef.current;
    if (!svg || !startPoint) return;

    const svgRect = svg.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    
    // 使用图像缩放因子进行转换
    const currentX = x / imageScaleFactor;
    const currentY = y / imageScaleFactor;

    // 检查坐标是否在原始图像范围内
    const naturalWidth = naturalImageSize.width || 800;
    const naturalHeight = naturalImageSize.height || 600;
    if (currentX < 0 || currentX > naturalWidth || currentY < 0 || currentY > naturalHeight) {
      return;
    }

    // 检查是否真正移动了
    const distance = Math.sqrt(Math.pow(currentX - startPoint.x, 2) + Math.pow(currentY - startPoint.y, 2));
    
    if (distance > 2 && !drawing && !hasMoved) {
      // 鼠标移动超过2像素，开始绘制
      setDrawing(true);
      setShowControls(false);
      setHasMoved(true);
    }

    // 只有在绘制时才更新鼠标位置（使用原始图像坐标）
    if (drawing) {
      setMouse({ x: currentX, y: currentY });
    }
  };

  const handleMouseUp = (e) => {
    if (!startPoint) return;

    e.preventDefault();

    const svg = svgRef.current;
    if (!svg) return;

    const svgRect = svg.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    
    // 使用图像缩放因子进行转换
    const currentX = x / imageScaleFactor;
    const currentY = y / imageScaleFactor;

    const width = Math.abs(currentX - startPoint.x);
    const height = Math.abs(currentY - startPoint.y);

    // 只有当矩形框尺寸大于5像素时才添加
    const MIN_BOX_SIZE = 5;
    if (width > MIN_BOX_SIZE && height > MIN_BOX_SIZE) {
      const naturalWidth = naturalImageSize.width || 800;
      const naturalHeight = naturalImageSize.height || 600;
      
      const newBox = {
        id: Date.now(),
        x: Math.min(startPoint.x, currentX),
        y: Math.min(startPoint.y, currentY),
        w: Math.round(width),
        h: Math.round(height),
        label: ctx.selectedLabel?.name || 'unlabeled',
        color: ctx.selectedLabel?.color || '#1890ff',
        labelId: ctx.selectedLabel?.id || 'default',
        imgWidth: naturalWidth,  // 存储图像原始宽度
        imgHeight: naturalHeight, // 存储图像原始高度
        scaleFactor: imageScaleFactor // 存储当前缩放因子
      };

      const updated = [...boxes, newBox];

      // 添加到历史记录
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...updated]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      setBoxes(updated);
      saveAnnotationBoxes(ctx.selectedImage.id, updated);
    }

    setDrawing(false);
    setStartPoint(null);
    setMouse({ x: -100, y: -100 }); // 隐藏鼠标位置显示
    setShowControls(true); // 显示按钮栏
    setHasMoved(false); // 重置移动标志
  };

  const handleBoxDown = (box, e) => {
    e.stopPropagation();
    setSelectedBox(box);
    
    if (!svgRef.current || !ctx.selectedImage) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - svgRect.left;
    const clientY = e.clientY - svgRect.top;
    
    // SVG viewBox使用原始图像尺寸
    const naturalWidth = imgRef.current.naturalWidth || 800;
    const naturalHeight = imgRef.current.naturalHeight || 600;
    const scaleX = naturalWidth / svgRect.width;
    const scaleY = naturalHeight / svgRect.height;
    
    // 转换为原始图像坐标
    const originalX = clientX * scaleX;
    const originalY = clientY * scaleY;
    
    const offset = {
      x: Math.round(originalX) - box.x,
      y: Math.round(originalY) - box.y
    };
    setDragOffset(offset);
    setDraggingBox(box);
  };

  const handleHandleDown = (handle, box, e) => {
    e.stopPropagation();
    setSelectedBox(box);
    setDraggingHandle({ handle, box });
  };

  useEffect(() => {
    const up = () => {
      setDraggingHandle(null);
      setDraggingBox(null);
    };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  useEffect(() => {
    if (!draggingHandle) return;
    const move = (e) => {
      updateMouse(e);
      if (mouse.x < 0 || mouse.y < 0) return;
      const { handle, box } = draggingHandle;
      const b = { ...box };

      if (handle === 'lt') { b.x = mouse.x; b.y = mouse.y; b.w = box.w + (box.x - mouse.x); b.h = box.h + (box.y - mouse.y); }
      if (handle === 'rt') { b.y = mouse.y; b.w = mouse.x - box.x; b.h = box.h + (box.y - mouse.y); }
      if (handle === 'lb') { b.x = mouse.x; b.w = box.w + (box.x - mouse.x); b.h = mouse.y - box.y; }
      if (handle === 'rb') { b.w = mouse.x - box.x; b.h = mouse.y - box.y; }
      if (handle === 't') { b.y = mouse.y; b.h = box.h + (box.y - mouse.y); }
      if (handle === 'b') { b.h = mouse.y - box.y; }
      if (handle === 'l') { b.x = mouse.x; b.w = box.w + (box.x - mouse.x); }
      if (handle === 'r') { b.w = mouse.x - box.x; }

      const updated = boxes.map(bx => bx.id === box.id ? b : bx);
      setBoxes(updated);
      saveAnnotationBoxes(ctx.selectedImage.id, updated);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [draggingHandle, boxes]);

  useEffect(() => {
    if (!draggingBox) return;
    const move = (e) => {
      updateMouse(e);
      if (mouse.x < 0 || mouse.y < 0) return;
      
      const b = { ...draggingBox };
      b.x = mouse.x - dragOffset.x;
      b.y = mouse.y - dragOffset.y;

      const updated = boxes.map(bx => bx.id === draggingBox.id ? b : bx);
      setBoxes(updated);
      saveAnnotationBoxes(ctx.selectedImage.id, updated);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [draggingBox, boxes, dragOffset]);

  useEffect(() => {
    const key = (e) => {
      // 删除选中的矩形框
      if (e.key === "Delete" && selectedBox) {
        const updated = boxes.filter(b => b.id !== selectedBox.id);
        setBoxes(updated);
        setSelectedBox(null);
        saveAnnotationBoxes(ctx.selectedImage.id, updated);
      }
      
      // 左右箭头键和A/D键切换图片
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "a" || e.key === "A" || e.key === "d" || e.key === "D") {
        const currentIndex = ctx.allImages.findIndex(i => i.id === ctx.selectedImage.id);
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
          const prevIndex = (currentIndex - 1 + ctx.allImages.length) % ctx.allImages.length;
          ctx.setSelectedImage(ctx.allImages[prevIndex]);
        } else {
          const nextIndex = (currentIndex + 1) % ctx.allImages.length;
          ctx.setSelectedImage(ctx.allImages[nextIndex]);
        }
      }
      
      // 数字键切换label（支持1-9）
      if (e.key >= '1' && e.key <= '9') {
        const labelIndex = parseInt(e.key) - 1;
        if (labelIndex < ctx.labels.length) {
          const newLabel = ctx.labels[labelIndex];
          
          if (selectedBox) {
            // 选中矩形框时：切换矩形框的label
            const updated = boxes.map(b => 
              b.id === selectedBox.id ? { ...b, label: newLabel.name, color: newLabel.color, labelId: newLabel.id } : b
            );
            setBoxes(updated);
            saveAnnotationBoxes(ctx.selectedImage.id, updated);
          }
          
          // 无论是否选中矩形框，都切换当前选中的label
          ctx.setSelectedLabel(newLabel);
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [selectedBox, boxes, ctx.labels]);

  if (!ctx.selectedImage) return null;

  const currentIndex = ctx.allImages.findIndex(i => i.id === ctx.selectedImage.id);
  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + ctx.allImages.length) % ctx.allImages.length;
    ctx.setSelectedImage(ctx.allImages[prevIndex]);
  };
  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % ctx.allImages.length;
    ctx.setSelectedImage(ctx.allImages[nextIndex]);
  };

  // 下载标注图像（带标注框）

    const handleDownloadAnnotatedImage = async () => {

          if (!ctx.selectedImage) {

            console.warn('没有选中的图片');

            return;

          }

    

          // 创建canvas
            const canvas = document.createElement('canvas');
            const canvasCtx = canvas.getContext('2d');

            // 使用代理方式获取图片以避免跨域问题
            const imageUrl = ctx.selectedImage.url;
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            // 创建一个Promise来等待图片加载
            const loadImagePromise = new Promise((resolve, reject) => {
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = imageUrl;
            });

            try {
              await loadImagePromise;
              
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;

              // 绘制原图
              canvasCtx.drawImage(img, 0, 0, canvas.width, canvas.height);

          

            // 绘制标注框

            // 标注框坐标已经基于原始图像尺寸，不需要转换

            boxes.forEach(box => {

              if (!box) return;

              

              const x = box.x;

              const y = box.y;

              const width = box.w;

              const height = box.h;

              

              // 转换颜色为RGBA格式
              const rgbaColor = rgbToRgba(box.color, 0.25); // 25%透明度

              

              // 绘制填充

              canvasCtx.fillStyle = rgbaColor;

              canvasCtx.fillRect(x, y, width, height);

              

              // 绘制边框

              canvasCtx.strokeStyle = box.color;

              canvasCtx.lineWidth = 2;

              canvasCtx.strokeRect(x, y, width, height);

              

              // 绘制标签文字

              if (showLabelText && box.label) {

                canvasCtx.fillStyle = box.color;

                canvasCtx.font = `${Math.max(12, Math.min(16, Math.floor(width / 10)))}px Arial`;

                canvasCtx.fillText(box.label, x, y - 5);

              }

            });

            

            // 转换为blob并下载

            canvas.toBlob((blob) => {

              const url = URL.createObjectURL(blob);

              const link = document.createElement('a');

              link.href = url;

              link.download = `annotated_${ctx.selectedImage.id}.jpg`;

              link.click();

              URL.revokeObjectURL(url);

            }, 'image/jpeg', 0.9);

            

          } catch (error) {

            console.error('下载标注图像失败:', error);

          }

        };

    

        const handleDownloadJSON = async () => {

          if (!ctx.selectedImage) {

            message.warning('没有选中的图片');

            return;

          }

    

          try {

            const annotationData = {

              image_id: ctx.selectedImage.id,

              image_url: ctx.selectedImage.url,

              image_width: imgRef.current?.naturalWidth || 800,

              image_height: imgRef.current?.naturalHeight || 600,

              annotations: boxes.map(box => ({

                id: box.id,

                label: box.label,

                x: box.x,

                y: box.y,

                width: box.w,

                height: box.h,

                color: box.color

              }))

            };

    

            // 转换为JSON并下载

            const jsonStr = JSON.stringify(annotationData, null, 2);

            const blob = new Blob([jsonStr], { type: 'application/json' });

            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');

            link.href = url;

            link.download = `${ctx.selectedImage.id}.json`;

            link.click();

            URL.revokeObjectURL(url);

            

            message.success('JSON标注文件下载成功');

          } catch (error) {

            console.error('下载JSON失败:', error);

            message.error('下载JSON失败');

          }

        };

    

        const handleDownloadYOLO = async () => {

          if (!ctx.selectedImage) {

            message.warning('没有选中的图片');

            return;

          }

    

          try {

            const naturalWidth = imgRef.current?.naturalWidth || 800;

            const naturalHeight = imgRef.current?.naturalHeight || 600;

            

            // 转换为YOLO格式

            const yoloLines = boxes.map(box => {

              const centerX = (box.x + box.w / 2) / naturalWidth;

              const centerY = (box.y + box.h / 2) / naturalHeight;

              const boxWidth = box.w / naturalWidth;

              const boxHeight = box.h / naturalHeight;

              return `0 ${centerX.toFixed(6)} ${centerY.toFixed(6)} ${boxWidth.toFixed(6)} ${boxHeight.toFixed(6)}`;

            });

    

            // 转换为文本并下载

            const yoloContent = yoloLines.join('\n');

            const blob = new Blob([yoloContent], { type: 'text/plain' });

            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');

            link.href = url;

            link.download = `${ctx.selectedImage.id}.txt`;

            link.click();

            URL.revokeObjectURL(url);

            

            message.success('YOLO标签文件下载成功');

          } catch (error) {

            console.error('下载YOLO失败:', error);

            message.error('下载YOLO失败');

          }

        };
  return (
    <div style={{
      position: 'fixed', // 改为 fixed 定位
      top: 64,          // 不覆盖顶部标题栏
      left: 200,        // 避开左侧导航栏（宽度200px）
      right: 0,         // 到最右边
      bottom: 0,        // 到底部
      background: 'rgba(0,0,0,0.3)', // 半透明黑色背景
      backdropFilter: 'blur(10px)',   // 背景虚化
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden' // 禁用滚动
    }}>
      {/* 左上角按钮组：独立悬浮 */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        background: 'rgba(255,255,255,0.7)', // 更高透明度
        backdropFilter: 'blur(15px)',          // 更强虚化效果
        padding: '8px 12px',
        display: showControls ? 'flex' : 'none', // 根据状态显示/隐藏
        alignItems: 'center',
        gap: 8,
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.2)',
        zIndex: 100
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      >
        <Button 
          type="primary" 
          icon={<EditOutlined />} 
          size="small"
          style={{
            background: 'rgba(24,144,255,0.8)',
            borderColor: 'rgba(24,144,255,0.5)',
            backdropFilter: 'blur(8px)'
          }}
        >Draw</Button>
        <Dropdown menu={{
          items: [
            { key: 'yolo', label: 'YOLO 自动标注', onClick: () => console.log('YOLO auto annotation') },
            { key: 'sam', label: 'SAM 自动标注', onClick: () => console.log('SAM auto annotation') }
          ]
        }} trigger={['click']}>
          <Button 
            icon={<SyncOutlined />} 
            size="small"
            style={{
              background: 'rgba(255,255,255,0.6)',
              borderColor: 'rgba(255,255,255,0.3)',
              backdropFilter: 'blur(8px)'
            }}
          >Smart</Button>
        </Dropdown>
        <Button 
          icon={<UndoOutlined />} 
          size="small"
          disabled={historyIndex <= 0}
          onClick={() => {
            if (historyIndex > 0) {
              const prevIndex = historyIndex - 1;
              setHistoryIndex(prevIndex);
              setBoxes(history[prevIndex]);
            }
          }}
          style={{
            background: 'rgba(255,255,255,0.3)',
            borderColor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)'
          }}
        />
        <Button 
          icon={<RedoOutlined />} 
          size="small"
          disabled={historyIndex >= history.length - 1}
          onClick={() => {
            if (historyIndex < history.length - 1) {
              const nextIndex = historyIndex + 1;
              setHistoryIndex(nextIndex);
              setBoxes(history[nextIndex]);
            }
          }}
          style={{
            background: 'rgba(255,255,255,0.3)',
            borderColor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)'
          }}
        />
        <Button 
          icon={<DeleteOutlined />} 
          danger 
          size="small"
          disabled={!selectedBox}
          onClick={() => {
            if (selectedBox) {
              const updated = boxes.filter(b => b.id !== selectedBox.id);
              setBoxes(updated);
              setSelectedBox(null);
              saveAnnotationBoxes(ctx.selectedImage.id, updated);
            }
          }}
          style={{
            background: 'rgba(255,77,79,0.7)',
            borderColor: 'rgba(255,77,79,0.4)',
            backdropFilter: 'blur(8px)'
          }}
        />
        <Dropdown menu={{
          items: [
            { 
              key: 'shortcuts', 
              label: (
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 'bold' }}>键盘快捷键</div>
                  <div>点击：绘制标注框</div>
                  <div>Delete：删除选中标注框</div>
                  <div>1-9：切换标注框label</div>
                  <div>← →：前后切换图片</div>
                </div>
              )
            }
          ]
        }} trigger={['click']}>
          <Button 
            icon={<BookOutlined />} 
            size="small"
            style={{
              background: 'rgba(255,255,255,0.6)',
              borderColor: 'rgba(255,255,255,0.3)',
              backdropFilter: 'blur(8px)'
            }}
          />
        </Dropdown>
      </div>

      {/* 右上角按钮组：独立悬浮 */}
      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        background: 'rgba(255,255,255,0.7)', // 更高透明度
        backdropFilter: 'blur(15px)',          // 更强虚化效果
        padding: '8px 12px',
        display: showControls ? 'flex' : 'none', // 根据状态显示/隐藏
        alignItems: 'center',
        gap: 8,
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.2)',
        zIndex: 100
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      >
        <Dropdown menu={{
          items: [
            {
              key: 'showLabels',
              label: (
                <div style={{ padding: '8px 12px', cursor: 'pointer' }}>
                  显示标注文字
                </div>
              ),
              onClick: () => setShowLabelText(!showLabelText)
            },
            {
              key: 'showBoxes',
              label: (
                <div style={{ padding: '8px 12px', cursor: 'pointer' }}>
                  显示矩形框
                </div>
              ),
              onClick: () => setShowBoxes(!showBoxes)
            }
          ]
        }} trigger={['click']}>
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            style={{
              background: 'rgba(255,255,255,0.6)',
              borderColor: 'rgba(255,255,255,0.3)',
              backdropFilter: 'blur(8px)',
              padding: '4px 12px'
            }}
          />
        </Dropdown>
        <Button 
          icon={showLabels ? <AppstoreOutlined /> : <BarsOutlined />} 
          size="small" 
          onClick={() => setShowLabels(!showLabels)}
          style={{
            background: 'rgba(255,255,255,0.3)',
            borderColor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)'
          }}
        />
        <Dropdown 
          menu={{
            items: [
              {
                key: 'downloadImage',
                label: '下载标注图像',
                onClick: handleDownloadAnnotatedImage
              },
              {
                key: 'downloadJSON',
                label: '下载JSON格式标签',
                onClick: handleDownloadJSON
              },
              {
                key: 'downloadYOLO',
                label: '下载YOLO格式标签',
                onClick: handleDownloadYOLO
              }
            ]
          }}
        >
          <Button 
            icon={<DownloadOutlined />} 
            size="small"
            style={{
              background: 'rgba(255,255,255,0.4)',
              borderColor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(12px)'
            }}
          />
        </Dropdown>
        <Dropdown menu={{
          items: [
            {
              key: 'saveYOLO',
              label: '保存当前图像的YOLO Label',
              onClick: () => {
                const naturalWidth = imgRef.current?.naturalWidth || 800;
                const naturalHeight = imgRef.current?.naturalHeight || 600;
                ctx.saveImageWithLabel(ctx.selectedImage, naturalWidth, naturalHeight);
              }
            },
            {
              key: 'saveAllYOLO',
              label: '保存所有YOLO Labels',
              onClick: () => {
                ctx.saveAllYOLOLabels();
              }
            },
            {
              key: 'loadFromAPI',
              label: '从项目目录加载标注',
              onClick: async () => {
                const datasetDir = `datasets/${ctx.currentDataset}`;
                const loadedBoxes = await ctx.loadAnnotationFromAPI(ctx.selectedImage.id, datasetDir);
                if (loadedBoxes) {
                  setBoxes(loadedBoxes);
                }
              }
            },
            {
              key: 'uploadAnnotation',
              label: '上传JSON标注文件',
              onClick: () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      try {
                        const jsonContent = event.target.result;
                        const loadedBoxes = await ctx.loadAnnotation(ctx.selectedImage, jsonContent);
                        if (loadedBoxes) {
                          setBoxes(loadedBoxes);
                          message.success('标注文件加载成功！');
                        }
                      } catch (error) {
                        message.error('加载标注文件失败：' + error.message);
                      }
                    };
                    reader.readAsText(file);
                  }
                };
                input.click();
              }
            }
          ]
        }} trigger={['click']}>
          <Button 
            icon={<SaveOutlined />} 
            size="small"
            style={{
              background: 'rgba(24,144,255,0.6)',
              borderColor: 'rgba(24,144,255,0.3)',
              backdropFilter: 'blur(12px)'
            }}
          >
            保存
          </Button>
        </Dropdown>
        <Button 
          icon={<CloseOutlined />} 
          size="small" 
          onClick={() => ctx.setSelectedImage(null)}
          style={{
            background: 'rgba(255,77,79,0.7)',
            borderColor: 'rgba(255,77,79,0.4)',
            backdropFilter: 'blur(8px)'
          }}
        />
      </div>

      {/* 图片区域：自适应居中 + 最底层 */}
            <div style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              background: 'transparent',
              padding: '10px'
            }}>
              {!imgLoaded && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 0,
                  textAlign: 'center'
                }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16, color: '#666' }}>加载图片中...</div>
                </div>
              )}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
              }}>
                <img
                  ref={imgRef}
                  src={ctx.selectedImage.url}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: imgLoaded ? 'block' : 'none',
                    zIndex: 1
                  }}
                  onLoad={handleImageLoad}
                  alt="标注图片"
                />
              </div>
      
              {/* SVG 标注层：覆盖在图片上 */}
              {showBoxes && (
              <svg
                ref={svgRef}
                style={{
                  position: 'absolute',
                  pointerEvents: 'auto',
                  top: imgSize.top,
                  left: imgSize.left,
                  width: imgSize.width,
                  height: imgSize.height,
                  zIndex: 2,
                  cursor: 'crosshair'
                }}
                width={imgSize.width}
                height={imgSize.height}
                viewBox={`0 0 ${naturalImageSize.width || 800} ${naturalImageSize.height || 600}`}
                preserveAspectRatio="xMidYMid meet"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >          <rect x="0" y="0" width="100%" height="100%" fill="transparent" />

          {imgLoaded && mouse.x >= 0 && (
            <g style={{ pointerEvents: 'none' }}>
              {/* 鼠标坐标是原始图像坐标，直接显示 */}
              {(() => {
                return (
                  <>
                    <line x1={mouse.x} y1={0} x2={mouse.x} y2={naturalImageSize.height} stroke="white" strokeWidth={1} />
                    <line x1={0} y1={mouse.y} x2={naturalImageSize.width} y2={mouse.y} stroke="white" strokeWidth={1} />
                    <text x={mouse.x + 8} y={mouse.y - 6} fill="white" fontSize="12">{Math.round(mouse.x)},{Math.round(mouse.y)}</text>
                  </>
                );
              })()}
            </g>
          )}

          {imgLoaded && drawing && startPoint && (
            <rect
              x={Math.min(startPoint.x, mouse.x)}
              y={Math.min(startPoint.y, mouse.y)}
              width={Math.abs(mouse.x - startPoint.x)}
              height={Math.abs(mouse.y - startPoint.y)}
              stroke={ctx.selectedLabel?.color || '#1890ff'}
              strokeWidth="2"
              fill={rgbToRgba(ctx.selectedLabel?.color || '#1890ff', 0.4)} // 高透明填充
            />
          )}

          {boxes.map(box => {
            // 如果有visible属性且为false，则不渲染
            if (box.visible === false) return null;
            
            // 标注框坐标是原始图像坐标，直接使用（SVG viewBox已设置为原始图像尺寸）
            return (
            <g key={box.id}>
              <rect
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                stroke={box.color}
                strokeWidth="2"
                fill={rgbToRgba(box.color, 0.4)} // 高透明填充
                style={{ cursor: 'move' }}
                onMouseDown={(e) => handleBoxDown(box, e)}
              />
              {showLabelText && <text x={box.x} y={box.y - 4} fill={box.color} fontSize="14" fontWeight="bold">{box.label}</text>}

              {selectedBox?.id === box.id && (
                <>
                  <rect onMouseDown={(e) => handleHandleDown('lt', box, e)} x={box.x - 4} y={box.y - 4} width="8" height="8" fill="#fff" stroke="#000" />
                  <rect onMouseDown={(e) => handleHandleDown('rt', box, e)} x={box.x + box.w - 4} y={box.y - 4} width="8" height="8" fill="#fff" stroke="#000" />
                  <rect onMouseDown={(e) => handleHandleDown('lb', box, e)} x={box.x - 4} y={box.y + box.h - 4} width="8" height="8" fill="#fff" stroke="#000" />
                  <rect onMouseDown={(e) => handleHandleDown('rb', box, e)} x={box.x + box.w - 4} y={box.y + box.h - 4} width="8" height="8" fill="#fff" stroke="#000" />
                  <rect onMouseDown={(e) => handleHandleDown('t', box, e)} x={box.x + box.w / 2 - 4} y={box.y - 4} width="8" height="8" fill="#fff" stroke="#000" />
                  <rect onMouseDown={(e) => handleHandleDown('b', box, e)} x={box.x + box.w / 2 - 4} y={box.y + box.h - 4} width="8" height="8" fill="#fff" stroke="#000" />
                  <rect onMouseDown={(e) => handleHandleDown('l', box, e)} x={box.x - 4} y={box.y + box.h / 2 - 4} width="8" height="8" fill="#fff" stroke="#000" />
                  <rect onMouseDown={(e) => handleHandleDown('r', box, e)} x={box.x + box.w - 4} y={box.y + box.h / 2 - 4} width="8" height="8" fill="#fff" stroke="#000" />
                </>
              )}
            </g>
            );
          })}
        </svg>
        )}

        {!drawing && (
        <>
        {/* 左下角：上一张按钮 */}
        <Button
          shape="circle"
          icon={<LeftOutlined />}
          style={{
            position: 'absolute',
            left: 16,
            bottom: 16,
            background: 'rgba(255,255,255,0.9)', // 更高透明度
            backdropFilter: 'blur(8px)',          // 虚化效果
            zIndex: 5
          }}
          onClick={handlePrev}
          onMouseDown={(e) => e.stopPropagation()}
        />
        {/* 右下角：下一张按钮 */}
        <Button
          shape="circle"
          icon={<RightOutlined />}
          style={{
            position: 'absolute',
            right: 16,
            bottom: 16,
            background: 'rgba(255,255,255,0.9)', // 更高透明度
            backdropFilter: 'blur(8px)',          // 虚化效果
            zIndex: 5
          }}
          onClick={handleNext}
          onMouseDown={(e) => e.stopPropagation()}
        />
        </>
        )}
      </div>

      {/* 右侧 Label 面板：高透明 + 自适应高度 + 可隐藏 */}
      {showLabels && !drawing && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 56,
          bottom: 'auto', // 自适应高度
          width: 220,
          background: 'rgba(255,255,255,0.5)', // 更高透明度
          backdropFilter: 'blur(12px)', // 更强虚化效果
          padding: '12px',
          borderLeft: '1px solid rgba(232,232,232,0.3)',
          borderRadius: '16px', // 四个顶角圆角
          margin: '8px',
          zIndex: 20,
          maxHeight: 'calc(100vh - 120px)',
          height: 'auto',
          overflowY: 'auto'
        }}>
          <Input.Search 
            placeholder="搜索标签..." 
            style={{ marginBottom: 12 }} 
            size="small"
            allowClear
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
          />
          
          {(ctx.labels || [])
            .filter(lab => searchQuery === '' || lab.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((lab, index) => (
            <div
              key={lab.id}
              style={{
                padding: '8px 6px', // 增加padding
                marginBottom: 4,
                minHeight: '36px', // 增加最小高度
                display: 'flex',
                alignItems: 'center',
                gap: 6, // 增加gap
                background: 'transparent',
                cursor: 'pointer',
                border: ctx.selectedLabel?.id === lab.id ? '2px solid #1890ff' : '2px solid transparent',
                transition: 'all 0.2s',
                position: 'relative',
                borderRadius: 4 // 添加圆角
              }}
              onClick={(e) => {
                // 如果点击的是按钮或输入框，不处理
                if (e.target.tagName === 'BUTTON' || e.target.closest('button') || 
                    e.target.tagName === 'INPUT' || e.target.closest('.ant-input')) {
                  e.stopPropagation();
                  return;
                }
                
                // 阻止事件冒泡
                e.stopPropagation();
                
                // 切换当前选中的label
                ctx.setSelectedLabel(lab);
                
                // 如果有选中的矩形框，也切换矩形框的label
                if (selectedBox) {
                  const updated = boxes.map(b => 
                    b.id === selectedBox.id ? { 
                      ...b, 
                      label: lab.name, 
                      color: lab.color, 
                      labelId: lab.id 
                    } : b
                  );
                  setBoxes(updated);
                  saveAnnotationBoxes(ctx.selectedImage.id, updated);
                }
              }}
              onMouseEnter={(e) => {
                if (ctx.selectedLabel?.id !== lab.id) {
                  e.currentTarget.style.border = '2px solid #d9d9d9';
                  e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; // 添加悬停背景
                }
              }}
              onMouseLeave={(e) => {
                if (ctx.selectedLabel?.id !== lab.id) {
                  e.currentTarget.style.border = '2px solid transparent';
                  e.currentTarget.style.background = 'transparent'; // 移除悬停背景
                }
              }}
            >
              {/* 圆形颜色按钮 */}
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: lab.color,
                  border: '1px solid #ddd',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  flexShrink: 0
                }}
                onClick={(e) => handleColorButtonClick(e, lab.id)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
              
              {/* Label名称 - 可编辑 */}
              {editingLabelId === lab.id ? (
                <Input
                  autoFocus
                  size="small"
                  value={editingLabelName}
                  onChange={(e) => setEditingLabelName(e.target.value)}
                  onBlur={() => {
                    if (editingLabelName.trim()) {
                      // 更新label名称
                      const updatedLabels = ctx.labels.map(l =>
                        l.id === lab.id ? { ...l, name: editingLabelName.trim() } : l
                      );
                      ctx.setLabels(updatedLabels);
                      
                      // 更新所有相关矩形框的label名称
                      const updatedBoxes = boxes.map(box =>
                        box.labelId === lab.id ? { ...box, label: editingLabelName.trim() } : box
                      );
                      setBoxes(updatedBoxes);
                      saveAnnotationBoxes(ctx.selectedImage.id, updatedBoxes);
                    }
                    setEditingLabelId(null);
                    setEditingLabelName('');
                  }}
                  onPressEnter={() => {
                    if (editingLabelName.trim()) {
                      // 更新label名称
                      const updatedLabels = ctx.labels.map(l =>
                        l.id === lab.id ? { ...l, name: editingLabelName.trim() } : l
                      );
                      ctx.setLabels(updatedLabels);
                      
                      // 更新所有相关矩形框的label名称
                      const updatedBoxes = boxes.map(box =>
                        box.labelId === lab.id ? { ...box, label: editingLabelName.trim() } : box
                      );
                      setBoxes(updatedBoxes);
                      saveAnnotationBoxes(ctx.selectedImage.id, updatedBoxes);
                    }
                    setEditingLabelId(null);
                    setEditingLabelName('');
                  }}
                  style={{ flex: 1, fontSize: '12px', fontWeight: 500 }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span 
                  style={{ 
                    flex: 1, 
                    fontSize: '12px', 
                    fontWeight: 500, 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    cursor: 'text'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {lab.name}
                </span>
              )}
              
              {/* 操作按钮组 - 紧密连接靠右 */}
              <div 
                style={{
                  display: 'flex',
                  gap: 0,
                  opacity: 0,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
              >
                <Tooltip title="显示/隐藏该类别标注框">
                  <Button
                    size="small"
                    type="text"
                    icon={<EyeOutlined />}
                    style={{ width: '24px', height: '24px', padding: 0, borderRadius: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // 切换该类别的显示状态
                      const updatedBoxes = boxes.map(box => {
                        if (box.labelId === lab.id) {
                          // 切换visible状态：undefined/true -> false, false -> true
                          // 这样可以保留之前的显示/隐藏状态
                          const currentVisible = box.visible;
                          const newVisible = currentVisible === false ? true : false;
                          return { ...box, visible: newVisible };
                        }
                        return box;
                      });
                      setBoxes(updatedBoxes);
                    }}
                  />
                </Tooltip>
                <Tooltip title="修改标签名称">
                  <Button
                    size="small"
                    type="text"
                    icon={<EditOutlined />}
                    style={{ width: '24px', height: '24px', padding: 0, borderRadius: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // 开始编辑
                      setEditingLabelId(lab.id);
                      setEditingLabelName(lab.name);
                    }}
                  />
                </Tooltip>
                <Tooltip title="删除该标签">
                  <Button
                    size="small"
                    type="text"
                    icon={<CloseOutlined />}
                    style={{ width: '24px', height: '24px', padding: 0, borderRadius: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // 删除该标签
                      const updatedLabels = ctx.labels.filter(l => l.id !== lab.id);
                      ctx.setLabels(updatedLabels);
                      // 删除该标签关联的所有标注框
                      const updatedBoxes = boxes.filter(box => box.labelId !== lab.id);
                      setBoxes(updatedBoxes);
                    }}
                  />
                </Tooltip>
              </div>
              
              <Tag 
                size="small" 
                style={{ 
                  minWidth: '24px', 
                  textAlign: 'center',
                  background: '#f0f0f0',
                  color: '#666',
                  border: 'none',
                  fontWeight: 500,
                  padding: '0 6px',
                  height: '20px',
                  lineHeight: '20px',
                  fontSize: '12px'
                }}
              >
                {index + 1}
              </Tag>
            </div>
          ))}
          {/* 颜色选择器弹窗 */}
          <Modal
            title={null}
            open={colorPickerVisible}
            onCancel={() => {
              setColorPickerVisible(false);
              setColorPickerLabelId(null);
            }}
            footer={null}
            width={320}
            closable={false}
            style={{ top: '20%' }}
          >
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <Button
                  block
                  onClick={handleGenerateRandomColor}
                  style={{
                    height: '48px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  🎲 生成随机颜色
                </Button>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  padding: '8px',
                  background: '#f5f5f5',
                  borderRadius: '8px'
                }}>
                  <Input
                    type="color"
                    value={ctx.labels.find(l => l.id === colorPickerLabelId)?.color || '#0052FF'}
                    onChange={(e) => handleColorSelect(e.target.value)}
                    style={{ width: '60px', height: '40px', border: 'none', padding: 0 }}
                  />
                  <span style={{ flex: 1, textAlign: 'center', fontSize: '14px', color: '#666' }}>
                    点击色块选择颜色
                  </span>
                </div>
              </div>
              <div style={{ marginBottom: '12px', fontSize: '13px', color: '#999', fontWeight: 500 }}>
                常用颜色
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#FF7675', '#74B9FF', '#55EFC4', '#A29BFE', '#FAB1A0'].map(color => (
                  <div
                    key={color}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: '8px',
                      backgroundColor: color,
                      cursor: 'pointer',
                      border: '2px solid transparent',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => handleColorSelect(color)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.borderColor = '#1890ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  />
                ))}
              </div>
            </div>
          </Modal>


          {/* 新增标签 */}
          <div style={{
            marginTop: 12,
            padding: '8px',
            borderRadius: 6,
            background: 'rgba(245,245,245,0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: '#1890ff',
                border: '1px solid #ddd'
              }}
            />
            <Input
              style={{ flex: 1 }}
              size="small"
              placeholder="New label"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              onPressEnter={() => {
                if (newLabelName.trim()) {
                  // 使用随机颜色
                  const randomColor = generateRandomColor();
                  ctx.addLabel(newLabelName.trim(), randomColor);
                  setNewLabelName('');
                }
              }}
            />
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (newLabelName.trim()) {
                  // 使用随机颜色
                  const randomColor = generateRandomColor();
                  ctx.addLabel(newLabelName.trim(), randomColor);
                  setNewLabelName('');
                }
              }}
            />
          </div>
        </div>
      )}
    </div>

  );


};

// ====================== 图片列表（布局严格按要求）======================

export default AnnotationView;
