// Modified: 2026-03-30 18:30 - Fixed download function
// import React, { useState } from 'react'
// import { Card, Form, Input, Button, Upload, Slider, message, Row, Col, Typography, Divider, Table, Progress, Tag, Space, Image, Empty } from 'antd'
// import { EditOutlined, UploadOutlined, DownloadOutlined, CheckCircleOutlined } from '@ant-design/icons'

// const { Title, Text, Paragraph } = Typography
// const { Dragger } = Upload

// function Annotation() {
//   const [form] = Form.useForm()
//   const [loading, setLoading] = useState(false)
//   const [uploadedImages, setUploadedImages] = useState([])
//   const [annotating, setAnnotating] = useState(false)
//   const [annotationProgress, setAnnotationProgress] = useState(0)
//   const [annotations, setAnnotations] = useState([])
//   const [currentImage, setCurrentImage] = useState(null)

//   const uploadProps = {
//     name: 'images',
//     multiple: true,
//     beforeUpload: () => false,
//     onChange(info) {
//       if (info.file.status === 'done') {
//         setUploadedImages([...uploadedImages, info.file])
//       }
//     },
//   }

//   const handleUpload = () => {
//     setLoading(true)
//     setTimeout(() => {
//       setLoading(false)
//       setUploadedImages([
//         { name: 'image1.jpg', url: 'https://via.placeholder.com/400x300', size: '1024KB' },
//         { name: 'image2.jpg', url: 'https://via.placeholder.com/400x300', size: '980KB' },
//         { name: 'image3.jpg', url: 'https://via.placeholder.com/400x300', size: '1100KB' }
//       ])
//       message.success('图片上传成功！')
//     }, 1000)
//   }

//   const handleAutoAnnotate = async (values) => {
//     if (uploadedImages.length === 0) {
//       message.warning('请先上传图片')
//       return
//     }
//     setLoading(true)
//     setAnnotating(true)
    
//     for (let i = 0; i <= 100; i += 10) {
//       setAnnotationProgress(i)
//       await new Promise(resolve => setTimeout(resolve, 200))
//     }
    
//     setAnnotations([
//       { key: 1, image_name: 'image1.jpg', count: 5, annotation_count: 5, classes: ['person', 'car'] },
//       { key: 2, image_name: 'image2.jpg', count: 3, annotation_count: 3, classes: ['person'] },
//       { key: 3, image_name: 'image3.jpg', count: 8, annotation_count: 8, classes: ['car', 'person', 'dog'] }
//     ])
//     setAnnotating(false)
//     setLoading(false)
//     message.success('AI 自动标注完成！')
//   }

//   const handleExport = (values) => {
//     setLoading(true)
//     setTimeout(() => {
//       setLoading(false)
//       message.success('数据集导出成功！')
//     }, 1500)
//   }

//   const handleViewImage = (image) => {
//     setCurrentImage(image)
//   }

//   return (
//     <div>
//       <Title level={2}><EditOutlined /> 智能标注工具</Title>
//       <Paragraph type="secondary">
//         支持批量上传图片、AI 自动标注（YOLO 模型）、数据集导出等功能
//       </Paragraph>
//       <Divider />

//       <Row gutter={[24, 24]}>
//         <Col span={8}>
//           <Card 
//             title={<><UploadOutlined /> 批量上传</>} 
//             bordered 
//             size="small"
//             extra={uploadedImages.length > 0 && <Tag color="success">{uploadedImages.length} 张</Tag>}
//           >
//             <Dragger {...uploadProps}>
//               <p className="ant-upload-drag-icon">
//                 <UploadOutlined style={{ fontSize: 48 }} />
//               </p>
//               <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
//               <p className="ant-upload-hint">支持批量上传图片文件</p>
//             </Dragger>
//             <Button 
//               type="primary" 
//               onClick={handleUpload} 
//               loading={loading}
//               block 
//               style={{ marginTop: 16 }}
//             >
//               确认上传
//             </Button>
//           </Card>

//           <Card 
//             title={<><CheckCircleOutlined /> AI 自动标注</>} 
//             bordered 
//             style={{ marginTop: 16 }}
//             size="small"
//           >
//             <Form form={form} layout="vertical" onFinish={handleAutoAnnotate}
//               initialValues={{ model_path: 'yolov8n.pt', conf: 0.5 }}>
//               <Form.Item name="model_path" label="模型路径" rules={[{ required: true }]}>
//                 <Input placeholder="yolov8n.pt" prefix={<CheckCircleOutlined />} />
//               </Form.Item>
//               <Form.Item name="conf" label="置信度阈值">
//                 <Slider min={0} max={1} step={0.05} marks={{ 0: '0', 0.5: '0.5', 1: '1' }} />
//               </Form.Item>
//               <Form.Item>
//                 <Button 
//                   type="primary" 
//                   htmlType="submit" 
//                   loading={loading} 
//                   block
//                   disabled={uploadedImages.length === 0}
//                 >
//                   开始自动标注
//                 </Button>
//               </Form.Item>
//             </Form>
//             {annotating && (
//               <div style={{ marginTop: 16 }}>
//                 <Space direction="vertical" style={{ width: '100%' }}>
//                   <Text>标注进度</Text>
//                   <Progress percent={annotationProgress} status="active" />
//                 </Space>
//               </div>
//             )}
//           </Card>

//           <Card 
//             title={<><DownloadOutlined /> 导出数据集</>} 
//             bordered 
//             style={{ marginTop: 16 }}
//             size="small"
//           >
//             <Form form={form} layout="vertical" onFinish={handleExport}
//               initialValues={{ class_names: 'person,car,dog' }}>
//               <Form.Item name="class_names" label="类别名称" rules={[{ required: true }]}>
//                 <Input placeholder="person,car,dog" />
//               </Form.Item>
//               <Form.Item>
//                 <Button 
//                   type="primary" 
//                   htmlType="submit" 
//                   loading={loading} 
//                   block
//                   icon={<DownloadOutlined />}
//                   disabled={annotations.length === 0}
//                 >
//                   导出 YOLO 数据集
//                 </Button>
//               </Form.Item>
//             </Form>
//           </Card>
//         </Col>

//         <Col span={8}>
//           <Card 
//             title={<><UploadOutlined /> 已上传图片</>} 
//             bordered
//             size="small"
//             extra={uploadedImages.length > 0 && (
//               <Text type="secondary">{uploadedImages.length} 张</Text>
//             )}
//           >
//             {uploadedImages.length === 0 ? (
//               <Empty description="暂无上传图片" style={{ padding: '40px 0' }} />
//             ) : (
//               <div style={{ maxHeight: '500px', overflow: 'auto' }}>
//                 {uploadedImages.map((img, idx) => (
//                   <div 
//                     key={idx} 
//                     style={{ 
//                       marginBottom: 12, 
//                       padding: 8, 
//                       border: '1px solid #f0f0f0', 
//                       borderRadius: 6,
//                       cursor: 'pointer',
//                       background: currentImage === img ? '#e6f7ff' : 'transparent'
//                     }}
//                     onClick={() => handleViewImage(img)}
//                   >
//                     <Image 
//                       src={img.url} 
//                       alt={img.name}
//                       style={{ width: '100%', borderRadius: 4, marginBottom: 8 }}
//                       preview={false}
//                     />
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                       <Text ellipsis style={{ flex: 1, marginRight: 8 }}>{img.name}</Text>
//                       <Tag color="blue">{img.size}</Tag>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </Card>
//         </Col>

//         <Col span={8}>
//           {currentImage && (
//             <Card 
//               title="图片预览" 
//               bordered
//               size="small"
//             >
//               <Image 
//                 src={currentImage.url} 
//                 alt={currentImage.name}
//                 style={{ width: '100%', borderRadius: 6 }}
//               />
//               <div style={{ marginTop: 12 }}>
//                 <Text strong>文件名：</Text><Text>{currentImage.name}</Text><br />
//                 <Text strong>大小：</Text><Text>{currentImage.size}</Text>
//               </div>
//             </Card>
//           )}
          
