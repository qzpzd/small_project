import React from 'react';
import { Card, Space, Typography, Divider, Table, Alert, Button } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';

const { Text } = Typography;

const InferenceResult = ({ inferenceResult, onDownload }) => {
  if (!inferenceResult) return null;

  return (
    <Card
      title={
        <Space>
          <SearchOutlined />
          <span>推理结果</span>
          {(inferenceResult.type === 'video' || inferenceResult.type === 'directory') && (
            <Button
              type="primary"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => onDownload(inferenceResult.data.result_id)}
            >
              下载结果
            </Button>
          )}
        </Space>
      }
      variant="outlined"
      style={{ marginTop: 24 }}
    >
      {inferenceResult.type === 'image' && (
        <div>
          <img
            src={`data:image/jpeg;base64,${inferenceResult.data.image}`}
            alt="推理结果"
            style={{ width: '100%', borderRadius: 8 }}
          />
          <Divider />
          <Text strong>检测到 {inferenceResult.data.detections?.length || 0} 个目标</Text>
          {inferenceResult.data.detections && inferenceResult.data.detections.length > 0 && (
            <Table
              dataSource={inferenceResult.data.detections.map((item, index) => ({ ...item, id: index }))}
              rowKey="id"
              columns={[
                { title: '类别', dataIndex: 'class', key: 'class' },
                {
                  title: '置信度',
                  dataIndex: 'confidence',
                  key: 'conf',
                  render: (v) => `${(v * 100).toFixed(1)}%`
                },
                {
                  title: '位置',
                  dataIndex: 'bbox',
                  key: 'bbox',
                  render: (v) => `(${v.map(n => n.toFixed(0)).join(', ')})`
                }
              ]}
              size="small"
              style={{ marginTop: 16 }}
              pagination={false}
            />
          )}
        </div>
      )}

      {inferenceResult.type === 'video' && (
        <div>
          <Alert
            message={
              <Space direction="vertical">
                <Text>视频处理完成！</Text>
                <Text>总帧数: {inferenceResult.data.frame_count}</Text>
                <Text>检测到目标总数: {inferenceResult.data.total_detections}</Text>
              </Space>
            }
            type="success"
            showIcon
          />
        </div>
      )}

      {inferenceResult.type === 'directory' && (
        <div>
          <Alert
            message={
              <Space direction="vertical">
                <Text>批量推理完成！</Text>
                <Text>总文件数: {inferenceResult.data.total_files}</Text>
                <Text>处理成功: {inferenceResult.data.processed_files}</Text>
              </Space>
            }
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Table
            dataSource={inferenceResult.data.results.map((item, index) => ({ ...item, id: index }))}
            rowKey="id"
            columns={[
              { title: '文件名', dataIndex: 'file_name', key: 'file_name' },
              { title: '检测数量', dataIndex: 'detections_count', key: 'count' }
            ]}
            size="small"
            pagination={false}
          />
        </div>
      )}
    </Card>
  );
};

export default InferenceResult;