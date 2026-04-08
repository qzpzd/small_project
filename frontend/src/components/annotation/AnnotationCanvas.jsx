import { useRef, useEffect } from 'react';
import { Button, Spin } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { rgbToRgba } from './useAnnotationUtils';

// 图像标注画布组件
export const AnnotationCanvas = ({
  ctx,
  imgRef,
  svgRef,
  imgLoaded,
  naturalImageSize,
  isDrawing,
  mouse,
  startPoint,
  currentRect,
  boxes,
  selectedBox,
  showBoxes,
  showLabelText,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handlePrev,
  handleNext,
  onImageLoad,
}) => {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: 'transparent'
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
      
      {/* 图片和SVG的公共容器 */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        {ctx.selectedImage && (
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
            onLoad={onImageLoad}
            alt="标注图片"
          />
        )}
        
        {/* SVG 标注层：直接覆盖在图片显示区域上 */}
        {showBoxes && (
          <svg
            ref={svgRef}
            style={{
              position: 'absolute',
              pointerEvents: 'auto',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 2,
              cursor: 'crosshair'
            }}
            width="100%"
            height="100%"
            viewBox={`0 0 ${naturalImageSize.width || 800} ${naturalImageSize.height || 600}`}
            preserveAspectRatio="xMidYMid meet"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <rect x="0" y="0" width="100%" height="100%" fill="transparent" />
            
            {/* 十字光标 */}
            {imgLoaded && mouse.x >= 0 && mouse.x <= naturalImageSize.width && mouse.y >= 0 && mouse.y <= naturalImageSize.height && (
              <g style={{ pointerEvents: 'none' }}>
                <line 
                  x1={mouse.x} 
                  y1={0} 
                  x2={mouse.x} 
                  y2={naturalImageSize.height} 
                  stroke="white" 
                  strokeWidth={1} 
                  strokeDasharray="4 2"
                />
                <line 
                  x1={0} 
                  y1={mouse.y} 
                  x2={naturalImageSize.width} 
                  y2={mouse.y} 
                  stroke="white" 
                  strokeWidth={1} 
                  strokeDasharray="4 2"
                />
                <circle 
                  cx={mouse.x} 
                  cy={mouse.y} 
                  r={3} 
                  fill="white" 
                  style={{ opacity: 0.8 }}
                />
                <text 
                  x={mouse.x + 8} 
                  y={mouse.y - 6} 
                  fill="white" 
                  fontSize={12} 
                  style={{ 
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    pointerEvents: 'none'
                  }}
                >
                  {Math.round(mouse.x)},{Math.round(mouse.y)}
                </text>
              </g>
            )}

            {/* 绘制中的矩形 */}
            {imgLoaded && isDrawing && startPoint && (
              <rect
                x={Math.min(startPoint.x, mouse.x)}
                y={Math.min(startPoint.y, mouse.y)}
                width={Math.abs(mouse.x - startPoint.x)}
                height={Math.abs(mouse.y - startPoint.y)}
                stroke={ctx.selectedLabel?.color || '#1890ff'}
                strokeWidth="2"
                fill={rgbToRgba(ctx.selectedLabel?.color || '#1890ff', 0.4)}
              />
            )}

            {/* 已标注的矩形框 */}
            {boxes.map(box => {
              if (box.visible === false) return null;
              return (
                <g key={box.id}>
                  <rect
                    x={box.x}
                    y={box.y}
                    width={box.w}
                    height={box.h}
                    stroke={box.color}
                    strokeWidth="2"
                    fill={rgbToRgba(box.color, 0.4)}
                    style={{ cursor: 'move' }}
                  />
                  {showLabelText && <text x={box.x} y={box.y - 4} fill={box.color} fontSize="14" fontWeight="bold">{box.label}</text>}
                </g>
              );
            })}
          </svg>
        )}

        {/* 导航按钮 */}
        {!isDrawing && (
          <>
            <Button
              shape="circle"
              icon={<LeftOutlined />}
              style={{
                position: 'absolute',
                left: 16,
                bottom: 16,
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(8px)',
                zIndex: 5
              }}
              onClick={handlePrev}
              onMouseDown={(e) => e.stopPropagation()}
            />
            <Button
              shape="circle"
              icon={<RightOutlined />}
              style={{
                position: 'absolute',
                right: 16,
                bottom: 16,
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(8px)',
                zIndex: 5
              }}
              onClick={handleNext}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </>
        )}
      </div>
    </div>
  );
};