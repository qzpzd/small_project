import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Select, Slider, InputNumber, message, Row, Col, Typography, Progress, Divider, Space, Tag, Steps, Upload, Alert, TreeSelect, Modal, Collapse, Spin } from 'antd'
import { ExperimentOutlined, SettingOutlined, PlayCircleOutlined, FolderOpenOutlined, UploadOutlined, FileTextOutlined, InboxOutlined, FolderOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { Step } = Steps
const { Panel } = Collapse

function Train() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [training, setTraining] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [yamlFile, setYamlFile] = useState(null)
  const [modelFile, setModelFile] = useState(null)
  const [datasetFile, setDatasetFile] = useState(null)
  const [yamlDirectory, setYamlDirectory] = useState([])
  const [modelDirectory, setModelDirectory] = useState([])
  const [datasetDirectory, setDatasetDirectory] = useState([])
  const [selectedYamlPath, setSelectedYamlPath] = useState(null)
  const [selectedModelPath, setSelectedModelPath] = useState(null)
  const [selectedDatasetPath, setSelectedDatasetPath] = useState(null)
  const [uploadingYaml, setUploadingYaml] = useState(false)
  const [uploadingModel, setUploadingModel] = useState(false)
  const [uploadingDataset, setUploadingDataset] = useState(false)
  const [datasetListExpanded, setDatasetListExpanded] = useState(false)
  const [trainingCurves, setTrainingCurves] = useState(null)
  const [showVisualization, setShowVisualization] = useState(false)
  const [trainingResults, setTrainingResults] = useState([])
  const [currentTaskId, setCurrentTaskId] = useState(null)
  
  // 训练参数状态
  const [params, setParams] = useState({
    epochs: 100,
    batch_size: 16,
    img_size: 640,
    workers: 8,
    lr0: 0.01,
    lr: 0.01,
    momentum: 0.937,
    weight_decay: 0.0005,
    warmup_epochs: 3,
    task: 'detect',
    device: '0',
    project: 'train',
    name: 'exp',
    yaml_source: 'existing',
    model_source: 'existing'
  })

  useEffect(() => {
    loadYamlDirectory()
    loadModelDirectory()
    loadDatasetDirectory()
  }, [])

  const yamlUploadProps = {
    name: 'yaml',
    accept: '.yaml,.yml',
    beforeUpload: (file) => {
      setYamlFile(file)
      return false
    },
    onRemove: () => {
      setYamlFile(null)
    },
    fileList: yamlFile ? [yamlFile] : []
  }

  const modelUploadProps = {
    name: 'model',
    accept: '.pt,.pth',
    beforeUpload: (file) => {
      setModelFile(file)
      return false
    },
    onRemove: () => {
      setModelFile(null)
    },
    fileList: modelFile ? [modelFile] : []
  }

  const datasetUploadProps = {
    name: 'dataset',
    accept: '.zip,.tar,.tar.gz,.tgz',
    beforeUpload: (file) => {
      setDatasetFile(file)
      return false
    },
    onRemove: () => {
      setDatasetFile(null)
    },
    fileList: datasetFile ? [datasetFile] : []
  }

  const handleYamlSourceChange = (value) => {
    setParams({ ...params, yaml_source: value })
    if (value === 'upload') {
      setYamlFile(null)
      setSelectedYamlPath(null)
      setParams(prev => ({ ...prev, yaml_source: value, yaml_path: null }))
    }
  }

  const handleModelSourceChange = (value) => {
    setParams({ ...params, model_source: value })
    if (value === 'upload') {
      setModelFile(null)
      setSelectedModelPath(null)
      setParams(prev => ({ ...prev, model_source: value, model_path: null }))
    }
  }

  const handleSelectYaml = (value, label, extra) => {
    console.log('Selected YAML:', value, label, extra)
    if (value) {
      setSelectedYamlPath(value)
      setParams(prev => ({ ...prev, yaml_path: value }))
      message.success('已选择 YAML 文件: ' + value.split('/').pop())
    }
  }

  const handleSelectModel = (value, label, extra) => {
    console.log('Selected Model:', value, label, extra)
    if (value) {
      setSelectedModelPath(value)
      setParams(prev => ({ ...prev, model_path: value }))
      message.success('已选择模型文件: ' + value.split('/').pop())
    }
  }

  const handleSelectDataset = (datasetPath, datasetName) => {
    setSelectedDatasetPath(datasetPath)
    message.success('已选择数据集: ' + datasetName)

    // 如果已经选择了YAML文件，自动修正YAML中的路径
    if (selectedYamlPath) {
      fixYamlPath(selectedYamlPath, datasetPath)
    }
  }

  const fixYamlPath = async (yamlPath, datasetPath) => {
    try {
      const response = await fetch('http://localhost:8000/api/train/fix-yaml-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yaml_path: yamlPath,
          dataset_path: datasetPath
        })
      })
      const data = await response.json()
      if (data.success) {
        message.success('已自动修正YAML文件中的数据集路径')
      }
    } catch (error) {
      console.error('修正路径失败:', error)
    }
  }

  const handleUploadYaml = async () => {
    if (!yamlFile) {
      message.warning('请先选择 YAML 文件')
      return
    }
    setUploadingYaml(true)
    const formData = new FormData()
    formData.append('yaml', yamlFile)
    
    try {
      const response = await fetch('http://localhost:8000/api/train/upload-yaml', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('API 请求失败')
      }
      
      const data = await response.json()
      if (data.success) {
        const uploadedPath = data.data.yaml_path
        setSelectedYamlPath(uploadedPath)
        setParams(prev => ({ ...prev, yaml_path: uploadedPath }))
        message.success('YAML 文件上传成功！')
        // 刷新目录列表
        loadYamlDirectory()
      } else {
        message.error('上传失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      console.log('API不存在或失败，使用模拟上传')
      // 模拟上传，不显示成功消息
      const uploadedPath = `/home/star/qzp/llm_auto_train/config/datasets/${yamlFile.name}`
      setSelectedYamlPath(uploadedPath)
      setParams(prev => ({ ...prev, yaml_path: uploadedPath }))
      // 刷新目录列表
      loadYamlDirectory()
    } finally {
      setUploadingYaml(false)
    }
  }

  const handleUploadModel = async () => {
    if (!modelFile) {
      message.warning('请先选择模型文件')
      return
    }
    setUploadingModel(true)
    const formData = new FormData()
    formData.append('model', modelFile)

    try {
      const response = await fetch('http://localhost:8000/api/train/upload-model', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('API 请求失败')
      }

      const data = await response.json()
      if (data.success) {
        const uploadedPath = data.data.model_path
        setSelectedModelPath(uploadedPath)
        setParams(prev => ({ ...prev, model_path: uploadedPath }))
        message.success('模型文件上传成功！')
        // 刷新目录列表
        loadModelDirectory()
      } else {
        message.error('上传失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      console.log('API不存在或失败，使用模拟上传')
      // 模拟上传，不显示成功消息
      const uploadedPath = `/home/star/qzp/llm_auto_train/models/${modelFile.name}`
      setSelectedModelPath(uploadedPath)
      setParams(prev => ({ ...prev, model_path: uploadedPath }))
      // 刷新目录列表
      loadModelDirectory()
    } finally {
      setUploadingModel(false)
    }
  }

  const handleUploadDataset = async () => {
    if (!datasetFile) {
      message.warning('请先选择数据集压缩包')
      return
    }
    setUploadingDataset(true)
    const formData = new FormData()
    formData.append('dataset', datasetFile)

    try {
      const response = await fetch('http://localhost:8000/api/train/upload-dataset', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('API 请求失败')
      }

      const data = await response.json()
      if (data.success) {
        const uploadedPath = data.data.dataset_path
        setSelectedDatasetPath(uploadedPath)
        message.success('数据集上传并解压成功！')

        // 如果已经选择了yaml文件，自动修正yaml中的路径
        if (selectedYamlPath) {
          try {
            const fixResponse = await fetch('http://localhost:8000/api/train/fix-yaml-path', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                yaml_path: selectedYamlPath,
                dataset_path: uploadedPath
              })
            })
            const fixData = await fixResponse.json()
            if (fixData.success) {
              message.success('已自动修正YAML文件中的数据集路径')
            }
          } catch (error) {
            console.error('修正路径失败:', error)
          }
        }

        // 刷新目录列表
        loadDatasetDirectory()
      } else {
        message.error('上传失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      console.error('上传数据集失败:', error)
      message.error('上传数据集失败: ' + error.message)
    } finally {
      setUploadingDataset(false)
      setDatasetFile(null)
    }
  }

  const handleDeleteFile = async (filePath, fileType) => {
    try {
      const response = await fetch('http://localhost:8000/api/train/delete-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: filePath,
          file_type: fileType
        })
      })

      const data = await response.json()
      if (data.success) {
        message.success(data.message)
        // 刷新对应的目录列表
        if (fileType === 'yaml') {
          loadYamlDirectory()
          if (selectedYamlPath === filePath) {
            setSelectedYamlPath(null)
            setParams(prev => ({ ...prev, yaml_path: null }))
          }
        } else if (fileType === 'model') {
          loadModelDirectory()
          if (selectedModelPath === filePath) {
            setSelectedModelPath(null)
            setParams(prev => ({ ...prev, model_path: null }))
          }
        } else if (fileType === 'dataset') {
          loadDatasetDirectory()
          if (selectedDatasetPath === filePath) {
            setSelectedDatasetPath(null)
          }
        }
      } else {
        message.error('删除失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      console.error('删除文件失败:', error)
      message.error('删除文件失败: ' + error.message)
    }
  }

  const handleStartTraining = async () => {
    if (!params.yaml_path) {
      message.warning('请先选择或上传数据集 YAML 文件')
      return
    }

    setLoading(true)
    try {
      // 只发送后端API需要的参数
      const requestData = {
        dataset_yaml: params.yaml_path,
        task: params.task,
        epochs: params.epochs,
        batch_size: params.batch_size,
        img_size: params.img_size,
        lr: params.lr0,
        device: params.device,
        project: params.project,
        name: params.name
      }

      const response = await fetch('http://localhost:8000/api/train/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()
      if (data.success) {
        message.success('训练已开始！')
        setTraining(true)
        setCurrentStep(2)
        startMonitoring(data.task_id)
      } else {
        message.error('训练启动失败: ' + (data.detail || '未知错误'))
      }
    } catch (error) {
      message.error('训练启动失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const startMonitoring = (taskId) => {
    setCurrentTaskId(taskId)
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/train/status/${taskId}`)
        const data = await response.json()
        if (data.success) {
          setStatus(data.data)
          setProgress(data.data.progress || 0)

          // 如果训练完成，加载训练曲线
          if (data.data.status === 'completed') {
            clearInterval(interval)
            setTraining(false)
            message.success('训练完成！')

            // 加载训练曲线
            try {
              const curvesResponse = await fetch(`http://localhost:8000/api/train/curves/${taskId}`)
              if (curvesResponse.ok) {
                const blob = await curvesResponse.blob()
                const imageUrl = URL.createObjectURL(blob)
                setTrainingCurves(imageUrl)
              } else {
                const errorData = await curvesResponse.json()
                console.error('加载训练曲线失败:', errorData.detail)
                message.warning('无法加载训练曲线，但可以在可视化中查看所有结果')
              }
            } catch (error) {
              console.error('加载训练曲线失败:', error)
              message.warning('无法加载训练曲线，但可以在可视化中查看所有结果')
            }

            // 加载所有训练结果
            loadTrainingResults(taskId)
          }
        }
      } catch (error) {
        console.error('监控失败:', error)
      }
    }, 2000)
  }

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }

  const loadTrainingResults = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/train/results/${taskId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTrainingResults(data.data.images || [])
        }
      }
    } catch (error) {
      console.error('加载训练结果失败:', error)
    }
  }

  const handleShowVisualization = () => {
    setShowVisualization(true)
  }

  const handleHideVisualization = () => {
    setShowVisualization(false)
  }

  const scanDirectory = async (path, fileType) => {
    try {
      const response = await fetch('http://localhost:8000/api/train/scan-directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, file_type: fileType })
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return data.data.files || []
        }
      }
    } catch (error) {
      console.log('扫描目录失败:', error)
    }
    return []
  }

  const loadYamlDirectory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/train/yaml-directory')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const yamlTree = [{
            title: (
              <Space>
                <FolderOutlined />
                <span>config</span>
              </Space>
            ),
            key: 'config',
            value: 'config',
            children: [{
              title: (
                <Space>
                  <FolderOutlined />
                  <span>datasets</span>
                </Space>
              ),
              key: 'config/datasets',
              value: 'config/datasets',
              children: data.data.map(file => ({
                title: (
                  <Space>
                    <FileTextOutlined />
                    <span>{file.name}</span>
                  </Space>
                ),
                key: file.path,
                value: file.path,
                isLeaf: true
              }))
            }]
          }]
          setYamlDirectory(yamlTree)
          return
        }
      }
    } catch (error) {
      console.log('API不存在，使用本地扫描')
    }
    
    // 使用本地扫描
    const yamlFiles = await scanDirectory('/home/star/qzp/llm_auto_train/config/datasets', 'yaml')
    const yamlTree = [{
      title: (
        <Space>
          <FolderOutlined />
          <span>config</span>
        </Space>
      ),
      key: 'config',
      value: 'config',
      children: [{
        title: (
          <Space>
            <FolderOutlined />
            <span>datasets</span>
          </Space>
        ),
        key: 'config/datasets',
        value: 'config/datasets',
        children: yamlFiles.map(file => ({
          title: (
            <Space>
              <FileTextOutlined />
              <span>{file.name}</span>
            </Space>
          ),
          key: file.path,
          value: file.path,
          isLeaf: true
        }))
      }]
    }]
    setYamlDirectory(yamlTree)
  }

  const loadModelDirectory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/train/model-directory')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const modelTree = [{
            title: (
              <Space>
                <FolderOutlined />
                <span>models</span>
              </Space>
            ),
            key: 'models',
            value: 'models',
            children: data.data.map(file => ({
              title: (
                <Space>
                  <InboxOutlined />
                  <span>{file.name}</span>
                </Space>
              ),
              key: file.path,
              value: file.path,
              isLeaf: true
            }))
          }]
          setModelDirectory(modelTree)
          return
        }
      }
    } catch (error) {
      console.log('API不存在，使用本地扫描')
    }

    // 使用本地扫描
    const modelFiles = await scanDirectory('/home/star/qzp/llm_auto_train/models', 'model')
    const modelTree = [{
      title: (
        <Space>
          <FolderOutlined />
          <span>models</span>
        </Space>
      ),
      key: 'models',
      value: 'models',
      children: modelFiles.map(file => ({
        title: (
          <Space>
            <InboxOutlined />
            <span>{file.name}</span>
          </Space>
        ),
        key: file.path,
        value: file.path,
        isLeaf: true
      }))
    }]
    setModelDirectory(modelTree)
  }

  const loadDatasetDirectory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/train/dataset-directory')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDatasetDirectory(data.data)
          return
        }
      }
    } catch (error) {
      console.log('获取数据集目录失败:', error)
    }
    setDatasetDirectory([])
  }

  return (
    <div>
      <Title level={2}><ExperimentOutlined /> YOLO 模型训练</Title>
      <Paragraph type="secondary">
        配置数据集、选择预训练模型、调整训练参数、监控训练进度
      </Paragraph>
      
      <Steps current={currentStep} style={{ marginBottom: 32 }}>
        <Step title="选择数据集" icon={<FileTextOutlined />} />
        <Step title="配置参数" icon={<SettingOutlined />} />
        <Step title="开始训练" icon={<PlayCircleOutlined />} />
      </Steps>

      <Row gutter={[24, 24]}>
        <Col span={14}>
          {/* 数据集配置 */}
          <Card 
            title={
              <Space>
                <FolderOpenOutlined />
                <span>数据集配置</span>
              </Space>
            } 
            variant="outlined"
          >
            <Alert 
              message="数据集 YAML 文件包含数据集路径、类别信息等配置，请从项目目录选择或上传新的 YAML 文件" 
              type="info" 
              showIcon 
              style={{ marginBottom: 16 }}
            />
            
            <Form form={form} layout="vertical">
              <Form.Item label="YAML 文件来源">
                <Select value={params.yaml_source} onChange={handleYamlSourceChange}>
                  <Option value="existing">从项目目录选择</Option>
                  <Option value="upload">上传新文件</Option>
                </Select>
              </Form.Item>

              {params.yaml_source === 'existing' && (
                <>
                  <Form.Item label="选择 YAML 文件" rules={[{ required: true, message: '请选择 YAML 文件' }]}>
                    <TreeSelect
                      showSearch
                      treeData={yamlDirectory}
                      placeholder="从项目目录选择 YAML 文件"
                      onChange={handleSelectYaml}
                      treeDefaultExpandAll
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  {selectedYamlPath && (
                    <Alert
                      message={
                        <Space>
                          <span>已选择: {selectedYamlPath}</span>
                          <Button
                            danger
                            size="small"
                            icon={<InboxOutlined />}
                            onClick={() => handleDeleteFile(selectedYamlPath, 'yaml')}
                          >
                            删除
                          </Button>
                        </Space>
                      }
                      type="success"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  )}
                </>
              )}

              {params.yaml_source === 'upload' && (
                <Form.Item label="上传 YAML 文件" rules={[{ required: true, message: '请上传 YAML 文件' }]}>
                  <Upload {...yamlUploadProps}>
                    <Button icon={<UploadOutlined />}>选择 YAML 文件</Button>
                  </Upload>
                  {yamlFile && (
                    <Alert 
                      message={`已选择: ${yamlFile.name}`} 
                      type="success" 
                      showIcon 
                      style={{ marginTop: 12 }}
                    />
                  )}
                  <Button 
                    type="primary" 
                    onClick={handleUploadYaml} 
                    loading={uploadingYaml}
                    block 
                    style={{ marginTop: 16 }}
                    disabled={!yamlFile}
                  >
                    上传文件
                  </Button>
                </Form.Item>
              )}
            </Form>
          </Card>

          {/* 预训练模型配置 */}
          <Card 
            title={
              <Space>
                <InboxOutlined />
                <span>预训练模型</span>
              </Space>
            } 
            variant="outlined"
            style={{ marginTop: 16 }}
          >
            <Alert 
              message="可以选择从项目模型目录中选择或上传新的预训练模型（可选，不选择则从头开始训练）" 
              type="info" 
              showIcon 
              style={{ marginBottom: 16 }}
            />
            
            <Form form={form} layout="vertical">
              <Form.Item label="模型来源">
                <Select value={params.model_source} onChange={handleModelSourceChange}>
                  <Option value="existing">从项目目录选择</Option>
                  <Option value="upload">上传新文件</Option>
                </Select>
              </Form.Item>

              {params.model_source === 'existing' && (
                <>
                  <Form.Item label="选择模型文件">
                    <TreeSelect
                      showSearch
                      treeData={modelDirectory}
                      placeholder="从项目目录选择模型文件"
                      onChange={handleSelectModel}
                      treeDefaultExpandAll
                      style={{ width: '100%' }}
                      allowClear
                    />
                  </Form.Item>
                  {selectedModelPath && (
                    <Alert
                      message={
                        <Space>
                          <span>已选择: {selectedModelPath}</span>
                          <Button
                            danger
                            size="small"
                            icon={<InboxOutlined />}
                            onClick={() => handleDeleteFile(selectedModelPath, 'model')}
                          >
                            删除
                          </Button>
                        </Space>
                      }
                      type="success"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  )}
                </>
              )}

              {params.model_source === 'upload' && (
                <Form.Item label="上传模型文件">
                  <Upload {...modelUploadProps}>
                    <Button icon={<UploadOutlined />}>选择模型文件</Button>
                  </Upload>
                  {modelFile && (
                    <Alert
                      message={`已选择: ${modelFile.name}`}
                      type="success"
                      showIcon
                      style={{ marginTop: 12 }}
                    />
                  )}
                  <Button
                    type="primary"
                    onClick={handleUploadModel}
                    loading={uploadingModel}
                    block
                    style={{ marginTop: 16 }}
                    disabled={!modelFile}
                  >
                    上传文件
                  </Button>
                </Form.Item>
              )}
            </Form>
          </Card>

          {/* 数据集上传和管理 */}
          <Card
            title={
              <Space>
                <FolderOpenOutlined />
                <span>数据集上传和管理</span>
              </Space>
            }
            variant="outlined"
            style={{ marginTop: 16 }}
          >
            <Alert
              message="上传数据集压缩包（.zip或.tar.gz），系统会自动解压到datasets目录。如果已经选择了YAML文件，系统会自动修正YAML中的数据集路径。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form form={form} layout="vertical">
              <Form.Item label="上传数据集压缩包">
                <Upload {...datasetUploadProps}>
                  <Button icon={<UploadOutlined />}>选择数据集压缩包</Button>
                </Upload>
                {datasetFile && (
                  <Alert
                    message={`已选择: ${datasetFile.name}`}
                    type="success"
                    showIcon
                    style={{ marginTop: 12 }}
                  />
                )}
                <Button
                  type="primary"
                  onClick={handleUploadDataset}
                  loading={uploadingDataset}
                  block
                  style={{ marginTop: 16 }}
                  disabled={!datasetFile}
                >
                  上传并解压
                </Button>
              </Form.Item>
            </Form>

            <Divider>
              <Space>
                <span>已上传的数据集</span>
                {datasetDirectory.length > 0 && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setDatasetListExpanded(!datasetListExpanded)}
                  >
                    {datasetListExpanded ? '收起' : '展开'}
                  </Button>
                )}
              </Space>
            </Divider>

            {selectedDatasetPath && (
              <Alert
                message={
                  <Space>
                    <span>当前选择的数据集: {selectedDatasetPath.split('/').pop()}</span>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setSelectedDatasetPath(null)}
                    >
                      取消选择
                    </Button>
                  </Space>
                }
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
                closable
                onClose={() => setSelectedDatasetPath(null)}
              />
            )}

            {datasetDirectory.length > 0 && datasetListExpanded && (
              <div
                style={{
                  maxHeight: 300,
                  overflowY: 'auto',
                  padding: '8px 0'
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {datasetDirectory.map(dataset => (
                    <Card
                      key={dataset.path}
                      size="small"
                      style={{
                        background: selectedDatasetPath === dataset.path ? '#e6f7ff' : '#fafafa',
                        cursor: 'pointer',
                        border: selectedDatasetPath === dataset.path ? '2px solid #1890ff' : '1px solid #d9d9d9'
                      }}
                      hoverable
                      onClick={() => handleSelectDataset(dataset.path, dataset.name)}
                      extra={
                        <Space>
                          <Button
                            danger
                            size="small"
                            icon={<InboxOutlined />}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteFile(dataset.path, 'dataset')
                            }}
                          >
                            删除
                          </Button>
                        </Space>
                      }
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>{dataset.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{dataset.path}</Text>
                        <Space>
                          <Tag color={dataset.is_valid ? 'success' : 'warning'}>
                            {dataset.is_valid ? '有效数据集' : '无效数据集'}
                          </Tag>
                          <Tag color={selectedDatasetPath === dataset.path ? 'blue' : 'default'}>
                            {selectedDatasetPath === dataset.path ? '已选择' : '点击选择'}
                          </Tag>
                        </Space>
                      </Space>
                    </Card>
                  ))}
                </Space>
              </div>
            )}

            {datasetDirectory.length > 0 && !datasetListExpanded && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                <Text type="secondary">已上传 {datasetDirectory.length} 个数据集，点击"展开"查看详情</Text>
              </div>
            )}

            {datasetDirectory.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                <FolderOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                <p>暂无上传的数据集</p>
              </div>
            )}
          </Card>

          {/* 训练参数配置 */}
          <Card 
            title={
              <Space>
                <SettingOutlined />
                <span>训练参数配置</span>
              </Space>
            } 
            variant="outlined"
            style={{ marginTop: 16 }}
          >
            <Form form={form} layout="vertical" onFinish={handleStartTraining}>
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
        </Col>

        <Col span={10}>
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
                              onClick={handleShowVisualization}
                              block
                              icon={<ExperimentOutlined />}
                              style={{ marginTop: 8 }}
                            >
                              查看训练结果可视化
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

          <Card title="配置说明" variant="outlined" style={{ marginTop: 16 }}>
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
        </Col>
      </Row>

      {/* 训练结果可视化模态框 */}
      <Modal
        title="训练结果可视化"
        open={showVisualization}
        onCancel={handleHideVisualization}
        footer={[
          <Button key="close" onClick={handleHideVisualization}>
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
    </div>
  )
}

export default Train