//           {annotations.length > 0 && (
//             <Card 
//               title={<><CheckCircleOutlined /> 标注结果</>} 
//               bordered 
//               style={{ marginTop: 16 }}
//               size="small"
//             >
//               <Table 
//                 dataSource={annotations}
//                 columns={[
//                   { 
//                     title: '图片名', 
//                     dataIndex: 'image_name', 
//                     key: 'image',
//                     ellipsis: true
//                   },
//                   { 
//                     title: '目标数', 
//                     dataIndex: 'count', 
//                     key: 'count',
//                     width: 80,
//                     align: 'center',
//                     render: (v) => <Tag color="blue">{v}</Tag> 
//                   },
//                   { 
//                     title: '标注数', 
//                     dataIndex: 'annotation_count', 
//                     key: 'ann_count',
//                     width: 80,
//                     align: 'center',
//                     render: (v) => <Tag color="green">{v}</Tag> 
//                   }
//                 ]}
//                 size="small"
//                 pagination={{ pageSize: 5, size: 'small' }}
//                 scroll={{ y: 200 }}
//               />
//               <div style={{ marginTop: 12, padding: 12, background: 'transparent', borderRadius: 4 }}>
//                 <Space direction="vertical" style={{ width: '100%' }}>
//                   <Text type="secondary">标注统计</Text>
//                   <Text>总计标注 <Text strong>{annotations.length}</Text> 张图片</Text>
//                   <Text>检测到 <Text strong>{annotations.reduce((sum, a) => sum + a.count, 0)}</Text> 个目标</Text>
//                   <Text>生成 <Text strong>{annotations.reduce((sum, a) => sum + a.annotation_count, 0)}</Text> 个标注</Text>
//                 </Space>
//               </div>
//             </Card>
//           )}
//         </Col>
//       </Row>
//     </div>
//   )
// }

// export default Annotation

import React, { useState, useContext, createContext, useEffect, useRef, useCallback } from 'react';
import {
  Layout, Button, Tabs, Tag, Input, Card, Table, Modal,
  Dropdown, Menu, Badge, Typography, ConfigProvider, Upload, Tooltip
} from 'antd';
import {
  PlusOutlined, UploadOutlined, DownloadOutlined, StarOutlined, SyncOutlined,
  DeleteOutlined, EyeOutlined, AppstoreOutlined, BarsOutlined,
  SearchOutlined, RightOutlined, EditOutlined, CloseOutlined,
  FolderOpenOutlined, LineChartOutlined, BlockOutlined, MoreOutlined,
  FilterOutlined, SettingOutlined, LeftOutlined, UndoOutlined, RedoOutlined, EyeInvisibleOutlined, HeartOutlined, BookOutlined
} from '@ant-design/icons';

import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip as ChartTooltip, Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, ChartTooltip, Legend
);

const { Header, Content } = Layout;
const { Text } = Typography;

// 全局上下文
const DatasetContext = createContext();

const DatasetProvider = ({ children }) => {
  // 从localStorage加载数据
  const loadFromStorage = () => {
    try {
      const savedImages = localStorage.getItem('annotation_images');
      const savedLabels = localStorage.getItem('annotation_labels');
      if (savedImages && savedLabels) {
        return {
          images: JSON.parse(savedImages),
          labels: JSON.parse(savedLabels)
        };
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
    return null;
  };

  const savedData = loadFromStorage();

  const [allImages, setAllImages] = useState(savedData ? savedData.images : [
    { id: 1, split: 'val', labeled: true, url: `https://picsum.photos/seed/bottle-1/800/600`, boxes: [{ id: 1, x: 50, y: 50, w: 100, h: 150, label: 'bottle', color: '#0052FF' }, { id: 2, x: 60, y: 200, w: 30, h: 30, label: 'cap', color: '#00D4FF' }] },
    { id: 2, split: 'val', labeled: true, url: `https://picsum.photos/seed/bottle-2/800/600`, boxes: [{ id: 3, x: 50, y: 50, w: 100, h: 150, label: 'bottle', color: '#0052FF' }, { id: 4, x: 60, y: 200, w: 30, h: 30, label: 'cap', color: '#00D4FF' }] },
    { id: 3, split: 'train', labeled: true, url: `https://picsum.photos/seed/bottle-3/800/600`, boxes: [{ id: 5, x: 200, y: 50, w: 80, h: 150, label: 'bottle', color: '#0052FF' }, { id: 6, x: 150, y: 180, w: 25, h: 25, label: 'cap', color: '#00D4FF' }] },
    { id: 4, split: 'train', labeled: true, url: `https://picsum.photos/seed/bottle-4/800/600`, boxes: [{ id: 7, x: 200, y: 50, w: 80, h: 150, label: 'bottle', color: '#0052FF' }, { id: 8, x: 150, y: 180, w: 25, h: 25, label: 'cap', color: '#00D4FF' }] },
    { id: 5, split: 'train', labeled: true, url: `https://picsum.photos/seed/bottle-5/800/600`, boxes: [{ id: 9, x: 150, y: 50, w: 80, h: 150, label: 'bottle', color: '#0052FF' }, { id: 10, x: 80, y: 200, w: 25, h: 25, label: 'cap', color: '#00D4FF' }] },
    { id: 6, split: 'train', labeled: true, url: `https://picsum.photos/seed/bottle-6/800/600`, boxes: [{ id: 11, x: 150, y: 50, w: 80, h: 150, label: 'bottle', color: '#0052FF' }, { id: 12, x: 80, y: 200, w: 25, h: 25, label: 'cap', color: '#00D4FF' }] },
    { id: 7, split: 'train', labeled: false, url: `https://picsum.photos/seed/bottle-7/800/600`, boxes: [] },
    { id: 8, split: 'train', labeled: false, url: `https://picsum.photos/seed/bottle-8/800/600`, boxes: [] },
  ]);

  const [labels, setLabels] = useState(savedData ? savedData.labels : [
    { id: 1, name: 'bottle', color: '#0052FF', count: 6, shortcut: '1' },
    { id: 2, name: 'cap', color: '#00D4FF', count: 6, shortcut: '2' },
  ]);

  const [currentSplit, setCurrentSplit] = useState('all');
  const [currentTab, setCurrentTab] = useState('images');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState(labels[0]);
  const [description, setDescription] = useState('Add a description...');
  const [uploadTime] = useState(Date.now() - 8 * 60 * 60 * 1000);

  const totalImages = allImages.length;
  const labeledCount = allImages.filter(img => img.labeled).length;
  const classCount = labels.length;
  const totalSizeMB = ((totalImages * 2.4) / 1024).toFixed(1);

  const getTimeAgo = () => {
    const diff = Date.now() - uploadTime;
    const h = Math.floor(diff / (1000 * 60 * 60));
    return `${h} hours ago`;
  };

  const updateImageBoxes = (imageId, boxes) => {
    setAllImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, boxes, labeled: boxes.length > 0 } : img
    ));
  };

  const refreshLabelStats = () => {
    const newLabels = labels.map(lab => ({ ...lab, count: 0 }));
    allImages.forEach(img => {
      img.boxes.forEach(box => {
        const idx = newLabels.findIndex(l => l.name === box.label);
        if (idx >= 0) newLabels[idx].count++;
      });
    });
    setLabels(newLabels);
  };

  const moveImageToSplit = (imageId, split) => {
    setAllImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, split } : img
    ));
  };

  const deleteImage = (imageId) => {
    setAllImages(prev => prev.filter(img => img.id !== imageId));
  };

  const addNewImages = (files) => {
    const newImgs = files.map((f, i) => ({
      id: Date.now() + i,
      split: 'train',
      labeled: false,
      boxes: [],
      url: URL.createObjectURL(f)
    }));
    setAllImages(prev => [...prev, ...newImgs]);
  };

  const addLabel = (name, color) => {
    const newLabel = {
      id: Date.now(),
      name: name,
      color: color,
      count: 0,
      shortcut: String(labels.length + 1)
    };
    setLabels(prev => [...prev, newLabel]);
  };

  // 保存数据到localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem('annotation_images', JSON.stringify(allImages));
      localStorage.setItem('annotation_labels', JSON.stringify(labels));
    } catch (error) {
      console.error('保存数据失败:', error);
    }
  };

  // 监听数据变化并自动保存
  useEffect(() => {
    saveToStorage();
  }, [allImages, labels]);

  useEffect(() => {
    refreshLabelStats();
  }, [allImages]);

  return (
    <DatasetContext.Provider value={{
      allImages, setAllImages,
      totalImages, labeledCount, classCount, totalSizeMB, timeAgo: getTimeAgo(),
      currentSplit, setCurrentSplit,
      currentTab, setCurrentTab,
      selectedImage, setSelectedImage,
      labels, setLabels, selectedLabel, setSelectedLabel,
      description, setDescription,
      updateImageBoxes, refreshLabelStats,
      moveImageToSplit, deleteImage, addNewImages, addLabel,
    }}>
      {children}
    </DatasetContext.Provider>
  );
};

