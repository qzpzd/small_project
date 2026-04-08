import React, { useState, useEffect } from 'react'
import { Typography, Steps, Row, Col, Space } from 'antd'
import { ExperimentOutlined, FileTextOutlined, SettingOutlined, PlayCircleOutlined } from '@ant-design/icons'

// 导入拆分后的组件
import DatasetConfig from '../components/train/DatasetConfig'
import ModelConfig from '../components/train/ModelConfig'
import DatasetManagement from '../components/train/DatasetManagement'
import TrainingParams from '../components/train/TrainingParams'
import TrainingStatus from '../components/train/TrainingStatus'
import TrainingVisualization from '../components/train/TrainingVisualization'
import ConfigInfo from '../components/train/ConfigInfo'

const { Title, Paragraph } = Typography
const { Step } = Steps

function Train() {
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
    }
  }

  const handleSelectModel = (value, label, extra) => {
    console.log('Selected Model:', value, label, extra)
    if (value) {
      setSelectedModelPath(value)
      setParams(prev => ({ ...prev, model_path: value }))
    }
  }

  const handleSelectDataset = (datasetPath, datasetName) => {
    setSelectedDatasetPath(datasetPath)
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
        console.log('已自动修正YAML文件中的数据集路径')
      }
    } catch (error) {
      console.error('修正路径失败:', error)
    }
  }

  const handleUploadYaml = async () => {
    if (!yamlFile) {
      console.warn('请先选择 YAML 文件')
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
        console.log('YAML 文件上传成功！')
        loadYamlDirectory()
      } else {
        console.error('上传失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      console.log('API不存在或失败，使用模拟上传')
      const uploadedPath = `/home/star/qzp/llm_auto_train/config/datasets/${yamlFile.name}`
      setSelectedYamlPath(uploadedPath)
      setParams(prev => ({ ...prev, yaml_path: uploadedPath }))
      loadYamlDirectory()
    } finally {
      setUploadingYaml(false)
    }
  }

  const handleUploadModel = async () => {
    if (!modelFile) {
      console.warn('请先选择模型文件')
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
        console.log('模型文件上传成功！')
        loadModelDirectory()
      } else {
        console.error('上传失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      console.log('API不存在或失败，使用模拟上传')
      const uploadedPath = `/home/star/qzp/llm_auto_train/models/${modelFile.name}`
      setSelectedModelPath(uploadedPath)
      setParams(prev => ({ ...prev, model_path: uploadedPath }))
      loadModelDirectory()
    } finally {
      setUploadingModel(false)
    }
  }

  const handleUploadDataset = async () => {
    if (!datasetFile) {
      console.warn('请先选择数据集压缩包')
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
        console.log('数据集上传并解压成功！')

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
              console.log('已自动修正YAML文件中的数据集路径')
            }
          } catch (error) {
            console.error('修正路径失败:', error)
          }
        }

        loadDatasetDirectory()
      } else {
        console.error('上传失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      console.error('上传数据集失败:', error)
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
        console.log(data.message)
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
        console.error('删除失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      console.error('删除文件失败:', error)
    }
  }

  const handleDownloadModel = async () => {
    if (!status?.model_path) {
      console.error('没有可下载的模型路径')
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/api/train/download-model?model_path=${encodeURIComponent(status.model_path)}`)

      if (!response.ok) {
        throw new Error('下载失败')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'best.pt'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('下载模型失败:', error)
    }
  }

  const handleStartTraining = async () => {
    if (!params.yaml_path) {
      console.warn('请先选择或上传数据集 YAML 文件')
      return
    }

    setLoading(true)
    try {
      const requestData = {
        dataset_yaml: params.yaml_path,
        task: params.task,
        epochs: params.epochs,
        batch_size: params.batch_size,
        img_size: params.img_size,
        lr: params.lr0,
        device: params.device,
        project: params.project,
        name: params.name,
        workers: params.workers
      }

      const response = await fetch('http://localhost:8000/api/train/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()
      if (data.success) {
        console.log('训练已开始！')
        setTraining(true)
        setCurrentStep(2)
        startMonitoring(data.task_id)
      } else {
        console.error('训练启动失败: ' + (data.detail || '未知错误'))
      }
    } catch (error) {
      console.error('训练启动失败: ' + error.message)
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

          if (data.data.status === 'completed') {
            clearInterval(interval)
            setTraining(false)
            console.log('训练完成！')

            try {
              const curvesResponse = await fetch(`http://localhost:8000/api/train/curves/${taskId}`)
              if (curvesResponse.ok) {
                const blob = await curvesResponse.blob()
                const imageUrl = URL.createObjectURL(blob)
                setTrainingCurves(imageUrl)
              }
            } catch (error) {
              console.error('加载训练曲线失败:', error)
            }

            loadTrainingResults(taskId)
          }
        }
      } catch (error) {
        console.error('监控失败:', error)
      }
    }, 2000)
  }

  const stopTraining = async () => {
    if (!currentTaskId) return
    
    try {
      const response = await fetch(`http://localhost:8000/api/train/stop/${currentTaskId}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log('训练已停止')
          setTraining(false)
        }
      }
    } catch (error) {
      console.error('停止训练失败:', error)
    }
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
            title: <Space><FileTextOutlined /><span>config</span></Space>,
            key: 'config',
            value: 'config',
            children: [{
              title: <Space><FileTextOutlined /><span>datasets</span></Space>,
              key: 'config/datasets',
              value: 'config/datasets',
              children: data.data.map(file => ({
                title: <Space><FileTextOutlined /><span>{file.name}</span></Space>,
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

    const yamlFiles = await scanDirectory('/home/star/qzp/llm_auto_train/config/datasets', 'yaml')
    const yamlTree = [{
      title: <Space><FileTextOutlined /><span>config</span></Space>,
      key: 'config',
      value: 'config',
      children: [{
        title: <Space><FileTextOutlined /><span>datasets</span></Space>,
        key: 'config/datasets',
        value: 'config/datasets',
        children: yamlFiles.map(file => ({
          title: <Space><FileTextOutlined /><span>{file.name}</span></Space>,
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
            title: <Space><FileTextOutlined /><span>models</span></Space>,
            key: 'models',
            value: 'models',
            children: data.data.map(file => ({
              title: <Space><FileTextOutlined /><span>{file.name}</span></Space>,
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

    const modelFiles = await scanDirectory('/home/star/qzp/llm_auto_train/models', 'model')
    const modelTree = [{
      title: <Space><FileTextOutlined /><span>models</span></Space>,
      key: 'models',
      value: 'models',
      children: modelFiles.map(file => ({
        title: <Space><FileTextOutlined /><span>{file.name}</span></Space>,
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
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 0, flexShrink: 0 }}>
        <Title level={2}><ExperimentOutlined /> YOLO 模型训练</Title>
        <Paragraph type="secondary">
          配置数据集、选择预训练模型、调整训练参数、监控训练进度
        </Paragraph>

        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Step title="选择数据集" icon={<FileTextOutlined />} />
          <Step title="配置参数" icon={<SettingOutlined />} />
          <Step title="开始训练" icon={<PlayCircleOutlined />} />
        </Steps>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Row gutter={[24, 24]}>
          <Col span={14}>
          <DatasetConfig
            params={params}
            yamlDirectory={yamlDirectory}
            selectedYamlPath={selectedYamlPath}
            yamlFile={yamlFile}
            uploadingYaml={uploadingYaml}
            onYamlSourceChange={handleYamlSourceChange}
            onSelectYaml={handleSelectYaml}
            onYamlFileChange={setYamlFile}
            onUploadYaml={handleUploadYaml}
            onDeleteFile={handleDeleteFile}
          />

          <ModelConfig
            params={params}
            modelDirectory={modelDirectory}
            selectedModelPath={selectedModelPath}
            modelFile={modelFile}
            uploadingModel={uploadingModel}
            onModelSourceChange={handleModelSourceChange}
            onSelectModel={handleSelectModel}
            onModelFileChange={setModelFile}
            onUploadModel={handleUploadModel}
            onDeleteFile={handleDeleteFile}
          />

          <DatasetManagement
            datasetDirectory={datasetDirectory}
            selectedDatasetPath={selectedDatasetPath}
            datasetFile={datasetFile}
            uploadingDataset={uploadingDataset}
            datasetListExpanded={datasetListExpanded}
            onDatasetFileChange={setDatasetFile}
            onUploadDataset={handleUploadDataset}
            onSelectDataset={handleSelectDataset}
            onDeleteFile={handleDeleteFile}
            onToggleDatasetList={() => setDatasetListExpanded(!datasetListExpanded)}
            onClearSelectedDataset={() => setSelectedDatasetPath(null)}
          />

          <TrainingParams
            params={params}
            loading={loading}
            training={training}
            updateParam={updateParam}
            onSubmit={handleStartTraining}
          />
        </Col>

        <Col span={10}>
          <TrainingStatus
            training={training}
            status={status}
            progress={progress}
            trainingCurves={trainingCurves}
            onShowVisualization={handleShowVisualization}
            onStopTraining={stopTraining}
            onDownloadModel={handleDownloadModel}
          />

          <ConfigInfo />
        </Col>
      </Row>
      </div>

      <TrainingVisualization
        showVisualization={showVisualization}
        onHideVisualization={handleHideVisualization}
        trainingResults={trainingResults}
        currentTaskId={currentTaskId}
      />
    </div>
  )
}

export default Train