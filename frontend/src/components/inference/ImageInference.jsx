import React from 'react';
import { Form, Upload, Button, Row, Col, Slider } from 'antd';
import { UploadOutlined, FileImageOutlined } from '@ant-design/icons';

const ImageInference = ({ params, loadingPredict, updateParam, onPredict, form }) => {
  const [fileList, setFileList] = React.useState([]);

  const handleUploadChange = (info) => {
    setFileList(info.fileList);
    // 将文件信息保存到Form中，避免循环引用
    if (info.fileList.length > 0) {
      const file = info.fileList[0];
      form.setFieldValue('image', {
        originFileObj: file.originFileObj,
        name: file.name,
        status: file.status
      });
    } else {
      form.setFieldValue('image', undefined);
    }
  };

  const beforeUpload = (file) => {
    return false;
  };

  return (
    <>
      <Form.Item name="image" label="上传图片" rules={[{ required: true, message: '请上传图片' }]}>
        <Upload
          beforeUpload={beforeUpload}
          onChange={handleUploadChange}
          listType="picture"
          maxCount={1}
          fileList={fileList}
        >
          <Button icon={<UploadOutlined />}>选择图片</Button>
        </Upload>
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label={`置信度阈值`}>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={params.image_conf}
              onChange={(value) => updateParam('image_conf', value)}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label={`IoU 阈值`}>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={params.image_iou}
              onChange={(value) => updateParam('image_iou', value)}
            />
          </Form.Item>
        </Col>
      </Row>

      <Button type="primary" onClick={onPredict} loading={loadingPredict} block>
        开始推理
      </Button>
    </>
  );
};

export default ImageInference;