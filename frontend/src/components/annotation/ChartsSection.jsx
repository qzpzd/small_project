import React, { useContext } from 'react';
import { Card, Empty, Statistic, Row, Col, Divider, Progress, List, Tag } from 'antd';
import { LineChartOutlined, FileImageOutlined, TagsOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { useDatasetContext, DatasetContext } from '../../context/DatasetContext';

const ChartsSection = () => {
  const ctx = useContext(DatasetContext);
  const trainCount = ctx.allImages.filter(i => i.split === 'train').length;
  const valCount = ctx.allImages.filter(i => i.split === 'val').length;
  const testCount = ctx.allImages.filter(i => i.split === 'test').length;
  const totalCount = trainCount + valCount + testCount;
  
  // 标注统计
  const labeledImages = ctx.allImages.filter(i => i.labeled && i.boxes && i.boxes.length > 0);
  const unlabeledImages = ctx.allImages.filter(i => !i.labeled || !i.boxes || i.boxes.length === 0);
  const totalBoxes = ctx.allImages.reduce((sum, img) => sum + (img.boxes ? img.boxes.length : 0), 0);
  const avgBoxesPerImage = labeledImages.length > 0 ? (totalBoxes / labeledImages.length).toFixed(1) : 0;

  // 数据集分割饼图数据
  const splitData = [
    { name: 'Train', value: trainCount, color: '#52c41a' },
    { name: 'Val', value: valCount, color: '#1890ff' },
    { name: 'Test', value: testCount, color: '#faad14' }
  ].filter(d => d.value > 0);

  // 标注状态饼图数据
  const labelStatusData = [
    { name: '已标注', value: labeledImages.length, color: '#52c41a' },
    { name: '未标注', value: unlabeledImages.length, color: '#ff4d4f' }
  ].filter(d => d.value > 0);

  // 类别标注分布数据
  const classDistributionData = ctx.labels.map(label => ({
    name: label.name,
    count: label.count,
    color: label.color
  }));

  // 每个分割的标注统计
  const trainLabeled = labeledImages.filter(i => i.split === 'train').length;
  const valLabeled = labeledImages.filter(i => i.split === 'val').length;
  const testLabeled = labeledImages.filter(i => i.split === 'test').length;

  const splitLabelData = [
    { name: 'Train', images: trainCount, labeled: trainLabeled },
    { name: 'Val', images: valCount, labeled: valLabeled },
    { name: 'Test', images: testCount, labeled: testLabeled }
  ].filter(d => d.images > 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: '#fff', 
          border: '1px solid #d9d9d9', 
          borderRadius: '4px', 
          padding: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: '4px 0 0', color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]}>
        {/* 数据集分割分布 */}
        <Col xs={24} lg={8}>
          <Card 
            title={<><LineChartOutlined /> 数据集分割</>}
            style={{ borderRadius: 8, height: '100%' }}
          >
            {totalCount === 0 ? (
              <Empty description="暂无数据" style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            ) : (
              <div>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Statistic
                      title="Train"
                      value={trainCount}
                      valueStyle={{ color: '#52c41a', fontSize: 24 }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Val"
                      value={valCount}
                      valueStyle={{ color: '#1890ff', fontSize: 24 }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Test"
                      value={testCount}
                      valueStyle={{ color: '#faad14', fontSize: 24 }}
                    />
                  </Col>
                </Row>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={splitData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {splitData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* 标注进度 */}
        <Col xs={24} lg={8}>
          <Card 
            title={<><CheckCircleOutlined /> 标注进度</>}
            style={{ borderRadius: 8, height: '100%' }}
          >
            {totalCount === 0 ? (
              <Empty description="暂无数据" style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            ) : (
              <div>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={12}>
                    <Statistic
                      title="已标注"
                      value={labeledImages.length}
                      valueStyle={{ color: '#52c41a', fontSize: 24 }}
                      suffix={`/ ${totalCount}`}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="完成率"
                      value={totalCount > 0 ? ((labeledImages.length / totalCount) * 100).toFixed(1) : 0}
                      suffix="%"
                      valueStyle={{ color: '#1890ff', fontSize: 24 }}
                    />
                  </Col>
                </Row>
                <Progress 
                  type="circle" 
                  percent={totalCount > 0 ? Math.round((labeledImages.length / totalCount) * 100) : 0}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  width={140}
                  style={{ marginTop: 16 }}
                />
              </div>
            )}
          </Card>
        </Col>

        {/* 标注统计 */}
        <Col xs={24} lg={8}>
          <Card 
            title={<><TagsOutlined /> 标注统计</>}
            style={{ borderRadius: 8, height: '100%' }}
          >
            {totalCount === 0 ? (
              <Empty description="暂无数据" style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            ) : (
              <div>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={12}>
                    <Statistic
                      title="总标注框"
                      value={totalBoxes}
                      valueStyle={{ color: '#722ed1', fontSize: 24 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="平均/图"
                      value={avgBoxesPerImage}
                      valueStyle={{ color: '#faad14', fontSize: 24 }}
                    />
                  </Col>
                </Row>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={labelStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {labelStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* 各分割标注进度 */}
        <Col xs={24} lg={12}>
          <Card 
            title="各分割标注详情"
            style={{ borderRadius: 8 }}
          >
            {totalCount === 0 ? (
              <Empty description="暂无数据" />
            ) : (
              <div>
                {splitLabelData.map(split => (
                  <div key={split.name} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Tag color={split.name === 'Train' ? 'green' : split.name === 'Val' ? 'blue' : 'orange'}>
                        {split.name}
                      </Tag>
                      <span style={{ fontSize: 13, color: '#666' }}>
                        {split.labeled} / {split.images}
                      </span>
                    </div>
                    <Progress 
                      percent={split.images > 0 ? Math.round((split.labeled / split.images) * 100) : 0}
                      strokeColor={split.name === 'Train' ? '#52c41a' : split.name === 'Val' ? '#1890ff' : '#faad14'}
                      showInfo={false}
                    />
                  </div>
                ))}
                <Divider />
                <div style={{ textAlign: 'center', color: '#666', fontSize: 13 }}>
                  总计: {labeledImages.length} / {totalCount} ({totalCount > 0 ? ((labeledImages.length / totalCount) * 100).toFixed(1) : 0}%)
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* 类别标注分布 */}
        <Col xs={24} lg={12}>
          <Card 
            title="类别标注分布"
            style={{ borderRadius: 8 }}
          >
            {ctx.labels.length === 0 ? (
              <Empty description="暂无类别" />
            ) : (
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#1890ff">
                      {classDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ChartsSection;