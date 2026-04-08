import React from 'react';
import { Card, Form, Select, Slider, InputNumber, Button, Row, Col, Divider, Space, Input } from 'antd';
import { SettingOutlined, PlayCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

const TrainingParams = ({ params, loading, training, updateParam, onSubmit }) => {
  return (
    <Card
      title={
        <Space>
          <SettingOutlined />
          <span>训练参数配置</span>
        </Space>
      }
      variant="outlined"
    >
      <Form layout="vertical" onFinish={onSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="任务类型">
              <Select value={params.task} onChange={(value) => updateParam('task', value)}>
                <Option value="detect">目标检测 (Detect)</Option>
                <Option value="segment">实例分割 (Segment)</Option>
                <Option value="classify">图像分类 (Classify)</Option>
                <Option value="pose">姿态估计 (Pose)</Option>
                <Option value="obb">旋转框检测 (OBB)</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="设备">
              <Select value={params.device} onChange={(value) => updateParam('device', value)}>
                <Option value="0">GPU 0 (推荐)</Option>
                <Option value="1">GPU 1</Option>
                <Option value="cpu">CPU</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={`训练轮数: ${params.epochs}`}>
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  min={1}
                  max={500}
                  value={params.epochs}
                  onChange={(value) => updateParam('epochs', value)}
                  style={{ flex: 1 }}
                />
                <Slider
                  min={1}
                  max={500}
                  value={params.epochs}
                  onChange={(value) => updateParam('epochs', value)}
                  style={{ flex: 2 }}
                />
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={`批次大小: ${params.batch_size}`}>
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  min={1}
                  max={64}
                  value={params.batch_size}
                  onChange={(value) => updateParam('batch_size', value)}
                  style={{ flex: 1 }}
                />
                <Slider
                  min={1}
                  max={64}
                  value={params.batch_size}
                  onChange={(value) => updateParam('batch_size', value)}
                  style={{ flex: 2 }}
                />
              </Space.Compact>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={`图像大小: ${params.img_size}`}>
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  min={320}
                  max={1280}
                  step={32}
                  value={params.img_size}
                  onChange={(value) => updateParam('img_size', value)}
                  style={{ flex: 1 }}
                />
                <Slider
                  min={320}
                  max={1280}
                  step={32}
                  value={params.img_size}
                  onChange={(value) => updateParam('img_size', value)}
                  style={{ flex: 2 }}
                />
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={`数据加载线程: ${params.workers}`}>
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  min={1}
                  max={16}
                  value={params.workers}
                  onChange={(value) => updateParam('workers', value)}
                  style={{ flex: 1 }}
                />
                <Slider
                  min={1}
                  max={16}
                  value={params.workers}
                  onChange={(value) => updateParam('workers', value)}
                  style={{ flex: 2 }}
                />
              </Space.Compact>
            </Form.Item>
          </Col>
        </Row>

        <Divider>优化器参数</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={`初始学习率: ${params.lr0}`}>
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  min={0.0001}
                  max={0.1}
                  step={0.0001}
                  value={params.lr0}
                  onChange={(value) => updateParam('lr0', value)}
                  style={{ flex: 1 }}
                />
                <Slider
                  min={0.0001}
                  max={0.1}
                  step={0.0001}
                  value={params.lr0}
                  onChange={(value) => updateParam('lr0', value)}
                  style={{ flex: 2 }}
                />
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={`最终学习率: ${params.lr}`}>
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  min={0.0001}
                  max={0.1}
                  step={0.0001}
                  value={params.lr}
                  onChange={(value) => updateParam('lr', value)}
                  style={{ flex: 1 }}
                />
                <Slider
                  min={0.0001}
                  max={0.1}
                  step={0.0001}
                  value={params.lr}
                  onChange={(value) => updateParam('lr', value)}
                  style={{ flex: 2 }}
                />
              </Space.Compact>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label={`动量: ${params.momentum}`}>
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  min={0}
                  max={1}
                  step={0.001}
                  value={params.momentum}
                  onChange={(value) => updateParam('momentum', value)}
                  style={{ flex: 1 }}
                />
                <Slider
                  min={0}
                  max={1}
                  step={0.001}
                  value={params.momentum}
                  onChange={(value) => updateParam('momentum', value)}
                  style={{ flex: 2 }}
                />
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={`权重衰减: ${params.weight_decay}`}>
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  min={0}
                  max={0.01}
                  step={0.0001}
                  value={params.weight_decay}
                  onChange={(value) => updateParam('weight_decay', value)}
                  style={{ flex: 1 }}
                />
                <Slider
                  min={0}
                  max={0.01}
                  step={0.0001}
                  value={params.weight_decay}
                  onChange={(value) => updateParam('weight_decay', value)}
                  style={{ flex: 2 }}
                />
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={`预热轮数: ${params.warmup_epochs}`}>
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  min={0}
                  max={10}
                  value={params.warmup_epochs}
                  onChange={(value) => updateParam('warmup_epochs', value)}
                  style={{ flex: 1 }}
                />
                <Slider
                  min={0}
                  max={10}
                  value={params.warmup_epochs}
                  onChange={(value) => updateParam('warmup_epochs', value)}
                  style={{ flex: 2 }}
                />
              </Space.Compact>
            </Form.Item>
          </Col>
        </Row>

        <Divider>输出配置</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="项目目录">
              <Input
                value={params.project}
                onChange={(e) => updateParam('project', e.target.value)}
                placeholder="runs/train"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="实验名称">
              <Input
                value={params.name}
                onChange={(e) => updateParam('name', e.target.value)}
                placeholder="exp"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading || training}
            disabled={training}
            block
            size="large"
            icon={<PlayCircleOutlined />}
          >
            开始训练
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default TrainingParams;