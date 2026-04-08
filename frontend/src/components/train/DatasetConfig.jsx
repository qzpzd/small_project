import React from 'react';
import { Card, Form, Select, TreeSelect, Upload, Button, Alert, Space } from 'antd';
import { FolderOpenOutlined, FileTextOutlined, UploadOutlined, InboxOutlined } from '@ant-design/icons';

const { Option } = Select;

const DatasetConfig = ({
  params,
  yamlDirectory,
  selectedYamlPath,
  yamlFile,
  uploadingYaml,
  onYamlSourceChange,
  onSelectYaml,
  onYamlFileChange,
  onUploadYaml,
  onDeleteFile
}) => {
  const yamlUploadProps = {
    name: 'yaml',
    accept: '.yaml,.yml',
    beforeUpload: (file) => {
      onYamlFileChange(file);
      return false;
    },
    onRemove: () => {
      onYamlFileChange(null);
    },
    fileList: yamlFile ? [yamlFile] : []
  };

  return (
    <Card
      title={
        <Space>
          <FolderOpenOutlined />
          <span>数据集配置</span>
        </Space>
      }
      variant="outlined"
    >
      <Alert
        message="数据集 YAML 文件包含数据集路径、类别信息等配置，请从项目目录选择或上传新的 YAML 文件"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form layout="vertical">
        <Form.Item label="YAML 文件来源">
          <Select value={params.yaml_source} onChange={onYamlSourceChange}>
            <Option value="existing">从项目目录选择</Option>
            <Option value="upload">上传新文件</Option>
          </Select>
        </Form.Item>

        {params.yaml_source === 'existing' && (
          <>
            <Form.Item label="选择 YAML 文件" rules={[{ required: true, message: '请选择 YAML 文件' }]}>
              <TreeSelect
                showSearch
                treeData={yamlDirectory}
                placeholder="从项目目录选择 YAML 文件"
                onChange={onSelectYaml}
                treeDefaultExpandAll
                style={{ width: '100%' }}
              />
            </Form.Item>
            {selectedYamlPath && (
              <Alert
                message={
                  <Space>
                    <span>已选择: {selectedYamlPath}</span>
                    <Button
                      danger
                      size="small"
                      icon={<InboxOutlined />}
                      onClick={() => onDeleteFile(selectedYamlPath, 'yaml')}
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

        {params.yaml_source === 'upload' && (
          <Form.Item label="上传 YAML 文件" rules={[{ required: true, message: '请上传 YAML 文件' }]}>
            <Upload {...yamlUploadProps}>
              <Button icon={<UploadOutlined />}>选择 YAML 文件</Button>
            </Upload>
            {yamlFile && (
              <Alert
                message={`已选择: ${yamlFile.name}`}
                type="success"
                showIcon
                style={{ marginTop: 12 }}
              />
            )}
            <Button
              type="primary"
              onClick={onUploadYaml}
              loading={uploadingYaml}
              block
              style={{ marginTop: 16 }}
              disabled={!yamlFile}
            >
              上传文件
            </Button>
          </Form.Item>
        )}
      </Form>
    </Card>
  );
};

export default DatasetConfig;