import React, { useState, useEffect, useRef } from 'react'
import { Card, Form, Select, Slider, InputNumber, Button, Upload, message, Row, Col, Typography, Divider, Table, Tabs, Alert, Space, Tag } from 'antd'
import { SearchOutlined, UploadOutlined, CameraOutlined, DownloadOutlined, FolderOutlined, InboxOutlined, FileImageOutlined, VideoCameraOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

function Inference() {
  const [form] = Form.useForm()
  const [loadingModel, setLoadingModel] = useState(false)
  const [loadingPredict, setLoadingPredict] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [currentModel, setCurrentModel] = useState(null)
  const [modelList, setModelList] = useState([])
  const [inferenceResult, setInferenceResult] = useState(null)
  const [cameraRunning, setCameraRunning] = useState(false)
  const [cameraFrame, setCameraFrame] = useState(null)
  const [cameraDevices, setCameraDevices] = useState([])
  const [selectedCamera, setSelectedCamera] = useState(0)
  const cameraIntervalRef = useRef(null)
  const cameraShouldRun = useRef(false)
  const isMounted = useRef(true)
  
  // 推理参数状态
  const [params, setParams] = useState({
    image_conf: 0.25,
    image_iou: 0.45,
    video_conf: 0.25,
    video_iou: 0.45,
    directory_conf: 0.25,
    directory_iou: 0.45,
    camera_conf: 0.25,
    camera_iou: 0.45
  })

  useEffect(() => {
    isMounted.current = true
    loadModelList()
    loadCameraDevices()
    
    return () => {
      isMounted.current = false
      stopCamera(false) // 不显示通知
    }
  }, [])

  const loadModelList = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/inference/model-directory')
      const data = await response.json()
      if (data.success && isMounted.current) {
        setModelList(data.data)
      }
    } catch (error) {
      console.error('加载模型列表失败:', error)
    }
  }

  const loadCameraDevices = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/inference/camera-devices')
      const data = await response.json()
      if (data.success && isMounted.current) {
        setCameraDevices(data.data)
      }
    } catch (error) {
      console.error('加载摄像头设备失败:', error)
    }
  }

  const handleLoadModel = async () => {
    const modelPath = form.getFieldValue('model_path')
    if (!modelPath) {
      message.warning('请先选择模型')
      return
    }
    
    setLoadingModel(true)
    try {
      const response = await fetch('http://localhost:8000/api/inference/load-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_path: modelPath })
      })
      const data = await response.json()
      if (data.success && isMounted.current) {
        message.success('模型加载成功！')
        setModelLoaded(true)
        setCurrentModel(data.data)
      } else {
        message.error('模型加载失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      if (isMounted.current) {
        message.error('模型加载失败: ' + error.message)
      }
    } finally {
      if (isMounted.current) {
        setLoadingModel(false)
      }
    }
  }

  const handleUploadModel = async (file) => {
    const formData = new FormData()
    formData.append('model', file)
    
    try {
      const response = await fetch('http://localhost:8000/api/inference/upload-model', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      if (data.success && isMounted.current) {
        message.success('模型上传成功！')
        loadModelList()
      } else {
        message.error('模型上传失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      if (isMounted.current) {
        message.error('模型上传失败: ' + error.message)
      }
    }
    return false
  }

  const handleImagePredict = async () => {
    if (!modelLoaded) {
      message.warning('请先加载模型')
      return
    }
    
    const imageFile = form.getFieldValue('image')
    if (!imageFile || !imageFile.file) {
      message.warning('请先上传图片')
      return
    }
    
    setLoadingPredict(true)
    try {
      const formData = new FormData()
      formData.append('image', imageFile.file)
      formData.append('conf', params.image_conf)
      formData.append('iou', params.image_iou)

      const response = await fetch('http://localhost:8000/api/inference/predict-image', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      if (data.success && isMounted.current) {
        setInferenceResult({
          type: 'image',
          data: data.data
        })
        message.success('推理完成！')
      } else {
        message.error('推理失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      if (isMounted.current) {
        message.error('推理失败: ' + error.message)
      }
    } finally {
      if (isMounted.current) {
        setLoadingPredict(false)
      }
    }
  }

  const handleVideoPredict = async () => {
    if (!modelLoaded) {
      message.warning('请先加载模型')
      return
    }
    
    const videoFile = form.getFieldValue('video')
    if (!videoFile || !videoFile.file) {
      message.warning('请先上传视频')
      return
    }
    
    setLoadingPredict(true)
    try {
      const formData = new FormData()
      formData.append('video', videoFile.file)
      formData.append('conf', params.video_conf)
      formData.append('iou', params.video_iou)

      const response = await fetch('http://localhost:8000/api/inference/predict-video', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      if (data.success && isMounted.current) {
        setInferenceResult({
          type: 'video',
          data: data.data
        })
        message.success('视频推理完成！')
      } else {
        message.error('视频推理失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      if (isMounted.current) {
        message.error('视频推理失败: ' + error.message)
      }
    } finally {
      if (isMounted.current) {
        setLoadingPredict(false)
      }
    }
  }

  const handleDirectoryPredict = async () => {
    if (!modelLoaded) {
      message.warning('请先加载模型')
      return
    }
    
    const directoryFile = form.getFieldValue('directory')
    if (!directoryFile || !directoryFile.file) {
      message.warning('请先上传压缩包')
      return
    }
    
    setLoadingPredict(true)
    try {
      const formData = new FormData()
      formData.append('directory', directoryFile.file)
      formData.append('conf', params.directory_conf)
      formData.append('iou', params.directory_iou)

      const response = await fetch('http://localhost:8000/api/inference/predict-directory', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      if (data.success && isMounted.current) {
        setInferenceResult({
          type: 'directory',
          data: data.data
        })
        message.success(`批量推理完成！共处理 ${data.data.processed_files}/${data.data.total_files} 个文件`)
      } else {
        message.error('批量推理失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      if (isMounted.current) {
        message.error('批量推理失败: ' + error.message)
      }
    } finally {
      if (isMounted.current) {
        setLoadingPredict(false)
      }
    }
  }

  const startCamera = async () => {
    if (!modelLoaded) {
      message.warning('请先加载模型')
      return
    }
    
    try {
      // 使用浏览器原生API获取远程摄像头
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      })
      
      if (isMounted.current) {
        setCameraRunning(true)
        cameraShouldRun.current = true
        message.success('摄像头推理已启动，正在获取画面...')
        console.log('摄像头流已获取，创建视频元素...')
        
        // 创建视频元素
        const video = document.createElement('video')
        video.autoplay = true
        video.srcObject = stream
        await video.play()
        console.log('视频元素已播放，尺寸:', video.videoWidth, 'x', video.videoHeight)
        
        // 创建canvas用于捕获帧
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // 定期捕获帧并发送到后端进行推理
        cameraIntervalRef.current = setInterval(() => {
          if (!isMounted.current || !cameraShouldRun.current) {
            console.log('摄像头运行检查失败: isMounted=', isMounted.current, 'cameraShouldRun=', cameraShouldRun.current)
            return
          }
          
          try {
            console.log('捕获摄像头帧...')
            // 绘制当前帧到canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            
            // 转换为base64
            const imageData = canvas.toDataURL('image/jpeg', 0.8)
            const base64Data = imageData.split(',')[1]
            console.log('发送推理请求，base64数据长度:', base64Data.length)
            
            // 发送到后端进行推理
            fetch('http://localhost:8000/api/inference/predict-image-json', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image: base64Data,
                conf: params.camera_conf,
                iou: params.camera_iou
              })
            })
            .then(res => res.json())
            .then(data => {
              console.log('推理响应:', data.success, data.data ? '有数据' : '无数据')
              if (data.success && data.data && isMounted.current && cameraShouldRun.current) {
                console.log('设置摄像头画面')
                setCameraFrame(data.data.image)
              }
            })
            .catch(err => {
              if (isMounted.current) {
                console.error('推理失败:', err)
              }
            })
          } catch (err) {
            if (isMounted.current) {
              console.error('捕获帧失败:', err)
            }
          }
        }, 100) // 每100ms推理一次
        
        // 保存stream引用用于停止
        window.cameraStream = stream
      }
    } catch (error) {
      if (isMounted.current) {
        message.error('启动摄像头失败: ' + error.message)
        console.error('摄像头访问失败:', error)
      }
    }
  }

  const stopCamera = async (showNotification = true) => {
    try {
      // 停止摄像头运行标志
      cameraShouldRun.current = false
      
      // 停止浏览器摄像头
      if (window.cameraStream) {
        window.cameraStream.getTracks().forEach(track => track.stop())
        window.cameraStream = null
      }
      
      if (isMounted.current) {
        setCameraRunning(false)
        setCameraFrame(null)
      }
      
      if (cameraIntervalRef.current) {
        clearInterval(cameraIntervalRef.current)
        cameraIntervalRef.current = null
      }
      
      // 只在用户主动停止时显示通知
      if (showNotification) {
        message.success('摄像头已停止')
      }
    } catch (error) {
      console.error('停止摄像头失败:', error)
    }
  }

  const handleDownload = async (resultId) => {
    try {
      window.open(`http://localhost:8000/api/inference/download/${resultId}`, '_blank')
    } catch (error) {
      message.error('下载失败: ' + error.message)
    }
  }

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div>
      <Title level={2}><SearchOutlined /> YOLO 模型推理</Title>
      <Divider />
      
      <Row gutter={[24, 24]}>
        {/* 左侧：模型加载和推理配置 */}
        <Col span={8}>
          <Card title="模型管理" variant="outlined">
            <Alert 
              message="选择已训练的模型或上传新模型进行推理" 
              type="info" 
              showIcon 
              style={{ marginBottom: 16 }}
            />
            
            <Form form={form} layout="vertical">
              <Form.Item name="model_path" label="选择模型" rules={[{ required: true, message: '请选择模型' }]}>
                <Select placeholder="请选择模型">
                  <Select.OptGroup label="训练模型">
                    {modelList.filter(m => m.type === 'trained').map(model => (
                      <Select.Option key={model.path} value={model.path}>
                        <Space>
                          <FolderOutlined />
                          <span>{model.name}</span>
                        </Space>
                      </Select.Option>
                    ))}
                  </Select.OptGroup>
                  <Select.OptGroup label="预训练模型">
                    {modelList.filter(m => m.type === 'pretrained').map(model => (
                      <Select.Option key={model.path} value={model.path}>
                        <Space>
                          <InboxOutlined />
                          <span>{model.name}</span>
                        </Space>
                      </Select.Option>
                    ))}
                  </Select.OptGroup>
                </Select>
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" onClick={handleLoadModel} loading={loadingModel} block>
                  加载模型
                </Button>
              </Form.Item>
            </Form>
            
            <Divider>上传新模型</Divider>
            
            <Upload
              accept=".pt,.pth"
              beforeUpload={handleUploadModel}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} block>
                上传模型文件
              </Button>
            </Upload>
            
            {currentModel && (
              <Alert
                message={
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>当前模型类别:</Text>
                    <div>{currentModel.names ? Object.values(currentModel.names).join(', ') : '未知'}</div>
                    <Tag color="success">任务类型: {currentModel.task}</Tag>
                  </Space>
                }
                type="success"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </Card>
        </Col>

        {/* 右侧：推理功能 */}
        <Col span={16}>
          <Card title="推理功能" variant="outlined">
            <Tabs
              defaultActiveKey="image"
              items={[
                {
                  key: 'image',
                  label: <span><FileImageOutlined />图片推理</span>,
                  children: (
                    <Form form={form} layout="vertical">
                      <Form.Item name="image" label="上传图片" rules={[{ required: true, message: '请上传图片' }]}>
                        <Upload
                          beforeUpload={() => false}
                          listType="picture"
                          maxCount={1}
                        >
                          <Button icon={<UploadOutlined />}>选择图片</Button>
                        </Upload>
                      </Form.Item>
                      
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label={`置信度阈值`}>
                            <Space.Compact style={{ width: '100%' }}>
                              <InputNumber
                                min={0}
                                max={1}
                                step={0.01}
                                value={params.image_conf}
                                onChange={(value) => updateParam('image_conf', value)}
                                style={{ flex: 1 }}
                              />
                              <Slider
                                min={0}
                                max={1}
                                step={0.01}
                                value={params.image_conf}
                                onChange={(value) => updateParam('image_conf', value)}
                                style={{ flex: 2 }}
                              />
                            </Space.Compact>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label={`IoU 阈值`}>
                            <Space.Compact style={{ width: '100%' }}>
                              <InputNumber
                                min={0}
                                max={1}
                                step={0.01}
                                value={params.image_iou}
                                onChange={(value) => updateParam('image_iou', value)}
                                style={{ flex: 1 }}
                              />
                              <Slider
                                min={0}
                                max={1}
                                step={0.01}
                                value={params.image_iou}
                                onChange={(value) => updateParam('image_iou', value)}
                                style={{ flex: 2 }}
                              />
                            </Space.Compact>
                          </Form.Item>
                        </Col>
                      </Row>
                      
                      <Form.Item>
                        <Button type="primary" onClick={handleImagePredict} loading={loadingPredict} block>
                          开始推理
                        </Button>
                      </Form.Item>
                    </Form>
                  )
                },
                {
                  key: 'video',
                  label: <span><VideoCameraOutlined />视频推理</span>,
                  children: (
                    <Form form={form} layout="vertical">
                      <Form.Item name="video" label="上传视频" rules={[{ required: true, message: '请上传视频' }]}>
                        <Upload
                          beforeUpload={() => false}
                          listType="picture"
                          maxCount={1}
                          accept=".mp4,.avi,.mov"
                        >
                          <Button icon={<UploadOutlined />}>选择视频</Button>
                        </Upload>
                      </Form.Item>
                      
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label={`置信度阈值`}>
                            <Space.Compact style={{ width: '100%' }}>
                              <InputNumber
                                min={0}
                                max={1}
                                step={0.01}
                                value={params.video_conf}
                                onChange={(value) => updateParam('video_conf', value)}
                                style={{ flex: 1 }}
                              />
                              <Slider
                                min={0}
                                max={1}
                                step={0.01}
                                value={params.video_conf}
                                onChange={(value) => updateParam('video_conf', value)}
                                style={{ flex: 2 }}
                              />
                            </Space.Compact>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label={`IoU 阈值`}>
                            <Space.Compact style={{ width: '100%' }}>
                              <InputNumber
                                min={0}
                                max={1}
                                step={0.01}
                                value={params.video_iou}
                                onChange={(value) => updateParam('video_iou', value)}
                                style={{ flex: 1 }}
                              />
                              <Slider
                                min={0}
                                max={1}
                                step={0.01}
                                value={params.video_iou}
                                onChange={(value) => updateParam('video_iou', value)}
                                style={{ flex: 2 }}
                              />
                            </Space.Compact>
                          </Form.Item>
                        </Col>
                      </Row>
                      
                      <Form.Item>
                        <Button type="primary" onClick={handleVideoPredict} loading={loadingPredict} block>
                          开始推理
                        </Button>
                      </Form.Item>
                    </Form>
                  )
                },
                {
                  key: 'directory',
                  label: <span><FolderOutlined />批量推理</span>,
                  children: (
                    <Form form={form} layout="vertical">
                      <Form.Item name="directory" label="上传图片目录压缩包" 
                        rules={[{ required: true, message: '请上传压缩包' }]}
                        extra="支持 .zip, .tar.gz 格式">
                        <Upload
                          beforeUpload={() => false}
                          listType="picture"
                          maxCount={1}
                          accept=".zip,.tar.gz,.tgz"
                        >
                          <Button icon={<UploadOutlined />}>选择压缩包</Button>
                        </Upload>
                      </Form.Item>
                      
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label={`置信度阈值`}>
                            <Space.Compact style={{ width: '100%' }}>
                              <InputNumber
                                min={0}
                                max={1}
                                step={0.01}
                                value={params.directory_conf}
                                onChange={(value) => updateParam('directory_conf', value)}
                                style={{ flex: 1 }}
                              />
                              <Slider
                                min={0}
                                max={1}
                                step={0.01}
                                value={params.directory_conf}
                                onChange={(value) => updateParam('directory_conf', value)}
                                style={{ flex: 2 }}
                              />
                            </Space.Compact>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label={`IoU 阈值`}>
                            <Space.Compact style={{ width: '100%' }}>
                              <InputNumber
                                min={0}
                                max={1}
                                step={0.01}
                                value={params.directory_iou}
                                onChange={(value) => updateParam('directory_iou', value)}
                                style={{ flex: 1 }}
                              />
                              <Slider
                                min={0}
                                max={1}
                                step={0.01}
                                value={params.directory_iou}
                                onChange={(value) => updateParam('directory_iou', value)}
                                style={{ flex: 2 }}
                              />
                            </Space.Compact>
                          </Form.Item>
                        </Col>
                      </Row>
                      
                      <Form.Item>
                        <Button type="primary" onClick={handleDirectoryPredict} loading={loadingPredict} block>
                          开始批量推理
                        </Button>
                      </Form.Item>
                    </Form>
                  )
                },
                {
                  key: 'camera',
                                    label: <span><CameraOutlined />摄像头推理</span>,
                                    children: (
                                      <>
                                        <Alert 
                                          message="使用浏览器摄像头进行实时推理" 
                                          description="点击启动摄像头后，浏览器将请求摄像头权限，获取您的摄像头画面进行推理。"
                                          type="info" 
                                          showIcon 
                                          style={{ marginBottom: 16 }}
                                        />
                                        
                                        <Form layout="vertical">
                                          <Row gutter={16}>
                                            <Col span={12}>
                                              <Form.Item label={`置信度阈值`}>
                                                <Space.Compact style={{ width: '100%' }}>
                                                  <InputNumber
                                                    min={0}
                                                    max={1}
                                                    step={0.01}
                                                    value={params.camera_conf}
                                                    onChange={(value) => updateParam('camera_conf', value)}
                                                    style={{ flex: 1 }}
                                                  />
                                                  <Slider
                                                    min={0}
                                                    max={1}
                                                    step={0.01}
                                                    value={params.camera_conf}
                                                    onChange={(value) => updateParam('camera_conf', value)}
                                                    style={{ flex: 2 }}
                                                  />
                                                </Space.Compact>
                                              </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                              <Form.Item label={`IoU 阈值`}>
                                                <Space.Compact style={{ width: '100%' }}>
                                                  <InputNumber
                                                    min={0}
                                                    max={1}
                                                    step={0.01}
                                                    value={params.camera_iou}
                                                    onChange={(value) => updateParam('camera_iou', value)}
                                                    style={{ flex: 1 }}
                                                  />
                                                  <Slider
                                                    min={0}
                                                    max={1}
                                                    step={0.01}
                                                    value={params.camera_iou}
                                                    onChange={(value) => updateParam('camera_iou', value)}
                                                    style={{ flex: 2 }}
                                                  />
                                                </Space.Compact>
                                              </Form.Item>
                                            </Col>
                                          </Row>
                                        </Form>
                                        
                                        <Space>
                                          {!cameraRunning ? (
                                            <Button type="primary" onClick={startCamera} icon={<CameraOutlined />}>
                                              启动摄像头
                                            </Button>
                                          ) : (
                                            <Button danger onClick={stopCamera}>
                                              停止摄像头
                                            </Button>
                                          )}
                                        </Space>
                                        
                                        {cameraFrame && (
                                          <div style={{ marginTop: 16 }}>
                                            <Text strong>实时推理画面</Text>
                                            <img
                                              src={`data:image/jpeg;base64,${cameraFrame}`}
                                              alt="摄像头画面"
                                              style={{ 
                                                width: '100%', 
                                                borderRadius: 8,
                                                marginTop: 8,
                                                border: '2px solid #1890ff'
                                              }}
                                            />
                                          </div>
                                        )}
                                      </>
                                    )
                                  }              ]}
            />
          </Card>

          {/* 推理结果显示 */}
          {inferenceResult && (
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
                      onClick={() => handleDownload(inferenceResult.data.result_id)}
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
                      dataSource={inferenceResult.data.detections}
                      rowKey={(record, index) => index}
                      columns={[
                        { title: '类别', dataIndex: 'class', key: 'class' },
                        { title: '置信度', dataIndex: 'confidence', key: 'conf', render: (v) => `${(v * 100).toFixed(1)}%` },
                        { title: '位置', dataIndex: 'bbox', key: 'bbox', render: (v) => `(${v.map(n => n.toFixed(0)).join(', ')})` }
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
                    dataSource={inferenceResult.data.results}
                    rowKey={(record, index) => index}
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
          )}
        </Col>
      </Row>
    </div>
  )
}

export default Inference