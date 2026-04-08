import React, { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Row, Col, message, Upload, Button, Tabs, Select, Card, Modal, Table, Space, Tag, Spin, Input, Switch } from 'antd'
import { UploadOutlined, FileTextOutlined, PictureOutlined, DeleteOutlined, DownloadOutlined, MessageOutlined, RobotOutlined, SettingOutlined, HistoryOutlined, BookOutlined } from '@ant-design/icons'
import axios from 'axios'
import api from './services/api'
import Layout from './components/Layout'
import Train from './pages/Train'
import Inference from './pages/Inference'
import Annotation from './pages/Annotation'
import Datasets from './pages/Datasets'
import ApiConfig from './components/ApiConfig'

const { TextArea } = Input
const { Option } = Select

// 生成会话ID
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

function Home() {
  const navigate = useNavigate()
  
  // 对话状态
  const [sessionId, setSessionId] = useState(generateSessionId())
  const [llmInput, setLlmInput] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [llmLoading, setLlmLoading] = useState(false)
  const [useKnowledge, setUseKnowledge] = useState(true)
  // 文件上传状态
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  
  // 图片分析状态
  const [analyzingImage, setAnalyzingImage] = useState(false)
  const [imageAnalysisResult, setImageAnalysisResult] = useState(null)
  const [analysisHistory, setAnalysisHistory] = useState([])
  
  // 报告生成状态
  const [reports, setReports] = useState([])
  const [generatingReport, setGeneratingReport] = useState(false)
  
  // API配置状态
  const [apiConfigs, setApiConfigs] = useState([])
  const [activeConfig, setActiveConfig] = useState(null)
  const [configModalVisible, setConfigModalVisible] = useState(false)
  
  // 知识库状态
  const [knowledgeDocs, setKnowledgeDocs] = useState([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState([])
  
  const chatEndRef = useRef(null)

  // 初始化时加载数据
  useEffect(() => {
    loadApiConfigs()
    loadReports()
    loadKnowledgeDocs()
    loadAnalysisHistory()
  }, [])

  // 自动滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // 加载API配置
  const loadApiConfigs = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/config/api')
      if (response.data.success) {
        setApiConfigs(response.data.data)
        const active = response.data.data.find(c => c.is_active)
        setActiveConfig(active)
      }
    } catch (error) {
      console.error('加载API配置失败:', error)
    }
  }

  // 加载报告列表
  const loadReports = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/report/list')
      console.log('报告列表响应:', response.data)
      if (response.data.success) {
        const reportData = response.data.data || []
        console.log('报告数据:', reportData)
        console.log('报告数据类型:', typeof reportData)
        console.log('报告数据是否为数组:', Array.isArray(reportData))
        
        if (Array.isArray(reportData)) {
          setReports(reportData)
        } else {
          console.error('报告数据不是数组:', reportData)
          setReports([])
        }
      }
    } catch (error) {
      console.error('加载报告列表失败:', error)
      setReports([])
    }
  }

  // 加载知识库文档
  const loadKnowledgeDocs = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/knowledge/list')
      if (response.data.success) {
        setKnowledgeDocs(response.data.data)
      }
    } catch (error) {
      console.error('加载知识库文档失败:', error)
    }
  }

  // 加载图片分析历史
  const loadAnalysisHistory = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/image/analysis/list')
      if (response.data.success) {
        setAnalysisHistory(response.data.data)
      }
    } catch (error) {
      console.error('加载分析历史失败:', error)
    }
  }

  // 发送消息（带记忆）
  const handleSendMessage = async () => {
    if (!llmInput.trim()) return
    
    const userMessage = llmInput
    setLlmInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLlmLoading(true)
    
    try {
      const response = await axios.post('http://localhost:8000/api/knowledge/chat', {
        session_id: sessionId,
        message: userMessage,
        use_knowledge: useKnowledge
      })
      
      if (response.data.success) {
        const assistantMessage = response.data.data.response
        setChatMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }])
      } else {
        message.error(response.data.message || '发送失败')
      }
    } catch (error) {
      message.error('服务连接失败，请检查后端服务')
      setChatMessages(prev => [...prev, { role: 'assistant', content: '抱歉，服务暂时不可用。' }])
    } finally {
      setLlmLoading(false)
    }
  }

  // 清除对话历史
  const handleClearHistory = async () => {
    try {
      await axios.delete(`http://localhost:8000/api/conversation/clear?session_id=${sessionId}`)
      setChatMessages([])
      setSessionId(generateSessionId())
      message.success('对话历史已清除')
    } catch (error) {
      message.error('清除失败')
    }
  }

  // 上传文档到知识库
  const handleKnowledgeUpload = async (options) => {
    const { file, onSuccess, onError } = options
    
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    
    console.log('上传文件:', file.name, file.size, file.type)
    console.log('文件对象:', file)
    
    try {
      const response = await axios.post('http://localhost:8000/api/knowledge/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log(`上传进度: ${percentCompleted}%`)
        }
      })
      
      console.log('上传响应:', response.data)
      
      if (response.data.success) {
        message.success('文档上传成功')
        loadKnowledgeDocs()
        if (onSuccess) onSuccess(response.data, file)
      } else {
        message.error(response.data.message || '上传失败')
        if (onError) onError(new Error(response.data.message || '上传失败'))
      }
    } catch (error) {
      console.error('上传失败:', error)
      console.error('错误详情:', error.response?.data)
      message.error('上传失败: ' + (error.response?.data?.detail || error.message))
      if (onError) onError(error)
    } finally {
      setUploading(false)
    }
  }

  // 搜索知识库
  const handleSearchKnowledge = async () => {
    if (!searchKeyword.trim()) return
    
    try {
      const response = await axios.get(`http://localhost:8000/api/knowledge/search?keyword=${encodeURIComponent(searchKeyword)}`)
      if (response.data.success) {
        setSearchResults(response.data.data)
      }
    } catch (error) {
      message.error('搜索失败')
    }
  }

  // 上传并分析图片
  const handleImageUpload = async (options) => {
    const { file, onSuccess, onError } = options
    
    setAnalyzingImage(true)
    const formData = new FormData()
    formData.append('file', file)
    
    console.log('上传图片:', file.name, file.size, file.type)
    console.log('文件对象:', file)
    
    try {
      const response = await axios.post(
        'http://localhost:8000/api/image/upload-and-analyze',
        formData,
        {
          params: {
            analysis_type: 'general',
            use_ocr: true,
            use_llm: true
          }
        }
      )
      
      console.log('图片分析响应:', response.data)
      
      if (response.data.success) {
        setImageAnalysisResult(response.data.data)
        loadAnalysisHistory()
        message.success('图片分析完成')
        if (onSuccess) onSuccess(response.data, file)
      } else {
        message.error(response.data.message || '分析失败')
        if (onError) onError(new Error(response.data.message || '分析失败'))
      }
    } catch (error) {
      console.error('分析失败:', error)
      console.error('错误详情:', error.response?.data)
      message.error('分析失败: ' + (error.response?.data?.detail || error.message))
      if (onError) onError(error)
    } finally {
      setAnalyzingImage(false)
    }
  }

  // 生成报告
  const handleGenerateReport = async () => {
    if (!imageAnalysisResult && chatMessages.length === 0) {
      message.warning('请先进行对话或图片分析')
      return
    }
    
    setGeneratingReport(true)
    
    try {
      const reportData = {
        title: `分析报告 - ${new Date().toLocaleString('zh-CN')}`,
        content: '本报告基于AI对话和图片分析结果生成。',
        sections: [],
        metadata: {
          author: 'AI助手',
          session_id: sessionId
        }
      }
      
      // 添加对话历史章节
      if (chatMessages.length > 0) {
        reportData.sections.push({
          title: '对话历史',
          content: `本次对话共${chatMessages.length}条消息，包含问题和AI回答。`,
          tables: [[
            '角色', '内容', '时间'
          ], ...chatMessages.map(msg => [
            msg.role === 'user' ? '用户' : 'AI',
            msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
            new Date().toLocaleString('zh-CN')
          ])]
        })
      }
      
      // 添加图片分析章节
      if (imageAnalysisResult) {
        reportData.sections.push({
          title: '图片分析',
          content: imageAnalysisResult.llm_summary || '图片分析结果',
          images: [imageAnalysisResult.file_path]
        })
      }
      
      const response = await axios.post('http://localhost:8000/api/report/generate', reportData)
      
      if (response.data.success) {
        message.success('报告生成成功')
        loadReports()
      } else {
        message.error(response.data.message || '生成失败')
      }
    } catch (error) {
      message.error('生成失败')
    } finally {
      setGeneratingReport(false)
    }
  }

  // 下载报告
  const handleDownloadReport = (filename) => {
    window.open(`http://localhost:8000/api/report/download/${filename}`, '_blank')
  }

  // 删除报告
  const handleDeleteReport = async (filename) => {
    try {
      await axios.delete(`http://localhost:8000/api/report/${filename}`)
      message.success('删除成功')
      loadReports()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 删除知识库文档
  const handleDeleteKnowledgeDoc = async (docId) => {
    try {
      await axios.delete(`http://localhost:8000/api/knowledge/${docId}`)
      message.success('删除成功')
      loadKnowledgeDocs()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 删除图片分析记录
  const handleDeleteAnalysis = async (analysisId) => {
    try {
      await axios.delete(`http://localhost:8000/api/image/analysis/${analysisId}`)
      message.success('删除成功')
      loadAnalysisHistory()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const knowledgeColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '文件名', dataIndex: 'filename', key: 'filename', ellipsis: true },
    { title: '类型', dataIndex: 'file_type', key: 'file_type', width: 80 },
    { 
      title: '上传时间', 
      dataIndex: 'upload_time', 
      key: 'upload_time',
      width: 120,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 70,
      render: (_, record) => (
        <Button 
          type="link" 
          size="small"
          danger 
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteKnowledgeDoc(record.id)}
        >
          删除
        </Button>
      )
    }
  ]

  const reportColumns = [
    { 
      title: '文件名', 
      dataIndex: 'filename', 
      key: 'filename',
      ellipsis: true
    },
    { 
      title: '格式', 
      dataIndex: 'format', 
      key: 'format',
      width: 100,
      render: (text) => text ? <Tag color="blue">{String(text).toUpperCase()}</Tag> : '-'
    },
    { 
      title: '大小', 
      dataIndex: 'size', 
      key: 'size',
      width: 120,
      render: (size) => size ? `${(Number(size) / 1024).toFixed(2)} KB` : '0 KB'
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadReport(record.filename)}
          >
            下载
          </Button>
          <Button 
            type="link" 
            size="small"
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteReport(record.filename)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* 标题区域 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, marginBottom: 16, color: '#001529' }}>
            YOLO + LLM + SAM 一体化视觉平台
          </h1>
          <p style={{ fontSize: 16, color: '#666', maxWidth: 800, margin: '0 auto' }}>
            集成了 YOLO 目标检测、大语言模型分析和 SAM 分割的一体化视觉平台
          </p>
          <Button 
            icon={<SettingOutlined />}
            onClick={() => setConfigModalVisible(true)}
            style={{ marginTop: 16 }}
          >
            API配置
          </Button>
        </div>

        <ApiConfig 
          visible={configModalVisible} 
          onClose={() => setConfigModalVisible(false)} 
        />

        {/* 三个功能卡片 */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} md={8}>
            <div 
              style={{ 
                padding: 20, 
                background: '#fff', 
                borderRadius: 12, 
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                transition: 'all 0.3s',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
              onClick={() => navigate('/train')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12, color: '#1890ff' }}>🎯</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#001529', fontSize: 18 }}>模型训练</h3>
              <p style={{ color: '#666', margin: 0, fontSize: 14 }}>YOLO多任务训练，可视化调参</p>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div 
              style={{ 
                padding: 20, 
                background: '#fff', 
                borderRadius: 12, 
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                transition: 'all 0.3s',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
              onClick={() => navigate('/inference')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12, color: '#52c41a' }}>🔍</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#001529', fontSize: 18 }}>智能推理</h3>
              <p style={{ color: '#666', margin: 0, fontSize: 14 }}>图片/视频推理，LLM分析</p>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div 
              style={{ 
                padding: 20, 
                background: '#fff', 
                borderRadius: 12, 
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                transition: 'all 0.3s',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
              onClick={() => navigate('/annotation')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12, color: '#722ed1' }}>✏️</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#001529', fontSize: 18 }}>智能标注</h3>
              <p style={{ color: '#666', margin: 0, fontSize: 14 }}>AI自动标注，批量处理</p>
            </div>
          </Col>
        </Row>

        {/* 主要功能区域 */}
        <Card style={{ marginBottom: 24 }}>
          <Tabs 
            defaultActiveKey="chat" 
            size="large"
            items={[
              {
                key: 'chat',
                label: <span><MessageOutlined />智能对话</span>,
                children: (
                  <div style={{ minHeight: 500 }}>
                    {/* 对话设置 */}
                                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                        <span style={{ color: '#666', fontSize: 13 }}>会话:</span>
                                        <Tag style={{ margin: 0 }}>{sessionId.substring(0, 8)}...</Tag>
                                        <Button 
                                          size="small" 
                                          icon={<HistoryOutlined />} 
                                          onClick={handleClearHistory}
                                          style={{ fontSize: 12 }}
                                        >
                                          清除历史
                                        </Button>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                        <BookOutlined style={{ color: '#1890ff' }} />
                                        <span>知识库:</span>
                                        <Switch 
                                          checked={useKnowledge} 
                                          onChange={setUseKnowledge}
                                          checkedChildren="开启"
                                          unCheckedChildren="关闭"
                                          size="small"
                                        />
                                      </div>
                                    </div>
                    {/* 对话消息区域 */}
                    <div style={{ 
                      minHeight: 400, 
                      maxHeight: 500, 
                      overflowY: 'auto', 
                      padding: 16, 
                      background: '#f9f9f9',
                      borderRadius: 8,
                      marginBottom: 16,
                      border: '1px solid #e8e8e8'
                    }}>
                      {chatMessages.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#999', marginTop: 150 }}>
                          <RobotOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                          <p>开始对话吧！AI会记住我们的对话历史</p>
                        </div>
                      )}
                      
                      {chatMessages.map((msg, index) => (
                        <div key={index} style={{ 
                          marginBottom: 16, 
                          display: 'flex',
                          justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                        }}>
                          <div style={{
                            maxWidth: '70%',
                            padding: '10px 16px',
                            borderRadius: 12,
                            background: msg.role === 'user' ? '#1890ff' : '#fff',
                            color: msg.role === 'user' ? '#fff' : '#333',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                          }}>
                            <div style={{ fontSize: 12, marginBottom: 4, opacity: 0.8 }}>
                              {msg.role === 'user' ? '用户' : 'AI助手'}
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {llmLoading && (
                        <div style={{ textAlign: 'center', color: '#1890ff', padding: '20px' }}>
                          <Spin size="large" />
                          <div style={{ marginTop: 8 }}>AI正在思考...</div>
                        </div>
                      )}
                      
                      <div ref={chatEndRef} />
                    </div>

                    {/* 输入区域 */}
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input
                        type="text"
                        value={llmInput}
                        onChange={(e) => setLlmInput(e.target.value)}
                        placeholder="输入您的问题... (支持多轮对话，AI会记住上下文)"
                        style={{ 
                          flex: 1, 
                          padding: '12px 16px', 
                          border: '1px solid #d9d9d9', 
                          borderRadius: 8,
                          fontSize: 14
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSendMessage()
                          }
                        }}
                      />
                      <Button 
                        type="primary" 
                        size="large"
                        onClick={handleSendMessage}
                        disabled={llmLoading || !llmInput.trim()}
                        loading={llmLoading}
                      >
                        发送
                      </Button>
                    </div>
                  </div>
                )
              },
              {
                key: 'knowledge',
                label: <span><FileTextOutlined />知识库</span>,
                children: (
                  <div style={{ minHeight: 500 }}>
                    <Row gutter={[24, 24]}>
                      <Col xs={24} lg={12}>
                        <Card title="上传文档" size="small">
                          <Upload
                            accept=".txt,.doc,.docx,.pdf,.xlsx,.xls"
                            customRequest={handleKnowledgeUpload}
                            showUploadList={false}
                          >
                            <Button 
                              icon={<UploadOutlined />} 
                              loading={uploading} 
                              block
                              size="small"
                            >
                              选择文档上传
                            </Button>
                          </Upload>
                          <div style={{ marginTop: 8, fontSize: 11, color: '#999' }}>
                            支持: TXT, DOC, DOCX, PDF, XLSX, XLS
                          </div>
                        </Card>

                        <Card title="搜索知识库" size="small" style={{ marginTop: 16 }}>
                          <Space.Compact style={{ width: '100%' }}>
                            <input
                              type="text"
                              placeholder="输入关键词..."
                              value={searchKeyword}
                              onChange={(e) => setSearchKeyword(e.target.value)}
                              style={{ 
                                flex: 1, 
                                padding: '6px 12px', 
                                border: '1px solid #d9d9d9', 
                                borderRadius: '4px 0 0 4px',
                                fontSize: 13
                              }}
                            />
                            <Button 
                              type="primary" 
                              onClick={handleSearchKnowledge}
                              style={{ borderRadius: '0 4px 4px 0' }}
                              size="small"
                            >
                              搜索
                            </Button>
                          </Space.Compact>
                          
                          {searchResults.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                              <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 'bold' }}>
                                搜索结果 ({searchResults.length})
                              </div>
                              {searchResults.map(doc => (
                                <div key={doc.id} style={{ 
                                  padding: 8, 
                                  background: '#f9f9f9', 
                                  marginBottom: 8, 
                                  borderRadius: 4,
                                  fontSize: 12
                                }}>
                                  <div style={{ fontWeight: 'bold' }}>{doc.filename}</div>
                                  <div style={{ color: '#666', marginTop: 4 }}>
                                    {doc.content.substring(0, 100)}...
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      </Col>

                      <Col xs={24} lg={12}>
                        <Card title="知识库文档" size="small">
                          <Table
                            columns={knowledgeColumns}
                            dataSource={knowledgeDocs}
                            rowKey="id"
                            size="small"
                            pagination={{ pageSize: 5 }}
                            scroll={{ x: 600 }}
                          />
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )
              },
              {
                key: 'image',
                label: <span><PictureOutlined />图片分析</span>,
                children: (
                  <div style={{ minHeight: 500 }}>
                    <Row gutter={[24, 24]}>
                      <Col xs={24} lg={12}>
                        <Card title="上传图片" size="small">
                          <Upload
                            accept="image/*"
                            customRequest={handleImageUpload}
                            showUploadList={false}
                          >
                            <Button 
                              icon={<UploadOutlined />} 
                              loading={analyzingImage} 
                              block
                              size="small"
                            >
                              选择图片分析
                            </Button>
                          </Upload>
                          <div style={{ marginTop: 8, fontSize: 11, color: '#999' }}>
                            支持: JPG, PNG, GIF, BMP, WEBP
                            <br />
                            功能: OCR文字识别、图表检测、表格提取
                          </div>
                        </Card>

                        {imageAnalysisResult && (
                          <Card title="分析结果" size="small" style={{ marginTop: 16 }}>
                            <div style={{ marginBottom: 16 }}>
                              <img 
                                src={`http://localhost:8000/uploads/images/${imageAnalysisResult.filename}`} 
                                alt="分析图片"
                                style={{ 
                                  maxWidth: '100%', 
                                  borderRadius: 8,
                                  border: '1px solid #e8e8e8'
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  console.error('图片加载失败:', e.target.src);
                                }}
                              />
                            </div>
                            
                            {imageAnalysisResult.ocr_result && (
                              <div style={{ marginBottom: 16 }}>
                                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>OCR识别结果:</div>
                                <div style={{ 
                                  padding: 12, 
                                  background: '#f9f9f9', 
                                  borderRadius: 4,
                                  whiteSpace: 'pre-wrap',
                                  fontSize: 12,
                                  maxHeight: 200,
                                  overflowY: 'auto'
                                }}>
                                  {imageAnalysisResult.ocr_result}
                                </div>
                              </div>
                            )}
                            
                            {imageAnalysisResult.llm_summary && (
                              <div>
                                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>AI摘要:</div>
                                <div style={{ 
                                  padding: 12, 
                                  background: '#e6f7ff', 
                                  borderRadius: 4,
                                  whiteSpace: 'pre-wrap',
                                  fontSize: 12
                                }}>
                                  {imageAnalysisResult.llm_summary}
                                </div>
                              </div>
                            )}
                          </Card>
                        )}
                      </Col>

                      <Col xs={24} lg={12}>
                        <Card title="分析历史" size="small">
                          <Table
                            columns={[
                              { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
                              { title: '文件名', dataIndex: 'filename', key: 'filename', ellipsis: true },
                              { 
                                title: '类型', 
                                dataIndex: 'analysis_type', 
                                key: 'analysis_type',
                                width: 80,
                                render: (text) => <Tag color="green">{text}</Tag>
                              },
                              {
                                title: '时间',
                                dataIndex: 'analysis_time',
                                key: 'analysis_time',
                                width: 140,
                                render: (text) => new Date(text).toLocaleString('zh-CN')
                              },
                              {
                                title: '操作',
                                key: 'action',
                                width: 80,
                                render: (_, record) => (
                                  <Button 
                                    type="link" 
                                    size="small"
                                    danger 
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteAnalysis(record.id)}
                                  >
                                    删除
                                  </Button>
                                )
                              }
                            ]}
                            dataSource={analysisHistory}
                            rowKey="id"
                            size="small"
                            pagination={{ pageSize: 5 }}
                          />
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )
              },
              {
                key: 'reports',
                label: <span><FileTextOutlined />报告管理</span>,
                children: (
                  <div style={{ minHeight: 500 }}>
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <Button 
                          type="primary" 
                          icon={<FileTextOutlined />}
                          onClick={handleGenerateReport}
                          loading={generatingReport}
                          size="small"
                        >
                          生成报告
                        </Button>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          基于当前对话和图片分析结果
                        </span>
                      </div>
                    </div>

                    <Table
                      columns={reportColumns}
                      dataSource={reports || []}
                      rowKey={(record) => record.filename || record.file_path}
                      pagination={{ 
                        pageSize: 10,
                        showSizeChanger: false,
                        showTotal: (total) => `共 ${total} 个报告`
                      }}
                      size="small"
                      scroll={{ x: 800 }}
                    />
                  </div>
                )
              }
            ]}
          />
        </Card>
      </div>
    </div>
  )
}

function AppRoot() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="datasets" element={<Datasets />} />
          <Route path="train" element={<Train />} />
          <Route path="inference" element={<Inference />} />
          <Route path="annotation" element={<Annotation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoot