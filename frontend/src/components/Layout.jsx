import React, { useState, useEffect, useContext } from 'react'
import { Layout as AntLayout, Menu, Dropdown, Badge } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  ExperimentOutlined,
  SearchOutlined,
  EditOutlined,
  HomeOutlined,
  PlusOutlined,
  AppstoreOutlined,
  DatabaseOutlined
} from '@ant-design/icons'
import DatasetContext from '../context/DatasetContext'

const { Header, Sider, Content } = AntLayout

function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [datasetList, setDatasetList] = useState([])
  const ctx = useContext(DatasetContext)

  // 加载数据集列表
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/dataset/list')
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setDatasetList(result.data)
          }
        }
      } catch (error) {
        console.error('加载数据集列表失败:', error)
      }
    }
    loadDatasets()
    
    // 监听数据集变化
    const handleDatasetChange = () => {
      loadDatasets()
    }
    
    const handleDatasetsUpdated = () => {
      loadDatasets()
    }
    
    window.addEventListener('dataset-created', handleDatasetChange)
    window.addEventListener('dataset-deleted', handleDatasetChange)
    window.addEventListener('datasets-updated', handleDatasetsUpdated)
    
    return () => {
      window.removeEventListener('dataset-created', handleDatasetChange)
      window.removeEventListener('dataset-deleted', handleDatasetChange)
      window.removeEventListener('datasets-updated', handleDatasetsUpdated)
    }
  }, [])

  // 处理创建新数据集
  const handleCreateDataset = () => {
    navigate('/annotation')
    // 延迟触发创建数据集模态框
    setTimeout(() => {
      const event = new CustomEvent('create-dataset')
      window.dispatchEvent(event)
    }, 100)
  }

  // 处理数据集创建成功后刷新列表
  useEffect(() => {
    const handleDatasetCreated = () => {
      const loadDatasets = async () => {
        try {
          const response = await fetch('http://localhost:8000/api/dataset/list')
          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              setDatasetList(result.data)
            }
          }
        } catch (error) {
          console.error('刷新数据集列表失败:', error)
        }
      }
      loadDatasets()
    }
    
    window.addEventListener('dataset-created', handleDatasetCreated)
    return () => {
      window.removeEventListener('dataset-created', handleDatasetCreated)
    }
  }, [])

  // 生成标注菜单项
  const getAnnotationMenuItems = () => {
    // 添加各个数据集（使用Badge显示右上角小数字）
    const datasetChildren = datasetList.map(dataset => ({
      key: `/annotation?dataset=${dataset.id}`,
      label: (
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ display: 'inline-block', position: 'relative' }}>
            {dataset.name}
            {dataset.image_count > 0 && (
              <sup 
                style={{ 
                  position: 'absolute',
                  top: '8px',
                  right: '-10px',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  borderRadius: '0',
                  minWidth: 'auto',
                  height: 'auto',
                  lineHeight: '1',
                  fontSize: '11px',
                  fontWeight: 'normal',
                  textAlign: 'center',
                  padding: '0',
                  marginLeft: '2px',
                  zIndex: 1
                }}
              >
                {dataset.image_count}
              </sup>
            )}
          </span>
        </div>
      ),
      onClick: ({ key }) => {
        if (key.startsWith('/annotation?dataset=')) {
          navigate(key)
        }
      }
    }))
    
    return datasetChildren
  }

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/')
    },
    
    {
      key: '/train',
      icon: <ExperimentOutlined />,
      label: '训练',
      onClick: () => navigate('/train')
    },
    {
      key: '/inference',
      icon: <SearchOutlined />,
      label: '推理',
      onClick: () => navigate('/inference')
    },
    {
      key: '/annotation',
      icon: <EditOutlined />,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>标注</span>
          <PlusOutlined 
            style={{ fontSize: 12, marginLeft: 8 }}
            onClick={(e) => {
              e.stopPropagation()
              handleCreateDataset()
            }}
          />
        </div>
      ),
      children: getAnnotationMenuItems()
    },
    {
      key: '/datasets',
      icon: <DatabaseOutlined />,
      label: '数据',
      onClick: () => navigate('/datasets')
    },
  ]

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          background: '#001529',
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 24 : 18,
          fontWeight: 'bold',
          padding: collapsed ? 0 : '0 16px',
          background: 'rgba(255,255,255,0.1)',
          margin: 16,
          borderRadius: 8,
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }}>
          {collapsed ? '🚀' : 'YOLO + LLM + SAM'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['/annotation']}
          mode="inline"
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <AntLayout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#001529' }}>
              YOLO + LLM + SAM 一体化视觉平台
            </h1>
          </div>
          <div style={{ fontSize: 14, color: '#666' }}>
            React + FastAPI
          </div>
        </Header>
        <Content style={{
          margin: '24px',
          padding: '24px',
          background: '#f5f5f5',
          borderRadius: '8px',
          minHeight: 'calc(100vh - 112px)',
        }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout