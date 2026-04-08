// import React, { useState, useContext } from 'react';
import React, { useState, useContext, useEffect, useRef } from 'react';
import { Card, Row, Col, Button, Upload, Dropdown, Tag, Image, Empty, message, Badge, App, Table, Checkbox, Input, Select, Modal } from 'antd';
import { EyeOutlined, AppstoreOutlined, BarsOutlined, DownloadOutlined, DeleteOutlined, UploadOutlined, AppstoreAddOutlined, BorderOutlined } from '@ant-design/icons';
import { useDatasetContext, DatasetContext } from '../../context/DatasetContext';

// 用于跟踪正在上传的文件，防止重复上传
const processingFiles = new Set();

// 用于跟踪上传批次，确保一次上传只显示一次成功消息
let currentBatchImages = [];

// 用于跟踪实际添加的图片数量（去重后）
let currentBatchAddedCount = 0;

// 用于跟踪跳过的重复图片数量
let currentBatchSkippedCount = 0;

// 用于跟踪已处理的压缩文件，防止重复解压
const processedArchives = new Set();

// 用于跟踪当前上传会话的所有文件，使用完整的唯一标识
let currentSessionImages = new Map(); // key: imageId, value: imageObject

// 递归扫描目录
const scanDirectory = async (directoryEntry, files) => {
  const reader = directoryEntry.createReader();
  
  // 持续读取直到没有更多条目
  let entries = [];
  let batchCount = 0;
  while (true) {
    const batch = await new Promise((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    if (batch.length === 0) {
      break; // 没有更多条目，退出循环
    }
    entries = entries.concat(batch);
    batchCount++;
  }
  
  console.log(`[扫描目录] 总共读取 ${entries.length} 个条目，分 ${batchCount} 批次`);

  // 处理所有条目
  for (const entry of entries) {
    if (entry.isFile) {
      const file = await new Promise((resolve, reject) => {
        entry.file(resolve, reject);
      });
      files.push(file);
      console.log(`[扫描目录] 添加文件: ${file.name}, size: ${file.size}`);
    } else if (entry.isDirectory) {
      console.log(`[扫描目录] 找到子目录: ${entry.name}，开始递归扫描`);
      await scanDirectory(entry, files);
    }
  }
};

const ImagesSection = () => {
  const ctx = useContext(DatasetContext);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [isDraggingDirectory, setIsDraggingDirectory] = useState(false);
  const [isProcessingDirectory, setIsProcessingDirectory] = useState(false);
  const [imgLoaded, setImgLoaded] = useState({});
  const { message: appMessage } = App.useApp();

  // 新增状态
  const [viewMode, setViewMode] = useState('grid'); // grid, compact, table
  const [gridColumns, setGridColumns] = useState(6); // 动态列数
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showClassLabels, setShowClassLabels] = useState(true);
  const [showAllInfo, setShowAllInfo] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, annotated, unannotated
  const [sortBy, setSortBy] = useState('created'); // created, name, size
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  
  // 用于存储每个图像卡片的容器尺寸信息
  const [cardDimensions, setCardDimensions] = useState({});
  const containerRef = useRef(null);

  // 处理单个文件上传
  const processFile = async (file) => {
    const fileKey = `${file.name}_${file.size}_${file.lastModified}`;
    console.log(`[processFile] 处理文件: ${file.name}, size: ${file.size}`);

    // 如果文件已经在处理中，直接跳过
    if (processingFiles.has(fileKey)) {
      console.log(`[processFile] 文件已在处理中，跳过: ${file.name}`);
      return;
    }

    // 将当前文件添加到处理集合
    processingFiles.add(fileKey);
    console.log(`[processFile] 添加到处理集合: ${fileKey}`);

    // 检查是否是图片文件
    const fileName = file.name.toLowerCase();
    if (!fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
      console.log('[processFile] 跳过非图片文件:', fileName);
      processingFiles.delete(fileKey);
      return;
    }

    console.log(`[processFile] 文件是图片，准备上传: ${file.name}`);

    // 检查文件大小（只检查过大文件，不检查0字节文件）
    if (file.size > 50 * 1024 * 1024) {
      console.warn(`跳过大文件: ${file.name} (超过50MB)`);
      processingFiles.delete(fileKey);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');
      formData.append('dataset_id', ctx.currentDataset);

      const response = await fetch('http://localhost:8000/api/upload/file', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`上传失败: ${file.name} - ${data.detail || '服务器错误'}`);
        return;
      }

      if (data.success) {
        const imageId = `${data.filename}_${data.path}`;
        if (!currentSessionImages.has(imageId)) {
          const existingFilenames = new Set(ctx.allImages.map(img => img.filename));
          if (!existingFilenames.has(data.filename)) {
            currentSessionImages.set(imageId, {
              name: data.filename,
              path: data.path,
              fullPath: `http://localhost:8000${data.path}`
            });
            currentBatchImages.push({
              name: data.filename,
              path: data.path,
              fullPath: `http://localhost:8000${data.path}`
            });
            currentBatchAddedCount++;
            console.log(`[processFile] 成功添加图片: ${data.filename}`);
          } else {
            currentBatchSkippedCount++;
            console.log(`[processFile] 跳过重复图片: ${data.filename}`);
          }
        }
      }
    } catch (error) {
      console.error(`上传失败: ${file.name} - ${error.message}`);
    } finally {
      processingFiles.delete(fileKey);
      console.log(`[processFile] 从处理集合中移除: ${fileKey}`);
    }
  };

  // 辅助函数：将RGB颜色转换为RGBA（带透明度）
  const rgbToRgba = (rgbColor, alpha) => {
    if (!rgbColor) return `rgba(128, 128, 128, ${alpha})`;
    
    if (rgbColor.startsWith('#')) {
      // 十六进制颜色
      const hex = rgbColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } else if (rgbColor.startsWith('rgb(')) {
      // RGB颜色
      const match = rgbColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }
    // 默认返回灰色
    return `rgba(128, 128, 128, ${alpha})`;
  };

  // 计算objectFit为contain时的实际显示区域
  const calculateContainArea = (imgNaturalWidth, imgNaturalHeight, containerWidth, containerHeight) => {
    const containerRatio = containerWidth / containerHeight;
    const imageRatio = imgNaturalWidth / imgNaturalHeight;

    let actualWidth, actualHeight, offsetX, offsetY;
    
    if (imageRatio > containerRatio) {
      // 图像更宽，以宽度为准
      actualWidth = containerWidth;
      actualHeight = containerWidth / imageRatio;
      offsetX = 0;
      offsetY = (containerHeight - actualHeight) / 2;
    } else {
      // 图像更高，以高度为准
      actualHeight = containerHeight;
      actualWidth = containerHeight * imageRatio;
      offsetX = (containerWidth - actualWidth) / 2;
      offsetY = 0;
    }
    
    return { actualWidth, actualHeight, offsetX, offsetY };
  };

// 计算objectFit为cover时的实际显示区域
  const calculateCoverArea = (imgNaturalWidth, imgNaturalHeight, containerWidth, containerHeight) => {
    const containerRatio = containerWidth / containerHeight;
    const imageRatio = imgNaturalWidth / imgNaturalHeight;

    let actualWidth, actualHeight, offsetX, offsetY;
    
    if (imageRatio > containerRatio) {
      // 图像更宽，以高度为准
      actualHeight = containerHeight;
      actualWidth = containerHeight * imageRatio;
      offsetX = (containerWidth - actualWidth) / 2;
      offsetY = 0;
    } else {
      // 图像更高，以宽度为准
      actualWidth = containerWidth;
      actualHeight = containerWidth / imageRatio;
      offsetX = 0;
      offsetY = (containerHeight - actualHeight) / 2;
    }
    
    return { actualWidth, actualHeight, offsetX, offsetY };
  };



  const filtered = ctx.currentSplit === 'all'
    ? ctx.allImages
    : ctx.allImages.filter(i => i.split === ctx.currentSplit);

  // 根据过滤类型进一步过滤
  const displayImages = filtered.filter(img => {
    // 搜索过滤
    if (searchText && !img.filename.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }

    // 标注状态过滤
    if (filterType === 'annotated' && !img.labeled) {
      return false;
    }
    if (filterType === 'unannotated' && img.labeled) {
      return false;
    }

    return true;
  });

  // 排序
  const sortedImages = [...displayImages].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'created':
        comparison = (a.uploadedAt || 0) - (b.uploadedAt || 0);
        break;
      case 'name':
        comparison = (a.filename || '').localeCompare(b.filename || '');
        break;
      case 'size':
        comparison = 0; // 需要添加文件大小信息
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // 分页
  const totalPages = Math.ceil(sortedImages.length / rowsPerPage);
  const paginatedImages = sortedImages.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // 表格视图数据
  const tableData = paginatedImages.map(img => ({
    key: img.id,
    preview: img.url,
    filename: img.filename,
    height: img.height || '-',
    width: img.width || '-',
    size: img.size ? `${(img.size / 1024).toFixed(2)} KB` : '-',
    split: img.split,
    annotations: img.boxes?.length || 0,
    classes: img.boxes?.length > 0 ? [...new Set(img.boxes.map(b => b.label))].join(', ') : '-'
  }));

  // 下载图片
  const handleDownloadImage = async (img) => {
    const imageUrl = img.url || `https://picsum.photos/seed/bottle-${img.id}/800/600`;

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `image_${img.id}.jpg`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error('Download failed:', error);
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `image_${img.id}.jpg`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    }
  };

  // 处理选中
  const handleSelectImage = (imgId) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imgId)) {
      newSelected.delete(imgId);
    } else {
      newSelected.add(imgId);
    }
    setSelectedImages(newSelected);
  };

  // 清除选中
  const handleClearSelection = async () => {
    if (selectedImages.size === 0) return;
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedImages.size} 张图片吗？`,
      onOk: async () => {
        // 前端删除
        ctx.setAllImages(prev => prev.filter(img => !selectedImages.has(img.id)));
        
        // 后端删除
        try {
          await fetch('http://localhost:8000/api/dataset/images', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_ids: Array.from(selectedImages) })
          });
          appMessage.success(`成功删除 ${selectedImages.size} 张图片`);
        } catch (error) {
          console.error('删除失败:', error);
        }
        
        setSelectedImages(new Set());
      }
    });
  };

  // 图片右键菜单项
  const imageContextMenuItems = [
    {
      key: 'download',
      label: '下载图片',
      onClick: () => {
        const img = ctx.allImages.find(i => i.id === ctxMenu.id);
        if (img) handleDownloadImage(img);
      }
    },
    {
      key: 'move',
      label: '移动到数据集',
      children: [
        { key: 'train', label: 'Train', onClick: () => ctx.moveImageToSplit(ctxMenu.id, 'train') },
        { key: 'val', label: 'Val', onClick: () => ctx.moveImageToSplit(ctxMenu.id, 'val') },
        { key: 'test', label: 'Test', onClick: () => ctx.moveImageToSplit(ctxMenu.id, 'test') },
      ]
    },
    {
      key: 'delete',
      label: '删除图片',
      danger: true,
      onClick: () => ctx.deleteImage(ctxMenu.id)
    },
  ];

  const handleImageLoad = (imgId, imgElement) => {
    setImgLoaded(prev => ({ 
      ...prev, 
      [imgId]: {
        loaded: true,
        naturalWidth: imgElement.naturalWidth,
        naturalHeight: imgElement.naturalHeight
      }
    }));
    
    // 图像加载完成后更新卡片尺寸，使用多次延迟确保稳定性
    const cardEl = cardRefs.current[imgId];
    if (cardEl) {
      const updateWithDelay = (delay) => {
        setTimeout(() => {
          updateCardDimensions(imgId, cardEl);
        }, delay);
      };
      
      updateWithDelay(0);
      updateWithDelay(50);
      updateWithDelay(100);
    }
  };

  // 更新卡片尺寸的函数
  const updateCardDimensions = (imgId, cardElement) => {
    if (!cardElement) return;
    
    const imageContainer = cardElement.querySelector('div[style*="position: relative"]');
    if (!imageContainer) return;
    
    const newWidth = imageContainer.offsetWidth;
    const newHeight = imageContainer.offsetHeight;
    
    // 降低尺寸更新的门槛，避免微小变化被忽略
    if (newWidth > 10 && newHeight > 10) {
      setCardDimensions(prev => {
        const current = prev[imgId];
        // 放宽尺寸变化的判断条件，允许更小的变化也触发更新
        if (current && 
            Math.abs(current.width - newWidth) < 2 && 
            Math.abs(current.height - newHeight) < 2) {
          return prev; // 变化很小，不更新
        }
        
        // 尺寸变化了，更新状态
        return {
          ...prev,
          [imgId]: {
            width: newWidth,
            height: newHeight
          }
        };
      });
    }
  };

  // 使用ResizeObserver监听容器尺寸变化
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      // 立即更新，不使用requestAnimationFrame以提高响应速度
      entries.forEach(entry => {
        const cardElement = entry.target.closest('[data-img-id]');
        if (cardElement) {
          const imgId = cardElement.getAttribute('data-img-id');
          if (imgId) {
            updateCardDimensions(imgId, cardElement);
          }
        }
      });
    }, {
      // 优化ResizeObserver配置，减少延迟
      box: 'content-box',
      // 使用较低的阈值，更敏感地检测变化
      threshold: 0.01
    });

    // 监听所有已渲染的图像卡片
    const observeCards = () => {
      const cards = document.querySelectorAll('[data-img-id]');
      const observedContainers = new Set();
      
      cards.forEach(card => {
        const imgId = card.getAttribute('data-img-id');
        if (imgId) {
          // 初始化尺寸
          updateCardDimensions(imgId, card);
          
          // 观察图像容器
          const imageContainer = card.querySelector('div[style*="position: relative"]');
          if (imageContainer) {
            const containerKey = `${imgId}-container`;
            // 避免重复观察
            if (!observedContainers.has(containerKey)) {
              observer.observe(imageContainer);
              observedContainers.add(containerKey);
            }
          }
        }
      });
    };

    // 初始观察
    observeCards();

    // 减少延迟时间，更快地响应DOM变化
    const timeout1 = setTimeout(observeCards, 50);
    const timeout2 = setTimeout(observeCards, 200);

    return () => {
      observer.disconnect();
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, []); // 只在组件挂载时设置一次，避免重新设置导致的闪烁

  const cardRefs = useRef({});

  // 响应式计算最佳列数
  useEffect(() => {
    let isCalculating = false;
    
    const calculateColumns = () => {
      if (isCalculating || !containerRef.current) return;
      
      isCalculating = true;
      
      const containerWidth = containerRef.current.offsetWidth;
      setContainerWidth(containerWidth);
      
      // 根据视图模式计算列数
      if (viewMode === 'table') {
        setGridColumns(1);
        isCalculating = false;
        return;
      }
      
      // 计算可用宽度（减去padding）
      const availableWidth = containerWidth - 48; // 24px padding on each side
      
      let newColumns = gridColumns;
      
      // grid模式：最小宽度150px，最大宽度300px
      if (viewMode === 'grid') {
        const minCardWidth = 150;
        const maxCardWidth = 300;
        
        // 计算最大可能的列数
        const maxColumns = Math.floor(availableWidth / minCardWidth);
        
        // 确保至少显示2列，最多显示8列
        newColumns = Math.max(2, Math.min(8, maxColumns));
      }
      
      // compact模式：最小宽度150px，最大宽度200px（与grid统一）
      if (viewMode === 'compact') {
        const minCardWidth = 150;
        const maxCardWidth = 200;
        
        // 计算最大可能的列数
        const maxColumns = Math.floor(availableWidth / minCardWidth);
        
        // 确保至少显示2列，最多显示12列
        newColumns = Math.max(2, Math.min(12, maxColumns));
      }
      
      // 只有当列数真正变化时才更新
      if (newColumns !== gridColumns) {
        setGridColumns(newColumns);
      }
      
      isCalculating = false;
    };
    
    // 移除防抖，立即响应
    const handleResize = () => {
      requestAnimationFrame(calculateColumns);
    };
    
    // 初始计算
    calculateColumns();
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    
    // 使用ResizeObserver监听容器尺寸变化
    const resizeObserver = new ResizeObserver(handleResize);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [viewMode, gridColumns]);

  return (
    <div ref={containerRef} style={{ 
      padding: '0 24px 24px',
      minWidth: '364px', // 统一最小宽度：150*2 + 16*1 + 24*2 = 364px
      overflowX: 'auto'
    }}>
      {/* 顶部工具栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, background: '#fff', padding: '8px 12px', borderRadius: 8, border: '1px solid #e8e8e8' }}>
        {/* 显示选项 */}
        <Dropdown
          menu={{
            items: [
              { 
                key: 'annotations', 
                label: (
                  <span>
                    {showAnnotations && <span style={{ color: '#1890ff', marginRight: 8 }}>✓</span>}
                    Annotations
                  </span>
                ) 
              },
              { 
                key: 'classLabels', 
                label: (
                  <span>
                    {showClassLabels && <span style={{ color: '#1890ff', marginRight: 8 }}>✓</span>}
                    Class labels
                  </span>
                ) 
              },
              { 
                key: 'showAll', 
                label: (
                  <span>
                    {showAllInfo && <span style={{ color: '#1890ff', marginRight: 8 }}>✓</span>}
                    Show all
                  </span>
                ) 
              }
            ],
            onClick: ({ key }) => {
              switch (key) {
                case 'annotations':
                  setShowAnnotations(!showAnnotations);
                  break;
                case 'classLabels':
                  setShowClassLabels(!showClassLabels);
                  break;
                case 'showAll':
                  if (showAllInfo) {
                    // 如果当前是显示所有，则隐藏所有
                    setShowAnnotations(false);
                    setShowClassLabels(false);
                    setShowAllInfo(false);
                  } else {
                    // 如果当前不是显示所有，则显示所有
                    setShowAnnotations(true);
                    setShowClassLabels(true);
                    setShowAllInfo(true);
                  }
                  break;
              }
            }
          }}
        >
          <Button icon={<EyeOutlined />} size="small" type="text" />
        </Dropdown>

        {/* 过滤选项 - 合并 Created */}
        <Dropdown
          menu={{
            items: [
              { key: 'all', label: `All images ${filterType === 'all' ? '✓' : ''}` },
              { key: 'annotated', label: `Annotated ${filterType === 'annotated' ? '✓' : ''}` },
              { key: 'unannotated', label: `Unannotated ${filterType === 'unannotated' ? '✓' : ''}` },
              { type: 'divider' },
              { key: 'created', label: `Created ${sortBy === 'created' ? '✓' : ''}` },
              { key: 'name', label: `Name ${sortBy === 'name' ? '✓' : ''}` },
              { key: 'size', label: `Size ${sortBy === 'size' ? '✓' : ''}` }
            ],
            onClick: ({ key }) => {
              if (['all', 'annotated', 'unannotated'].includes(key)) {
                setFilterType(key);
              } else if (['created', 'name', 'size'].includes(key)) {
                setSortBy(key);
              }
            }
          }}
        >
          <Button size="small" type="text">
            {filterType === 'all' ? 'All' : filterType === 'annotated' ? 'Annotated' : 'Unannotated'} · {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)} ↓
          </Button>
        </Dropdown>

        {/* 视图模式按钮 */}
        <Button
          icon={<AppstoreOutlined />}
          size="small"
          type={viewMode === 'grid' ? 'primary' : 'text'}
          onClick={() => {
            setViewMode('grid');
          }}
        />
        <Button
          icon={<BorderOutlined />}
          size="small"
          type={viewMode === 'compact' ? 'primary' : 'text'}
          onClick={() => {
            setViewMode('compact');
          }}
        />
        <Button
          icon={<BarsOutlined />}
          size="small"
          type={viewMode === 'table' ? 'primary' : 'text'}
          onClick={() => setViewMode('table')}
        />

        <div style={{ flex: 1 }} />

        {/* Clear按钮（选中时显示） */}
        {selectedImages.size > 0 && (
          <Button
            danger
            size="small"
            onClick={handleClearSelection}
          >
            Clear ({selectedImages.size})
          </Button>
        )}

        <Button type={ctx.currentSplit === 'all' ? 'primary' : 'default'} onClick={() => ctx.setCurrentSplit('all')} size="small">All <Tag>{ctx.totalImages}</Tag></Button>
        <Button type={ctx.currentSplit === 'train' ? 'primary' : 'default'} onClick={() => ctx.setCurrentSplit('train')} size="small">Train <Tag>{ctx.allImages.filter(i => i.split === 'train').length}</Tag></Button>
        <Button type={ctx.currentSplit === 'val' ? 'primary' : 'default'} onClick={() => ctx.setCurrentSplit('val')} size="small">Val <Tag>{ctx.allImages.filter(i => i.split === 'val').length}</Tag></Button>
        <Button type={ctx.currentSplit === 'test' ? 'primary' : 'default'} onClick={() => ctx.setCurrentSplit('test')} size="small">Test <Tag>{ctx.allImages.filter(i => i.split === 'test').length}</Tag></Button>
      </div>

      {/* 图片网格布局 - 只在非表格视图时显示 */}
      {viewMode !== 'table' && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${gridColumns}, minmax(150px, 1fr))`, 
              gap: 16,
              width: '100%'
            }}>
              {displayImages.map(img => (          <Card
            key={img.id}
            ref={(el) => {
              if (el) {
                cardRefs.current[img.id] = el;
                // 使用requestAnimationFrame确保在渲染后更新尺寸
                requestAnimationFrame(() => {
                  updateCardDimensions(img.id, el);
                });
                // 额外的延迟更新，确保所有布局都完成
                setTimeout(() => {
                  updateCardDimensions(img.id, el);
                }, 50);
              }
            }}
            className="image-card"
            data-img-id={img.id}
            styles={{ body: { padding: 8 } }}
            hoverable
            onClick={() => ctx.setSelectedImage(img)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCtxMenu({ id: img.id, x: e.clientX, y: e.clientY });
            }}
            style={{ 
              position: 'relative', 
              cursor: 'pointer',
              minWidth: '150px', // 统一最小宽度
              maxWidth: viewMode === 'grid' ? '300px' : '200px',
              width: '100%'
            }}
          >
            <div 
              style={{ 
                position: 'relative', 
                width: '100%',
                // 使用固定高度，避免图像被拉伸
                height: '120px',
                minHeight: '120px',
                backgroundColor: '#f5f5f5'
              }}
            >
              <img
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
                src={img.url || `https://picsum.photos/seed/bottle-${img.id}/400/300`}
                onLoad={(e) => handleImageLoad(img.id, e.target)}
                loading="eager"
                alt={img.filename || `image-${img.id}`}
              />
              <Badge status={img.split === 'train' ? 'success' : 'processing'} style={{ position: 'absolute', top: 8, right: 8 }} />

              {/* 悬停时显示的下载和删除按钮 */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  gap: 4,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: 4,
                  padding: 4,
                  zIndex: 10,
                  display: 'none'
                }}
                className="hover-actions"
              >
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleDownloadImage(img);
                  }}
                  style={{ padding: '2px 4px' }}
                />
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    ctx.deleteImage(img.id);
                  }}
                  style={{ padding: '2px 4px' }}
                />
              </div>

              {/* 标注框预览 */}
              {showAnnotations && imgLoaded[img.id] && img.boxes && img.boxes.length > 0 && (() => {
                const imgInfo = imgLoaded[img.id];
                const dimensions = cardDimensions[img.id];
                
                if (!imgInfo || !dimensions) return null;
                
                const { naturalWidth, naturalHeight } = imgInfo;
                const imgWidth = naturalWidth || 800;
                const imgHeight = naturalHeight || 600;
                
                const { width: containerWidth, height: containerHeight } = dimensions;
                
                // 使用objectFit: contain计算
                const { actualWidth: displayWidth, actualHeight: displayHeight, offsetX, offsetY } = 
                  calculateContainArea(imgWidth, imgHeight, containerWidth, containerHeight);
                
                // 计算缩放因子
                const scaleFactor = displayWidth / imgWidth;
                
                return (
                <svg style={{ 
                  position: 'absolute', 
                  top: offsetY,
                  left: offsetX,
                  width: displayWidth,
                  height: displayHeight,
                  pointerEvents: 'none',
                  zIndex: 5,
                  overflow: 'visible'
                }}
                width={displayWidth}
                height={displayHeight}
                viewBox={`0 0 ${imgWidth} ${imgHeight}`}
                preserveAspectRatio="xMidYMid meet"
                >
                  {img.boxes.map(box => {
                    // 确保矩形框的宽度和高度都是正数
                    const rectX = Math.min(box.x, box.x + box.w);
                    const rectY = Math.min(box.y, box.y + box.h);
                    const rectW = Math.abs(box.w);
                    const rectH = Math.abs(box.h);
                    
                    // 如果矩形框太小，跳过
                    if (rectW < 1 || rectH < 1) return null;
                    
                    return (
                      <g key={box.id}>
                        <rect
                          x={rectX}
                          y={rectY}
                          width={rectW}
                          height={rectH}
                          stroke={box.color}
                          strokeWidth={Math.max(2, 2 / scaleFactor)}
                          fill={rgbToRgba(box.color, 0.25)}
                        />
                        {showClassLabels && box.label && (
                          <text
                            x={rectX}
                            y={rectY - 4 / scaleFactor}
                            fill={box.color}
                            fontSize={Math.max(10, 14 / scaleFactor)}
                            fontWeight="bold"
                            style={{
                              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                              pointerEvents: 'none'
                            }}
                          >
                            {box.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              );
              })()}
            </div>
          </Card>
        ))}
      </div>
      )}
      
      {/* 右键菜单 */}
      {ctxMenu && (
        <Dropdown
          trigger={['click']}
          open={!!ctxMenu}
          onOpenChange={(v) => !v && setCtxMenu(null)}
          menu={{ items: imageContextMenuItems }}
        >
          <div
            style={{
              position: 'fixed',
              left: ctxMenu.x,
              top: ctxMenu.y,
              width: 1,
              height: 1,
              pointerEvents: 'none'
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          />
        </Dropdown>
      )}

      {/* 表格视图 */}
      {viewMode === 'table' && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Input
                placeholder="搜索文件名"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
              />
              <Button
                onClick={() => setSearchText('')}
                disabled={!searchText}
              >
                清除
              </Button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Rows per page:</span>
              <Select
                value={rowsPerPage}
                onChange={setRowsPerPage}
                style={{ width: 100 }}
              >
                <Select.Option value={20}>20</Select.Option>
                <Select.Option value={50}>50</Select.Option>
                <Select.Option value={100}>100</Select.Option>
                <Select.Option value={200}>200</Select.Option>
                <Select.Option value={500}>500</Select.Option>
              </Select>
            </div>
          </div>

          <Table
            dataSource={tableData}
            rowSelection={{
              selectedRowKeys: Array.from(selectedImages),
              onChange: (selectedKeys) => setSelectedImages(new Set(selectedKeys)),
              type: 'checkbox'
            }}
            columns={[
              {
                title: 'Preview',
                dataIndex: 'preview',
                width: 100,
                render: (url) => (
                  <Image
                    src={url}
                    style={{ width: 60, height: 60, objectFit: 'cover' }}
                    preview={false}
                  />
                )
              },
              {
                title: 'Filename',
                dataIndex: 'filename',
                key: 'filename',
                sorter: true
              },
              {
                title: 'Height',
                dataIndex: 'height',
                key: 'height',
                width: 80
              },
              {
                title: 'Width',
                dataIndex: 'width',
                key: 'width',
                width: 80
              },
              {
                title: 'Size',
                dataIndex: 'size',
                key: 'size',
                width: 100
              },
              {
                title: 'Split',
                dataIndex: 'split',
                key: 'split',
                width: 80,
                render: (split) => <Tag color={split === 'train' ? 'success' : split === 'val' ? 'processing' : 'warning'}>{split}</Tag>
              },
              {
                title: 'Annotations',
                dataIndex: 'annotations',
                key: 'annotations',
                width: 100,
                render: (count) => <Badge count={count} showZero />
              },
              {
                title: 'Classes',
                dataIndex: 'classes',
                key: 'classes',
                ellipsis: true
              }
            ]}
            pagination={false}
            size="small"
          />

          {/* 分页控件 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <div>
              Page {currentPage} of {totalPages}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 上传区域 */}
      <div style={{ marginTop: 24, border: '4px dashed #e5e7eb', borderRadius: 12, padding: '40px 24px', textAlign: 'center', color: '#666', background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)', transition: 'all 0.3s ease', cursor: 'pointer' }} className="upload-container">
        <Upload.Dragger
          name="file"
          multiple
          showUploadList={false}
          onDrop={async (e) => {
            // 检测是否拖拽了目录
            const items = e.dataTransfer.items;
            if (items && items.length > 0) {
              const item = items[0].webkitGetAsEntry();
              if (item && item.isDirectory) {
                console.log('[上传] 检测到目录拖拽，开始扫描目录');
                setIsDraggingDirectory(true);
                setIsProcessingDirectory(true);

                // 阻止默认的beforeUpload处理
                e.preventDefault();
                e.stopPropagation();

                // 重置批次计数器
                currentBatchImages = [];
                currentBatchAddedCount = 0;
                currentBatchSkippedCount = 0;

                // 手动扫描目录
                const files = [];
                await scanDirectory(item, files);

                console.log(`[上传] 目录扫描完成，找到 ${files.length} 个文件`);

                // 手动触发上传
                for (const file of files) {
                  await processFile(file);
                }

                // 显示成功消息
                if (currentBatchAddedCount > 0 && currentBatchSkippedCount > 0) {
                  appMessage.success(`成功上传 ${currentBatchAddedCount} 张图片，已跳过 ${currentBatchSkippedCount} 张重复图片`);
                } else if (currentBatchAddedCount > 0) {
                  appMessage.success(`成功上传 ${currentBatchAddedCount} 张图片`);
                } else if (currentBatchSkippedCount > 0) {
                  appMessage.warning(`已跳过 ${currentBatchSkippedCount} 张重复图片，没有新图片被上传`);
                }

                // 添加到数据集
                if (currentBatchImages.length > 0) {
                  const processedImages = currentBatchImages.map((img, index) => {
                    const uniqueId = `${img.name.split('.')[0]}_${Date.now()}_${index}`;
                    return {
                      id: uniqueId,
                      split: 'train',
                      labeled: false,
                      boxes: [],
                      url: img.fullPath || `http://localhost:8000${img.path}`,
                      originalPath: img.path.replace('/uploads/', ''),
                      filename: img.name,
                      uploadedAt: Date.now()
                    };
                  });
                  ctx.setAllImages(prev => [...prev, ...processedImages]);
                }

                // 清理
                currentBatchImages = [];
                currentBatchAddedCount = 0;
                currentBatchSkippedCount = 0;
                processedArchives.clear();
                currentSessionImages.clear();
                setIsProcessingDirectory(false);

                // 阻止默认行为
                e.preventDefault();
                e.stopPropagation();
                return false;
              } else {
                setIsDraggingDirectory(false);
                console.log('[上传] 检测到文件拖拽');
              }
            }
          }}
          onDragEnter={() => {
            console.log('[上传] 拖拽进入');
          }}
          beforeUpload={async (file, fileList) => {
            // 如果正在处理目录拖拽，跳过beforeUpload
            if (isProcessingDirectory) {
              console.log('[上传] 正在处理目录，跳过beforeUpload');
              return false;
            }

            // 跳过目录占位符文件（size为0且没有扩展名的文件通常是目录）
            if (file.size === 0 && !file.name.includes('.')) {
              console.log('[上传] 跳过目录占位符文件:', file.name);
              return false;
            }

            // 使用文件名+大小作为唯一标识，防止重复处理
            const fileKey = `${file.name}_${file.size}_${file.lastModified}`;

            console.log(`[上传] 开始处理文件: ${file.name}, fileKey: ${fileKey}`);
            console.log(`[上传] processingFiles.size: ${processingFiles.size}, currentBatchImages.length: ${currentBatchImages.length}`);

            // 如果文件已经在处理中，直接跳过
            if (processingFiles.has(fileKey)) {
              console.log(`[上传] 文件已在处理中，跳过: ${file.name}`);
              return false;
            }
            
            // 如果是压缩文件且已经处理过，直接跳过
            const isArchive = file.name.match(/\.(zip|tar|tar\.gz|tgz)$/i);
            if (isArchive && processedArchives.has(fileKey)) {
              console.log(`[上传] 压缩文件已处理过，跳过: ${file.name}`);
              return false;
            }
            
            // 将当前文件添加到处理集合
            processingFiles.add(fileKey);
            
            // 如果是压缩文件，立即标记为已处理（防止异步操作期间重复调用）
            if (isArchive) {
              processedArchives.add(fileKey);
            }

            try {
              let uploadedImages = [];

              // 自动识别上传类型
              // 检查是否有 webkitRelativePath（表示来自目录选择）
              const hasWebkitRelativePath = file.webkitRelativePath && file.webkitRelativePath.includes('/');
              const isDirectory = hasWebkitRelativePath || (fileList.length > 1 && fileList.some(f => f.webkitRelativePath && f.webkitRelativePath.includes('/')));
              const uploadType = isArchive ? 'archive' : (isDirectory ? 'directory' : 'image');
              
              console.log(`[上传] 上传类型: ${uploadType}, fileList.length: ${fileList.length}, isDirectory: ${isDirectory}`);
              
              // 只处理当前文件，而不是整个fileList
              const filesToUpload = [file];

              for (const uploadFile of filesToUpload) {
                // 获取实际的File对象
                let fileToUpload = uploadFile.originFileObj || uploadFile;

                console.log(`[上传] 处理文件: ${fileToUpload.name}, size: ${fileToUpload.size}, type: ${uploadType}`);

                // 验证文件对象
                if (!fileToUpload || !(fileToUpload instanceof File)) {
                  console.warn('跳过无效文件:', uploadFile.name);
                  continue;
                }

                // 如果是目录上传，跳过非图片文件
                if (uploadType === 'directory') {
                  const fileName = fileToUpload.name.toLowerCase();
                  if (!fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
                    console.log('[上传] 跳过非图片文件:', fileName);
                    continue;
                  }
                }

                console.log(`[上传] 文件通过验证，准备上传: ${fileToUpload.name}`);

                // 检查文件大小（只检查过大文件）
                if (fileToUpload.size > 50 * 1024 * 1024) {
                  console.warn(`跳过大文件: ${fileToUpload.name} (超过50MB)`);
                  continue;
                }

                const formData = new FormData();
                formData.append('file', fileToUpload);
                formData.append('type', uploadType);
                formData.append('dataset_id', ctx.currentDataset);

                try {
                  const response = await fetch('http://localhost:8000/api/upload/file', {
                    method: 'POST',
                    body: formData
                  });
                  
                  const data = await response.json();
                  
                  if (!response.ok) {
                    console.error(`上传失败: ${fileToUpload.name} - ${data.detail || '服务器错误'}`);
                    continue;
                  }

                  if (data.success) {
                    if (uploadType === 'archive') {
                      // 解压压缩包 - 解压到临时目录后依次上传到图片目录
                      console.log(`[上传] 开始解压压缩包，路径: ${data.path}`);
                      const extractResponse = await fetch('http://localhost:8000/api/upload/extract-dataset', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path: data.path })
                      });
                      const extractData = await extractResponse.json();
                      console.log('[上传] 压缩包解压结果:', extractData);
                      console.log(`[上传] 解压返回的图片列表:`, extractData.data?.images);
                      if (extractData.success && extractData.data?.images) {
                        // 获取当前数据集中已存在的文件名
                        const existingFilenames = new Set(ctx.allImages.map(img => img.filename));

                        // 去重：检查当前会话和数据集中的重复
                        const newImages = extractData.data.images.filter(img => {
                          const imageId = `${img.name}_${img.fullPath}`;

                          // 检查当前会话中的重复
                          if (currentSessionImages.has(imageId)) {
                            console.log(`[上传] 跳过当前会话重复图片: ${imageId}`);
                            currentBatchSkippedCount++;
                            return false;
                          }

                          // 检查数据集中的重复
                          if (existingFilenames.has(img.name)) {
                            console.log(`[上传] 跳过数据集重复图片: ${img.name}`);
                            currentBatchSkippedCount++;
                            return false;
                          }

                          // 添加到当前会话
                          currentSessionImages.set(imageId, img);
                          return true;
                        });
                        console.log(`[上传] 解压得到 ${extractData.data.images.length} 张图片，新增 ${newImages.length} 张`);
                        uploadedImages = [...uploadedImages, ...newImages];
                      } else {
                        console.error(`解压失败: ${extractData.detail || extractData.message}`);
                      }
                    } else {
                      // 单个图片或目录中的图片
                      // 使用完整的URL作为唯一标识进行去重
                      const imageId = `${data.filename}_${data.path}`;
                      if (!currentSessionImages.has(imageId)) {
                        currentSessionImages.set(imageId, {
                          name: data.filename,
                          path: data.path,
                          fullPath: `http://localhost:8000${data.path}`
                        });
                        uploadedImages.push({
                          name: data.filename,
                          path: data.path,
                          fullPath: `http://localhost:8000${data.path}`
                        });
                      }
                    }
                  }
                } catch (uploadError) {
                  console.error(`上传失败: ${fileToUpload.name} - ${uploadError.message}`);
                }
              }

              // 添加到当前批次
              currentBatchImages.push(...uploadedImages);

              // 添加到当前数据集
              const processedImages = uploadedImages.map((img, index) => {
                const uniqueId = `${img.name.split('.')[0]}_${Date.now()}_${index}`;
                return {
                  id: uniqueId,
                  split: 'train',
                  labeled: false,
                  boxes: [],
                  // 使用fullPath作为URL，它包含了正确的HTTP路径
                  url: uploadType === 'archive'
                    ? `http://localhost:8000${img.fullPath}`
                    : `http://localhost:8000${img.path}`,
                  originalPath: img.path.replace('/uploads/', ''),
                  filename: img.name,
                  uploadedAt: Date.now()
                };
              });

              // 检查重复图片，避免添加已存在的图片
              const existingFilenames = new Set(ctx.allImages.map(img => img.filename));
              const newImages = processedImages.filter(img => !existingFilenames.has(img.filename));
              const skippedCount = processedImages.length - newImages.length;

              if (newImages.length > 0) {
                console.log(`[上传] 添加 ${newImages.length} 张图片到数据集，跳过 ${skippedCount} 张重复图片`);
                ctx.setAllImages(prev => [...prev, ...newImages]);
                currentBatchAddedCount += newImages.length;
              } else if (skippedCount > 0) {
                console.log(`[上传] 跳过 ${skippedCount} 张重复图片，没有新图片被添加`);
              }

              if (skippedCount > 0) {
                currentBatchSkippedCount += skippedCount;
              }

              // 记录到批次中用于显示消息
              currentBatchImages.push(...newImages);
            } catch (error) {
              console.error('[上传] 上传错误:', error);
            } finally {
              // 延迟清理，确保所有上传操作都已完成
              setTimeout(() => {
                processingFiles.delete(fileKey);
                console.log(`[上传] 清理完成，processingFiles.size: ${processingFiles.size}, currentBatchImages.length: ${currentBatchImages.length}, currentSessionImages.size: ${currentSessionImages.size}`);
                
                // 当所有文件都处理完毕后，显示成功消息并清空批次
                if (processingFiles.size === 0) {
                  if (currentBatchAddedCount > 0 && currentBatchSkippedCount > 0) {
                    appMessage.success(`成功上传 ${currentBatchAddedCount} 张图片，已跳过 ${currentBatchSkippedCount} 张重复图片`);
                  } else if (currentBatchAddedCount > 0) {
                    appMessage.success(`成功上传 ${currentBatchAddedCount} 张图片`);
                  } else if (currentBatchSkippedCount > 0) {
                    appMessage.warning(`已跳过 ${currentBatchSkippedCount} 张重复图片，没有新图片被上传`);
                  }
                  console.log(`[上传] 所有文件处理完毕，添加 ${currentBatchAddedCount} 张图片，跳过 ${currentBatchSkippedCount} 张重复图片`);

                  // 清空批次和计数器
                  currentBatchImages = [];
                  currentBatchAddedCount = 0;
                  currentBatchSkippedCount = 0;
                  processedArchives.clear();
                  currentSessionImages.clear();
                }
              }, 200);
            }

            return false; // 阻止默认上传行为
          }}
          customRequest={({ onSuccess }) => {
            onSuccess('ok');
          }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: 32, color: '#999' }} />
          </p>
          <p className="ant-upload-text" style={{ fontSize: 16, color: '#999' }}>
            All {ctx.allImages.length} images loaded
          </p>
          <p className="ant-upload-hint" style={{ fontSize: 12, color: '#999' }}>
            点击或拖拽图像文件、图像目录或压缩文件(zip, tar, tar.gz)到此处上传
          </p>
        </Upload.Dragger>
      </div>

      {/* 悬停样式 */}
      <style>{`
        .image-card .hover-actions {
          display: none !important;
        }
        .image-card:hover .hover-actions {
          display: flex !important;
        }
        .upload-container:hover {
          border-color: #1890ff !important;
        }
      `}</style>
    </div>
  );
};



export default ImagesSection;