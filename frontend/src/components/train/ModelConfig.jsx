import React from 'react';
import { Card, Form, Select, TreeSelect, Upload, Button, Alert, Space } from 'antd';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';

const { Option } = Select;

const ModelConfig = ({
  params,
  modelDirectory,
  selectedModelPath,
  modelFile,
  uploadingModel,
  onModelSourceChange,
  onSelectModel,
  onModelFileChange,
  onUploadModel,
  onDeleteFile
}) => {
  const modelUploadProps = {
    name: 'model',
    accept: '.pt,.pth',
    beforeUpload: (file) => {
      onModelFileChange(file);
      return false;
    },
    onRemove: () => {
      onModelFileChange(null);
    },
    fileList: modelFile ? [modelFile] : []
  };

  return (
    <Card
      title={
        <Space>
          <InboxOutlined />
          <span>预训练模型</span>
        </Space>
      }
      variant="outlined"
    >
      <Alert
        message="可以选择从项目模型目录中选择或上传新的预训练模型（可选，不选择则从头开始训练）"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form layout="vertical">
        <Form.Item label="模型来源">
          <Select value={params.model_source} onChange={onModelSourceChange}>
            <Option value="existing">从项目目录选择</Option>
            <Option value="upload">上传新文件</Option>
          </Select>
        </Form.Item>

        {params.model_source === 'existing' && (
          <>
            <Form.Item label="选择模型文件">
              <TreeSelect
                showSearch
                treeData={modelDirectory}
                placeholder="从项目目录选择模型文件"
                onChange={onSelectModel}
                treeDefaultExpandAll
                style={{ width: '100%' }}
                allowClear
              />
            </Form.Item>
            {selectedModelPath && (
              <Alert
                message={
                  <Space>
                    <span>已选择: {selectedModelPath}</span>
                    <Button
                      danger
                      size="small"
                      icon={<InboxOutlined />}
                      onClick={() => onDeleteFile(selectedModelPath, 'model')}
                    >
                      删除
                    </Button>
                  </Space>
                }
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
          </>
        )}

        {params.model_source === 'upload' && (
          <Form.Item label="上传模型文件">
            <Upload {...modelUploadProps}>
              <Button icon={<UploadOutlined />}>选择模型文件</Button>
            </Upload>
            {modelFile && (
              <Alert
                message={`已选择: ${modelFile.name}`}
                type="success"
                showIcon
                style={{ marginTop: 12 }}
              />
            )}
            <Button
              type="primary"
              onClick={onUploadModel}
              loading={uploadingModel}
              block
              style={{ marginTop: 16 }}
              disabled={!modelFile}
            >
              上传文件
            </Button>
          </Form.Item>
        )}
      </Form>
    </Card>
  );
};

export default ModelConfig;