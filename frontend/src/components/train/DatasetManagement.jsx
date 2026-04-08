import React from 'react';
import { Card, Form, Upload, Button, Alert, Divider, Space, Tag, Typography } from 'antd';
import { FolderOpenOutlined, UploadOutlined, FolderOutlined, InboxOutlined } from '@ant-design/icons';

const { Text } = Typography;

const DatasetManagement = ({
  datasetDirectory,
  selectedDatasetPath,
  datasetFile,
  uploadingDataset,
  datasetListExpanded,
  onDatasetFileChange,
  onUploadDataset,
  onSelectDataset,
  onDeleteFile,
  onToggleDatasetList,
  onClearSelectedDataset
}) => {
  const datasetUploadProps = {
    name: 'dataset',
    accept: '.zip,.tar,.tar.gz,.tgz',
    beforeUpload: (file) => {
      onDatasetFileChange(file);
      return false;
    },
    onRemove: () => {
      onDatasetFileChange(null);
    },
    fileList: datasetFile ? [datasetFile] : []
  };

  return (
    <Card
      title={
        <Space>
          <FolderOpenOutlined />
          <span>数据集上传和管理</span>
        </Space>
      }
      variant="outlined"
    >
      <Alert
        message="上传数据集压缩包（.zip或.tar.gz），系统会自动解压到datasets目录。如果已经选择了YAML文件，系统会自动修正YAML中的数据集路径。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form layout="vertical">
        <Form.Item label="上传数据集压缩包">
          <Upload {...datasetUploadProps}>
            <Button icon={<UploadOutlined />}>选择数据集压缩包</Button>
          </Upload>
          {datasetFile && (
            <Alert
              message={`已选择: ${datasetFile.name}`}
              type="success"
              showIcon
              style={{ marginTop: 12 }}
            />
          )}
          <Button
            type="primary"
            onClick={onUploadDataset}
            loading={uploadingDataset}
            block
            style={{ marginTop: 16 }}
            disabled={!datasetFile}
          >
            上传并解压
          </Button>
        </Form.Item>
      </Form>

      <Divider>
        <Space>
          <span>已上传的数据集</span>
          {datasetDirectory.length > 0 && (
            <Button
              type="link"
              size="small"
              onClick={onToggleDatasetList}
            >
              {datasetListExpanded ? '收起' : '展开'}
            </Button>
          )}
        </Space>
      </Divider>

      {selectedDatasetPath && (
        <Alert
          message={
            <Space>
              <span>当前选择的数据集: {selectedDatasetPath.split('/').pop()}</span>
              <Button
                type="link"
                size="small"
                onClick={onClearSelectedDataset}
              >
                取消选择
              </Button>
            </Space>
          }
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={onClearSelectedDataset}
        />
      )}

      {datasetDirectory.length > 0 && datasetListExpanded && (
        <div
          style={{
            maxHeight: 300,
            overflowY: 'auto',
            padding: '8px 0'
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {datasetDirectory.map(dataset => (
              <Card
                key={dataset.path}
                size="small"
                style={{
                  background: selectedDatasetPath === dataset.path ? '#e6f7ff' : '#fafafa',
                  cursor: 'pointer',
                  border: selectedDatasetPath === dataset.path ? '2px solid #1890ff' : '1px solid #d9d9d9'
                }}
                hoverable
                onClick={() => onSelectDataset(dataset.path, dataset.name)}
                extra={
                  <Space>
                    <Button
                      danger
                      size="small"
                      icon={<InboxOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(dataset.path, 'dataset');
                      }}
                    >
                      删除
                    </Button>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>{dataset.name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{dataset.path}</Text>
                  <Space>
                    <Tag color={dataset.is_valid ? 'success' : 'warning'}>
                      {dataset.is_valid ? '有效数据集' : '无效数据集'}
                    </Tag>
                    <Tag color={selectedDatasetPath === dataset.path ? 'blue' : 'default'}>
                      {selectedDatasetPath === dataset.path ? '已选择' : '点击选择'}
                    </Tag>
                  </Space>
                </Space>
              </Card>
            ))}
          </Space>
        </div>
      )}

      {datasetDirectory.length > 0 && !datasetListExpanded && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          <Text type="secondary">已上传 {datasetDirectory.length} 个数据集，点击"展开"查看详情</Text>
        </div>
      )}

      {datasetDirectory.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          <FolderOutlined style={{ fontSize: 48, marginBottom: 12 }} />
          <p>暂无上传的数据集</p>
        </div>
      )}
    </Card>
  );
};

export default DatasetManagement;