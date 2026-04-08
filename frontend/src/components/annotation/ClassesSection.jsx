import React, { useContext } from 'react';
import { Card, Empty, Progress, Divider, Tag, Row, Col, Statistic } from 'antd';
import { BlockOutlined, PieChartOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useDatasetContext, DatasetContext } from '../../context/DatasetContext';

const ClassesSection = () => {
  const ctx = useContext(DatasetContext);
  const maxCount = Math.max(...ctx.labels.map(l => l.count), 1);
  const totalLabels = ctx.labels.reduce((sum, label) => sum + label.count, 0);

  // 准备饼图数据
  const pieData = ctx.labels.map(label => ({
    name: label.name,
    value: label.count,
    color: label.color
  }));

  // 准备柱状图数据
  const barData = ctx.labels.map(label => ({
    name: label.name,
    count: label.count
  }));

  const COLORS = ctx.labels.map(l => l.color);

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

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: '#fff', 
          border: '1px solid #d9d9d9', 
          borderRadius: '4px', 
          padding: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{payload[0].name}</p>
          <p style={{ margin: '4px 0 0', color: '#666' }}>
            数量: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]}>
        {/* 类别分布饼图 */}
        <Col xs={24} lg={12}>
          <Card 
            title={<><PieChartOutlined /> 类别分布</>}
            style={{ borderRadius: 8, height: '100%' }}
          >
            {ctx.labels.length === 0 ? (
              <Empty description="暂无类别" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            ) : (
              <div style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        {/* 类别统计详情 */}
        <Col xs={24} lg={12}>
          <Card 
            title={<><BlockOutlined /> 类别统计</>}
            style={{ borderRadius: 8, height: '100%' }}
          >
            {ctx.labels.length === 0 ? (
              <Empty description="暂无类别" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            ) : (
              <div>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={8}>
                    <Statistic
                      title="类别总数"
                      value={ctx.labels.length}
                      valueStyle={{ color: '#1890ff', fontSize: 28 }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="标注总数"
                      value={totalLabels}
                      valueStyle={{ color: '#52c41a', fontSize: 28 }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="平均每类"
                      value={totalLabels > 0 ? (totalLabels / ctx.labels.length).toFixed(1) : 0}
                      valueStyle={{ color: '#faad14', fontSize: 28 }}
                    />
                  </Col>
                </Row>

                <Divider />

                <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                  {ctx.labels.map((label, index) => (
                    <div key={label.id} style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ 
                            width: 14, 
                            height: 14, 
                            borderRadius: '50%', 
                            background: label.color, 
                            display: 'inline-block', 
                            marginRight: 10,
                            verticalAlign: 'middle',
                            border: '2px solid #fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                          <span style={{ fontWeight: 500 }}>{label.name}</span>
                        </span>
                        <Tag 
                          color={label.color}
                          style={{ 
                            fontSize: 13, 
                            fontWeight: 'bold',
                            padding: '2px 10px',
                            borderRadius: '12px'
                          }}
                        >
                          {label.count} ({((label.count / totalLabels) * 100).toFixed(1)}%)
                        </Tag>
                      </div>
                      <Progress 
                        percent={Math.round((label.count / maxCount) * 100)} 
                        strokeColor={label.color}
                        showInfo={false}
                        size="small"
                        style={{ marginBottom: 4 }}
                      />
                      <div style={{ 
                        fontSize: 11, 
                        color: '#999', 
                        textAlign: 'right',
                        marginTop: 2
                      }}>
                        占比: {((label.count / totalLabels) * 100).toFixed(2)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ClassesSection;