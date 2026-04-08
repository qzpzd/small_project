import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Table, Tag, Space, Typography, Empty, Spin, App } from 'antd';
import { FolderOpenOutlined, PlusOutlined, DeleteOutlined, EyeOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

function Datasets() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  // 加载数据集列表
  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/dataset/list');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDatasets(result.data);
        }
      }
    } catch (error) {
      console.error('加载数据集列表失败:', error);
      message.error('加载数据集列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除数据集
  const handleDeleteDataset = async (datasetId, datasetName) => {
    try {
      // 1. 删除后端数据集目录和文件
      const response = await fetch(`http://localhost:8000/api/dataset/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: datasetId })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          message.success(`数据集 "${datasetName}" 已删除`);
          
          // 2. 删除前端相关的图片
          const currentImages = datasets.find(d => d.id === datasetId)?.images || [];
          const imagesToDelete = currentImages.filter(img => img.url.includes('/datasets/'));
          
          if (imagesToDelete.length > 0) {
            console.log(`[删除] 清理前端图片: ${imagesToDelete.length}张`);
          }
          
          // 3. 刷新数据集列表
          loadDatasets();
          
          // 4. 触发删除事件，通知其他组件
          window.dispatchEvent(new CustomEvent('dataset-deleted', { detail: datasetId }));
        } else {
          message.error(result.message || '删除失败');
        }
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error('删除数据集失败:', error);
      message.error('删除失败: ' + error.message);
    }
  };

  // 查看数据集详情
  const handleViewDataset = (datasetId) => {
    navigate(`/annotation?dataset=${datasetId}`);
  };

  // 创建新数据集
  const handleCreateDataset = () => {
    navigate('/annotation');
    setTimeout(() => {
      const event = new CustomEvent('create-dataset');
      window.dispatchEvent(event);
    }, 100);
  };

  // 处理描述更改
  const handleDescriptionChange = (datasetId, newDescription) => {
    setDatasets(prevDatasets =>
      prevDatasets.map(ds =>
        ds.id === datasetId ? { ...ds, description: newDescription } : ds
      )
    );
  };

  // 保存描述
  const handleDescriptionSave = async (datasetId) => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) return;

    try {
      const response = await fetch(`http://localhost:8000/api/dataset/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: datasetId,
          description: dataset.description
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          message.success('描述已保存');
          // 触发数据集更新事件
          window.dispatchEvent(new CustomEvent('datasets-updated'));
        } else {
          message.error(result.message || '保存失败');
        }
      } else {
        message.error('保存失败');
      }
    } catch (error) {
      console.error('保存描述失败:', error);
      message.error('保存失败: ' + error.message);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '数据集名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <FolderOpenOutlined style={{ color: '#1890ff' }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '任务类型',
      dataIndex: 'task',
      key: 'task',
      render: (task) => (
        <Tag color={task === 'detect' ? 'blue' : 'green'}>{task}</Tag>
      ),
    },
    {
      title: '图片数量',
      dataIndex: 'image_count',
      key: 'image_count',
      render: (count) => (
        <Statistic 
          value={count} 
          valueStyle={{ fontSize: '16px' }}
          suffix="张"
        />
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text, record) => (
        <input
          type="text"
          value={text || ''}
          placeholder="点击添加描述..."
          style={{
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            padding: '4px 8px',
            width: '100%',
            fontSize: '14px',
            color: text ? '#000' : '#999'
          }}
          onChange={(e) => handleDescriptionChange(record.id, e.target.value)}
          onBlur={() => handleDescriptionSave(record.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.target.blur(); // 触发onBlur保存
            }
          }}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => <Text type="secondary">{date ? new Date(date).toLocaleString() : '-'}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button 
            type="link" 
            size="small"
            icon={<EyeOutlined />} 
            onClick={() => handleViewDataset(record.id)}
          >
            查看
          </Button>
          <Button 
            type="link" 
            danger 
            size="small"
            icon={<DeleteOutlined />} 
            onClick={() => {
              if (window.confirm(`确定要删除数据集 "${record.name}" 吗？此操作不可恢复。`)) {
                handleDeleteDataset(record.id, record.name);
              }
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 统计数据
  const totalDatasets = datasets.length;
  const totalImages = datasets.reduce((sum, ds) => sum + ds.image_count, 0);
  const detectDatasets = datasets.filter(ds => ds.task === 'detect').length;
  const segmentDatasets = datasets.filter(ds => ds.task === 'segment').length;

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Spin size="large" tip="加载数据集中...">
          <div>加载中...</div>
        </Spin>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          <BarChartOutlined /> 数据集管理
        </Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreateDataset}
        >
          创建数据集
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="总数据集数"
              value={totalDatasets}
              prefix={<FolderOpenOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="总图片数"
              value={totalImages}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="检测任务"
              value={detectDatasets}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="分割任务"
              value={segmentDatasets}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据集列表 */}
      <Card title="数据集列表">
        {datasets.length === 0 ? (
          <Empty 
            description="暂无数据集，点击右上角创建数据集"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateDataset}>
              创建数据集
            </Button>
          </Empty>
        ) : (
          <Table 
            columns={columns} 
            dataSource={datasets} 
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个数据集`
            }}
          />
        )}
      </Card>
    </div>
  );
}

export default Datasets;