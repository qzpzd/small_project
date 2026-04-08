import React from 'react';
import { Alert, Button, Row, Col, Slider, Space, Tag, Typography } from 'antd';
import { CameraOutlined } from '@ant-design/icons';

const { Text } = Typography;

const CameraInference = ({
  params,
  cameraRunning,
  cameraFrame,
  cameraDetections,
  updateParam,
  onStartCamera,
  onStopCamera
}) => {
  return (
    <>
      <Alert
        message="使用浏览器摄像头进行实时推理"
        description="点击启动摄像头后，浏览器将请求摄像头权限，获取您的摄像头画面进行推理。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16}>
        <Col span={12}>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={params.camera_conf}
            onChange={(value) => updateParam('camera_conf', value)}
            tooltip={{ formatter: (value) => `置信度: ${(value * 100).toFixed(0)}%` }}
          />
        </Col>
        <Col span={12}>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={params.camera_iou}
            onChange={(value) => updateParam('camera_iou', value)}
            tooltip={{ formatter: (value) => `IoU: ${(value * 100).toFixed(0)}%` }}
          />
        </Col>
      </Row>

      <Space>
        {!cameraRunning ? (
          <Button type="primary" onClick={onStartCamera} icon={<CameraOutlined />}>
            启动摄像头
          </Button>
        ) : (
          <Button danger onClick={onStopCamera}>
            停止摄像头
          </Button>
        )}
      </Space>

      {cameraFrame && (
        <div style={{ marginTop: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>实时推理画面</Text>
              <Tag color="blue" style={{ marginLeft: 16 }}>
                检测到 {cameraDetections.length} 个目标
              </Tag>
            </div>
            <img
              src={`data:image/jpeg;base64,${cameraFrame}`}
              alt="摄像头画面"
              style={{
                width: '100%',
                borderRadius: 8,
                marginTop: 8,
                border: '2px solid #1890ff'
              }}
            />
            {cameraDetections.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <Text strong>检测目标列表：</Text>
                <div style={{ marginTop: 8 }}>
                  {cameraDetections.map((det, index) => (
                    <Tag key={index} color="green" style={{ margin: '4px' }}>
                      {det.class} ({det.confidence.toFixed(3)})
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </Space>
        </div>
      )}
    </>
  );
};

export default CameraInference;