import React from 'react';
import { Card, Space, Typography, Divider } from 'antd';

const { Text } = Typography;

const ConfigInfo = () => {
  return (
    <Card title="配置说明" variant="outlined">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text strong>数据集 YAML 文件说明：</Text>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>path: 数据集根目录</li>
          <li>train: 训练图片路径</li>
          <li>val: 验证图片路径</li>
          <li>names: 类别名称字典</li>
        </ul>
        <Divider />
        <Text strong>预训练模型说明：</Text>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>YOLOv8n: 最小模型，速度最快</li>
          <li>YOLOv8s: 小型模型，平衡速度与精度</li>
          <li>YOLOv8m: 中型模型，精度较高</li>
          <li>YOLOv8l/x: 大型模型，精度最高</li>
        </ul>
        <Divider />
        <Text strong>训练参数说明：</Text>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>epochs: 训练总轮数</li>
          <li>batch_size: 每批样本数</li>
          <li>img_size: 输入图像尺寸</li>
          <li>lr0: 初始学习率</li>
          <li>lr: 最终学习率</li>
        </ul>
      </Space>
    </Card>
  );
};

export default ConfigInfo;