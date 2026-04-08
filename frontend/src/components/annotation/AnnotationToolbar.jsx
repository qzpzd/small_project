import { Button, Dropdown } from 'antd';
import { 
  EditOutlined, SyncOutlined, UndoOutlined, RedoOutlined, 
  DeleteOutlined, BookOutlined 
} from '@ant-design/icons';

// 工具栏组件
export const AnnotationToolbar = ({
  showControls,
  onDraw,
  onAutoAnnotation,
  onUndo,
  onRedo,
  onDelete,
  onShowShortcuts,
  history,
  historyIndex,
  selectedBox,
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: 16,
      left: 16,
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(15px)',
      padding: '8px 12px',
      display: showControls ? 'flex' : 'none',
      alignItems: 'center',
      gap: 8,
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.2)',
      zIndex: 100
    }}>
      <Button 
        type="primary" 
        icon={<EditOutlined />} 
        size="small"
        style={{
          background: 'rgba(24,144,255,0.8)',
          borderColor: 'rgba(24,144,255,0.5)',
          backdropFilter: 'blur(8px)'
        }}
        onClick={onDraw}
      >
        Draw
      </Button>
      
      <Dropdown menu={{
        items: [
          { key: 'yolo', label: 'YOLO 自动标注', onClick: () => onAutoAnnotation('yolo') },
          { key: 'sam', label: 'SAM 自动标注', onClick: () => onAutoAnnotation('sam') }
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
        >
          Smart
        </Button>
      </Dropdown>
      
      <Button 
        icon={<UndoOutlined />} 
        size="small"
        disabled={historyIndex <= 0}
        onClick={onUndo}
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
        onClick={onRedo}
        style={{
          background: 'rgba(255,255,255,0.3)',
          borderColor: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(12px)'
        }}
      />
      
      <Button 
        icon={<DeleteOutlined />} 
        size="small"
        disabled={!selectedBox}
        onClick={onDelete}
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
  );
};