import { Input, Button, Tag, Tooltip, Modal, Dropdown } from 'antd';
import { PlusOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import { generateRandomColor } from './useAnnotationUtils';

// 标签面板组件
export const LabelPanel = ({
  ctx,
  showLabels,
  isDrawing,
  newLabelName,
  newLabelColor,
  searchQuery,
  editingLabelId,
  editingLabelName,
  colorPickerVisible,
  colorPickerLabelId,
  onNewLabelNameChange,
  onAddLabel,
  onSearchChange,
  onEditLabel,
  onEditLabelNameChange,
  onEditLabelBlur,
  onDeleteLabel,
  onColorButtonClick,
  onColorSelect,
  onColorPickerClose,
  onGenerateRandomColor,
}) => {
  const filteredLabels = ctx.labels.filter(lab =>
    lab.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      position: 'absolute',
      right: 0,
      top: 56,
      bottom: 'auto',
      width: 220,
      background: 'rgba(255,255,255,0.5)',
      backdropFilter: 'blur(12px)',
      padding: '12px',
      borderLeft: '1px solid rgba(232,232,232,0.3)',
      borderRadius: '16px',
      margin: '8px',
      zIndex: 20,
      maxHeight: 'calc(100vh - 120px)',
      height: 'auto',
      overflowY: 'auto'
    }}>
      <Input.Search 
        placeholder="搜索标签..." 
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ marginBottom: 12 }}
      />
      
      {filteredLabels.map((lab, index) => (
        <div 
          key={lab.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px',
            borderRadius: 8,
            marginBottom: 8,
            background: ctx.selectedLabel?.id === lab.id ? 'rgba(24,144,255,0.1)' : 'transparent',
            border: ctx.selectedLabel?.id === lab.id ? '1px solid rgba(24,144,255,0.3)' : '1px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => onEditLabel(lab.id)}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: lab.color,
              border: '1px solid #ddd',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              flexShrink: 0
            }}
            onClick={(e) => onColorButtonClick(e, lab.id)}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          />
          
          {editingLabelId === lab.id ? (
            <Input
              autoFocus
              size="small"
              value={editingLabelName}
              onChange={(e) => onEditLabelNameChange(e.target.value)}
              onBlur={() => onEditLabelBlur(lab.id)}
              style={{ flex: 1 }}
            />
          ) : (
            <div style={{ flex: 1 }}>{lab.name}</div>
          )}
          
          {ctx.selectedLabel?.id === lab.id && (
            <CheckCircleOutlined style={{ color: '#52c41a', flexShrink: 0 }} />
          )}
          
          <Tooltip title={`选中标注框: ${lab.name}`}>
            <EditOutlined 
              style={{ 
                color: '#999', 
                cursor: 'pointer', 
                flexShrink: 0,
                fontSize: 12
              }}
              onClick={(e) => {
                e.stopPropagation();
                onEditLabel(lab.id);
              }}
            />
          </Tooltip>
          
          <Tooltip title={`删除标签 ${lab.name}`}>
            <Button 
              type="text" 
              size="small" 
              danger
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteLabel(lab.id);
              }}
              style={{ 
                padding: 0, 
                minWidth: 'auto',
                height: 'auto',
                flexShrink: 0
              }}
            >
              ×
            </Button>
          </Tooltip>
          
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
          onChange={(e) => onNewLabelNameChange(e.target.value)}
          onPressEnter={() => {
            if (newLabelName.trim()) {
              const randomColor = generateRandomColor(ctx.labels);
              onAddLabel(newLabelName.trim(), randomColor);
            }
          }}
        />
        <Button
          size="small"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            if (newLabelName.trim()) {
              const randomColor = generateRandomColor(ctx.labels);
              onAddLabel(newLabelName.trim(), randomColor);
            }
          }}
        />
      </div>
      
      {/* 颜色选择器弹窗 */}
      <Modal
        title={null}
        open={colorPickerVisible}
        onCancel={onColorPickerClose}
        footer={null}
        width={320}
        closable={false}
        style={{ top: '20%' }}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <Button
              block
              onClick={onGenerateRandomColor}
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
                onChange={(e) => onColorSelect(e.target.value)}
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
                onClick={() => onColorSelect(color)}
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
    </div>
  );
};