import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, App } from 'antd'
import './index.css'
import AppRoot from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider>
      <App>
        <AppRoot />
      </App>
    </ConfigProvider>
  </StrictMode>,
)
