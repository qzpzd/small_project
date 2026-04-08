import React from 'react';
import { Modal, Collapse, Row, Col, Card, Spin, Button } from 'antd';

const TrainingVisualization = ({
  showVisualization,
  onHideVisualization,
  trainingResults,
  currentTaskId
}) => {
  return (
    <Modal
      title="训练结果可视化"
      open={showVisualization}
      onCancel={onHideVisualization}
      footer={[
        <Button key="close" onClick={onHideVisualization}>
          关闭
        </Button>
      ]}
      width={1200}
      style={{ top: 20 }}
    >
      {trainingResults.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>加载训练结果中...</p>
        </div>
      ) : (
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Collapse defaultActiveKey={['1']} ghost
            items={[
              {
                key: '1',
                label: '训练曲线图',
                children: (
                  <Row gutter={[16, 16]}>
                    {trainingResults
                      .filter(img => img.category === '训练曲线')
                      .map((img, index) => (
                        <Col span={24} key={index}>
                          <Card size="small" title={img.name}>
                            <div style={{ textAlign: 'center' }}>
                              <img
                                src={`http://localhost:8000/api/train/result-image/${currentTaskId}/${img.name}`}
                                alt={img.name}
                                style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }}
                              />
                            </div>
                          </Card>
                        </Col>
                      ))}
                  </Row>
                )
              },
              {
                key: '2',
                label: '性能指标曲线',
                children: (
                  <Row gutter={[16, 16]}>
                    {trainingResults
                      .filter(img => img.category === '性能指标曲线')
                      .map((img, index) => (
                        <Col span={12} key={index}>
                          <Card size="small" title={img.name} hoverable>
                            <div style={{ textAlign: 'center' }}>
                              <img
                                src={`http://localhost:8000/api/train/result-image/${currentTaskId}/${img.name}`}
                                alt={img.name}
                                style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }}
                              />
                            </div>
                          </Card>
                        </Col>
                      ))}
                  </Row>
                )
              },
              {
                key: '3',
                label: '混淆矩阵',
                children: (
                  <Row gutter={[16, 16]}>
                    {trainingResults
                      .filter(img => img.category === '混淆矩阵')
                      .map((img, index) => (
                        <Col span={12} key={index}>
                          <Card size="small" title={img.name} hoverable>
                            <div style={{ textAlign: 'center' }}>
                              <img
                                src={`http://localhost:8000/api/train/result-image/${currentTaskId}/${img.name}`}
                                alt={img.name}
                                style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }}
                              />
                            </div>
                          </Card>
                        </Col>
                      ))}
                  </Row>
                )
              },
              {
                key: '4',
                label: '标签分析',
                children: (
                  <Row gutter={[16, 16]}>
                    {trainingResults
                      .filter(img => img.category === '标签分析')
                      .map((img, index) => (
                        <Col span={12} key={index}>
                          <Card size="small" title={img.name} hoverable>
                            <div style={{ textAlign: 'center' }}>
                              <img
                                src={`http://localhost:8000/api/train/result-image/${currentTaskId}/${img.name}`}
                                alt={img.name}
                                style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }}
                              />
                            </div>
                          </Card>
                        </Col>
                      ))}
                  </Row>
                )
              },
              {
                key: '5',
                label: '其他结果',
                children: (
                  <Row gutter={[16, 16]}>
                    {trainingResults
                      .filter(img => img.category === '其他')
                      .map((img, index) => (
                        <Col span={12} key={index}>
                          <Card size="small" title={img.name} hoverable>
                            <div style={{ textAlign: 'center' }}>
                              <img
                                src={`http://localhost:8000/api/train/result-image/${currentTaskId}/${img.name}`}
                                alt={img.name}
                                style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }}
                              />
                            </div>
                          </Card>
                        </Col>
                      ))}
                  </Row>
                )
              }
            ]}
          />
        </div>
      )}
    </Modal>
  );
};

export default TrainingVisualization;