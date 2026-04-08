import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, Upload, App } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useDatasetContext } from '../../context/DatasetContext';

const { Option } = Select;
const { TextArea } = Input;

const CreateDatasetModal = ({ visible, onCancel, onCreate }) => {
  const [form] = Form.useForm();
  const ctx = useDatasetContext();
  const [fileList, setFileList] = useState([]);
  const { message } = App.useApp();

  const handleUploadChange = (info) => {
    setFileList(info.fileList);
  };

  const beforeUpload = (file) => {
    setFileList([file]);
    return false;
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const datasetName = values.name.toLowerCase().replace(/\s+/g, '-');
      
      // 上传数据集文件
      let datasetPath = '';
      let uploadedImages = [];
      
      if (fileList.length > 0) {
        const formData = new FormData();
        formData.append('dataset_file', fileList[0].originFileObj);
        formData.append('dataset_type', 'compressed');

        try {
          const response = await fetch('http://localhost:8000/api/upload/dataset', {
            method: 'POST',
            body: formData
          });
          const data = await response.json();
          console.log('上传响应:', data);
          if (data.success) {
            datasetPath = data.path || '';
            message.success('数据集文件上传成功！');
            
            // 自动解压并获取图片列表，传递dataset_id
            try {
              const extractResponse = await fetch('http://localhost:8000/api/upload/extract-dataset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  path: data.path,
                  dataset_id: datasetName
                })
              });
              const extractData = await extractResponse.json();
              console.log('解压响应:', extractData);
              if (extractData.success && extractData.data.images) {
                uploadedImages = extractData.data.images;
                message.success(`成功解压并加载 ${uploadedImages.length} 张图片！`);
              }
            } catch (extractError) {
              console.error('解压数据集失败:', extractError);
              // 即使解压失败也继续创建数据集
            }
          } else {
            message.error('数据集文件上传失败: ' + (data.message || '未知错误'));
            return;
          }
        } catch (error) {
          console.error('上传数据集文件失败:', error);
          message.error('数据集文件上传失败: ' + error.message);
          return;
        }
      }

      onCreate({
        ...values,
        datasetPath,
        uploadedImages
      });

      form.resetFields();
      setFileList([]);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    onCancel();
  };

  return (
    <Modal
      title="创建新数据集"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="create" type="primary" onClick={handleOk}>
          创建数据集
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="数据集名称"
          rules={[{ required: true, message: '请输入数据集名称' }]}
        >
          <Input placeholder="例如：我的数据集" />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
          rules={[{ required: true, message: '请输入描述' }]}
        >
          <TextArea rows={3} placeholder="描述数据集的内容和用途" />
        </Form.Item>

        <Form.Item
          name="task"
          label="任务类型"
          rules={[{ required: true, message: '请选择任务类型' }]}
        >
          <Select placeholder="选择任务类型">
            <Option value="detect">目标检测 (Detect)</Option>
            <Option value="segment">实例分割 (Segment)</Option>
            <Option value="classify">图像分类 (Classify)</Option>
            <Option value="pose">姿态估计 (Pose)</Option>
            <Option value="obb">旋转框检测 (OBB)</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="license"
          label="许可证"
          rules={[{ required: true, message: '请选择许可证' }]}
        >
          <Select placeholder="选择许可证">
            <Option value="MIT">MIT</Option>
            <Option value="Apache 2.0">Apache 2.0</Option>
            <Option value="GPL-3.0">GPL-3.0</Option>
            <Option value="BSD-3-Clause">BSD-3-Clause</Option>
            <Option value="CC BY 4.0">CC BY 4.0</Option>
            <Option value="CC BY-NC 4.0">CC BY-NC 4.0</Option>
            <Option value="Private">私有</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="visibility"
          label="可见性"
          rules={[{ required: true, message: '请选择可见性' }]}
        >
          <Select placeholder="选择可见性">
            <Option value="public">公开</Option>
            <Option value="private">私有</Option>
            <Option value="unlisted">未列出</Option>
          </Select>
        </Form.Item>

        <Form.Item label="上传数据集">
          <Upload
            beforeUpload={beforeUpload}
            onChange={handleUploadChange}
            listType="picture"
            maxCount={1}
            accept=".zip,.tar,.tar.gz,.tgz"
            fileList={fileList}
          >
            <Button icon={<UploadOutlined />}>选择数据集压缩包</Button>
          </Upload>
          <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
            支持 .zip, .tar.gz 格式，上传后会自动解压
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateDatasetModal;