import React from 'react'

function Test() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>测试页面</h1>
      <p>当前路径: {window.location.pathname}</p>
      <p>如果你能看到这个页面，说明路由正常工作</p>
    </div>
  )
}

export default Test