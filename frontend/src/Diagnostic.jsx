// 诊断页面
import React from 'react'

function Diagnostic() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>系统诊断</h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2>✅ 基本检查</h2>
        <ul>
          <li>✓ React 已加载</li>
          <li>✓ 页面可访问</li>
          <li>✓ JavaScript 正常运行</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>📋 服务状态</h2>
        <ul>
          <li>前端: http://localhost:5174</li>
          <li>后端: http://localhost:8000</li>
          <li>API 文档: http://localhost:8000/docs</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>🔧 下一步</h2>
        <ol>
          <li>检查浏览器控制台是否有错误</li>
          <li>确认后端服务正常运行</li>
          <li>访问 <a href="http://localhost:8000/docs">http://localhost:8000/docs</a> 查看 API 文档</li>
          <li>如果一切正常，访问 <a href="http://localhost:5174">http://localhost:5174</a> 使用应用</li>
        </ol>
      </div>
    </div>
  )
}

export default Diagnostic