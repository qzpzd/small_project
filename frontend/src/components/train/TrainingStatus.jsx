import React from 'react';
import { Card, Progress, Space, Typography, Divider, Row, Col, Tag, Alert, Button, Spin } from 'antd';
import { PlayCircleOutlined, ExperimentOutlined, StopOutlined, DownloadOutlined } from '@ant-design/icons';

const { Text } = Typography;

const TrainingStatus = ({ training, status, progress, trainingCurves, onShowVisualization, onStopTraining, onDownloadModel }) => {
  return (
    <Card title="训练状态" variant="outlined">
      {training || status?.status === 'completed' ? (
        <div>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text strong>训练进度</Text>
              <Progress
                percent={progress}
                status={status?.status === 'completed' ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
            </div>

            {status && (
              <>
                <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Row gutter={[16, 8]}>
                      <Col span={12}>
                        <Text strong>状态: </Text>
                        <Tag color={status.status === 'completed' ? 'success' : status.status === 'failed' ? 'error' : 'processing'}>
                          {status.status === 'completed' ? '已完成' : status.status === 'failed' ? '失败' : '训练中'}
                        </Tag>
                      </Col>
                      <Col span={12}>
                        <Text strong>当前轮数: </Text>
                        <Text>{status.epoch || 0} / {status.total_epochs || 0}</Text>
                      </Col>
                    </Row>

                    {training && (
                      <Button
                        type="primary"
                        danger
                        onClick={onStopTraining}
                        icon={<StopOutlined />}
                        block
                      >
                        停止训练
                      </Button>
                    )}

                    <Divider style={{ margin: '8px 0' }} />

                    <Row gutter={[16, 8]}>
                      <Col span={12}>
                        <Text strong>损失: </Text>
                        <Text>{status.loss !== undefined ? status.loss.toFixed(4) : 'N/A'}</Text>
                      </Col>
                      <Col span={12}>
                        <Text strong>学习率: </Text>
                        <Text>{status.lr !== undefined ? status.lr.toFixed(6) : 'N/A'}</Text>
                      </Col>
                    </Row>

                    <Row gutter={[16, 8]}>
                      <Col span={12}>
                        <Text strong>mAP50: </Text>
                        <Text>{status.map50 !== undefined ? status.map50.toFixed(4) : 'N/A'}</Text>
                      </Col>
                      <Col span={12}>
                        <Text strong>mAP50-95: </Text>
                        <Text>{status.map50_95 !== undefined ? status.map50_95.toFixed(4) : 'N/A'}</Text>
                      </Col>
                    </Row>

                    {status.status === 'completed' && status.model_path && (
                      <div style={{ marginTop: 8 }}>
                        <Text strong>模型路径: </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{status.model_path}</Text>
                      </div>
                    )}

                    {status.status === 'completed' && (
                      <Button
                        type="primary"
                        onClick={onShowVisualization}
                        block
                        icon={<ExperimentOutlined />}
                        style={{ marginTop: 8 }}
                      >
                        查看训练结果可视化
                      </Button>
                    )}

                    {status.status === 'completed' && status.model_path && (
                      <Button
                        type="default"
                        onClick={onDownloadModel}
                        block
                        icon={<DownloadOutlined />}
                        style={{ marginTop: 8 }}
                      >
                        下载 best.pt 模型
                      </Button>
                    )}

                    {status.error && (
                      <Alert
                        message="训练失败"
                        description={status.error}
                        type="error"
                        showIcon
                      />
                    )}
                  </Space>
                </div>
              </>
            )}

            {trainingCurves && (
              <div>
                <Text strong>训练曲线</Text>
                <div style={{ marginTop: 8, textAlign: 'center' }}>
                  <img
                    src={trainingCurves}
                    alt="训练曲线"
                    style={{ maxWidth: '100%', height: 'auto', border: '1px solid #d9d9d9', borderRadius: 8 }}
                  />
                </div>
              </div>
            )}
          </Space>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <PlayCircleOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
          <p style={{ marginTop: 16, color: '#999' }}>
            等待开始训练...
          </p>
        </div>
      )}
    </Card>
  );
};

export default TrainingStatus;