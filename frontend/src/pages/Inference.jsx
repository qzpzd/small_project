import React, { useState, useEffect, useRef } from 'react'
import { Typography, Row, Col, Divider, Tabs, Card, Form } from 'antd'
import { SearchOutlined, FileImageOutlined, VideoCameraOutlined, FolderOutlined, CameraOutlined } from '@ant-design/icons'

// 导入拆分后的组件
import ModelManagement from '../components/inference/ModelManagement'
import ImageInference from '../components/inference/ImageInference'
import VideoInference from '../components/inference/VideoInference'
import DirectoryInference from '../components/inference/DirectoryInference'
import CameraInference from '../components/inference/CameraInference'
import InferenceResult from '../components/inference/InferenceResult'

const { Title } = Typography

function Inference() {
  const [formInstance] = Form.useForm()
  const formRef = useRef(formInstance)
  const [loadingModel, setLoadingModel] = useState(false)
  const [loadingPredict, setLoadingPredict] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [currentModel, setCurrentModel] = useState(null)
  const [modelList, setModelList] = useState([])
  const [inferenceResult, setInferenceResult] = useState(null)
  const [cameraRunning, setCameraRunning] = useState(false)
  const [cameraFrame, setCameraFrame] = useState(null)
  const [cameraDetections, setCameraDetections] = useState([])
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

    return () => {
      isMounted.current = false
      stopCamera(false)
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

  const handleLoadModel = async () => {
    const modelPath = formRef.current?.getFieldValue('model_path')
    if (!modelPath) {
      console.warn('请先选择模型')
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
        console.log('模型加载成功！')
        setModelLoaded(true)
        setCurrentModel(data.data)
      } else {
        console.error('模型加载失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('模型加载失败: ' + error.message)
      }
    } finally {
      if (isMounted.current) {
        setLoadingModel(false)
      }
    }
  }

  const handleUploadModel = async (file) => {
    console.log('开始上传模型文件:', file)
    
    if (!file) {
      console.error('没有选择文件')
      return false
    }

    const formData = new FormData()
    formData.append('model', file)

    try {
      console.log('发送上传请求到:', 'http://localhost:8000/api/inference/upload-model')
      const response = await fetch('http://localhost:8000/api/inference/upload-model', {
        method: 'POST',
        body: formData
      })
      
      console.log('响应状态:', response.status)
      const data = await response.json()
      console.log('响应数据:', data)
      
      if (data.success && isMounted.current) {
        console.log('模型上传成功！')
        
        // 重新加载模型列表
        await loadModelList()
        
        // 自动选择新上传的模型
        if (data.data && data.data.model_path) {
          formRef.current?.setFieldsValue({
            model_path: data.data.model_path
          })
          console.log('已自动选择新上传的模型:', data.data.model_path)
        }
      } else {
        console.error('模型上传失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('模型上传失败: ' + error.message)
        console.error('错误详情:', error)
      }
    }
    return false
  }

  const handleImagePredict = async () => {
    if (!modelLoaded) {
      console.warn('请先加载模型')
      return
    }

    const imageFile = formRef.current?.getFieldValue('image')
    console.log('获取到的图片文件:', imageFile)
    
    // 获取实际的文件对象
    let actualFile = null
    if (imageFile && Array.isArray(imageFile) && imageFile.length > 0) {
      actualFile = imageFile[0]
    } else if (imageFile && imageFile.originFileObj) {
      actualFile = imageFile.originFileObj
    } else if (imageFile instanceof File) {
      actualFile = imageFile
    }
    
    console.log('实际文件对象:', actualFile)
    
    if (!actualFile) {
      console.warn('请先上传图片')
      return
    }

    setLoadingPredict(true)
    try {
      const formData = new FormData()
      formData.append('image', actualFile)
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
        console.log('推理完成！')
      } else {
        console.error('推理失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('推理失败: ' + error.message)
      }
    } finally {
      if (isMounted.current) {
        setLoadingPredict(false)
      }
    }
  }

  const handleVideoPredict = async () => {
    if (!modelLoaded) {
      console.warn('请先加载模型')
      return
    }

    const videoFile = formRef.current?.getFieldValue('video')
    
    // 尝试不同的文件获取方式
    let actualFile = videoFile
    if (videoFile && videoFile.fileList && videoFile.fileList.length > 0) {
      actualFile = videoFile.fileList[0]
    } else if (videoFile && videoFile.originFileObj) {
      actualFile = videoFile.originFileObj
    }
    
    if (!actualFile) {
      console.warn('请先上传视频')
      return
    }

    setLoadingPredict(true)
    try {
      const formData = new FormData()
      formData.append('video', actualFile)
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
        console.log('视频推理完成！')
      } else {
        console.error('视频推理失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('视频推理失败: ' + error.message)
      }
    } finally {
      if (isMounted.current) {
        setLoadingPredict(false)
      }
    }
  }

  const handleDirectoryPredict = async () => {
    if (!modelLoaded) {
      console.warn('请先加载模型')
      return
    }

    const directoryFile = formRef.current?.getFieldValue('directory')
    
    // 尝试不同的文件获取方式
    let actualFile = directoryFile
    if (directoryFile && directoryFile.fileList && directoryFile.fileList.length > 0) {
      actualFile = directoryFile.fileList[0]
    } else if (directoryFile && directoryFile.originFileObj) {
      actualFile = directoryFile.originFileObj
    }
    
    if (!actualFile) {
      console.warn('请先上传压缩包')
      return
    }

    setLoadingPredict(true)
    try {
      const formData = new FormData()
      formData.append('directory', actualFile)
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
        console.log(`批量推理完成！共处理 ${data.data.processed_files}/${data.data.total_files} 个文件`)
      } else {
        console.error('批量推理失败: ' + (data.message || '未知错误'))
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('批量推理失败: ' + error.message)
      }
    } finally {
      if (isMounted.current) {
        setLoadingPredict(false)
      }
    }
  }

  const startCamera = async () => {
    if (!modelLoaded) {
      console.warn('请先加载模型')
      return
    }

    // 清空之前的推理结果
    setInferenceResult(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })

      if (isMounted.current) {
        setCameraRunning(true)
        cameraShouldRun.current = true
        console.log('摄像头推理已启动，正在获取画面...')

        const video = document.createElement('video')
        video.autoplay = true
        video.srcObject = stream
        await video.play()

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        cameraIntervalRef.current = setInterval(() => {
          if (!isMounted.current || !cameraShouldRun.current) {
            return
          }

          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const imageData = canvas.toDataURL('image/jpeg', 0.8)
            const base64Data = imageData.split(',')[1]

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
              if (data.success && data.data && isMounted.current && cameraShouldRun.current) {
                setCameraFrame(data.data.image)
                setCameraDetections(data.data.detections || [])
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
        }, 100)

        window.cameraStream = stream
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('启动摄像头失败: ' + error.message)
      }
    }
  }

  const stopCamera = async (showNotification = true) => {
    try {
      cameraShouldRun.current = false

      if (window.cameraStream) {
        window.cameraStream.getTracks().forEach(track => track.stop())
        window.cameraStream = null
      }

      if (isMounted.current) {
        setCameraRunning(false)
        setCameraFrame(null)
        setCameraDetections([])
      }

      if (cameraIntervalRef.current) {
        clearInterval(cameraIntervalRef.current)
        cameraIntervalRef.current = null
      }

      if (showNotification) {
        console.log('摄像头已停止')
      }
    } catch (error) {
      console.error('停止摄像头失败:', error)
    }
  }

  const handleDownload = async (resultId) => {
    try {
      window.open(`http://localhost:8000/api/inference/download/${resultId}`, '_blank')
    } catch (error) {
      console.error('下载失败: ' + error.message)
    }
  }

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }

  const handleTabChange = (activeKey) => {
    // 如果切换到摄像头标签，清空其他推理结果
    if (activeKey === 'camera') {
      setInferenceResult(null)
    }
    // 如果从摄像头切换到其他标签，清空摄像头推理结果
    else if (cameraRunning) {
      stopCamera(false)
    }
  }

  return (
    <div>
      <Title level={2}><SearchOutlined /> YOLO 模型推理</Title>
      <Divider />

      <Row gutter={[24, 24]}>
        <Col span={8}>
          <ModelManagement
            modelList={modelList}
            loadingModel={loadingModel}
            currentModel={currentModel}
            modelLoaded={modelLoaded}
            onLoadModel={handleLoadModel}
            onUploadModel={handleUploadModel}
            form={formInstance}
          />
        </Col>

        <Col span={16}>
          <Card title="推理功能" variant="outlined">
            <Form form={formInstance}>
              <Tabs
                defaultActiveKey="image"
                onChange={handleTabChange}
                items={[
                  {
                    key: 'image',
                    label: <span><FileImageOutlined />图片推理</span>,
                    children: (
                      <ImageInference
                        params={params}
                        loadingPredict={loadingPredict}
                        updateParam={updateParam}
                        onPredict={handleImagePredict}
                        form={formInstance}
                      />
                    )
                  },
                  {
                    key: 'video',
                    label: <span><VideoCameraOutlined />视频推理</span>,
                    children: (
                    <VideoInference
                      params={params}
                      loadingPredict={loadingPredict}
                      updateParam={updateParam}
                      onPredict={handleVideoPredict}
                      form={formInstance}
                    />
                  )
                },
                {
                  key: 'directory',
                  label: <span><FolderOutlined />批量推理</span>,
                  children: (
                    <DirectoryInference
                      params={params}
                      loadingPredict={loadingPredict}
                      updateParam={updateParam}
                      onPredict={handleDirectoryPredict}
                      form={formInstance}
                    />
                  )
                },
                {
                  key: 'camera',
                  label: <span><CameraOutlined />摄像头推理</span>,
                  children: (
                    <CameraInference
                      params={params}
                      cameraRunning={cameraRunning}
                      cameraFrame={cameraFrame}
                      cameraDetections={cameraDetections}
                      updateParam={updateParam}
                      onStartCamera={startCamera}
                      onStopCamera={() => stopCamera(true)}
                    />
                  )
                }
                                ]}
                              />
                            </Form>
                          </Card>
          <InferenceResult
            inferenceResult={inferenceResult}
            onDownload={handleDownload}
          />
        </Col>
      </Row>
    </div>
  )
}

export default Inference