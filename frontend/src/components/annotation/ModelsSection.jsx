import React, { useContext, useState, useEffect, useRef } from 'react';
import { App, Card, Empty, Button, Modal, Form, Select, InputNumber, 
  Input, Upload, Progress, List, Tag, Space, 
  Divider, Row, Col, Statistic, Tooltip, Spin, Dropdown, Menu, Image, Tabs
} from 'antd';
import { 
  MoreOutlined, PlusOutlined, PlayCircleOutlined, 
  DownloadOutlined, DeleteOutlined, SettingOutlined, 
  UploadOutlined, RocketOutlined, CheckCircleOutlined,
  ClockCircleOutlined, StopOutlined
} from '@ant-design/icons';
import { useDatasetContext, DatasetContext } from '../../context/DatasetContext';

const { TextArea } = Input;
const { Dragger } = Upload;

const ModelsSection = () => {
  const { message } = App.useApp();
  const ctx = useContext(DatasetContext);
  const [trainModalVisible, setTrainModalVisible] = useState(false);
  const [training, setTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(null);
  const [trainedModels, setTrainedModels] = useState([]);
  const [yamlContent, setYamlContent] = useState('');
  const [form] = Form.useForm();
  const [selectedModel, setSelectedModel] = useState('yolov8n.pt');
  const [modelType, setModelType] = useState('pretrained');
  const [customModels, setCustomModels] = useState([]);
  const [trainingLog, setTrainingLog] = useState([]);
  const [selectedTrainingModel, setSelectedTrainingModel] = useState(null);
  const [modelDetailVisible, setModelDetailVisible] = useState(false);
  const [modelResults, setModelResults] = useState([]);
  const logEndRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // 默认YAML配置
  const defaultYaml = `task: detect
model: yolov8n.pt
pretrained: true
data: datasets/${ctx.currentDataset || 'bottle'}/data.yaml
epochs: 100
batch_size: 16
imgsz: 640
patience: 50
lr0: 0.01
lrf: 0.01
momentum: 0.937
weight_decay: 0.0005
warmup_epochs: 3.0
warmup_momentum: 0.8
warmup_bias_lr: 0.1
box: 7.5
cls: 0.5
dfl: 1.5
hsv_h: 0.015
hsv_s: 0.7
hsv_v: 0.4
degrees: 0.0
translate: 0.1
scale: 0.5
shear: 0.0
perspective: 0.0
flipud: 0.0
fliplr: 0.5
mosaic: 1.0
mixup: 0.0
workers: 8
device: 0
project: runs/detect
name: exp
exist_ok: false
save: true
save_period: -1
cache: false
conf: 0.001
iou: 0.7
max_det: 300
vid_stride: 1
plots: true
show: false
save_json: false
save_hybrid: false
`;

  // 加载自定义模型列表
  useEffect(() => {
    loadCustomModels();
    loadTrainedModels();
  }, []);

  // 自动滚动日志到底部
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [trainingLog]);

  const loadCustomModels = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/train/model-directory');
      const result = await response.json();
      if (result.success) {
        setCustomModels(result.data);
      }
    } catch (error) {
      console.error('加载自定义模型失败:', error);
    }
  };

  const loadTrainedModels = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/train/models');
      const result = await response.json();
      if (result.success) {
        // 过滤模型：只显示当前数据集的模型
        const currentDataset = ctx.currentDataset || 'bottle';
        const filteredModels = result.data.filter(model => {
          if (model.type === 'trained') {
            return model.dataset_name === currentDataset;
          }
          return false; // 不显示手动模型
        });
        
        // 只显示best.pt模型
        const bestModels = filteredModels.filter(model => 
          model.weight_type === 'best'
        );
        
        setTrainedModels(bestModels);
      }
    } catch (error) {
      console.error('加载训练模型失败:', error);
    }
  };

  // 当表单字段值改变时，同步更新YAML内容
  const handleFormFieldChange = (changedFields) => {
    const newValues = form.getFieldsValue();
    
    // 解析当前YAML
    const lines = yamlContent.split('\n');
    const newLines = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('epochs:')) {
        newLines.push(`epochs: ${newValues.epochs || 100}`);
      } else if (trimmed.startsWith('batch_size:')) {
        newLines.push(`batch_size: ${newValues.batch_size || 16}`);
      } else if (trimmed.startsWith('imgsz:')) {
        newLines.push(`imgsz: ${newValues.img_size || 640}`);
      } else if (trimmed.startsWith('data:')) {
        newLines.push(`data: datasets/${ctx.currentDataset || 'bottle'}/data.yaml`);
      } else {
        newLines.push(line);
      }
    });
    
    setYamlContent(newLines.join('\n'));
  };

  const handleOpenTrainModal = () => {
    setTrainModalVisible(true);
    setYamlContent(defaultYaml);
    form.setFieldsValue({
      model: 'yolov8n.pt',
      epochs: 100,
      batch_size: 16,
      img_size: 640,
      run_name: `exp_${Date.now()}`
    });
  };

  const handleStartTraining = async () => {
    try {
      const values = await form.validateFields();
      setTraining(true);
      setTrainingProgress({ epoch: 0, total_epochs: values.epochs, status: 'starting' });
      setTrainingLog(['开始训练...', `配置: ${JSON.stringify(values, null, 2)}`]);

      // 解析YAML配置（提取关键参数）
      let yamlConfig = {};
      try {
        // 手动解析YAML内容，提取关键参数
        const lines = yamlContent.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('lr0:')) {
            yamlConfig.lr0 = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('weight_decay:')) {
            yamlConfig.weight_decay = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('momentum:')) {
            yamlConfig.momentum = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('lrf:')) {
            yamlConfig.lrf = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('warmup_epochs:')) {
            yamlConfig.warmup_epochs = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('warmup_momentum:')) {
            yamlConfig.warmup_momentum = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('warmup_bias_lr:')) {
            yamlConfig.warmup_bias_lr = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('box:')) {
            yamlConfig.box = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('cls:')) {
            yamlConfig.cls = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('dfl:')) {
            yamlConfig.dfl = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('hsv_h:')) {
            yamlConfig.hsv_h = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('hsv_s:')) {
            yamlConfig.hsv_s = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('hsv_v:')) {
            yamlConfig.hsv_v = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('degrees:')) {
            yamlConfig.degrees = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('translate:')) {
            yamlConfig.translate = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('scale:')) {
            yamlConfig.scale = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('shear:')) {
            yamlConfig.shear = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('perspective:')) {
            yamlConfig.perspective = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('flipud:')) {
            yamlConfig.flipud = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('fliplr:')) {
            yamlConfig.fliplr = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('mosaic:')) {
            yamlConfig.mosaic = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('mixup:')) {
            yamlConfig.mixup = parseFloat(trimmed.split(':')[1].trim());
          }
        });
        console.log('解析到的YAML配置:', yamlConfig);
      } catch (error) {
        console.error('YAML解析失败:', error);
      }

      // 准备训练参数
      const trainParams = {
        dataset_yaml: `datasets/${ctx.currentDataset || 'bottle'}/data.yaml`,
        task: 'detect',
        epochs: values.epochs,
        batch_size: values.batch_size,
        img_size: values.img_size,
        lr: yamlConfig.lr0 || 0.01,
        device: '0',
        project: 'runs/detect/train',
        name: values.run_name,
        yaml_config: yamlConfig,
        model: values.model || 'yolov8n.pt'
      };

      // 启动训练
      const response = await fetch('http://localhost:8000/api/train/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainParams)
      });

      const result = await response.json();

      if (result.success) {
        setTrainingLog(prev => [...prev, `训练任务已启动: ${result.task_id}`]);
        
        // 开始轮询训练状态
        startProgressPolling(result.task_id);
      } else {
        throw new Error(result.message || '训练启动失败');
      }
    } catch (error) {
      message.error('训练启动失败: ' + error.message);
      setTraining(false);
      setTrainingProgress(null);
    }
  };

  const startProgressPolling = (taskId) => {
    progressIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/train/status/${taskId}`);
        const result = await response.json();

        if (result.success) {
          const status = result.data;
          
          // 更新训练进度
          setTrainingProgress({
            epoch: status.epoch || 0,
            total_epochs: status.total_epochs || 100,
            status: status.status || 'training',
            loss: status.loss,
            accuracy: status.accuracy,
            mAP: status.map
          });

          // 添加日志
          if (status.log) {
            setTrainingLog(prev => [...prev, status.log]);
          }

          // 检查训练是否完成
          if (status.status === 'completed' || status.status === 'failed' || status.status === 'stopped') {
            clearInterval(progressIntervalRef.current);
            setTraining(false);
            
            if (status.status === 'completed') {
              message.success('训练完成！');
              setTrainingLog(prev => [...prev, '训练完成！']);
              loadTrainedModels(); // 重新加载模型列表
            } else if (status.status === 'failed') {
              message.error('训练失败');
              setTrainingLog(prev => [...prev, `训练失败: ${status.error || '未知错误'}`]);
            } else {
              message.info('训练已停止');
              setTrainingLog(prev => [...prev, '训练已停止']);
            }
          }
        }
      } catch (error) {
        console.error('获取训练状态失败:', error);
      }
    }, 2000); // 每2秒轮询一次
  };

  const handleStopTraining = async () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setTraining(false);
    message.info('训练已停止');
    setTrainingLog(prev => [...prev, '训练已手动停止']);
  };

  const handleDownloadModel = async (modelPath) => {
    try {
      // 直接使用静态文件路径下载
      const response = await fetch(`http://localhost:8000/${modelPath}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = modelPath.split('/').pop();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        message.success('模型下载成功');
      } else {
        message.error('下载失败');
      }
    } catch (error) {
      message.error('下载失败: ' + error.message);
    }
  };

  const handleShowModelDetail = async (model) => {
    setSelectedTrainingModel(model);
    setModelDetailVisible(true);
    
    // 加载训练结果图片
    try {
      // 从模型路径中提取训练结果目录
      const modelPath = model.path;
      const resultsDir = modelPath.replace('/weights/best.pt', '');
      
      // 尝试加载常见的训练结果图片
      const resultImages = [];
      const possibleImages = [
        'results.png',      // 训练曲线
        'confusion_matrix.png',  // 混淆矩阵
        'confusion_matrix_normalized.png',  // 归一化混淆矩阵
        'BoxF1_curve.png',    // F1曲线
        'BoxPR_curve.png',    // PR曲线
        'BoxP_curve.png',     // P曲线
        'BoxR_curve.png',     // R曲线
        'val_batch0_pred.jpg',  // 验证结果
        'val_batch0_labels.jpg',  // 验证标签
        'train_batch0.jpg',    // 训练样本
        'labels.jpg'          // 标签分布
      ];

      for (const imageName of possibleImages) {
        try {
          const imageUrl = `http://localhost:8000/${resultsDir}/${imageName}`;
          const response = await fetch(imageUrl, { method: 'HEAD' });
          if (response.ok) {
            // 分类判断逻辑
            let category = '其他';
            if (imageName.includes('curve') || imageName.includes('matrix')) {
              category = '指标图表';
            } else if (imageName.includes('val')) {
              category = '验证结果';
            } else if (imageName.includes('train') || imageName.includes('labels')) {
              category = '训练样本';
            } else if (imageName === 'results.png') {
              category = '指标图表';
            }
            
            resultImages.push({
              name: imageName,
              url: imageUrl,
              category: category
            });
          }
        } catch (error) {
          // 图片不存在，跳过
        }
      }
      
      setModelResults(resultImages);
    } catch (error) {
      console.error('加载模型详情失败:', error);
    }
  };

  const handleDeleteModel = async (modelPath) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除模型 ${modelPath.split('/').pop()} 吗？`,
      onOk: async () => {
        try {
          const response = await fetch('http://localhost:8000/api/train/delete-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              file_path: modelPath, 
              file_type: 'model' 
            })
          });
          const result = await response.json();
          if (result.success) {
            message.success('模型删除成功');
            loadTrainedModels(); // 重新加载模型列表
          } else {
            message.error(result.message || '删除失败');
          }
        } catch (error) {
          message.error('删除失败: ' + error.message);
        }
      }
    });
  };

  const handleYamlUpload = (info) => {
    const { file } = info;
    const reader = new FileReader();
    reader.onload = (e) => {
      setYamlContent(e.target.result);
      message.success('YAML文件导入成功');
    };
    reader.readAsText(file.originFileObj);
    return false;
  };

  const handleSaveYaml = () => {
    // 这里可以添加保存YAML到服务器的逻辑
    message.success('配置已保存');
  };

  return (
    <div style={{ padding: 24 }}>
      {/* 训练进度卡片 */}
      {training && trainingProgress && (
        <Card 
          title={<><RocketOutlined /> 训练进行中</>}
          style={{ marginBottom: 16, borderRadius: 8, borderColor: '#52c41a' }}
          extra={
            <Button danger icon={<StopOutlined />} onClick={handleStopTraining}>
              停止训练
            </Button>
          }
        >
          <Row gutter={16}>
            <Col span={12}>
              <Progress 
                percent={Math.round((trainingProgress.epoch / trainingProgress.total_epochs) * 100)}
                status="active"
                strokeColor="#52c41a"
                size="default"
              />
              <div style={{ marginTop: 8, color: '#666' }}>
                Epoch: {trainingProgress.epoch} / {trainingProgress.total_epochs}
              </div>
            </Col>
            <Col span={12}>
              <Space size="large">
                {trainingProgress.loss !== undefined && (
                  <Statistic
                    title="Loss"
                    value={trainingProgress.loss}
                    precision={4}
                    valueStyle={{ fontSize: 20 }}
                  />
                )}
                {trainingProgress.mAP !== undefined && (
                  <Statistic
                    title="mAP"
                    value={trainingProgress.mAP}
                    precision={4}
                    valueStyle={{ fontSize: 20, color: '#52c41a' }}
                  />
                )}
              </Space>
            </Col>
          </Row>
          
          <Divider />
          
          <div style={{ 
            background: '#1e1e1e', 
            color: '#d4d4d4', 
            padding: 12, 
            borderRadius: 4, 
            fontFamily: 'monospace',
            fontSize: 12,
            maxHeight: 200,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {trainingLog.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
            <div ref={logEndRef} />
          </div>
        </Card>
      )}

      {/* 已训练模型列表 */}
      <Card 
        title={<><CheckCircleOutlined /> 已训练模型</>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenTrainModal}>
            训练新模型
          </Button>
        }
        style={{ borderRadius: 8, marginBottom: 16 }}
      >
        {trainedModels.length === 0 ? (
          <Empty description="暂无训练模型" />
        ) : (
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 3 }}
            dataSource={trainedModels}
            renderItem={(model) => (
              <List.Item>
                <Card
                  size="small"
                  hoverable
                  onClick={() => handleShowModelDetail(model)}
                  style={{ borderRadius: 8 }}
                  actions={[
                    <Tooltip title="下载模型">
                      <Button 
                        type="text" 
                        icon={<DownloadOutlined />} 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadModel(model.path);
                        }}
                      />
                    </Tooltip>,
                    <Tooltip title="删除模型">
                      <Button 
                        type="text" 
                        danger
                        icon={<DeleteOutlined />} 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteModel(model.path);
                        }}
                      />
                    </Tooltip>
                  ]}
                >
                  <Card.Meta
                    avatar={<RocketOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={model.name}
                    description={
                      <div>
                        <Tag color={model.type === 'trained' ? 'blue' : 'green'}>
                          {model.type === 'trained' ? '训练模型' : '手动模型'}
                        </Tag>
                        {model.type === 'trained' && (
                          <>
                            <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                              数据集: {model.dataset_name || 'unknown'}
                            </div>
                            <div style={{ marginTop: 2, fontSize: 12, color: '#666' }}>
                              训练: {model.train_name || 'unknown'}
                            </div>
                          </>
                        )}
                        <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                          {model.size && `大小: ${(model.size / 1024 / 1024).toFixed(2)} MB`}
                        </div>
                        {model.weight_type && (
                          <div style={{ marginTop: 2, fontSize: 12, color: '#666' }}>
                            权重: {model.weight_type}
                          </div>
                        )}
                      </div>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 训练配置弹窗 */}
      <Modal
        title={<><PlayCircleOutlined /> 训练配置</>}
        open={trainModalVisible}
        onOk={handleStartTraining}
        onCancel={() => setTrainModalVisible(false)}
        width={800}
        okText="开始训练"
        cancelText="取消"
        okButtonProps={{ loading: training }}
      >
        <Form form={form} layout="vertical" onValuesChange={handleFormFieldChange}>
          {/* 模型选择 */}
          <Form.Item label="选择模型">
            <Row gutter={16}>
              <Col span={8}>
                <Select
                  value={modelType}
                  onChange={setModelType}
                  options={[
                    { label: '预训练模型', value: 'pretrained' },
                    { label: '自定义模型', value: 'custom' }
                  ]}
                />
              </Col>
              <Col span={16}>
                {modelType === 'pretrained' ? (
                  <Select
                    value={selectedModel}
                    onChange={setSelectedModel}
                    options={[
                      { label: 'YOLOv8n (Nano)', value: 'yolov8n.pt' },
                      { label: 'YOLOv8s (Small)', value: 'yolov8s.pt' },
                      { label: 'YOLOv8m (Medium)', value: 'yolov8m.pt' },
                      { label: 'YOLOv8l (Large)', value: 'yolov8l.pt' },
                      { label: 'YOLOv8x (XLarge)', value: 'yolov8x.pt' }
                    ]}
                  />
                ) : (
                  <Select
                    placeholder="选择自定义模型"
                    options={customModels.map(m => ({ label: m.name, value: m.path }))}
                  />
                )}
              </Col>
            </Row>
          </Form.Item>

          {/* 数据集 */}
          <Form.Item label="数据集">
            <Input value={ctx.currentDataset || 'bottle'} disabled />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              使用当前选中的数据集，无法更改
            </div>
          </Form.Item>

          {/* 超参数配置 */}
          <Form.Item label="训练参数">
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Epochs" name="epochs" initialValue={100}>
                  <InputNumber min={1} max={1000} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Batch Size" name="batch_size" initialValue={16}>
                  <InputNumber min={1} max={128} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Image Size" name="img_size" initialValue={640}>
                  <InputNumber min={32} max={1280} step={32} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Run Name" name="run_name" initialValue={`exp_${Date.now()}`}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>

          {/* 高级设置 */}
          <Form.Item 
            label={
              <Space>
                <SettingOutlined />
                <span style={{ fontSize: 16, fontWeight: 500, color: '#1890ff' }}>高级设置</span>
              </Space>
            }
          >
            <div style={{ marginBottom: 8 }}>
              <Upload.Dragger
                accept=".yaml,.yml"
                showUploadList={false}
                beforeUpload={handleYamlUpload}
                style={{ padding: '16px 24px' }}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined style={{ fontSize: 32 }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: 14 }}>拖拽YAML文件到此处，或点击上传</p>
              </Upload.Dragger>
            </div>
            <TextArea
              value={yamlContent}
              onChange={(e) => setYamlContent(e.target.value)}
              rows={12}
              style={{ 
                fontFamily: 'monospace', 
                fontSize: 14,
                color: '#1890ff',
                textDecoration: 'none'
              }}
              placeholder="YAML配置内容..."
            />
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <Button size="small" onClick={handleSaveYaml}>
                保存配置
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 模型详情弹窗 */}
      <Modal
        title={<><RocketOutlined /> 模型训练结果</>}
        open={modelDetailVisible}
        onCancel={() => setModelDetailVisible(false)}
        footer={null}
        width={1200}
        style={{ top: 20 }}
        styles={{ body: { backgroundColor: '#f5f5f5' } }}
      >
        {selectedTrainingModel && (
          <div>
            {/* 模型基本信息 */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="数据集" value={selectedTrainingModel.dataset_name || 'unknown'} />
                </Col>
                <Col span={6}>
                  <Statistic title="训练名称" value={selectedTrainingModel.train_name || 'unknown'} />
                </Col>
                <Col span={6}>
                  <Statistic title="模型大小" value={`${(selectedTrainingModel.size / 1024 / 1024).toFixed(2)} MB`} />
                </Col>
                <Col span={6}>
                  <Statistic title="权重类型" value={selectedTrainingModel.weight_type || 'best'} />
                </Col>
              </Row>
            </Card>

            {/* 训练结果分类展示 */}
            <Tabs 
              defaultActiveKey="all"
              items={[
                {
                  key: 'all',
                  label: '全部结果',
                  children: (
                    <Row gutter={[16, 16]}>
                      {modelResults.length === 0 ? (
                        <Col span={24}>
                          <Empty description="暂无训练结果图片" />
                        </Col>
                      ) : (
                        modelResults.map((result, index) => (
                          <Col span={8} key={index}>
                            <Card
                              size="small"
                              hoverable
                              cover={
                                <div style={{ height: 200, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                                  <Image
                                    alt={result.name}
                                    src={result.url}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    preview={{
                                      mask: <div style={{ color: 'white' }}>点击预览</div>
                                    }}
                                  />
                                </div>
                              }
                            >
                              <Card.Meta
                                title={result.name}
                                description={<Tag color="blue">{result.category}</Tag>}
                              />
                            </Card>
                          </Col>
                        ))
                      )}
                    </Row>
                  )
                },
                {
                  key: 'metrics',
                  label: '指标图表',
                  children: (
                    <Row gutter={[16, 16]}>
                      {modelResults.filter(r => r.category === '指标图表').map((result, index) => (
                        <Col span={12} key={index}>
                          <Card
                            size="small"
                            title={result.name}
                            cover={
                              <div style={{ height: 300, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                                <Image
                                  alt={result.name}
                                  src={result.url}
                                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  preview={{
                                    mask: <div style={{ color: 'white' }}>点击预览</div>
                                    }}
                                />
                              </div>
                            }
                          />
                        </Col>
                      ))}
                    </Row>
                  )
                },
                {
                  key: 'validation',
                  label: '验证结果',
                  children: (
                    <Row gutter={[16, 16]}>
                      {modelResults.filter(r => r.category === '验证结果').map((result, index) => (
                        <Col span={12} key={index}>
                          <Card
                            size="small"
                            title={result.name}
                            cover={
                              <div style={{ height: 300, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                                <Image
                                  alt={result.name}
                                  src={result.url}
                                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  preview={{
                                    mask: <div style={{ color: 'white' }}>点击预览</div>
                                    }}
                                />
                              </div>
                            }
                          />
                        </Col>
                      ))}
                    </Row>
                  )
                },
                {
                  key: 'samples',
                  label: '训练样本',
                  children: (
                    <Row gutter={[16, 16]}>
                      {modelResults.filter(r => r.category === '训练样本').map((result, index) => (
                        <Col span={12} key={index}>
                          <Card
                            size="small"
                            title={result.name}
                            cover={
                              <div style={{ height: 300, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                                <Image
                                  alt={result.name}
                                  src={result.url}
                                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  preview={{
                                    mask: <div style={{ color: 'white' }}>点击预览</div>
                                    }}
                                />
                              </div>
                            }
                          />
                        </Col>
                      ))}
                    </Row>
                  )
                }
              ]}
            />

            {/* 操作按钮 */}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Space>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadModel(selectedTrainingModel.path)}
                >
                  下载模型
                </Button>
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    setModelDetailVisible(false);
                    handleDeleteModel(selectedTrainingModel.path);
                  }}
                >
                  删除模型
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ModelsSection;