import React from 'react';
import { Form, Upload, Button, Row, Col, Slider } from 'antd';
import { UploadOutlined, VideoCameraOutlined } from '@ant-design/icons';

const VideoInference = ({ params, loadingPredict, updateParam, onPredict, form }) => {
  const [fileList, setFileList] = React.useState([]);

  const handleUploadChange = (info) => {
    setFileList(info.fileList);
    // 将文件信息保存到Form中，避免循环引用
    if (info.fileList.length > 0) {
      const file = info.fileList[0];
      form.setFieldValue('video', {
        originFileObj: file.originFileObj,
        name: file.name,
        status: file.status
      });
    } else {
      form.setFieldValue('video', undefined);
    }
  };

  const beforeUpload = (file) => {
    return false;
  };

  return (
    <>
      <Form.Item name="video" label="上传视频" rules={[{ required: true, message: '请上传视频' }]}>
        <Upload
          beforeUpload={beforeUpload}
          onChange={handleUploadChange}
          listType="picture"
          maxCount={1}
          accept=".mp4,.avi,.mov"
          fileList={fileList}
        >
          <Button icon={<UploadOutlined />}>选择视频</Button>
        </Upload>
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label={`置信度阈值`}>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={params.video_conf}
              onChange={(value) => updateParam('video_conf', value)}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label={`IoU 阈值`}>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={params.video_iou}
              onChange={(value) => updateParam('video_iou', value)}
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

export default VideoInference;