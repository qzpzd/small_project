import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, Button, Table, Space, message, Tag, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Option } = Select

const ApiConfig = ({ visible, onClose }) => {
  const [form] = Form.useForm()
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)

  useEffect(() => {
    if (visible) {
      loadConfigs()
    }
  }, [visible])

  const loadConfigs = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/config/api')
      if (response.data.success) {
        setConfigs(response.data.data)
      }
    } catch (error) {
      message.error('加载配置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values) => {
    try {
      await axios.post('http://localhost:8000/api/config/api', {
        ...values,
        is_active: true
      })
      message.success('配置保存成功')
      form.resetFields()
      setEditingConfig(null)
      loadConfigs()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleEdit = (config) => {
    setEditingConfig(config)
    form.setFieldsValue(config)
  }

  const handleDelete = async (configName) => {
    try {
      await axios.delete(`http://localhost:8000/api/config/api/${configName}`)
      message.success('删除成功')
      loadConfigs()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSetActive = async (config) => {
    try {
      await axios.post('http://localhost:8000/api/config/api', {
        ...config,
        is_active: true
      })
      message.success('已设置为默认配置')
      loadConfigs()
    } catch (error) {
      message.error('设置失败')
    }
  }

  const columns = [
    {
      title: '配置名称',
      dataIndex: 'config_name',
      key: 'config_name',
      render: (text, record) => (
        <Space>
          {text}
          {record.is_active && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'api_type',
      key: 'api_type',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'API地址',
      dataIndex: 'api_url',
      key: 'api_url',
      ellipsis: true
    },
    {
      title: '模型',
      dataIndex: 'model_name',
      key: 'model_name'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          {!record.is_active && (
            <Button 
              type="link" 
              size="small"
              onClick={() => handleSetActive(record)}
            >
              设为默认
            </Button>
          )}
          <Button 
            type="link" 
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除此配置？"
            onConfirm={() => handleDelete(record.config_name)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Modal
      title="API配置管理"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <div style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="配置名称"
            name="config_name"
            rules={[{ required: true, message: '请输入配置名称' }]}
          >
            <Input placeholder="例如: OpenAI配置" />
          </Form.Item>

          <Form.Item
            label="API类型"
            name="api_type"
            rules={[{ required: true, message: '请选择API类型' }]}
          >
            <Select placeholder="选择API类型">
              <Option value="ollama">Ollama (本地)</Option>
              <Option value="openai">OpenAI</Option>
              <Option value="custom">自定义</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="API地址"
            name="api_url"
            rules={[{ required: true, message: '请输入API地址' }]}
          >
            <Input placeholder="例如: http://localhost:11434/api/chat" />
          </Form.Item>

          <Form.Item
            label="API密钥"
            name="api_key"
          >
            <Input.Password placeholder="API密钥 (可选)" />
          </Form.Item>

          <Form.Item
            label="模型名称"
            name="model_name"
          >
            <Input placeholder="例如: deepseek-coder:6.7b" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                {editingConfig ? '更新配置' : '添加配置'}
              </Button>
              <Button onClick={() => {
                form.resetFields()
                setEditingConfig(null)
              }}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <Table
        columns={columns}
        dataSource={configs}
        rowKey="config_name"
        loading={loading}
        pagination={false}
        size="small"
      />

      <div style={{ marginTop: 16, padding: 12, background: '#f0f2f5', borderRadius: 4, fontSize: 12 }}>
        <strong>使用说明:</strong>
        <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
          <li>Ollama: 用于本地部署的大模型，默认地址 http://localhost:11434/api/chat</li>
          <li>OpenAI: 使用OpenAI API，需要提供API密钥</li>
          <li>自定义: 支持任何兼容OpenAI格式的API端点</li>
          <li>点击"设为默认"可激活配置，系统将使用该配置进行AI对话</li>
        </ul>
      </div>
    </Modal>
  )
}

export default ApiConfig