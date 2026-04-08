import React, { useContext, useState, useEffect } from 'react';
import { Layout, Tabs, ConfigProvider, Dropdown, Tag, Button, Tooltip, Upload, Modal, App, Form, InputNumber, Input, Select, Row, Col } from 'antd';
import { useLocation } from 'react-router-dom';
const { Header, Content } = Layout;
const { Dragger } = Upload;
import { FolderOpenOutlined, BlockOutlined, LineChartOutlined, MoreOutlined, PlusOutlined, UploadOutlined, DownloadOutlined, SyncOutlined, DeleteOutlined, AppstoreOutlined, PlayCircleOutlined, SettingOutlined, RocketOutlined } from '@ant-design/icons';
import DatasetProvider, { DatasetContext } from '../context/DatasetContext';
import AnnotationView from '../components/annotation/AnnotationView';
import ImagesSection from '../components/annotation/ImagesSection';
import ClassesSection from '../components/annotation/ClassesSection';
import ChartsSection from '../components/annotation/ChartsSection';
import ModelsSection from '../components/annotation/ModelsSection';
import StatsAndDescription from '../components/annotation/StatsAndDescription';
import CreateDatasetModal from '../components/annotation/CreateDatasetModal';

const Annotation = () => {
  const { message } = App.useApp();
  const ctx = useContext(DatasetContext);
  const [uploadFileList, setUploadFileList] = useState([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [trainModalVisible, setTrainModalVisible] = useState(false);
  const [yamlContent, setYamlContent] = useState('');
  const [form] = Form.useForm();
  const [customModels, setCustomModels] = useState([]);
  const [modelType, setModelType] = useState('pretrained');
  const [license, setLicense] = useState('MIT');
  const location = useLocation();

  const commonLicenses = [
    'MIT',
    'Apache-2.0',
    'GPL-3.0',
    'BSD-3-Clause',
    'CC BY 4.0',
    'CC BY-SA 4.0',
    'CC BY-NC 4.0',
    'Public Domain',
    'Proprietary'
  ];
  const currentDatasetName = ctx.datasets.find(d => d.id === ctx.currentDataset)?.name || 'bottle';

  // 计算数据集信息
  const getDatasetInfo = () => {
    const currentDataset = ctx.datasets.find(d => d.id === ctx.currentDataset);
    if (!currentDataset) return { size: 0, timeText: '', isReady: false, formattedStats: '' };
    
    // 计算总大小
    const totalSize = ctx.allImages.reduce((sum, img) => sum + (img.size || 0), 0);
    const sizeInMB = totalSize / (1024 * 1024);
    
    // 计算更新时间
    const createTime = currentDataset.created_at ? new Date(currentDataset.created_at) : new Date();
    const now = new Date();
    const diffHours = Math.floor((now - createTime) / (1000 * 60 * 60));
    
    let timeText = '';
    if (diffHours < 1) {
      timeText = 'Just now';
    } else if (diffHours < 24) {
      timeText = `${diffHours} hours ago`;
    } else if (diffHours < 24 * 365) {
      const days = Math.floor(diffHours / 24);
      timeText = `${days} days ago`;
    } else {
      const years = Math.floor(diffHours / (24 * 365));
      timeText = `${years} years ago`;
    }
    
    // 判断Ready状态：train/val有数据且有标注
    const trainImages = ctx.allImages.filter(img => img.split === 'train');
    const valImages = ctx.allImages.filter(img => img.split === 'val');
    const hasTrainData = trainImages.length > 0 && trainImages.some(img => img.labeled && img.boxes && img.boxes.length > 0);
    const hasValData = valImages.length > 0 && valImages.some(img => img.labeled && img.boxes && img.boxes.length > 0);
    const isReady = hasTrainData && hasValData;
    
    // 格式化统计信息
    const totalImages = ctx.allImages.length;
    const labeledImages = ctx.allImages.filter(img => img.labeled).length;
    const classCount = ctx.labels.length;
    const formattedStats = `${totalImages} images • ${labeledImages} labeled • ${classCount} classes • ${sizeInMB.toFixed(1)} MB • Updated ${timeText}`;
    
    return {
      size: sizeInMB,
      timeText: timeText,
      isReady: isReady,
      formattedStats: formattedStats
    };
  };

  // 加载自定义模型列表
  useEffect(() => {
    loadCustomModels();
  }, []);

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
project: runs/detect/train
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
save_hybrid: false`;

  // 监听自定义事件，支持从导航栏创建数据集
  useEffect(() => {
    const handleCreateDataset = () => {
      ctx.setShowCreateDatasetModal(true);
    };

    window.addEventListener('create-dataset', handleCreateDataset);
    return () => {
      window.removeEventListener('create-dataset', handleCreateDataset);
    };
  }, [ctx]);

  // 处理URL参数中的数据集切换
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const datasetId = params.get('dataset');
    
    // 只有当URL参数中的数据集ID存在，且与当前数据集不同，且该数据集确实存在时才切换
    if (datasetId && datasetId !== ctx.currentDataset) {
      const datasetExists = ctx.datasets.some(d => d.id === datasetId);
      if (datasetExists) {
        console.log('[URL参数] 检测到数据集切换:', datasetId);
        ctx.switchDataset(datasetId);
      } else {
        console.log('[URL参数] 数据集不存在，跳过切换:', datasetId);
      }
    }
  }, [location.search, ctx.datasets]);

  // 统一处理文件/目录选择
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newFileList = files.map(file => ({
      uid: `${Date.now()}-${Math.random()}`,
      name: file.name,
      status: 'done',
      originFileObj: file,
    }));
    setUploadFileList([...uploadFileList, ...newFileList]);
    e.target.value = ''; // 重置 input
  };

  const fileInputRef = React.useRef(null);
  const directoryInputRef = React.useRef(null);

  // 动态创建文件选择器
  const createFileSelector = (isDirectory = false) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.style.display = 'none';

    if (isDirectory) {
      input.webkitdirectory = true;
      input.directory = true;
    }

    input.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      const newFileList = files.map(file => ({
        uid: `${Date.now()}-${Math.random()}`,
        name: file.name,
        status: 'done',
        originFileObj: file,
      }));
      setUploadFileList(prev => [...prev, ...newFileList]);
      document.body.removeChild(input);
    });

    document.body.appendChild(input);
    return input;
  };

  const handleSelectDirectory = () => {
    const input = createFileSelector(true);
    input.click();
  };

  const handleSelectFiles = () => {
    const input = createFileSelector(false);
    input.click();
  };

  const switchToTaskDataset = (task) => {
    // 查找当前任务类型的数据集
    const targetDataset = ctx.datasets.find(d => d.task === task);
    if (targetDataset) {
      console.log('切换到任务数据集:', task, targetDataset.id);
      ctx.switchDataset(targetDataset.id);
    } else {
      message.info(`没有找到${task}类型的数据集`);
    }
  };

  const handleCreateDataset = (datasetInfo) => {
    ctx.createDataset(datasetInfo);
    ctx.setShowCreateDatasetModal(false);
  };

  const handleUploadOk = async () => {
    if (uploadFileList.length === 0) {
      message.warning('请选择要上传的文件');
      return;
    }

    try {
      let uploadedImages = [];

      for (const file of uploadFileList) {
        // 获取实际的File对象
        const fileToUpload = file.originFileObj;

        // 验证文件对象
        if (!fileToUpload || !(fileToUpload instanceof File)) {
          console.warn('跳过无效文件:', file);
          continue;
        }

        // 检查文件大小(可选)
        if (fileToUpload.size > 50 * 1024 * 1024) { // 50MB限制
          message.error(`文件过大: ${fileToUpload.name} (超过50MB)`);
          continue;
        }

        // 自动判断文件类型
        const fileName = fileToUpload.name.toLowerCase();
        const isArchive = fileName.endsWith('.zip') || fileName.endsWith('.tar') || fileName.endsWith('.tar.gz') || fileName.endsWith('.tgz');
        const isImage = fileToUpload.type.startsWith('image/') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.gif') || fileName.endsWith('.webp') || fileName.endsWith('.bmp');

        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('type', isArchive ? 'archive' : 'image');
        formData.append('dataset_id', currentDatasetId); // 传递当前数据集ID

        try {
          const response = await fetch('http://localhost:8000/api/upload/file', {
            method: 'POST',
            body: formData
          });

          const data = await response.json();

          if (!response.ok) {
            message.error(`上传失败: ${fileToUpload.name} - ${data.detail || '服务器错误'}`);
            continue;
          }

          if (data.success) {
            if (isArchive) {
              // 解压压缩包，传递当前数据集ID
              const extractResponse = await fetch('http://localhost:8000/api/upload/extract-dataset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  path: data.path,
                  dataset_id: currentDatasetId 
                })
              });
              const extractData = await extractResponse.json();
              console.log('压缩包解压结果:', extractData);
              if (extractData.success && extractData.data?.images) {
                uploadedImages = [...uploadedImages, ...extractData.data.images];
              } else {
                message.error(`解压失败: ${extractData.detail || extractData.message}`);
              }
            } else if (isImage) {
              // 单个图片
              uploadedImages.push({
                name: fileToUpload.name,
                path: data.path,
                fullPath: data.path
              });
            } else {
              console.warn('跳过不支持的文件类型:', fileToUpload.name);
            }
          } else {
            message.error(`上传失败: ${fileToUpload.name}`);
          }
        } catch (uploadError) {
          message.error(`上传失败: ${fileToUpload.name} - ${uploadError.message}`);
        }
      }

      // 添加到当前数据集
      const processedImages = uploadedImages.map((img, index) => {
        const uniqueId = `${img.name.split('.')[0]}_${Date.now()}_${index}`;
        return {
          id: uniqueId,
          split: 'train',
          labeled: false,
          boxes: [],
          url: `http://localhost:8000${img.path}`,
          originalPath: img.path.replace('/uploads/', ''),
          filename: img.name
        };
      });

      // 检查重复图片，避免添加已存在的图片

            const existingFilenames = new Set(ctx.allImages.map(img => img.filename));

            const newImages = processedImages.filter(img => !existingFilenames.has(img.filename));

            const skippedCount = processedImages.length - newImages.length;

      

            // 立即更新图片列表，不需要等待自动同步

            if (newImages.length > 0) {

              ctx.setAllImages(prev => [...prev, ...newImages]);

            }

      

            // 显示上传结果

      

                        if (newImages.length > 0 && skippedCount > 0) {

      

                          message.success(`成功上传 ${newImages.length} 张图片，已跳过 ${skippedCount} 张重复图片`);

      

                        } else if (newImages.length > 0) {

      

                          message.success(`成功上传 ${newImages.length} 张图片`);

      

                        } else if (skippedCount > 0) {

      

                          message.warning(`已跳过 ${skippedCount} 张重复图片，没有新图片被上传`);

      

                        } else {

      

                          message.warning('没有图片被上传');

      

                        }

      

                  setUploadFileList([]);
    } catch (error) {
      console.error('上传错误:', error);
      message.error('上传失败: ' + error.message);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/dataset/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: ctx.currentDataset })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentDatasetName}_dataset.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        message.success('数据集下载成功');
      } else {
        message.error('下载失败');
      }
    } catch (error) {
      message.error('下载失败: ' + error.message);
    }
  };

  const handleRefresh = () => {
    // 重新加载当前数据集
    ctx.switchDataset(ctx.currentDataset);
    message.success('界面已刷新');
  };

  const handleDelete = () => {
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = () => {
    // 获取要删除的数据集ID
    const datasetToDelete = ctx.datasets.find(d => d.id === ctx.currentDataset);
    if (!datasetToDelete) {
      message.error('数据集不存在');
      return;
    }
    
    console.log(`[删除数据集] 删除数据集: ${datasetToDelete.name} (${datasetToDelete.id})`);
    
    // 1. 从状态中删除该数据集
    const updatedDatasets = ctx.datasets.filter(d => d.id !== ctx.currentDataset);
    ctx.setDatasets(updatedDatasets);
    
    // 2. 清理当前数据集相关的状态
    ctx.setCurrentDataset(null);
    ctx.setAllImages([]);
    ctx.setLabels([]);
    ctx.setSelectedImage(null);
    ctx.setSelectedLabel(null);
    
    // 3. 清理localStorage中的所有相关数据
    // 清理annotation_datasets
    const savedDatasets = JSON.parse(localStorage.getItem('annotation_datasets') || '[]');
    const updatedSavedDatasets = savedDatasets.filter(ds => ds.id !== ctx.currentDataset);
    localStorage.setItem('annotation_datasets', JSON.stringify(updatedSavedDatasets));
    
    // 清理uploadedImages（只保留不属于该数据集的图片）
    const savedImages = JSON.parse(localStorage.getItem('uploadedImages') || '[]');
    const updatedImages = savedImages.filter(img => {
      // 如果图片URL包含该数据集的路径，则删除
      if (img.url && img.url.includes(`/datasets/${ctx.currentDataset}/`)) {
        return false;
      }
      return true;
    });
    localStorage.setItem('uploadedImages', JSON.stringify(updatedImages));
    
    // 清理annotation_labels（只保留不属于该数据集的标签）
    const savedLabels = JSON.parse(localStorage.getItem('annotation_labels') || '[]');
    // 这里可以添加更精确的过滤逻辑，但简单起见直接清空
    localStorage.setItem('annotation_labels', JSON.stringify([]));
    
    console.log(`[删除数据集] localStorage已清理`);
    
    // 4. 调用后端API删除数据集
    const deleteDatasetFromBackend = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/dataset/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataset_id: ctx.currentDataset })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('[删除数据集] 后端删除成功:', result);
        } else {
          console.error('[删除数据集] 后端删除失败:', response.status);
        }
      } catch (error) {
        console.error('[删除数据集] 调用后端删除失败:', error);
      }
    };
    
    deleteDatasetFromBackend();
    
    // 5. 如果还有其他数据集，切换到第一个可用数据集
    if (updatedDatasets.length > 0) {
      const nextDatasetId = updatedDatasets[0].id;
      ctx.setCurrentDataset(nextDatasetId);
      ctx.setAllImages(updatedDatasets[0].images || []);
      ctx.setLabels(updatedDatasets[0].labels || []);
      ctx.setSelectedImage(null);
      ctx.setSelectedLabel(updatedDatasets[0].labels?.[0] || null);
    }
    
    setDeleteModalVisible(false);
    message.success(`数据集 "${currentDatasetName}" 已删除（包括所有图片和标注文件）`);
    
    // 6. 触发删除事件，通知其他组件刷新
    window.dispatchEvent(new CustomEvent('dataset-deleted', { detail: ctx.currentDataset }));
  };

  // 训练相关功能
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

  const handleStartTraining = async () => {
    try {
      const values = await form.validateFields();
      message.loading({ content: '正在启动训练...', key: 'training' });

      // 解析YAML配置
      let yamlConfig = {};
      try {
        const lines = yamlContent.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('lr0:')) {
            yamlConfig.lr0 = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('lrf:')) {
            yamlConfig.lrf = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('momentum:')) {
            yamlConfig.momentum = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('weight_decay:')) {
            yamlConfig.weight_decay = parseFloat(trimmed.split(':')[1].trim());
          } else if (trimmed.startsWith('warmup_epochs:')) {
            yamlConfig.warmup_epochs = parseFloat(trimmed.split(':')[1].trim());
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
        model: values.model
      };

      // 启动训练
      const response = await fetch('http://localhost:8000/api/train/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainParams)
      });

      const result = await response.json();

      if (result.success) {
        message.success({ content: '训练已启动', key: 'training' });
        setTrainModalVisible(false);
        // 切换到Models标签页查看训练进度
        ctx.setCurrentTab('models');
      } else {
        message.error({ content: '训练启动失败: ' + (result.message || result.detail || '未知错误'), key: 'training' });
      }
    } catch (error) {
      message.error({ content: '训练启动失败: ' + error.message, key: 'training' });
    }
  };

  return (
    <Layout style={{ height: 'calc(100vh - 64px)', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e8e8e8', height: '64px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <AppstoreOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          <span style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
            {currentDatasetName}
          </span>
          <Dropdown 
            menu={{ 
              items: [
                { key: 'detect', label: 'Detect', onClick: () => switchToTaskDataset('detect') },
                { key: 'segment', label: 'Segment', onClick: () => switchToTaskDataset('segment') },
                { key: 'pose', label: 'Pose', onClick: () => switchToTaskDataset('pose') },
                { key: 'classify', label: 'Classify', onClick: () => switchToTaskDataset('classify') }
              ]
            }}
            trigger={['click']}
          >
            <Tag color="blue" style={{ cursor: 'pointer', padding: '2px 8px' }}>
              {ctx.datasets.find(d => d.id === ctx.currentDataset)?.task || 'detect'}
            </Tag>
          </Dropdown>
          <Dropdown 
            menu={{ 
              items: commonLicenses.map(lic => ({
                key: lic,
                label: lic,
                onClick: () => {
                  setLicense(lic);
                  message.success(`License已设置为: ${lic}`);
                }
              }))
            }}
            trigger={['click']}
          >
            <Tag color="purple" style={{ cursor: 'pointer', padding: '2px 8px' }}>
              {license}
            </Tag>
          </Dropdown>
          <Tag 
            color={getDatasetInfo().isReady ? 'success' : 'default'} 
            style={{ padding: '2px 8px' }}
          >
            {getDatasetInfo().isReady ? 'Ready' : 'Not Ready'}
          </Tag>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button size="small" icon={<PlusOutlined />} onClick={handleOpenTrainModal}>New Model</Button>
          <Dropdown menu={{
            items: [
              {
                key: 'directory',
                label: '选择目录',
                icon: <FolderOpenOutlined />,
                onClick: handleSelectDirectory
              },
              {
                key: 'files',
                label: '选择文件',
                icon: <UploadOutlined />,
                onClick: handleSelectFiles
              }
            ]
          }} trigger={['click']}>
            <Tooltip title="Upload">
              <UploadOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Tooltip>
          </Dropdown>
          <Tooltip title="Download"><DownloadOutlined style={{ fontSize: 18, cursor: 'pointer' }} onClick={handleDownload} /></Tooltip>
          <Tooltip title="Refresh"><SyncOutlined style={{ fontSize: 18, cursor: 'pointer' }} onClick={handleRefresh} /></Tooltip>
          <Tooltip title="Delete"><DeleteOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#ff4d4f' }} onClick={handleDelete} /></Tooltip>
        </div>
      </Header>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {/* 统计信息和描述 */}
        <StatsAndDescription formattedStats={getDatasetInfo().formattedStats} />

        <Tabs
          activeKey={ctx.currentTab}
          onChange={ctx.setCurrentTab}
          items={[
            { key: 'images', label: <><FolderOpenOutlined /> Images</> },
            { key: 'classes', label: <><BlockOutlined /> Classes</> },
            { key: 'charts', label: <><LineChartOutlined /> Charts</> },
            { key: 'models', label: <><MoreOutlined /> Models</> },
          ]}
          style={{ padding: '0 24px', background: '#fff' }}
          type="card"
        />

        {ctx.currentTab === 'images' && <ImagesSection />}
        {ctx.currentTab === 'classes' && <ClassesSection />}
        {ctx.currentTab === 'charts' && <ChartsSection />}
        {ctx.currentTab === 'models' && <ModelsSection />}
      </div>

      <AnnotationView />

      <CreateDatasetModal
        visible={ctx.showCreateDatasetModal}
        onCancel={() => ctx.setShowCreateDatasetModal(false)}
        onCreate={handleCreateDataset}
      />

      {/* 删除确认模态框 */}
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={() => setDeleteModalVisible(false)}
        okText="删除"
        okType="danger"
        cancelText="取消"
      >
        确定要删除数据集 "{currentDatasetName}" 吗？此操作不可恢复。
      </Modal>

      {/* 训练配置模态框 */}
      <Modal
        title={<><PlayCircleOutlined /> 训练配置</>}
        open={trainModalVisible}
        onOk={handleStartTraining}
        onCancel={() => setTrainModalVisible(false)}
        width={800}
        okText="开始训练"
        cancelText="取消"
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
                    defaultValue="yolov8n.pt"
                    onChange={(value) => form.setFieldsValue({ model: value })}
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
                    onChange={(value) => form.setFieldsValue({ model: value })}
                    options={customModels.map(m => ({ label: m.name, value: m.path }))}
                  />
                )}
              </Col>
            </Row>
          </Form.Item>
          <Form.Item name="model" initialValue="yolov8n.pt" hidden />

          {/* 数据集 */}
          <Form.Item label="数据集">
            <Input value={ctx.currentDataset || 'bottle'} disabled />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              使用当前选中的数据集，无法更改
            </div>
          </Form.Item>

          {/* 训练参数 */}
          <Form.Item label="训练参数">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <Form.Item label="Epochs" name="epochs" initialValue={100}>
                <InputNumber min={1} max={1000} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Batch Size" name="batch_size" initialValue={16}>
                <InputNumber min={1} max={128} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Image Size" name="img_size" initialValue={640}>
                <InputNumber min={32} max={1280} step={32} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Run Name" name="run_name" initialValue={`exp_${Date.now()}`}>
                <Input />
              </Form.Item>
            </div>
          </Form.Item>

          {/* 高级设置 */}
          <Form.Item 
            label={
              <span style={{ fontSize: 16, fontWeight: 500, color: '#1890ff' }}>高级设置</span>
            }
          >
            <div style={{ marginBottom: 8 }}>
              <Upload.Dragger
                accept=".yaml,.yml"
                showUploadList={false}
                beforeUpload={(file) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    setYamlContent(e.target.result);
                    message.success('YAML文件导入成功');
                  };
                  reader.readAsText(file);
                  return false;
                }}
                style={{ padding: '8px 16px' }}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">拖拽YAML文件到此处，或点击上传</p>
              </Upload.Dragger>
            </div>
            <Input.TextArea
              value={yamlContent}
              onChange={(e) => setYamlContent(e.target.value)}
              rows={12}
              style={{ fontFamily: 'monospace', fontSize: 14, color: '#1890ff' }}
              placeholder="YAML配置内容..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

const AnnotationWithProviders = () => (
  <App>
    <DatasetProvider>
      <ConfigProvider theme={{ token: { colorPrimary: '#1890ff', borderRadius: 6 } }}>
        <Annotation />
      </ConfigProvider>
    </DatasetProvider>
  </App>
);

export default AnnotationWithProviders;