// ====================== 标注视图（严格匹配截图布局 · 最终版）======================
const AnnotationView = () => {
  const ctx = useContext(DatasetContext);

  // 将RGB颜色转换为RGBA（带透明度）
  const rgbToRgba = (rgbColor, alpha) => {
    if (!rgbColor) return `#808080${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
    
    if (rgbColor.startsWith('#')) {
      // 十六进制颜色
      const hex = rgbColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
    } else if (rgbColor.startsWith('rgb(')) {
      // RGB颜色
      const match = rgbColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
      }
    }
    // 默认返回灰色
    return `#808080${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
  };

  // HSL转RGB辅助函数
  const hslToRgb = (h, s, l) => {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return `rgb(${Math.floor(255 * f(0))}, ${Math.floor(255 * f(8))}, ${Math.floor(255 * f(4))})`;
  };

  // 生成随机颜色（RGB格式），确保与现有颜色不同
  const generateRandomColor = () => {
    const existingColors = ctx.labels.map(l => l.color.toLowerCase());
    let newColor;
    let attempts = 0;
    do {
      const hue = Math.floor(Math.random() * 360);
      const saturation = 70 + Math.floor(Math.random() * 30);
      const lightness = 45 + Math.floor(Math.random() * 25);
      newColor = hslToRgb(hue, saturation, lightness);
      attempts++;
    } while (existingColors.some(c => c.toLowerCase() === newColor.toLowerCase()) && attempts < 100);
    return newColor;
  };
  // 处理颜色按钮点击
  const handleColorButtonClick = (e, labelId) => {
    e.stopPropagation();
    setColorPickerLabelId(labelId);
    setColorPickerVisible(true);
  };

  // 处理颜色选择
  const handleColorSelect = (color) => {
    if (colorPickerLabelId) {
      const updatedLabels = ctx.labels.map(l =>
        l.id === colorPickerLabelId ? { ...l, color } : l
      );
      ctx.setLabels(updatedLabels);
    }
    setColorPickerVisible(false);
    setColorPickerLabelId(null);
  };

  // 处理生成随机颜色
  const handleGenerateRandomColor = () => {
    const newColor = generateRandomColor();
    handleColorSelect(newColor);
  };


  // 添加新label时的颜色选择
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [colorPickerLabelId, setColorPickerLabelId] = useState(null);

  const [boxes, setBoxes] = useState([]);
  const [mouse, setMouse] = useState({ x: -100, y: -100 });
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [selectedBox, setSelectedBox] = useState(null);
  const [draggingHandle, setDraggingHandle] = useState(null);
  const [draggingBox, setDraggingBox] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0, top: 0, left: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#0052FF');

  const [searchQuery, setSearchQuery] = useState('');
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [editingLabelName, setEditingLabelName] = useState('');
  const [showLabels, setShowLabels] = useState(true); // 控制label面板显示/隐藏
  const [showBoxes, setShowBoxes] = useState(true); // 控制显示标注框
  const [showAllLabels, setShowAllLabels] = useState(true); // 控制显示所有labels
  const [showShortcuts, setShowShortcuts] = useState(false); // 控制显示快捷键
  const [history, setHistory] = useState([]); // 撤销历史
  const [historyIndex, setHistoryIndex] = useState(-1); // 历史记录索引
  const [showLabelText, setShowLabelText] = useState(true); // 控制显示标注框label文字

  const imgRef = useRef(null);
  const svgRef = useRef(null);

  // 更新 SVG 尺寸和位置的函数
  const updateSvgSize = useCallback(() => {
    if (imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const parentRect = imgRef.current.parentElement.getBoundingClientRect();
      setImgSize({
        width: rect.width,
        height: rect.height,
        top: rect.top - parentRect.top,
        left: rect.left - parentRect.left
      });
    }
  }, []);

  // 监听图片尺寸变化
  useEffect(() => {
    if (imgRef.current && ctx.selectedImage) {
      const updateSize = () => {
        if (imgRef.current) {
          const rect = imgRef.current.getBoundingClientRect();
          const parentRect = imgRef.current.parentElement.getBoundingClientRect();
          setImgSize({
            width: rect.width,
            height: rect.height,
            top: rect.top - parentRect.top,
            left: rect.left - parentRect.left
          });
        }
      };
      
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => {
        window.removeEventListener('resize', updateSize);
      };
    }
  }, [ctx.selectedImage]);

  // 当选择新图片时，重置状态
  useEffect(() => {
    if (ctx.selectedImage) {
      const img = ctx.allImages.find(i => i.id === ctx.selectedImage.id);
      setBoxes(img?.boxes || []);
      setImgLoaded(false);
      setImgSize({ width: 0, height: 0, top: 0, left: 0 });
    }
  }, [ctx.selectedImage]);

  // 图片加载完成事件
  const handleImageLoad = () => {
    setImgLoaded(true);
    setTimeout(updateSvgSize, 100);
  };

  // 核心：精准坐标计算 - 优化版本，减少延迟
  const updateMouse = (e) => {
    if (!imgRef.current || !ctx.selectedImage) {
      setMouse({ x: -100, y: -100 });
      return;
    }

    const imgRect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - imgRect.left;
    const y = e.clientY - imgRect.top;
    
    const inside = x >= 0 && x <= imgRect.width && y >= 0 && y <= imgRect.height;
    if (!inside) {
      setMouse({ x: -100, y: -100 });
      return;
    }

    const naturalWidth = imgRef.current.naturalWidth || 800;
    const naturalHeight = imgRef.current.naturalHeight || 600;
    const scaleX = naturalWidth / imgRect.width;
    const scaleY = naturalHeight / imgRect.height;

    // 直接使用浮点数，不四舍五入，提高实时性
    setMouse({
      x: x * scaleX,
      y: y * scaleY
    });
  };

  useEffect(() => {
    // 使用requestAnimationFrame优化性能
    let rafId = null;
    const handleMouseMove = (e) => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        updateMouse(e);
      });
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [ctx.selectedImage]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const scaleX = svg.viewBox.baseVal.width / rect.width;
    const scaleY = svg.viewBox.baseVal.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setStartPoint({ x: Math.round(x), y: Math.round(y) });
    setDrawing(true);
  };

  const handleMouseMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const scaleX = svg.viewBox.baseVal.width / rect.width;
    const scaleY = svg.viewBox.baseVal.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // 直接使用浮点数，不四舍五入，提高实时性
    setMouse({ x, y });
  };

  const handleMouseUp = (e) => {
    if (!drawing || !startPoint) return;
    
    e.preventDefault();
    
    const svg = svgRef.current;
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const scaleX = svg.viewBox.baseVal.width / rect.width;
    const scaleY = svg.viewBox.baseVal.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const newBox = {
      id: Date.now(),
      x: Math.min(startPoint.x, x),
      y: Math.min(startPoint.y, y),
      w: Math.abs(Math.round(x) - startPoint.x),
      h: Math.abs(Math.round(y) - startPoint.y),
      label: ctx.selectedLabel.name,
      color: ctx.selectedLabel.color,
      labelId: ctx.selectedLabel.id,
    };
    
    // 只有当矩形框尺寸大于0时才添加
    if (newBox.w > 0 && newBox.h > 0) {
      const updated = [...boxes, newBox];
      
      // 添加到历史记录
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...updated]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      setBoxes(updated);
      ctx.updateImageBoxes(ctx.selectedImage.id, updated);
    }
    
    setDrawing(false);
    setStartPoint(null);
    setMouse({ x: -100, y: -100 }); // 隐藏鼠标位置显示
  };

  const handleBoxDown = (box, e) => {
    e.stopPropagation();
    setSelectedBox(box);
    
    if (!imgRef.current || !ctx.selectedImage) return;
    const imgRect = imgRef.current.getBoundingClientRect();
    const clientX = e.clientX - imgRect.left;
    const clientY = e.clientY - imgRect.top;
    const naturalWidth = imgRef.current.naturalWidth || 800;
    const naturalHeight = imgRef.current.naturalHeight || 600;
    const scaleX = naturalWidth / imgRect.width;
    const scaleY = naturalHeight / imgRect.height;
    
    const offset = {
      x: Math.round(clientX * scaleX) - box.x,
      y: Math.round(clientY * scaleY) - box.y
    };
    setDragOffset(offset);
    setDraggingBox(box);
  };

  const handleHandleDown = (handle, box, e) => {
    e.stopPropagation();
    setSelectedBox(box);
    setDraggingHandle({ handle, box });
  };

  useEffect(() => {
    const up = () => {
      setDraggingHandle(null);
      setDraggingBox(null);
    };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  useEffect(() => {
    if (!draggingHandle) return;
    const move = (e) => {
      updateMouse(e);
      if (mouse.x < 0 || mouse.y < 0) return;
      const { handle, box } = draggingHandle;
      const b = { ...box };

      if (handle === 'lt') { b.x = mouse.x; b.y = mouse.y; b.w = box.w + (box.x - mouse.x); b.h = box.h + (box.y - mouse.y); }
      if (handle === 'rt') { b.y = mouse.y; b.w = mouse.x - box.x; b.h = box.h + (box.y - mouse.y); }
      if (handle === 'lb') { b.x = mouse.x; b.w = box.w + (box.x - mouse.x); b.h = mouse.y - box.y; }
      if (handle === 'rb') { b.w = mouse.x - box.x; b.h = mouse.y - box.y; }
      if (handle === 't') { b.y = mouse.y; b.h = box.h + (box.y - mouse.y); }
      if (handle === 'b') { b.h = mouse.y - box.y; }
      if (handle === 'l') { b.x = mouse.x; b.w = box.w + (box.x - mouse.x); }
      if (handle === 'r') { b.w = mouse.x - box.x; }

      const updated = boxes.map(bx => bx.id === box.id ? b : bx);
      setBoxes(updated);
      ctx.updateImageBoxes(ctx.selectedImage.id, updated);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [draggingHandle, boxes]);

  useEffect(() => {
    if (!draggingBox) return;
    const move = (e) => {
      updateMouse(e);
      if (mouse.x < 0 || mouse.y < 0) return;
      
      const b = { ...draggingBox };
      b.x = mouse.x - dragOffset.x;
      b.y = mouse.y - dragOffset.y;

      const updated = boxes.map(bx => bx.id === draggingBox.id ? b : bx);
      setBoxes(updated);
      ctx.updateImageBoxes(ctx.selectedImage.id, updated);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [draggingBox, boxes, dragOffset]);

  useEffect(() => {
    const key = (e) => {
      // 删除选中的矩形框
      if (e.key === "Delete" && selectedBox) {
        const updated = boxes.filter(b => b.id !== selectedBox.id);
        setBoxes(updated);
        setSelectedBox(null);
        ctx.updateImageBoxes(ctx.selectedImage.id, updated);
      }
      
      // 左右箭头键和A/D键切换图片
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "a" || e.key === "A" || e.key === "d" || e.key === "D") {
        const currentIndex = ctx.allImages.findIndex(i => i.id === ctx.selectedImage.id);
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
          const prevIndex = (currentIndex - 1 + ctx.allImages.length) % ctx.allImages.length;
          ctx.setSelectedImage(ctx.allImages[prevIndex]);
        } else {
          const nextIndex = (currentIndex + 1) % ctx.allImages.length;
          ctx.setSelectedImage(ctx.allImages[nextIndex]);
        }
      }
      
      // 数字键切换label（支持1-9）
      if (e.key >= '1' && e.key <= '9') {
        const labelIndex = parseInt(e.key) - 1;
        if (labelIndex < ctx.labels.length) {
          const newLabel = ctx.labels[labelIndex];
          
          if (selectedBox) {
            // 选中矩形框时：切换矩形框的label
            const updated = boxes.map(b => 
              b.id === selectedBox.id ? { ...b, label: newLabel.name, color: newLabel.color, labelId: newLabel.id } : b
            );
            setBoxes(updated);
            ctx.updateImageBoxes(ctx.selectedImage.id, updated);
          }
          
          // 无论是否选中矩形框，都切换当前选中的label
          ctx.setSelectedLabel(newLabel);
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [selectedBox, boxes, ctx.labels]);

  if (!ctx.selectedImage) return null;

  const currentIndex = ctx.allImages.findIndex(i => i.id === ctx.selectedImage.id);
  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + ctx.allImages.length) % ctx.allImages.length;
    ctx.setSelectedImage(ctx.allImages[prevIndex]);
  };
  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % ctx.allImages.length;
    ctx.setSelectedImage(ctx.allImages[nextIndex]);
  };

  // 下载标注图像（带标注框）
  const handleDownloadAnnotatedImage = async () => {
    if (!ctx.selectedImage || !imgRef.current) {
      console.warn('没有选中的图片或图片未加载');
      return;
    }

    try {
      // 创建canvas
      const canvas = document.createElement('canvas');
      const canvasCtx = canvas.getContext('2d');
      
      // 获取图片尺寸
      const img = imgRef.current;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // 绘制原图
      canvasCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 绘制标注框
      const scaleX = canvas.width / imgSize.width;
      const scaleY = canvas.height / imgSize.height;
      
      boxes.forEach(box => {
        if (!box) return;
        
        const x = box.x * scaleX;
        const y = box.y * scaleY;
        const width = box.width * scaleX;
        const height = box.height * scaleY;
        
        // 绘制填充
        canvasCtx.fillStyle = box.color + '40'; // 25%透明度
        canvasCtx.fillRect(x, y, width, height);
        
        // 绘制边框
        canvasCtx.strokeStyle = box.color;
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeRect(x, y, width, height);
        
        // 绘制标签文字
        if (showLabelText && box.label) {
          canvasCtx.fillStyle = box.color;
          canvasCtx.font = `${Math.max(12, Math.min(16, Math.floor(width / 10)))}px Arial`;
          canvasCtx.fillText(box.label, x, y - 5);
        }
      });
      
      // 转换为blob并下载
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `annotated_${ctx.selectedImage.id}.jpg`;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('下载标注图像失败:', error);
    }
  };
  return (
    <div style={{
      position: 'absolute',
      top: 64,          // 不覆盖顶部标题栏
      left: 200,        // 避开左侧导航栏（假设导航栏宽度为200px）
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.3)', // 半透明黑色背景
      backdropFilter: 'blur(10px)',   // 背景虚化
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 左上角按钮组：独立悬浮 */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        background: 'rgba(255,255,255,0.7)', // 更高透明度
        backdropFilter: 'blur(15px)',          // 更强虚化效果
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.2)',
        zIndex: 100
      }}>
        <Button 
          type="primary" 
          icon={<EditOutlined />} 
          size="small"
          style={{
            background: 'rgba(24,144,255,0.8)',
            borderColor: 'rgba(24,144,255,0.5)',
            backdropFilter: 'blur(8px)'
          }}
        >Draw</Button>
        <Dropdown menu={{
          items: [
            { key: 'yolo', label: 'YOLO 自动标注', onClick: () => console.log('YOLO auto annotation') },
            { key: 'sam', label: 'SAM 自动标注', onClick: () => console.log('SAM auto annotation') }
          ]
        }} trigger={['click']}>
          <Button 
            icon={<SyncOutlined />} 
            size="small"
            style={{
              background: 'rgba(255,255,255,0.6)',
              borderColor: 'rgba(255,255,255,0.3)',
              backdropFilter: 'blur(8px)'
            }}
          >Smart</Button>
        </Dropdown>
        <Button 
          icon={<UndoOutlined />} 
          size="small"
          disabled={historyIndex <= 0}
          onClick={() => {
            if (historyIndex > 0) {
              const prevIndex = historyIndex - 1;
              setHistoryIndex(prevIndex);
              setBoxes(history[prevIndex]);
            }
          }}
          style={{
            background: 'rgba(255,255,255,0.3)',
            borderColor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)'
          }}
        />
        <Button 
          icon={<RedoOutlined />} 
          size="small"
          disabled={historyIndex >= history.length - 1}
          onClick={() => {
            if (historyIndex < history.length - 1) {
              const nextIndex = historyIndex + 1;
              setHistoryIndex(nextIndex);
              setBoxes(history[nextIndex]);
            }
          }}
          style={{
            background: 'rgba(255,255,255,0.3)',
            borderColor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)'
          }}
        />
        <Button 
          icon={<DeleteOutlined />} 
          danger 
          size="small"
          disabled={!selectedBox}
          onClick={() => {
            if (selectedBox) {
              const updated = boxes.filter(b => b.id !== selectedBox.id);
              setBoxes(updated);
              setSelectedBox(null);
              ctx.updateImageBoxes(ctx.selectedImage.id, updated);
            }
          }}
          style={{
            background: 'rgba(255,77,79,0.7)',
            borderColor: 'rgba(255,77,79,0.4)',
            backdropFilter: 'blur(8px)'
          }}
        />
        <Dropdown menu={{
          items: [
            { 
              key: 'shortcuts', 
              label: (
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 'bold' }}>键盘快捷键</div>
                  <div>点击：绘制标注框</div>
                  <div>Delete：删除选中标注框</div>
                  <div>1-9：切换标注框label</div>
                  <div>← →：前后切换图片</div>
                </div>
              )
            }
          ]
        }} trigger={['click']}>
          <Button 
            icon={<BookOutlined />} 
            size="small"
            style={{
              background: 'rgba(255,255,255,0.6)',
              borderColor: 'rgba(255,255,255,0.3)',
              backdropFilter: 'blur(8px)'
            }}
          />
        </Dropdown>
      </div>

      {/* 右上角按钮组：独立悬浮 */}
      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        background: 'rgba(255,255,255,0.7)', // 更高透明度
        backdropFilter: 'blur(15px)',          // 更强虚化效果
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.2)',
        zIndex: 100
      }}>
        <Dropdown menu={{
          items: [
            {
              key: 'showLabels',
              label: (
                <div style={{ padding: '8px 12px', cursor: 'pointer' }}>
                  显示标注文字
                </div>
              ),
              onClick: () => setShowLabelText(!showLabelText)
            },
            {
              key: 'showBoxes',
              label: (
                <div style={{ padding: '8px 12px', cursor: 'pointer' }}>
                  显示矩形框
                </div>
              ),
              onClick: () => setShowBoxes(!showBoxes)
            }
          ]
        }} trigger={['click']}>
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            style={{
              background: 'rgba(255,255,255,0.6)',
              borderColor: 'rgba(255,255,255,0.3)',
              backdropFilter: 'blur(8px)',
              padding: '4px 12px'
            }}
          />
        </Dropdown>
        <Button 
          icon={showLabels ? <AppstoreOutlined /> : <BarsOutlined />} 
          size="small" 
          onClick={() => setShowLabels(!showLabels)}
          style={{
            background: 'rgba(255,255,255,0.3)',
            borderColor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)'
          }}
        />
        <Button 
          icon={<DownloadOutlined />} 
          size="small"
          onClick={handleDownloadAnnotatedImage}
          style={{
            background: 'rgba(255,255,255,0.4)',
            borderColor: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(12px)'
          }}
        />
        <Button 
          icon={<CloseOutlined />} 
          size="small" 
          onClick={() => ctx.setSelectedImage(null)}
          style={{
            background: 'rgba(255,77,79,0.7)',
            borderColor: 'rgba(255,77,79,0.4)',
            backdropFilter: 'blur(8px)'
          }}
        />
      </div>

      {/* 图片区域：自适应居中 + 最底层 */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'transparent'
      }}>
        <img
          ref={imgRef}
          src={ctx.selectedImage.url}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
            zIndex: 1 // 图片在最底层
          }}
          onLoad={handleImageLoad}
          alt="标注图片"
        />

        {/* SVG 标注层：覆盖在图片上 */}
        {showBoxes && (
        <svg
          ref={svgRef}
          style={{
            position: 'absolute',
            pointerEvents: 'auto',
            top: imgSize.top,
            left: imgSize.left,
            width: imgSize.width,
            height: imgSize.height,
            zIndex: 2,
            cursor: 'crosshair' // 绘制时鼠标变为十字形
          }}
          width={imgRef.current?.naturalWidth || 800}
          height={imgRef.current?.naturalHeight || 600}
          viewBox={`0 0 ${imgRef.current?.naturalWidth || 800} ${imgRef.current?.naturalHeight || 600}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <rect x="0" y="0" width="100%" height="100%" fill="transparent" />

          {imgLoaded && mouse.x >= 0 && (
            <g style={{ pointerEvents: 'none' }}>
              <line x1={mouse.x} y1={0} x2={mouse.x} y2={"100%"} stroke="white" strokeWidth={1} />
              <line x1={0} y1={mouse.y} x2={"100%"} y2={mouse.y} stroke="white" strokeWidth={1} />
              <text x={mouse.x + 8} y={mouse.y - 6} fill="white" fontSize="12">{mouse.x},{mouse.y}</text>
            </g>
          )}

          {imgLoaded && drawing && startPoint && (
            <rect
              x={Math.min(startPoint.x, mouse.x)}
              y={Math.min(startPoint.y, mouse.y)}
              width={Math.abs(mouse.x - startPoint.x)}
              height={Math.abs(mouse.y - startPoint.y)}
              stroke={ctx.selectedLabel.color}
              strokeWidth="2"
              fill={rgbToRgba(ctx.selectedLabel.color, 0.4)} // 高透明填充
            />
          )}

          {boxes.map(box => {
            // 如果有visible属性且为false，则不渲染
            if (box.visible === false) return null;
            
            return (
            <g key={box.id}>
              <rect
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                stroke={box.color}
                strokeWidth="2"
                fill={rgbToRgba(box.color, 0.4)} // 高透明填充
                style={{ cursor: 'move' }}
                onMouseDown={(e) => handleBoxDown(box, e)}
              />
              {showLabelText && <text x={box.x} y={box.y - 4} fill={box.color} fontSize="14" fontWeight="bold">{box.label}</text>}

              {selectedBox?.id === box.id && (
                <>
                  <rect onMouseDown={(e) => handleHandleDown('lt', box, e)} x={box.x-4} y={box.y-4} width="8" height="8" fill="#fff" stroke="#000" />
                  <rect onMouseDown={(e) => handleHandleDown('rt', box, e)} x={box.x+box.w-4} y={box.y-4} width="8" height="8" fill="#fff" stroke="#000" />
                  <rect onMouseDown={(e) => handleHandleDown('lb', box, e)} x={box.x-4} y={box.y+box.h-4} width="8" height="8" fill="#fff" stroke="#000" />
                  <rect onMouseDown={(e) => handleHandleDown('rb', box, e)} x={box.x+box.w-4} y={box.y+box.h-4} width="8" height="8" fill="#fff" stroke="#000" />
                  <rect onMouseDown={(e) => handleHandleDown('t', box, e)} x={box.x+box.w/2-4} y={box.y-4} width="8" height="8" fill="#fff" stroke="#000" />
                  <rect onMouseDown={(e) => handleHandleDown('b', box, e)} x={box.x+box.w/2-4} y={box.y+box.h-4} width="8" height="8" fill="#fff" stroke="#000" />
                  <rect onMouseDown={(e) => handleHandleDown('l', box, e)} x={box.x-4} y={box.y+box.h/2-4} width="8" height="8" fill="#fff" stroke="#000" />
                  <rect onMouseDown={(e) => handleHandleDown('r', box, e)} x={box.x+box.w-4} y={box.y+box.h/2-4} width="8" height="8" fill="#fff" stroke="#000" />
                </>
              )}
            </g>
            );
          })}
        </svg>
        )}

        {!drawing && (
        <>
        {/* 左下角：上一张按钮 */}
        <Button
          shape="circle"
          icon={<LeftOutlined />}
          style={{
            position: 'absolute',
            left: 16,
            bottom: 16,
            background: 'rgba(255,255,255,0.9)', // 更高透明度
            backdropFilter: 'blur(8px)',          // 虚化效果
            zIndex: 5
          }}
          onClick={handlePrev}
        />
        {/* 右下角：下一张按钮 */}
        <Button
          shape="circle"
          icon={<RightOutlined />}
          style={{
            position: 'absolute',
            right: 16,
            bottom: 16,
            background: 'rgba(255,255,255,0.9)', // 更高透明度
            backdropFilter: 'blur(8px)',          // 虚化效果
            zIndex: 5
          }}
          onClick={handleNext}
        />
        </>
        )}
      </div>

      {/* 右侧 Label 面板：高透明 + 自适应高度 + 可隐藏 */}
      {showLabels && !drawing && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 56,
          bottom: 'auto', // 自适应高度
          width: 220,
          background: 'rgba(255,255,255,0.5)', // 更高透明度
          backdropFilter: 'blur(12px)', // 更强虚化效果
          padding: '12px',
          borderLeft: '1px solid rgba(232,232,232,0.3)',
          borderRadius: '16px', // 四个顶角圆角
          margin: '8px',
          zIndex: 20,
          maxHeight: 'calc(100vh - 120px)',
          height: 'auto',
          overflowY: 'auto'
        }}>
          <Input.Search 
            placeholder="搜索标签..." 
            style={{ marginBottom: 12 }} 
            size="small"
            allowClear
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
          />
          
          {(ctx.labels || [])
            .filter(lab => searchQuery === '' || lab.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((lab, index) => (
            <div
              key={lab.id}
              style={{
                padding: '8px 6px', // 增加padding
                marginBottom: 4,
                minHeight: '36px', // 增加最小高度
                display: 'flex',
                alignItems: 'center',
                gap: 6, // 增加gap
                background: 'transparent',
                cursor: 'pointer',
                border: ctx.selectedLabel?.id === lab.id ? '2px solid #1890ff' : '2px solid transparent',
                transition: 'all 0.2s',
                position: 'relative',
                borderRadius: 4 // 添加圆角
              }}
              onClick={(e) => {
                // 如果点击的是按钮或输入框，不处理
                if (e.target.tagName === 'BUTTON' || e.target.closest('button') || 
                    e.target.tagName === 'INPUT' || e.target.closest('.ant-input')) {
                  e.stopPropagation();
                  return;
                }
                
                // 阻止事件冒泡
                e.stopPropagation();
                
                // 切换当前选中的label
                ctx.setSelectedLabel(lab);
                
                // 如果有选中的矩形框，也切换矩形框的label
                if (selectedBox) {
                  const updated = boxes.map(b => 
                    b.id === selectedBox.id ? { 
                      ...b, 
                      label: lab.name, 
                      color: lab.color, 
                      labelId: lab.id 
                    } : b
                  );
                  setBoxes(updated);
                  ctx.updateImageBoxes(ctx.selectedImage.id, updated);
                }
              }}
              onMouseEnter={(e) => {
                if (ctx.selectedLabel?.id !== lab.id) {
                  e.currentTarget.style.border = '2px solid #d9d9d9';
                  e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; // 添加悬停背景
                }
              }}
              onMouseLeave={(e) => {
                if (ctx.selectedLabel?.id !== lab.id) {
                  e.currentTarget.style.border = '2px solid transparent';
                  e.currentTarget.style.background = 'transparent'; // 移除悬停背景
                }
              }}
            >
              {/* 圆形颜色按钮 */}
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: lab.color,
                  border: '1px solid #ddd',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  flexShrink: 0
                }}
                onClick={(e) => handleColorButtonClick(e, lab.id)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
              
              {/* Label名称 - 可编辑 */}
              {editingLabelId === lab.id ? (
                <Input
                  autoFocus
                  size="small"
                  value={editingLabelName}
                  onChange={(e) => setEditingLabelName(e.target.value)}
                  onBlur={() => {
                    if (editingLabelName.trim()) {
                      // 更新label名称
                      const updatedLabels = ctx.labels.map(l =>
                        l.id === lab.id ? { ...l, name: editingLabelName.trim() } : l
                      );
                      ctx.setLabels(updatedLabels);
                      
                      // 更新所有相关矩形框的label名称
                      const updatedBoxes = boxes.map(box =>
                        box.labelId === lab.id ? { ...box, label: editingLabelName.trim() } : box
                      );
                      setBoxes(updatedBoxes);
                      ctx.updateImageBoxes(ctx.selectedImage.id, updatedBoxes);
                    }
                    setEditingLabelId(null);
                    setEditingLabelName('');
                  }}
                  onPressEnter={() => {
                    if (editingLabelName.trim()) {
                      // 更新label名称
                      const updatedLabels = ctx.labels.map(l =>
                        l.id === lab.id ? { ...l, name: editingLabelName.trim() } : l
                      );
                      ctx.setLabels(updatedLabels);
                      
                      // 更新所有相关矩形框的label名称
                      const updatedBoxes = boxes.map(box =>
                        box.labelId === lab.id ? { ...box, label: editingLabelName.trim() } : box
                      );
                      setBoxes(updatedBoxes);
                      ctx.updateImageBoxes(ctx.selectedImage.id, updatedBoxes);
                    }
                    setEditingLabelId(null);
                    setEditingLabelName('');
                  }}
                  style={{ flex: 1, fontSize: '12px', fontWeight: 500 }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span 
                  style={{ 
                    flex: 1, 
                    fontSize: '12px', 
                    fontWeight: 500, 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    cursor: 'text'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {lab.name}
                </span>
              )}
              
              {/* 操作按钮组 - 紧密连接靠右 */}
              <div 
                style={{
                  display: 'flex',
                  gap: 0,
                  opacity: 0,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
              >
                <Tooltip title="显示/隐藏该类别标注框">
                  <Button
                    size="small"
                    type="text"
                    icon={<EyeOutlined />}
                    style={{ width: '24px', height: '24px', padding: 0, borderRadius: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // 切换该类别的显示状态
                      const updatedBoxes = boxes.map(box => {
                        if (box.labelId === lab.id) {
                          // 切换visible状态：undefined/true -> false, false -> true
                          // 这样可以保留之前的显示/隐藏状态
                          const currentVisible = box.visible;
                          const newVisible = currentVisible === false ? true : false;
                          return { ...box, visible: newVisible };
                        }
                        return box;
                      });
                      setBoxes(updatedBoxes);
                    }}
                  />
                </Tooltip>
                <Tooltip title="修改标签名称">
                  <Button
                    size="small"
                    type="text"
                    icon={<EditOutlined />}
                    style={{ width: '24px', height: '24px', padding: 0, borderRadius: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // 开始编辑
                      setEditingLabelId(lab.id);
                      setEditingLabelName(lab.name);
                    }}
                  />
                </Tooltip>
                <Tooltip title="删除该标签">
                  <Button
                    size="small"
                    type="text"
                    icon={<CloseOutlined />}
                    style={{ width: '24px', height: '24px', padding: 0, borderRadius: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // 删除该标签
                      const updatedLabels = ctx.labels.filter(l => l.id !== lab.id);
                      ctx.setLabels(updatedLabels);
                      // 删除该标签关联的所有标注框
                      const updatedBoxes = boxes.filter(box => box.labelId !== lab.id);
                      setBoxes(updatedBoxes);
                    }}
                  />
                </Tooltip>
              </div>
              
              <Tag 
                size="small" 
                style={{ 
                  minWidth: '24px', 
                  textAlign: 'center',
                  background: '#f0f0f0',
                  color: '#666',
                  border: 'none',
                  fontWeight: 500,
                  padding: '0 6px',
                  height: '20px',
                  lineHeight: '20px',
                  fontSize: '12px'
                }}
              >
                {index + 1}
              </Tag>
            </div>
          ))}
          {/* 颜色选择器弹窗 */}
          <Modal
            title={null}
            open={colorPickerVisible}
            onCancel={() => {
              setColorPickerVisible(false);
              setColorPickerLabelId(null);
            }}
            footer={null}
            width={320}
            closable={false}
            style={{ top: '20%' }}
          >
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <Button
                  block
                  onClick={handleGenerateRandomColor}
                  style={{
                    height: '48px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  🎲 生成随机颜色
                </Button>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  padding: '8px',
                  background: '#f5f5f5',
                  borderRadius: '8px'
                }}>
                  <Input
                    type="color"
                    value={ctx.labels.find(l => l.id === colorPickerLabelId)?.color || '#0052FF'}
                    onChange={(e) => handleColorSelect(e.target.value)}
                    style={{ width: '60px', height: '40px', border: 'none', padding: 0 }}
                  />
                  <span style={{ flex: 1, textAlign: 'center', fontSize: '14px', color: '#666' }}>
                    点击色块选择颜色
                  </span>
                </div>
              </div>
              <div style={{ marginBottom: '12px', fontSize: '13px', color: '#999', fontWeight: 500 }}>
                常用颜色
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#FF7675', '#74B9FF', '#55EFC4', '#A29BFE', '#FAB1A0'].map(color => (
                  <div
                    key={color}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: '8px',
                      backgroundColor: color,
                      cursor: 'pointer',
                      border: '2px solid transparent',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => handleColorSelect(color)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.borderColor = '#1890ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  />
                ))}
              </div>
            </div>
          </Modal>


          {/* 新增标签 */}
          <div style={{
            marginTop: 12,
            padding: '8px',
            borderRadius: 6,
            background: 'rgba(245,245,245,0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: '#1890ff',
                border: '1px solid #ddd'
              }}
            />
            <Input
              style={{ flex: 1 }}
              size="small"
              placeholder="New label"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              onPressEnter={() => {
                if (newLabelName.trim()) {
                  // 使用随机颜色
                  const randomColor = generateRandomColor();
                  ctx.addLabel(newLabelName.trim(), randomColor);
                  setNewLabelName('');
                }
              }}
            />
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (newLabelName.trim()) {
                  // 使用随机颜色
                  const randomColor = generateRandomColor();
                  ctx.addLabel(newLabelName.trim(), randomColor);
                  setNewLabelName('');
                }
              }}
            />
          </div>
        </div>
      )}
    </div>

  );


};

// ====================== 图片列表（布局严格按要求）======================
import { useState, useContext } from 'react';
import { Card, Button, Tag, Dropdown, Badge, Upload, Tooltip } from 'antd';
import {
  EyeOutlined,
  AppstoreOutlined,
  BarsOutlined,
  DownloadOutlined,
  DeleteOutlined,
  UploadOutlined
} from '@ant-design/icons';

const ImagesSection = () => {
  const ctx = useContext(DatasetContext);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [imgLoaded, setImgLoaded] = useState({});
  const filtered = ctx.currentSplit === 'all'
    ? ctx.allImages
    : ctx.allImages.filter(i => i.split === ctx.currentSplit);

  const splitMenuItems = [
    { key: 'train', label: 'Train', onClick: () => ctx.moveImageToSplit(ctxMenu.id, 'train') },
    { key: 'val', label: 'Val', onClick: () => ctx.moveImageToSplit(ctxMenu.id, 'val') },
    { key: 'test', label: 'Test', onClick: () => ctx.moveImageToSplit(ctxMenu.id, 'test') },
  ];

  // 下载图片
  const handleDownloadImage = async (img) => {
    const imageUrl = img.url || `https://picsum.photos/seed/bottle-${img.id}/800/600`;

    try {
      // 使用fetch获取图片数据
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      // 获取blob数据
      const blob = await response.blob();

      // 创建blob URL
      const blobUrl = URL.createObjectURL(blob);

      // 创建下载链接
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `image_${img.id}.jpg`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // 清理
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error('Download failed:', error);
      // 如果fetch失败，尝试直接下载（兼容某些情况）
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `image_${img.id}.jpg`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    }
  };

  // 图片右键菜单项
  const imageContextMenuItems = [
    {
      key: 'download',
      label: '下载图片',
      onClick: () => {
        const img = ctx.allImages.find(i => i.id === ctxMenu.id);
        if (img) handleDownloadImage(img);
      }
    },
    {
      key: 'move',
      label: '移动到数据集',
      children: splitMenuItems
    },
    {
      key: 'delete',
      label: '删除图片',
      danger: true,
      onClick: () => ctx.deleteImage(ctxMenu.id)
    },
  ];

  const handleImageLoad = (imgId) => {
    setImgLoaded(prev => ({ ...prev, [imgId]: true }));
  };

  return (
    <div style={{ padding: '0 24px 24px' }}>
      {/* 顶部工具栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, background: '#fff', padding: '8px 12px', borderRadius: 8, border: '1px solid #e8e8e8' }}>
        <Button icon={<EyeOutlined />} size="small" type="text" />
        <Dropdown menu={{ items: [{ key: 'all', label: 'All · Created ↓' }] }}>
          <Button size="small" type="text">All · Created ↓</Button>
        </Dropdown>
        <Button icon={<AppstoreOutlined />} size="small" type="text" />
        <Button icon={<BarsOutlined />} size="small" type="text" />
        <div style={{ flex: 1 }} />
        <Button type={ctx.currentSplit === 'all' ? 'primary' : 'default'} onClick={() => ctx.setCurrentSplit('all')} size="small">All <Tag>{ctx.totalImages}</Tag></Button>
        <Button type={ctx.currentSplit === 'train' ? 'primary' : 'default'} onClick={() => ctx.setCurrentSplit('train')} size="small">Train <Tag>{ctx.allImages.filter(i => i.split === 'train').length}</Tag></Button>
        <Button type={ctx.currentSplit === 'val' ? 'primary' : 'default'} onClick={() => ctx.setCurrentSplit('val')} size="small">Val <Tag>{ctx.allImages.filter(i => i.split === 'val').length}</Tag></Button>
        <Button type={ctx.currentSplit === 'test' ? 'primary' : 'default'} onClick={() => ctx.setCurrentSplit('test')} size="small">Test <Tag>{ctx.allImages.filter(i => i.split === 'test').length}</Tag></Button>
      </div>

      {/* 图片网格布局 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {filtered.map(img => (
          <Card
            key={img.id}
            className="image-card"
            bodyStyle={{ padding: 8 }}
            hoverable
            onClick={() => ctx.setSelectedImage(img)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCtxMenu({ id: img.id, x: e.clientX, y: e.clientY });
            }}
            style={{ position: 'relative', cursor: 'pointer' }}
          >
            <div style={{ position: 'relative' }}>
              <img
                width="100%"
                src={img.url || `https://picsum.photos/seed/bottle-${img.id}/400/300`}
                onLoad={() => handleImageLoad(img.id)}
                loading="lazy"
                style={{ display: 'block' }}
              />
              <Badge status={img.split === 'train' ? 'success' : 'processing'} style={{ position: 'absolute', top: 8, right: 8 }} />

              {/* 悬停时显示的下载和删除按钮 */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  gap: 4,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: 4,
                  padding: 4,
                  zIndex: 10,
                  display: 'none'
                }}
                className="hover-actions"
              >
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleDownloadImage(img);
                  }}
                  style={{ padding: '2px 4px' }}
                />
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    ctx.deleteImage(img.id);
                  }}
                  style={{ padding: '2px 4px' }}
                />
              </div>

              {/* 标注框预览 */}
              {imgLoaded[img.id] && img.boxes && img.boxes.length > 0 && (
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  {img.boxes.map(box => (
                    <g key={box.id}>
                      <rect
                        x={`${(box.x / 800) * 100}%`}
                        y={`${(box.y / 600) * 100}%`}
                        width={`${(box.w / 800) * 100}%`}
                        height={`${(box.h / 600) * 100}%`}
                        stroke={box.color}
                        strokeWidth="2"
                        fill="none"
                      />
                    </g>
                  ))}
                </svg>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* 右键菜单 */}
      {ctxMenu && (
        <Dropdown
          trigger={['click']}
          open={!!ctxMenu}
          onOpenChange={(v) => !v && setCtxMenu(null)}
          menu={{ items: imageContextMenuItems }}
        >
          <div
            style={{
              position: 'fixed',
              left: ctxMenu.x,
              top: ctxMenu.y,
              width: 1,
              height: 1,
              pointerEvents: 'none'
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          />
        </Dropdown>
      )}

      {/* 上传区域 */}
      <div style={{ marginTop: 24, border: '1px dashed #e5e7eb', borderRadius: 8, padding: '40px 24px', textAlign: 'center', color: '#666' }}>
        <Upload showUploadList={false} beforeUpload={(f) => { ctx.addNewImages([f]); return false; }} multiple>
          <div style={{ cursor: 'pointer' }}>
            <UploadOutlined style={{ fontSize: 32 }} />
            <div>All {ctx.totalImages} images loaded</div>
          </div>
        </Upload>
      </div>

      {/* 悬停样式 */}
      <style>{`
        .image-card .hover-actions {
          display: none !important;
        }
        .image-card:hover .hover-actions {
          display: flex !important;
        }
      `}</style>
    </div>
  );
};


// ====================== 其他页面 ======================
const ClassesSection = () => {
  const ctx = useContext(DatasetContext);
  return (
    <div style={{ padding: 24 }}>
      <Card style={{ borderRadius: 8 }}>
        <h3 style={{ marginBottom: 16 }}>Class Distribution</h3>
        <div style={{ height: 280 }}>
          <Bar
            data={{
              labels: ctx.labels.map(l => l.name),
              datasets: [{ data: ctx.labels.map(l => l.count), backgroundColor: ctx.labels.map(l => l.color) }]
            }}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </div>
        <Table
          dataSource={ctx.labels}
          columns={[
            { title: 'Label', render: r => <><div style={{ width: 12, height: 12, borderRadius: '50%', background: r.color, display: 'inline-block', marginRight: 8 }} />{r.name}</> },
            { title: 'Count', dataIndex: 'count' },
          ]}
          pagination={false}
          style={{ marginTop: 20 }}
        />
      </Card>
    </div>
  );
};

const ChartsSection = () => {
  const ctx = useContext(DatasetContext);
  const splitData = {
    labels: ['Train', 'Val', 'Test'],
    datasets: [{
      data: [
        ctx.allImages.filter(i => i.split === 'train').length,
        ctx.allImages.filter(i => i.split === 'val').length,
        ctx.allImages.filter(i => i.split === 'test').length,
      ],
      backgroundColor: ['#00C853', '#4285F4', '#AB47BC']
    }]
  };
  const labelData = {
    labels: ctx.labels.map(l => l.name),
    datasets: [{ data: ctx.labels.map(l => l.count), backgroundColor: ctx.labels.map(l => l.color) }]
  };
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Split Distribution" style={{ borderRadius: 8 }}>
          <div style={{ height: 240 }}>
            <Doughnut data={splitData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </Card>
        <Card title="Label Distribution" style={{ borderRadius: 8 }}>
          <div style={{ height: 240 }}>
            <Doughnut data={labelData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </Card>
      </div>
    </div>
  );
};

const ModelsSection = () => (
  <div style={{ padding: 24 }}>
    <Card style={{ borderRadius: 8 }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <PlusOutlined style={{ fontSize: 32, color: '#1890ff' }} />
        <div style={{ marginTop: 16, fontSize: 16 }}>No models trained yet</div>
        <Button type="primary" style={{ marginTop: 16 }}>Train New Model</Button>
      </div>
    </Card>
  </div>
);

// ====================== 统计信息和描述组件 ======================
const StatsAndDescription = () => {
  const ctx = useContext(DatasetContext);
  const [descModal, setDescModal] = useState(false);
  const [descEdit, setDescEdit] = useState(ctx.description);

  return (
    <div style={{ padding: '16px 24px 0' }}>
      {/* 第一行：统计信息 */}
      <div style={{
        color: '#666', fontSize: '14px',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        marginBottom: 4
      }}>
        {ctx.totalImages} images • {ctx.labeledCount} labeled • {ctx.classCount} classes • {ctx.totalSizeMB} MB • Updated {ctx.timeAgo}
      </div>

      {/* 第二行：描述 */}
      <span
        style={{
          color: '#1890ff', cursor: 'pointer',
          fontSize: '14px'
        }}
        onClick={(e) => { e.stopPropagation(); setDescModal(true); }}
      >
        {ctx.description}
      </span>

      <Modal open={descModal} onCancel={() => setDescModal(false)} footer={null}>
        <Input.TextArea 
          value={descEdit} 
          onChange={(e) => setDescEdit(e.target.value)} 
          rows={4} 
          autoFocus 
          placeholder="Add a description..." 
        />
        <Button 
          type="primary" 
          block 
          style={{ marginTop: 16 }} 
          onClick={() => { ctx.setDescription(descEdit); setDescModal(false); }}
        >
          Save
        </Button>
      </Modal>
    </div>
  );
};

// ====================== 主页面（顶部栏美化）======================
const Annotation = () => {
  const ctx = useContext(DatasetContext);
  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e8e8e8', height: '64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <FolderOpenOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>bottle</div>
          <Dropdown menu={{ items: [{ key: 'detect', label: 'Detect' }, { key: 'segment', label: 'Segment' }] }}>
            <Tag color="blue" style={{ cursor: 'pointer', padding: '2px 8px' }}>Detect</Tag>
          </Dropdown>
          <Dropdown menu={{ items: [{ key: 'add', label: 'Add License' }, { key: 'manage', label: 'Manage Licenses' }] }}>
            <Button size="small" type="text">Add license</Button>
          </Dropdown>
          <Tag color="success" style={{ padding: '2px 8px' }}>Ready</Tag>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button type="primary" icon={<PlusOutlined />} size="small">+ New Model</Button>
          <Tooltip title="Upload"><UploadOutlined style={{ fontSize: 18, cursor: 'pointer' }} /></Tooltip>
          <Tooltip title="Download"><DownloadOutlined style={{ fontSize: 18, cursor: 'pointer' }} /></Tooltip>
          <Tooltip title="Star"><StarOutlined style={{ fontSize: 18, cursor: 'pointer' }} /></Tooltip>
          <Tooltip title="Refresh"><SyncOutlined style={{ fontSize: 18, cursor: 'pointer' }} /></Tooltip>
          <Tooltip title="Delete"><DeleteOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#ff4d4f' }} /></Tooltip>
        </div>
      </Header>

      {/* 统计信息和描述 */}
      <StatsAndDescription />

      <Tabs
        activeKey={ctx.currentTab}
        onChange={ctx.setCurrentTab}
        items={[
          { key: 'images', label: <><FolderOpenOutlined /> Images</> },
          { key: 'classes', label: <><BlockOutlined /> Classes {ctx.classCount}</> },
          { key: 'charts', label: <><LineChartOutlined /> Charts</> },
          { key: 'models', label: <><MoreOutlined /> Models</> },
        ]}
        style={{ padding: '0 24px', background: '#fff' }}
        type="card"
      />

      {ctx.currentTab === 'images' && <ImagesSection />}
      {ctx.currentTab === 'classes' && <ClassesSection />}
      {ctx.currentTab === 'charts' && <ChartsSection />}
      {ctx.currentTab === 'models' && <ModelsSection />}

      <AnnotationView />
    </Layout>
  );
};

const App = () => (
  <DatasetProvider>
    <ConfigProvider theme={{ token: { colorPrimary: '#1890ff', borderRadius: 6 } }}>
      <Annotation />
    </ConfigProvider>
  </DatasetProvider>
);

export default App;