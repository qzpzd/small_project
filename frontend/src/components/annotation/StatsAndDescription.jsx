import React, { useContext, useState } from 'react';
import { Card, Typography, Divider, Row, Col, Statistic, Progress, Tag, Modal, Input, Button } from 'antd';
import { useDatasetContext, DatasetContext } from '../../context/DatasetContext';

const StatsAndDescription = ({ formattedStats }) => {
  const ctx = useContext(DatasetContext);
  const [descModal, setDescModal] = useState(false);
  const [descEdit, setDescEdit] = useState(ctx.description);

  return (
    <div style={{ padding: '16px 24px 0' }}>
      {/* 第一行：统计信息 */}
      <div style={{
        color: '#666', fontSize: '14px',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        marginBottom: 4
      }}>
        {formattedStats}
      </div>

      {/* 第二行：描述 */}
      <span
        style={{
          color: '#1890ff', cursor: 'pointer',
          fontSize: '14px'
        }}
        onClick={(e) => { e.stopPropagation(); setDescModal(true); }}
      >
        {ctx.description}
      </span>

      <Modal open={descModal} onCancel={() => setDescModal(false)} footer={null}>
        <Input.TextArea 
          value={descEdit} 
          onChange={(e) => setDescEdit(e.target.value)} 
          rows={4} 
          autoFocus 
          placeholder="Add a description..." 
        />
        <Button 
          type="primary" 
          block 
          style={{ marginTop: 16 }} 
          onClick={() => { ctx.setDescription(descEdit); setDescModal(false); }}
        >
          Save
        </Button>
      </Modal>
    </div>
  );
};


export default StatsAndDescription;
