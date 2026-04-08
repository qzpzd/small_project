import { useContext, useEffect, useCallback } from 'react';
import { App } from 'antd';
import { useDatasetContext, DatasetContext } from '../../context/DatasetContext';
import { useAnnotationState, useSvgSize } from './useAnnotationHooks';
import { useAnnotationHandlers } from './useAnnotationHandlers';
import { AnnotationCanvas } from './AnnotationCanvas';
import { AnnotationToolbar } from './AnnotationToolbar';
import { LabelPanel } from './LabelPanel';
import { generateRandomColor } from './useAnnotationUtils';

const AnnotationView = () => {
  const ctx = useContext(DatasetContext);
  const { message } = App.useApp();

  // 使用状态管理hooks
  const state = useAnnotationState();
  const {
    imgRef,
    svgRef,
    imgLoaded,
    setImgLoaded,
    lastImageId,
    setLastImageId,
    boxes,
    setBoxes,
    selectedBox,
    setSelectedBox,
    showLabels,
    showBoxes,
    showControls,
    showLabelText,
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    newLabelName,
    setNewLabelName,
    searchQuery,
    setSearchQuery,
    editingLabelId,
    setEditingLabelId,
    editingLabelName,
    setEditingLabelName,
    colorPickerVisible,
    setColorPickerVisible,
    colorPickerLabelId,
    setColorPickerLabelId,
    isDrawing,
    mouse,
    startPoint,
    currentRect,
    naturalImageSize,
  } = state;

  // 使用SVG尺寸管理
  const {
    naturalImageSize: svgNaturalSize,
    displayImageSize,
    imageScaleFactor,
    imgSize,
    updateSvgSize,
  } = useSvgSize(imgRef, ctx);

  // 使用事件处理handlers
  const handlers = useAnnotationHandlers(ctx, state, {
    setBoxes,
    setMouse: state.setMouse,
    setIsDrawing: state.setIsDrawing,
    setCurrentRect: state.setCurrentRect,
    setStartPoint: state.setStartPoint,
    setSelectedBox,
    setHistory,
    setHistoryIndex,
    setHasMoved: state.setHasMoved,
    setColorPickerVisible,
    setColorPickerLabelId,
  });

  const {
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
  } = handlers;

  // 图像加载处理
  const handleImageLoad = useCallback(() => {
    setImgLoaded(true);
    console.log(`[图片加载] 图片加载完成: ${ctx.selectedImage?.filename}`);
    setTimeout(updateSvgSize, 200);
    setTimeout(updateSvgSize, 500);
  }, [ctx.selectedImage, updateSvgSize, setImgLoaded]);

  // 当选择新图片时，重置状态
  useEffect(() => {
    if (ctx.selectedImage) {
      const img = ctx.allImages.find(i => i.id === ctx.selectedImage.id);
      
      if (ctx.selectedImage.id !== lastImageId) {
        setLastImageId(ctx.selectedImage.id);
        setBoxes(ctx.selectedImage.boxes || []);
        
        // 保存到历史记录
        if (ctx.selectedImage.boxes && ctx.selectedImage.boxes.length > 0) {
          setHistory([ctx.selectedImage.boxes]);
          setHistoryIndex(0);
        }
      }
    }
  }, [ctx.selectedImage, lastImageId, ctx.allImages, setBoxes, setHistory, setHistoryIndex, setLastImageId]);

  // 监听鼠标移动
  useEffect(() => {
    const handleMouseMove = (e) => {
      updateMouse(e);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [updateMouse]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedBox) {
        handleDeleteBox();
      }
      
      // 数字键切换标签
      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < ctx.labels.length) {
          ctx.selectLabel(ctx.labels[index].id);
        }
      }
      
      // 方向键切换图片
      if (e.key === 'ArrowLeft') {
        handlePrev();
      }
      if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedBox, ctx.labels, ctx, handleDeleteBox, handlePrev, handleNext]);

  // Label面板事件处理
  const handleNewLabelNameChange = (value) => {
    setNewLabelName(value);
  };

  const handleAddLabel = (name, color) => {
    ctx.addLabel(name, color);
    setNewLabelName('');
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
  };

  const handleEditLabel = (labelId) => {
    ctx.selectLabel(labelId);
    setEditingLabelId(labelId);
    const label = ctx.labels.find(l => l.id === labelId);
    if (label) {
      setEditingLabelName(label.name);
    }
  };

  const handleEditLabelNameChange = (value) => {
    setEditingLabelName(value);
  };

  const handleEditLabelBlur = (labelId) => {
    if (editingLabelName.trim()) {
      const updatedLabels = ctx.labels.map(l =>
        l.id === labelId ? { ...l, name: editingLabelName.trim() } : l
      );
      ctx.setLabels(updatedLabels);
      
      const updatedBoxes = boxes.map(box =>
        box.labelId === labelId ? { ...box, label: editingLabelName.trim() } : box
      );
      setBoxes(updatedBoxes);
      saveAnnotationBoxes(ctx.selectedImage.id, updatedBoxes);
    }
    setEditingLabelId(null);
  };

  const handleDeleteLabel = (labelId) => {
    const updatedLabels = ctx.labels.filter(l => l.id !== labelId);
    ctx.setLabels(updatedLabels);
    
    const updatedBoxes = boxes.filter(box => box.labelId !== labelId);
    setBoxes(updatedBoxes);
    saveAnnotationBoxes(ctx.selectedImage.id, updatedBoxes);
  };

  const handleColorPickerClose = () => {
    setColorPickerVisible(false);
    setColorPickerLabelId(null);
  };

  const handleGenerateRandomColor = () => {
    const newColor = generateRandomColor(ctx.labels);
    handleColorSelect(newColor);
  };

  // 工具栏事件处理
  const handleDraw = () => {
    message.info('点击图片开始绘制标注框');
  };

  const handleAutoAnnotation = (type) => {
    message.info(`${type} 自动标注功能即将推出`);
  };

  const handleShowShortcuts = () => {
    message.info('快捷键说明已显示');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 64,
      left: 200,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.3)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* 工具栏 */}
      <AnnotationToolbar
        showControls={showControls}
        onDraw={handleDraw}
        onAutoAnnotation={handleAutoAnnotation}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDelete={handleDeleteBox}
        onShowShortcuts={handleShowShortcuts}
        history={history}
        historyIndex={historyIndex}
        selectedBox={selectedBox}
      />

      {/* 图像标注画布 */}
      <AnnotationCanvas
        ctx={ctx}
        imgRef={imgRef}
        svgRef={svgRef}
        imgLoaded={imgLoaded}
        naturalImageSize={naturalImageSize}
        isDrawing={isDrawing}
        mouse={mouse}
        startPoint={startPoint}
        currentRect={currentRect}
        boxes={boxes}
        selectedBox={selectedBox}
        showBoxes={showBoxes}
        showLabelText={showLabelText}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        handlePrev={handlePrev}
        handleNext={handleNext}
        onImageLoad={handleImageLoad}
      />

      {/* 标签面板 */}
      {showLabels && !isDrawing && (
        <LabelPanel
          ctx={ctx}
          showLabels={showLabels}
          isDrawing={isDrawing}
          newLabelName={newLabelName}
          newLabelColor={state.newLabelColor}
          searchQuery={searchQuery}
          editingLabelId={editingLabelId}
          editingLabelName={editingLabelName}
          colorPickerVisible={colorPickerVisible}
          colorPickerLabelId={colorPickerLabelId}
          onNewLabelNameChange={handleNewLabelNameChange}
          onAddLabel={handleAddLabel}
          onSearchChange={handleSearchChange}
          onEditLabel={handleEditLabel}
          onEditLabelNameChange={handleEditLabelNameChange}
          onEditLabelBlur={handleEditLabelBlur}
          onDeleteLabel={handleDeleteLabel}
          onColorButtonClick={handleColorButtonClick}
          onColorSelect={handleColorSelect}
          onColorPickerClose={handleColorPickerClose}
          onGenerateRandomColor={handleGenerateRandomColor}
        />
      )}
    </div>
  );
};

export default AnnotationView;