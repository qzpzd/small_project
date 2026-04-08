import React from 'react';
import { Card, Form, TreeSelect, Upload, Button, Alert, Space, Typography, Tag, Divider } from 'antd';
import { FolderOutlined, InboxOutlined, UploadOutlined } from '@ant-design/icons';

const { Text } = Typography;

const ModelManagement = ({
  modelList,
  loadingModel,
  currentModel,
  modelLoaded,
  onLoadModel,
  onUploadModel,
  form
}) => {
  // 构建树状结构数据
  const buildTreeData = () => {
    const trainedModels = modelList.filter(m => m.type === 'trained');
    const pretrainedModels = modelList.filter(m => m.type === 'pretrained');
    
    const treeData = [];
    
    // 训练模型按数据集分组
    if (trainedModels.length > 0) {
      const datasetGroups = trainedModels.reduce((groups, model) => {
        const dataset = model.dataset || 'unknown';
        if (!groups[dataset]) {
          groups[dataset] = [];
        }
        groups[dataset].push(model);
        return groups;
      }, {});
      
      const trainedChildren = Object.entries(datasetGroups).map(([dataset, models]) => ({
        title: (
          <Space>
            <FolderOutlined />
            <span>{dataset}</span>
          </Space>
        ),
        value: `dataset-${dataset}`,
        key: `dataset-${dataset}`,
        selectable: false,
        disableCheckbox: true,
        children: models.map(model => {
          // 从路径中提取模型文件名
          const fileName = model.path.split('/').pop();
          return {
            title: (
              <Space>
                <span>{fileName}</span>
              </Space>
            ),
            value: model.path,
            key: model.path,
            selectable: true,
            isLeaf: true
          };
        })
      }));
      
      treeData.push({
        title: '训练模型',
        value: 'trained-root',
        key: 'trained-root',
        selectable: false,
        disableCheckbox: true,
        children: trainedChildren
      });
    }
    
    // 预训练模型
    if (pretrainedModels.length > 0) {
      const pretrainedChildren = pretrainedModels.map(model => ({
        title: (
          <Space>
            <InboxOutlined />
            <span>{model.name}</span>
          </Space>
        ),
        value: model.path,
        key: model.path,
        selectable: true,
        isLeaf: true
      }));
      
      treeData.push({
        title: '预训练模型',
        value: 'pretrained-root',
        key: 'pretrained-root',
        selectable: false,
        disableCheckbox: true,
        children: pretrainedChildren
      });
    }
    
    return treeData;
  };

  return (
    <Card title="模型管理" variant="outlined">
      <Alert
        message="选择已训练的模型或上传新模型进行推理"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form layout="vertical" form={form}>
        <Form.Item name="model_path" label="选择模型" rules={[{ required: true, message: '请选择模型' }]}>
          <TreeSelect
            showSearch
            style={{ width: '100%' }}
            styles={{
              popup: {
                root: { maxHeight: 400, overflow: 'auto' }
              }
            }}
            placeholder="请选择模型"
            allowClear
            treeDefaultExpandAll
            treeData={buildTreeData()}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" onClick={onLoadModel} loading={loadingModel} block>
            加载模型
          </Button>
        </Form.Item>
      </Form>

      <Divider>上传新模型</Divider>

      <Upload
        accept=".pt,.pth"
        beforeUpload={(file) => {
          console.log('Upload组件触发了文件选择:', file)
          onUploadModel(file);
          return false; // 阻止自动上传
        }}
        showUploadList={false}
      >
        <Button icon={<UploadOutlined />} block>
          上传模型文件
        </Button>
      </Upload>

      {currentModel && (
        <Alert
          message={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>当前模型类别:</Text>
              <div>{currentModel.names ? Object.values(currentModel.names).join(', ') : '未知'}</div>
              <Tag color="success">任务类型: {currentModel.task}</Tag>
            </Space>
          }
          type="success"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  );
};

export default ModelManagement;