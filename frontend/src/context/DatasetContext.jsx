import { Layout, Typography, App } from 'antd';
import React, { useState, useContext, createContext, useEffect } from 'react';

const { Header, Content } = Layout;
const { Text } = Typography;

// 全局上下文
const DatasetContext = createContext();

const useDatasetContext = () => useContext(DatasetContext);

const DatasetProvider = ({ children }) => {
  const { message } = App.useApp();
  
  // 调试：确保message存在
  useEffect(() => {
    console.log('DatasetProvider mounted, message:', message);
  }, [message]);
  
  // 从localStorage加载数据
  const loadFromStorage = () => {
    try {
      const savedDatasets = localStorage.getItem('annotation_datasets');
      const savedImages = localStorage.getItem('uploadedImages');
      const savedLabels = localStorage.getItem('annotation_labels');
      
      let datasetsData = savedDatasets ? JSON.parse(savedDatasets) : [
        {
          id: 'bottle',
          name: 'bottle',
          task: 'detect',
          visibility: 'public',
          license: 'MIT',
          description: 'Bottle detection dataset',
          createdAt: Date.now() - 8 * 60 * 60 * 1000
        }
      ];
      
      let imagesData = savedImages ? JSON.parse(savedImages) : [
        { id: 1, split: 'val', labeled: true, url: `https://picsum.photos/seed/bottle-1/800/600`, boxes: [{ id: 1, x: 50, y: 50, w: 100, h: 150, label: 'bottle', color: '#0052FF' }, { id: 2, x: 60, y: 200, w: 30, h: 30, label: 'cap', color: '#00D4FF' }] },
        { id: 2, split: 'val', labeled: true, url: `https://picsum.photos/seed/bottle-2/800/600`, boxes: [{ id: 3, x: 50, y: 50, w: 100, h: 150, label: 'bottle', color: '#0052FF' }, { id: 4, x: 60, y: 200, w: 30, h: 30, label: 'cap', color: '#00D4FF' }] },
        { id: 3, split: 'train', labeled: true, url: `https://picsum.photos/seed/bottle-3/800/600`, boxes: [{ id: 5, x: 200, y: 50, w: 80, h: 150, label: 'bottle', color: '#0052FF' }, { id: 6, x: 150, y: 180, w: 25, h: 25, label: 'cap', color: '#00D4FF' }] },
        { id: 4, split: 'train', labeled: true, url: `https://picsum.photos/seed/bottle-4/800/600`, boxes: [{ id: 7, x: 200, y: 50, w: 80, h: 150, label: 'bottle', color: '#0052FF' }, { id: 8, x: 150, y: 180, w: 25, h: 25, label: 'cap', color: '#00D4FF' }] },
        { id: 5, split: 'train', labeled: true, url: `https://picsum.photos/seed/bottle-5/800/600`, boxes: [{ id: 9, x: 150, y: 50, w: 80, h: 150, label: 'bottle', color: '#0052FF' }, { id: 10, x: 80, y: 200, w: 25, h: 25, label: 'cap', color: '#00D4FF' }] },
        { id: 6, split: 'train', labeled: true, url: `https://picsum.photos/seed/bottle-6/800/600`, boxes: [{ id: 11, x: 150, y: 50, w: 80, h: 150, label: 'bottle', color: '#0052FF' }, { id: 12, x: 80, y: 200, w: 25, h: 25, label: 'cap', color: '#00D4FF' }] },
        { id: 7, split: 'train', labeled: false, url: `https://picsum.photos/seed/bottle-7/800/600`, boxes: [] },
        { id: 8, split: 'train', labeled: false, url: `https://picsum.photos/seed/bottle-8/800/600`, boxes: [] },
      ];
      
      let labelsData = savedLabels ? JSON.parse(savedLabels) : [
        { id: 1, name: 'bottle', color: '#0052FF', count: 6, shortcut: '1' },
        { id: 2, name: 'cap', color: '#00D4FF', count: 6, shortcut: '2' },
      ];
      
      // 确保每个数据集都有自己的数据
      datasetsData.forEach(dataset => {
        if (!dataset.images) {
          dataset.images = [];
        }
        if (!dataset.labels) {
          dataset.labels = [];
        }
      });
      
      // 默认数据集使用默认数据
      const bottleDataset = datasetsData.find(d => d.id === 'bottle');
      if (bottleDataset) {
        bottleDataset.images = imagesData;
        bottleDataset.labels = labelsData;
      }
      
      return {
        datasets: datasetsData,
        images: imagesData,
        labels: labelsData
      };
    } catch (error) {
      console.error('加载数据失败:', error);
    }
    return null;
  };

  const savedData = loadFromStorage();

  // 如果localStorage中的图片数据与服务器不一致（服务器为空），清空localStorage
  useEffect(() => {
    const clearLocalStorageIfNeeded = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/images/list');
        const data = await response.json();
        
        if (data.success && data.data) {
          const serverImages = data.data.images;
          const localStorageImages = JSON.parse(localStorage.getItem('uploadedImages') || '[]');
          
          // 如果服务器为空但localStorage有图片，清空localStorage
          if (serverImages.length === 0 && localStorageImages.length > 0) {
            console.log('[清理] 服务器无图片，清空localStorage中的图片数据');
            localStorage.removeItem('uploadedImages');
            setAllImages([]);
          }
        }
      } catch (error) {
        console.error('检查服务器图片失败:', error);
      }
    };
    
    clearLocalStorageIfNeeded();
  }, []);

  

  const [allImages, setAllImages] = useState(() => {

  

      // 初始化时不从localStorage加载图片，改为空数组

  

      // 图片数据会在切换数据集时从后端加载

  

      console.log('[初始化] 不从localStorage加载图片数据，等待数据集切换');

  

      return [];

  

    });
  const [labels, setLabels] = useState(savedData?.labels || []);

  const [currentSplit, setCurrentSplit] = useState('all');
  const [currentTab, setCurrentTab] = useState('images');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState(labels[0]);
  const [description, setDescription] = useState('Add a description...');
  const [uploadTime] = useState(Date.now() - 8 * 60 * 60 * 1000);

  // 数据集管理状态
  const [datasets, setDatasets] = useState(savedData?.datasets || [
    {
      id: 'bottle',
      name: 'bottle',
      task: 'detect',
      visibility: 'public',
      license: 'MIT',
      description: 'Bottle detection dataset',
      createdAt: Date.now() - 8 * 60 * 60 * 1000,
      images: savedData?.images || [],
      labels: savedData?.labels || []
    }
  ]);
  const [currentDataset, setCurrentDataset] = useState('bottle');

  // 初始化时检查服务器状态，如果为空则清空本地数据
  useEffect(() => {
    const checkServerOnLoad = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/images/list');
        const data = await response.json();
        if (data.success && data.data.count === 0 && allImages.length > 0) {
          // 服务器为空但本地有数据，清空本地数据
          console.log('[初始化] 服务器为空，清空本地图片数据');
          setAllImages([]);
          setLabels([]);
          // 同时清空数据集中的图片和标签数据
          setDatasets(prev => prev.map(ds => ({
            ...ds,
            images: [],
            labels: []
          })));
          localStorage.removeItem('uploadedImages');
          localStorage.removeItem('annotation_labels');
        }
      } catch (error) {
        console.error('[初始化] 检查服务器状态失败:', error);
      }
    };
    checkServerOnLoad();
  }, []); // 只在组件挂载时执行一次

  // 同步服务器图片列表
  const syncWithServer = async () => {
    try {
      // 获取当前数据集ID
      const currentDatasetId = currentDataset || 'bottle';
      
      // 从指定数据集获取图片列表
      const response = await fetch(`http://localhost:8000/api/images/list?dataset_id=${currentDatasetId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const serverImages = data.data.images;
        
        // 获取当前前端显示的图片（只比较通过上传的图片，不包括默认图片）
        const uploadedImages = allImages.filter(img => img.filename && !img.url.includes('picsum.photos'));
        
        // 使用 Map 来快速查找，key 为 filename
        const currentImageMap = new Map(uploadedImages.map(img => [img.filename, img]));
        const serverImageMap = new Map(serverImages.map(img => [img.name, img]));
        
        // 找出服务器上有但前端没有的图片（新增）
        const newImages = serverImages.filter(img => !currentImageMap.has(img.name));
        
        // 找出前端有但服务器上没有的图片（已删除）
        const deletedImages = uploadedImages.filter(img => !serverImageMap.has(img.filename));
        
        let updatedImages = [...allImages];
        
        // 添加新图片
        if (newImages.length > 0) {
          // 为新图片尝试加载标注
          const addedImages = await Promise.all(newImages.map(async (img) => {
            const imageId = `${img.name.split('.')[0]}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const fileNameWithoutExt = img.name.split('.')[0];
            
            // 尝试加载该图片的标注
            let boxes = [];
            let labeled = false;
            
            try {
              const labelResponse = await fetch('http://localhost:8000/api/annotation/load-annotation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `image_id=${encodeURIComponent(fileNameWithoutExt)}&dataset_dir=${encodeURIComponent(currentDatasetId)}`
              });
              const labelData = await labelResponse.json();
              
              if (labelData.success && labelData.data) {
                boxes = labelData.data.boxes || [];
                labeled = boxes.length > 0;
                console.log(`[自动同步] ${img.name}: 找到 ${boxes.length} 个标注框`);
              }
            } catch (labelError) {
              console.warn(`[自动同步] ${img.name}: 加载标注失败`, labelError);
            }
            
            return {
              id: imageId,
              split: img.subfolder || 'train',
              labeled: labeled,
              boxes: boxes,
              url: `http://localhost:8000${img.path}`,
              filename: img.name,
              uploadedAt: img.modified * 1000
            };
          }));
          
          // 合并结果（保留现有图片，添加新图片）
          updatedImages = [...updatedImages, ...addedImages];
          
          console.log(`[自动同步] 新增 ${addedImages.length} 张图片:`, addedImages.map(img => img.filename));
          // 移除弹窗提示，改为静默同步
        }
        
        // 自动删除服务器上不存在的图片
        if (deletedImages.length > 0) {
          const deletedIds = new Set(deletedImages.map(img => img.id));
          updatedImages = updatedImages.filter(img => !deletedIds.has(img.id));
          
          console.log(`[自动同步] 已删除 ${deletedImages.length} 张服务器上不存在的图片:`, deletedImages.map(img => img.filename));
          // 移除弹窗提示，改为静默清理
        }
        
        // 更新状态
        if (newImages.length > 0 || deletedImages.length > 0) {
          setAllImages(updatedImages);
          // 更新localStorage
          localStorage.setItem('uploadedImages', JSON.stringify(updatedImages));
        }
      }
    } catch (error) {
      console.error('[自动同步] 同步服务器图片失败:', error);
    }
  };

  // 自动同步：每30秒检查一次服务器图片列表
  useEffect(() => {
    // 延迟初始同步，避免与页面加载冲突
    const initialSyncTimeout = setTimeout(() => {
      syncWithServer();
    }, 2000); // 2秒后开始第一次同步
    
    // 定期同步
    const syncInterval = setInterval(() => {
      syncWithServer();
    }, 30000); // 30秒
    
    return () => {
      clearTimeout(initialSyncTimeout);
      clearInterval(syncInterval);
    };
  }, [allImages.length]); // 只在图片数量变化时重新设置定时器
  const [showCreateDatasetModal, setShowCreateDatasetModal] = useState(false);

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
    
    // 同时更新selectedImage（如果当前选中的是这个图像）
    if (selectedImage && selectedImage.id === imageId) {
      const updatedImage = { ...selectedImage, boxes, labeled: boxes.length > 0 };
      setSelectedImage(updatedImage);
      
      // 触发自动保存（保存JSON和YOLO文件）
      debouncedAutoSave(updatedImage);
    }
  };

  // 删除YOLO标注文件
  const deleteYOLOFile = async (imageId) => {
    try {
      // 查找对应的图像，获取正确的文件名和路径
      const image = allImages.find(img => img.id === imageId);
      if (!image) {
        console.warn(`[删除YOLO] 找不到图像: ${imageId}`);
        return;
      }
      
      const currentDatasetId = currentDataset || 'bottle';
      
      // 从image.url中提取图片路径，确定TXT文件的保存位置
      let yoloPath = `datasets/${currentDatasetId}/labels/${imageId}.txt`;
      let imageBaseName = '';  // 用于YOLO文件的基础名称（不含扩展名）
      
      if (image.url) {
        // 从URL中提取图片路径，例如: http://localhost:8000/datasets/bottle/images/val/image.jpg
        const urlPath = image.url.replace(/^.*\/datasets\//, '');
        const pathParts = urlPath.split('/');
        
        // 期望的路径结构: bottle/images/val/image.jpg
        // pathParts[0] = bottle, pathParts[1] = images, pathParts[2] = val/test/train, pathParts[3] = image.jpg
        if (pathParts.length >= 4 && ['train', 'val', 'test'].includes(pathParts[2])) {
          const splitDir = pathParts[2]; // train, val, 或 test
          const imageFileName = pathParts[pathParts.length - 1];
          imageBaseName = imageFileName.replace(/\.[^.]+$/, ''); // 去除扩展名
          yoloPath = `datasets/${currentDatasetId}/labels/${splitDir}/${imageBaseName}.txt`;
        }
      }
      
      // 如果没有从URL中提取到基础名称，从filename中提取
      if (!imageBaseName && image.filename) {
        imageBaseName = image.filename.replace(/\.[^.]+$/, '');
      }
      
      // 如果还没有，使用image.id
      if (!imageBaseName) {
        imageBaseName = imageId;
      }
      
      console.log(`[删除YOLO] 删除YOLO文件: ${yoloPath}, 图像ID: ${imageId}, 基础名称: ${imageBaseName}`);
      
      // 调用后端API删除YOLO文件
      const response = await fetch('http://localhost:8000/api/annotation/delete-yolo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_id: imageBaseName,  // 使用不含扩展名的基础名称
          yolo_path: yoloPath
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`[删除YOLO] 删除成功:`, result);
      } else {
        console.error(`[删除YOLO] 删除失败:`, response.status);
      }
    } catch (error) {
      console.error('[删除YOLO] 删除YOLO文件失败:', error);
    }
  };

  // 删除JSON标注文件
  const deleteJSONFile = async (imageId) => {
    try {
      // 查找对应的图像，获取正确的文件名
      const image = allImages.find(img => img.id === imageId);
      const filename = image?.filename || imageId;
      
      const currentDatasetId = currentDataset || 'bottle';
      const jsonPath = `datasets/${currentDatasetId}/annotations/${filename}.json`;
      
      console.log(`[删除JSON] 删除JSON文件: ${jsonPath}, 图像ID: ${imageId}, 文件名: ${filename}`);
      
      // 调用后端API删除JSON文件
      const response = await fetch('http://localhost:8000/api/annotation/delete-annotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_id: filename,
          json_path: jsonPath
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`[删除JSON] 删除成功:`, result);
      } else {
        console.error(`[删除JSON] 删除失败:`, response.status);
      }
    } catch (error) {
      console.error('[删除JSON] 删除JSON文件失败:', error);
    }
  };
  const autoSaveAnnotation = async (image) => {
    try {
      const currentDatasetId = currentDataset || 'bottle';
      const saveDir = `datasets/${currentDatasetId}/annotations`;
      
      // 如果没有矩形框，删除JSON文件
      if (!image.boxes || image.boxes.length === 0) {
        console.log(`[JSON保存] 没有矩形框，删除JSON文件`);
        await deleteJSONFile(image.id);
        return;
      }
      
      const annotationData = {
        imageId: image.id,
        imageUrl: image.url,
        labeled: image.labeled,
        boxes: image.boxes,
        createdAt: new Date().toISOString()
      };
      
      console.log(`[JSON保存] 开始保存标注:`, {
        imageId: image.id,
        currentDatasetId,
        saveDir,
        boxesCount: image.boxes?.length
      });
      
      // 使用fetch但不等待响应，避免阻塞UI
      fetch('http://localhost:8000/api/annotation/save-annotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_id: image.filename || image.id,  // 优先使用filename
          annotation_data: annotationData,
          save_dir: saveDir
        })
      }).then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('保存失败');
      }).then(result => {
        console.log(`[JSON保存] 标注文件已保存:`, result.data);
      }).catch(error => {
        console.error(`[JSON保存] 保存失败:`, error);
      });
    } catch (error) {
      console.error('[JSON保存] 保存标注文件失败:', error);
    }
  };

  // 加载单个图像的JSON标注
  const loadAnnotation = async (image, jsonContent) => {
    try {
      const annotationData = JSON.parse(jsonContent);
      const updatedBoxes = annotationData.boxes || [];
      
      setAllImages(prev => prev.map(img =>
        img.id === image.id ? { ...img, boxes: updatedBoxes, labeled: updatedBoxes.length > 0 } : img
      ));
      
      return updatedBoxes;
    } catch (error) {
      console.error('加载标注文件失败:', error);
      return null;
    }
  };

  // 从后端API加载标注
  const loadAnnotationFromAPI = async (imageId, datasetDir = null) => {
    try {
      // 如果没有指定数据集目录，使用当前数据集的annotations目录
      const currentDatasetId = currentDataset || 'bottle';
      const annotationDir = datasetDir || `datasets/${currentDatasetId}/annotations`;
      
      const formData = new FormData();
      formData.append('image_id', imageId);
      formData.append('dataset_dir', annotationDir);
      
      const response = await fetch('http://localhost:8000/api/annotation/load-annotation', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const updatedBoxes = result.data.boxes || [];
          setAllImages(prev => prev.map(img =>
            img.id === imageId ? { ...img, boxes: updatedBoxes, labeled: updatedBoxes.length > 0 } : img
          ));
          
          // 自动提取标签并添加到标签列表中
          if (updatedBoxes.length > 0) {
            const uniqueLabels = [...new Set(updatedBoxes.map(box => box.label).filter(l => l))];
            const existingLabelNames = new Set(labels.map(l => l.name));
            
            uniqueLabels.forEach(labelName => {
              if (!existingLabelNames.has(labelName)) {
                // 为新标签生成颜色
                const colors = ['#0052FF', '#00D4FF', '#52C41A', '#FA8C16', '#F5222D', '#722ED1', '#EB2F96', '#FAAD14'];
                const color = colors[labels.length % colors.length];
                
                const newLabel = {
                  id: labels.length + 1,
                  name: labelName,
                  color: color,
                  count: 0,
                  shortcut: String(labels.length + 1)
                };
                setLabels(prev => [...prev, newLabel]);
                console.log(`[加载标注] 自动添加新标签: ${labelName}`);
              }
            });
            
            // 更新标签统计
            refreshLabelStats();
            
            message.success('标注文件加载成功！');
          }
          return updatedBoxes;
        } else {
          // 没有标注文件时不显示警告消息
          return null;
        }
      } else {
        const error = await response.json();
        // 不显示错误消息，静默处理
        return null;
      }
    } catch (error) {
      console.error('从API加载标注失败:', error);
      // 不显示错误消息，静默处理
      return null;
    }
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

  const moveImageToSplit = async (imageId, split) => {
    try {
      // 找到要移动的图片
      const imageToMove = allImages.find(img => img.id === imageId);
      
      if (!imageToMove) {
        console.error('[移动] 图片不存在:', imageId);
        return;
      }
      
      // 如果图片已经在目标split，不需要移动
      if (imageToMove.split === split) {
        console.log('[移动] 图片已经在目标split:', split);
        return;
      }
      
      // 调用后端API移动图片和标签文件
      if (imageToMove.filename) {
        console.log('[移动] 尝试移动图片和标签文件:', imageToMove.filename, '到', split);
        
        try {
          const response = await fetch('http://localhost:8000/api/dataset/move-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              image_filename: imageToMove.filename,
              dataset_id: currentDataset,
              target_split: split
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              console.log('[移动] 图片和标签文件移动成功');
              message.success(`图片已移动到 ${split}`);
            } else {
              console.error('[移动] 后端移动失败:', result.message);
              message.error(`移动失败: ${result.message}`);
            }
          } else {
            const error = await response.json();
            console.error('[移动] 后端移动请求失败:', response.status, error);
            message.error('移动请求失败');
          }
        } catch (fetchError) {
          console.error('[移动] 调用后端移动接口失败:', fetchError);
          message.error('移动接口调用失败');
        }
      } else {
        console.warn('[移动] 图片没有文件名，跳过后端移动:', imageToMove);
      }
      
      // 更新前端状态
      setAllImages(prev => prev.map(img =>
        img.id === imageId ? { ...img, split } : img
      ));
      
    } catch (error) {
      console.error('[移动] 移动图片失败:', error);
      message.error('移动图片失败');
    }
  };

  const deleteImage = async (imageId) => {
    try {
      // 找到要删除的图片
      const imageToDelete = allImages.find(img => img.id === imageId);
      
      if (!imageToDelete) {
        console.error('[删除] 图片不存在:', imageId);
        return;
      }
      
      let backendDeleteSuccess = false;
      
      // 使用新的批量删除接口，同时删除图片和标签文件
      if (imageToDelete.filename) {
        console.log('[删除] 尝试删除图片和标签文件:', imageToDelete.filename);
        
        try {
          const response = await fetch('http://localhost:8000/api/dataset/images', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              image_ids: [imageToDelete.filename],
              dataset_id: currentDataset
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              backendDeleteSuccess = true;
              console.log('[删除] 图片和标签文件删除成功:', imageToDelete.filename);
            } else {
              console.error('[删除] 后端删除失败:', result.message);
            }
          } else {
            console.error('[删除] 后端删除请求失败:', response.status);
            const errorText = await response.text();
            console.error('[删除] 错误详情:', errorText);
          }
        } catch (fetchError) {
          console.error('[删除] 调用后端删除接口失败:', fetchError);
        }
      } else {
        console.warn('[删除] 图片没有文件名，跳过后端删除:', imageToDelete);
      }
      
      // 从状态中删除
      setAllImages(prev => prev.filter(img => img.id !== imageId));
      
      // 更新localStorage
      const savedImages = JSON.parse(localStorage.getItem('uploadedImages') || '[]');
      const updatedImages = savedImages.filter(img => img.id !== imageId);
      localStorage.setItem('uploadedImages', JSON.stringify(updatedImages));
      
      // 显示删除结果提示
      if (backendDeleteSuccess) {
        message.success('图片和标签文件删除成功');
      } else if (deletePath) {
        message.warning('前端已删除，但后端文件删除失败');
      } else {
        message.success('图片删除成功（仅前端）');
      }
      
      // 触发数据集更新事件，通知Layout刷新导航栏
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('datasets-updated'));
      }, 100);
      
    } catch (error) {
      console.error('[删除] 删除图片失败:', error);
      // 即使删除后端文件失败，也要从状态中删除
      setAllImages(prev => prev.filter(img => img.id !== imageId));
      message.error('删除图片失败');
      
      // 即使失败也触发数据集更新事件
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('datasets-updated'));
      }, 100);
    }
  };

  // 补充现有图片的尺寸信息
  const updateImagesInfo = async () => {
    try {
      console.log('[图片信息] 开始获取现有图片的尺寸信息，当前数据集:', currentDataset);
      
      const response = await fetch(`http://localhost:8000/api/images/info?dataset_id=${currentDataset}`);
      const result = await response.json();
      
      if (result.success && result.data.images) {
        const imagesInfoMap = {};
        result.data.images.forEach(info => {
          imagesInfoMap[info.filename] = {
            width: info.width,
            height: info.height,
            size: info.size
          };
        });
        
        console.log('[图片信息] 后端返回的图片信息:', imagesInfoMap);
        
        // 更新现有图片的信息
        let updatedCount = 0;
        let skippedCount = 0;
        
        setAllImages(prev => {
          const updated = prev.map(img => {
            // 支持多种文件名来源
            const filenameToCheck = img.filename || img.name || img.originalPath;
            
            if (filenameToCheck && imagesInfoMap[filenameToCheck]) {
              updatedCount++;
              console.log(`[图片信息] 更新图片: ${filenameToCheck}`, imagesInfoMap[filenameToCheck]);
              return {
                ...img,
                ...imagesInfoMap[filenameToCheck]
              };
            } else {
              if (filenameToCheck) {
                skippedCount++;
                console.log(`[图片信息] 跳过图片(无后端信息): ${filenameToCheck}`);
              } else {
                console.log(`[图片信息] 跳过图片(无文件名):`, img);
              }
            }
            return img;
          });
          
          console.log(`[图片信息] 更新完成: 更新了 ${updatedCount} 张图片，跳过了 ${skippedCount} 张图片`);
          return updated;
        });
      } else {
        console.warn('[图片信息] 后端返回数据无效:', result);
      }
    } catch (error) {
      console.error('[图片信息] 获取图片信息失败:', error);
    }
  };

  const addNewImages = async (files) => {
    console.log('开始上传图片...', files);
    
    try {
      // 为每个文件上传到后端
      const uploadPromises = files.map(async (f, i) => {
        console.log(`上传文件 ${i}: ${f.name}`, f);
        console.log('文件类型:', f.type, '文件大小:', f.size);
        
        const formData = new FormData();
        formData.append('dataset_file', f);
        formData.append('dataset_type', 'images');

        console.log('开始发送请求到 http://localhost:8000/api/upload/dataset');
        
        let result;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
          
          const response = await fetch('http://localhost:8000/api/upload/dataset', {
            method: 'POST',
            body: formData,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          console.log(`上传响应 ${f.name}:`, response.status, response.statusText);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`上传失败响应: ${errorText}`);
            throw new Error(`Upload failed for ${f.name}: ${response.status} ${errorText}`);
          }

          result = await response.json();
          console.log(`上传结果 ${f.name}:`, result);
        } catch (fetchError) {
          console.error(`Fetch错误 ${f.name}:`, fetchError);
          throw fetchError;
        }
        
        // 使用文件名+时间戳作为唯一ID
        const uniqueId = `${f.name.split('.')[0]}_${Date.now()}_${i}`;
        const imageUrl = `http://localhost:8000/uploads/datasets/images/${f.name}`;
        
        console.log(`生成的图片URL: ${imageUrl}`);
        
        // 返回图片信息，使用后端返回的路径
        return {
          id: uniqueId,
          split: 'train',
          labeled: false,
          boxes: [],
          url: imageUrl,
          originalPath: result.path,
          filename: f.name
        };
      });

      const newImgs = await Promise.all(uploadPromises);
      console.log('所有图片上传完成:', newImgs);
      console.log('准备更新allImages, 当前长度:', allImages.length, '新增图片数:', newImgs.length);
      setAllImages(prev => {
        const updated = [...prev, ...newImgs];
        console.log('更新后的图片列表长度:', updated.length);
        console.log('更新后的图片列表:', updated);
        return updated;
      });
      console.log('setAllImages调用完成');
      
      // 保存到localStorage，刷新页面后可以恢复
      const savedImages = JSON.parse(localStorage.getItem('uploadedImages') || '[]');
      localStorage.setItem('uploadedImages', JSON.stringify([...savedImages, ...newImgs]));
      
    } catch (error) {
      console.error('Upload images failed:', error);
      console.error('上传失败,使用blob URL作为fallback');
      console.log('当前allImages长度:', allImages.length);
      alert(`上传失败,使用本地预览: ${error.message}`);
      
      try {
        // 如果上传失败，使用本地blob URL作为fallback
        const newImgs = files.map((f, i) => {
          const blobUrl = URL.createObjectURL(f);
          console.log(`为文件 ${f.name} 创建blob URL: ${blobUrl}`);
          return {
            id: `${f.name}_${Date.now()}_${i}`,
            split: 'train',
            labeled: false,
            boxes: [],
            url: blobUrl,
            filename: f.name
          };
        });
        
        console.log('准备更新allImages with fallback, 新增图片数:', newImgs.length);
        setAllImages(prev => {
          const updated = [...prev, ...newImgs];
          console.log('Fallback更新后的图片列表长度:', updated.length);
          console.log('Fallback更新后的图片列表:', updated);
          return updated;
        });
        console.log('Fallback setAllImages调用完成');
      } catch (fallbackError) {
        console.error('Fallback逻辑执行失败:', fallbackError);
        alert(`本地预览也失败了: ${fallbackError.message}`);
      }
    }
  };

  const addLabel = (name, color) => {
    const newLabel = {
      id: Date.now(),
      name: name,
      color: color,
      count: 0,
      shortcut: String(labels.length + 1)
    };
    
    // 先更新状态，获取新的label列表
    const newLabels = [...labels, newLabel];
    setLabels(newLabels);
    
    // 使用新的label列表更新data.yaml
    updateDataYamlWithLabels(newLabels);
  };
  
  // 更新data.yaml文件（带label列表参数）
  const updateDataYamlWithLabels = async (labelList) => {
    try {
      const currentDatasetId = currentDataset || 'bottle';
      
      // 使用传入的label列表
      const labelNames = labelList.map(l => l.name);
      console.log(`[更新data.yaml] 使用传入的label列表:`, labelNames);
      
      const response = await fetch('http://localhost:8000/api/train/update-data-yaml', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataset_id: currentDatasetId,
          label_names: labelNames
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('[更新data.yaml] 成功:', result);
      } else {
        console.error('[更新data.yaml] 失败:', response.status);
      }
    } catch (error) {
      console.error('[更新data.yaml] 失败:', error);
    }
  };
  
  // 更新data.yaml文件（使用当前labels状态）
  const updateDataYaml = async () => {
    try {
      const currentDatasetId = currentDataset || 'bottle';
      
      // 获取前端label列表
      const labelNames = labels.map(l => l.name);
      console.log(`[更新data.yaml] 使用前端label列表:`, labelNames);
      
      const response = await fetch('http://localhost:8000/api/train/update-data-yaml', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataset_id: currentDatasetId,
          label_names: labelNames
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('[更新data.yaml] 成功:', result);
      } else {
        console.error('[更新data.yaml] 失败:', response.status);
      }
    } catch (error) {
      console.error('[更新data.yaml] 失败:', error);
    }
  };

  // 转换为YOLO格式
  const convertToYOLO = (image, labelNames, imageWidth, imageHeight) => {
    // 如果没有labels，使用box中的label名称作为索引
    const uniqueLabels = [...new Set(image.boxes.map(box => box.label).filter(l => l))];
    
    const yoloLines = [];
    image.boxes.forEach(box => {
      if (!box || !box.label) return;
      
      // 使用label名称在uniqueLabels中的索引
      const labelIndex = uniqueLabels.indexOf(box.label);
      if (labelIndex === -1) {
        console.warn(`标签 "${box.label}" 未找到索引`);
        return;
      }
      
      // 使用矩形框自己的图像尺寸进行归一化（优先使用box.imgWidth，否则使用传入的尺寸）
      const actualWidth = box.imgWidth || imageWidth;
      const actualHeight = box.imgHeight || imageHeight;
      
      // YOLO格式：class_id x_center y_center width height (都是归一化的0-1值)
      const x_center = (box.x + box.w / 2) / actualWidth;
      const y_center = (box.y + box.h / 2) / actualHeight;
      const width = box.w / actualWidth;
      const height = box.h / actualHeight;
      
      // 使用epsilon避免边界值0和1，确保坐标严格在(0,1)范围内
      const epsilon = 1e-6;
      const normalizedX = Math.max(epsilon, Math.min(1 - epsilon, x_center));
      const normalizedY = Math.max(epsilon, Math.min(1 - epsilon, y_center));
      const normalizedW = Math.max(epsilon, Math.min(1 - epsilon, width));
      const normalizedH = Math.max(epsilon, Math.min(1 - epsilon, height));
      
      console.log(`[YOLO转换] 矩形框${box.id}: 原始坐标(x=${box.x}, y=${box.y}, w=${box.w}, h=${box.h}), 图像尺寸(${actualWidth}x${actualHeight}), 归一化后(x=${normalizedX.toFixed(6)}, y=${normalizedY.toFixed(6)}, w=${normalizedW.toFixed(6)}, h=${normalizedH.toFixed(6)})`);
      
      yoloLines.push(`${labelIndex} ${normalizedX.toFixed(6)} ${normalizedY.toFixed(6)} ${normalizedW.toFixed(6)} ${normalizedH.toFixed(6)}`);
    });
    
    console.log(`YOLO转换结果: ${yoloLines.length} 个标注, 内容:`, yoloLines);
    return yoloLines.join('\n');
  };

  // 保存单张图像的YOLO格式label（通过后端API保存到labels目录）
  const saveImageWithLabel = async (image, imageWidth, imageHeight) => {
    try {
      console.log(`[YOLO保存] 开始保存YOLO标注，图像ID: ${image.id}, 矩形框数量: ${image.boxes?.length}`);
      
      // 生成YOLO格式label
      const labelNames = labels.map(l => l.name);
      console.log(`[YOLO保存] 当前labels:`, labelNames);
      
      // 使用实际图像尺寸（从图像对象中获取）
      const actualWidth = image.imgWidth || imageWidth;
      const actualHeight = image.imgHeight || imageHeight;
      const yoloContent = convertToYOLO(image, labelNames, actualWidth, actualHeight);
      console.log(`[YOLO保存] 生成的YOLO内容:`, yoloContent);
      
      if (!yoloContent || yoloContent.trim().length === 0) {
        console.warn(`[YOLO保存] YOLO内容为空，跳过保存`);
        return;
      }
      
      // 获取当前数据集ID，确保YOLO标注保存到对应数据集的目录
      const currentDatasetId = currentDataset || 'bottle';
      
      // 使用fetch但不等待响应，避免阻塞UI
      // 从image.url中提取图片路径，确定标签保存位置
      let imagePath = '';
      let imageBaseName = '';  // 用于YOLO文件的基础名称（不含扩展名）
      
      if (image.url) {
        // URL格式: http://localhost:8000/datasets/{dataset_id}/images/{split}/{filename}
        const urlPath = image.url.replace(/^.*\/datasets\//, '');
        const urlParts = urlPath.split('/');
        // 期望结构: bottle/images/val/filename.jpg
        if (urlParts.length >= 4 && ['images'].includes(urlParts[1])) {
          // 重建相对路径: datasets/{dataset_id}/images/{split}/{filename}
          imagePath = `datasets/${currentDatasetId}/images/${urlParts.slice(2).join('/')}`;
          
          // 获取不含扩展名的文件名
          const filename = urlParts[urlParts.length - 1];
          imageBaseName = filename.replace(/\.[^.]+$/, '');
        }
      }
      
      // 如果没有从URL中提取到基础名称，从filename中提取
      if (!imageBaseName && image.filename) {
        imageBaseName = image.filename.replace(/\.[^.]+$/, '');
      }
      
      // 如果还没有，使用image.id
      if (!imageBaseName) {
        imageBaseName = image.id;
      }
      
      fetch('http://localhost:8000/api/annotation/save-yolo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_id: imageBaseName,  // 使用不含扩展名的基础名称
          yolo_content: yoloContent,
          labels_dir: `datasets/${currentDatasetId}/labels`,
          image_path: imagePath  // 添加图片路径，用于确定标签保存位置
        })
      }).then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('保存失败');
      }).then(result => {
        console.log(`[YOLO保存] 保存成功:`, result);
      }).catch(error => {
        console.error(`[YOLO保存] 保存失败:`, error);
      });
    } catch (error) {
      console.error('[YOLO保存] 保存YOLO label失败:', error);
    }
  };

  // 保存所有图像的YOLO labels到一个ZIP文件（通过后端API）
  const saveAllYOLOLabels = async () => {
    try {
      const labelNames = labels.map(l => l.name);
      const yoloLabels = {};
      
      // 获取当前数据集ID，确保YOLO标注保存到对应数据集的目录
      const currentDatasetId = currentDataset || 'bottle';
      
      // 遍历所有已标注的图像
      allImages.forEach(image => {
        if (image.labeled && image.boxes && image.boxes.length > 0) {
          // 使用实际图像尺寸
        const actualWidth = image.imgWidth || 800;
        const actualHeight = image.imgHeight || 600;
        const yoloContent = convertToYOLO(image, labelNames, actualWidth, actualHeight);
          yoloLabels[image.id] = yoloContent;
        }
      });
      
      // 调用后端API保存所有YOLO labels到对应数据集的labels目录
      const response = await fetch('http://localhost:8000/api/annotation/save-all-yolo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          labels_dir: `datasets/${currentDatasetId}/labels`,
          labels: yoloLabels
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        message.success(`已保存 ${result.data.saved_count} 个YOLO label文件到 datasets/${currentDatasetId}/labels`);
      } else {
        const error = await response.json();
        message.error('保存失败：' + error.detail);
      }
    } catch (error) {
      console.error('保存所有YOLO labels失败:', error);
      message.error('保存失败：' + error.message);
    }
  };

  // 保存整个数据集
  const saveDataset = async () => {
    try {
      const datasetData = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        labels: labels.map(l => ({
          id: l.id,
          name: l.name,
          color: l.color,
          shortcut: l.shortcut
        })),
        images: allImages.map(img => ({
          id: img.id,
          split: img.split,
          labeled: img.labeled,
          url: img.url,
          boxes: img.boxes
        }))
      };
      
      // 下载JSON格式的数据集
      const jsonBlob = new Blob([JSON.stringify(datasetData, null, 2)], { type: 'application/json' });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const link = document.createElement('a');
      link.href = jsonUrl;
      link.download = `dataset_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(jsonUrl);
      
      message.success('数据集保存成功！');
    } catch (error) {
      console.error('保存数据集失败:', error);
      message.error('保存数据集失败：' + error.message);
    }
  };

  // 加载数据集
  const loadDataset = (datasetData) => {
    try {
      if (!datasetData.labels || !datasetData.images) {
        throw new Error('无效的数据集格式');
      }
      
      setLabels(datasetData.labels);
      setAllImages(datasetData.images);
      
      message.success('数据集加载成功！');
    } catch (error) {
      console.error('加载数据集失败:', error);
      message.error('加载数据集失败：' + error.message);
    }
  };

  // 保存数据到localStorage
const saveToStorage = () => {
    // 保存所有数据集的数据
    const updatedDatasets = datasets.map(dataset => {
      if (dataset.id === currentDataset) {
        return {
          ...dataset,
          images: allImages,
          labels: labels
        };
      }
      return dataset;
    });
    localStorage.setItem('annotation_datasets', JSON.stringify(updatedDatasets));
    
    // 兼容旧的存储方式
    localStorage.setItem('uploadedImages', JSON.stringify(allImages));
    localStorage.setItem('annotation_labels', JSON.stringify(labels));
  };

  // 监听数据变化并自动保存
  useEffect(() => {
    saveToStorage();
  }, [allImages, labels, currentDataset]);

  // 防抖函数，避免频繁触发保存
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // 防抖版本的自动保存函数
  const debouncedAutoSave = debounce(async (image) => {
    if (!image) return;
    
    console.log(`[自动保存] 检测到标注变化，矩形框数量: ${image.boxes?.length}`);
    try {
      // 先保存JSON文件（包含完整的标注信息）
      await autoSaveAnnotation(image);
      
      // 根据矩形框数量决定YOLO文件的处理方式
      if (!image.boxes || image.boxes.length === 0) {
        // 如果没有矩形框，删除YOLO文件
        console.log(`[自动保存] 没有矩形框，删除YOLO文件`);
        await deleteYOLOFile(image.id);
        await deleteJSONFile(image.id);
      } else {
        // 有矩形框，保存YOLO文件
        await saveImageWithLabel(image, 800, 600);
      }
      
      console.log(`[自动保存] 保存完成`);
    } catch (error) {
      console.error(`[自动保存] 保存失败:`, error);
    }
  }, 300); // 300ms防抖延迟，更快响应用户操作

  // 监听选中图像变化，自动保存该图像的标注
  useEffect(() => {
    if (selectedImage) {
      console.log(`[自动保存] 检测到图像变化，准备保存...`);
      // 使用防抖版本的自动保存
      debouncedAutoSave(selectedImage);
    }
  }, [selectedImage, selectedImage?.boxes]);

  useEffect(() => {
    refreshLabelStats();
  }, [allImages]);

  // 数据集管理函数
  const createDataset = async (datasetInfo) => {
    console.log('创建数据集，输入信息:', datasetInfo);
    
    try {
      // 调用后端API创建数据集
      const response = await fetch('http://localhost:8000/api/dataset/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: datasetInfo.name,
          task: datasetInfo.task,
          description: datasetInfo.description
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '创建数据集失败');
      }
      
      const result = await response.json();
      
      // 处理上传的图片列表
      const uploadedImages = datasetInfo.uploadedImages || [];
      console.log('上传的图片数量:', uploadedImages.length);
      
      const processedImages = uploadedImages.map((img, index) => {
        const uniqueId = `${img.name.split('.')[0]}_${Date.now()}_${index}`;
        return {
          id: uniqueId,
          split: 'train',
          labeled: false,
          boxes: [],
          url: `http://localhost:8000/uploads/datasets/extracted/${img.path}`,
          originalPath: img.fullPath,
          filename: img.name
        };
      });
      
      console.log('处理后的图片数量:', processedImages.length);
      
      const newDataset = {
        id: result.data.name.toLowerCase().replace(/\s+/g, '-'),
        name: result.data.name,
        task: result.data.task,
        visibility: datasetInfo.visibility || 'public',
        license: datasetInfo.license || 'MIT',
        description: datasetInfo.description || '',
        datasetPath: result.data.path,
        createdAt: Date.now(),
        images: processedImages,
        labels: []
      };
      
      console.log('新数据集:', newDataset);
      
      setDatasets(prev => [...prev, newDataset]);
      setCurrentDataset(newDataset.id);
      
      // 重新加载所有数据集，确保数据同步
      console.log('[创建数据集] 重新加载所有数据集');
      try {
        const datasetsResponse = await fetch('http://localhost:8000/api/dataset/list');
        const datasetsData = await datasetsResponse.json();
        if (datasetsData.success && datasetsData.data) {
          console.log('[创建数据集] 重新加载数据集列表:', datasetsData.data);
          setDatasets(datasetsData.data);
        }
      } catch (error) {
        console.error('[创建数据集] 重新加载数据集列表失败:', error);
      }
      
      // 加载新数据集的数据
      setAllImages(processedImages || []);
      setLabels([]);
      setSelectedImage(null);
      setSelectedLabel(null);
      
      const msg = processedImages.length > 0
        ? `数据集 "${newDataset.name}" 创建成功！已加载 ${processedImages.length} 张图片`
        : `数据集 "${newDataset.name}" 创建成功！`;
      
      message.success(msg);
      
      // 刷新页面以更新UI
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      // 触发自定义事件，通知Layout更新数据集列表
      window.dispatchEvent(new CustomEvent('dataset-created', { detail: newDataset }));
    } catch (error) {
      console.error('创建数据集失败:', error);
      message.error('创建数据集失败：' + error.message);
    }
  };

  // 从后端加载数据集列表
  const loadDatasetsFromBackend = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/dataset/list');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDatasets(result.data);
          // 如果没有当前数据集，设置第一个为当前数据集
          if (!currentDataset && result.data.length > 0) {
            setCurrentDataset(result.data[0].id);
          }
        }
      }
    } catch (error) {
      console.error('加载数据集列表失败:', error);
    }
  };

  // 初始化时加载数据集列表
  useEffect(() => {
    const initializeDataset = async () => {
      await loadDatasetsFromBackend();
      // 初始化后自动切换到当前数据集，确保labels正确加载
      if (currentDataset) {
        await switchDataset(currentDataset);
      }
    };
    initializeDataset();
  }, []);

  const switchDataset = async (datasetId) => {
    console.log('切换数据集:', datasetId);
    
    // 先检查数据集是否存在
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) {
      console.error('数据集不存在:', datasetId);
      return;
    }
    
    // 保存当前数据集的数据
    saveCurrentDatasetData();
    
    setCurrentDataset(datasetId);
    
    // 从后端API重新加载该数据集的图片列表
    try {
      console.log(`[切换数据集] 从后端加载图片: ${datasetId}`);
      const response = await fetch(`http://localhost:8000/api/images/list?dataset_id=${datasetId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const serverImages = data.data.images;
        console.log(`[切换数据集] 从后端加载到 ${serverImages.length} 张图片`);
        
        // 转换为前端图片格式，并尝试加载每张图片的标注
        const loadedImages = await Promise.all(serverImages.map(async (img) => {
          const imageId = `${img.name.split('.')[0]}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const fileNameWithoutExt = img.name.split('.')[0];
          
          // 尝试加载该图片的标注（使用文件名而不是image_id）
          let boxes = [];
          let labeled = false;
          
          try {
            const labelResponse = await fetch('http://localhost:8000/api/annotation/load-annotation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `image_id=${encodeURIComponent(fileNameWithoutExt)}&dataset_dir=${encodeURIComponent(datasetId)}`
            });
            const labelData = await labelResponse.json();
            
            if (labelData.success && labelData.data) {
              boxes = labelData.data.boxes || [];
              labeled = boxes.length > 0;
              console.log(`[加载标注] ${img.name}: 找到 ${boxes.length} 个标注框`);
            }
          } catch (labelError) {
            console.warn(`[加载标注] ${img.name}: 加载失败`, labelError);
          }
          
          return {
            id: imageId,
            split: img.subfolder || 'train',  // 使用后端返回的subfolder信息
            labeled: labeled,
            boxes: boxes,
            url: `http://localhost:8000${img.path}`,
            filename: img.name,
            uploadedAt: img.modified * 1000
          };
        }));
        
        setAllImages(loadedImages);
        
        // 从加载的标注中自动提取标签
        const allLabels = new Map();
        const colors = ['#0052FF', '#00D4FF', '#52C41A', '#FA8C16', '#F5222D', '#722ED1', '#EB2F96', '#FAAD14'];
        
        loadedImages.forEach(img => {
          if (img.boxes && img.boxes.length > 0) {
            img.boxes.forEach(box => {
              if (box.label && !allLabels.has(box.label)) {
                allLabels.set(box.label, {
                  id: allLabels.size + 1,
                  name: box.label,
                  color: colors[allLabels.size % colors.length],
                  count: 0,
                  shortcut: String(allLabels.size + 1)
                });
              }
            });
          }
        });
        
        // 计算每个标签的数量
        loadedImages.forEach(img => {
          if (img.boxes && img.boxes.length > 0) {
            img.boxes.forEach(box => {
              if (box.label && allLabels.has(box.label)) {
                allLabels.get(box.label).count++;
              }
            });
          }
        });
        
        const extractedLabels = Array.from(allLabels.values());
        console.log(`[切换数据集] 从标注中提取了 ${extractedLabels.length} 个标签:`, extractedLabels.map(l => l.name));
        
        // 尝试从后端加载标签列表作为补充
        try {
          const labelsResponse = await fetch(`http://localhost:8000/api/dataset/get-labels?dataset_id=${datasetId}`);
          const labelsData = await labelsResponse.json();
          if (labelsData.success && labelsData.data && labelsData.data.length > 0) {
            console.log(`[切换数据集] 从后端加载了 ${labelsData.data.length} 个标签`);
            setLabels(labelsData.data);
          } else {
            // 如果后端没有标签，使用从标注中提取的标签
            console.log('[切换数据集] 后端没有标签，使用从标注中提取的标签');
            setLabels(extractedLabels);
          }
        } catch (labelsError) {
          console.warn('[切换数据集] 加载标签失败，使用从标注中提取的标签:', labelsError);
          setLabels(extractedLabels);
        }
      } else {
        console.warn('[切换数据集] 后端返回空图片列表');
        setAllImages([]);
        setLabels([]);
      }
    } catch (error) {
      console.error('[切换数据集] 从后端加载图片失败:', error);
      // 如果后端加载失败，清空数据而不是使用本地缓存
      // 本地缓存可能包含其他数据集的图片数据
      console.warn('[切换数据集] 后端加载失败，清空图片数据');
      setAllImages([]);
      setLabels([]);
    }

    // 补充现有图片的尺寸信息
    updateImagesInfo();
    
    setSelectedImage(null);
    setSelectedLabel(null);
    
    console.log(`[切换数据集] 切换完成: ${dataset.name}`);
  };

  const saveCurrentDatasetData = () => {
    const updatedDatasets = datasets.map(dataset => {
      if (dataset.id === currentDataset) {
        return {
          ...dataset,
          images: allImages,
          labels: labels
        };
      }
      return dataset;
    });
    setDatasets(updatedDatasets);
    
    // 保存到localStorage
    localStorage.setItem('annotation_datasets', JSON.stringify(updatedDatasets));
  };

  return (
    <DatasetContext.Provider value={{
      allImages, setAllImages,
      totalImages, labeledCount, classCount, totalSizeMB, timeAgo: getTimeAgo(),
      currentSplit, setCurrentSplit,
      currentTab, setCurrentTab,
      selectedImage, setSelectedImage,
      labels, setLabels, selectedLabel, setSelectedLabel,
      description, setDescription,
      datasets, setDatasets, currentDataset, setCurrentDataset, showCreateDatasetModal, setShowCreateDatasetModal,
      createDataset, switchDataset, saveCurrentDatasetData,
      updateImageBoxes, refreshLabelStats,
      moveImageToSplit, deleteImage, addNewImages, addLabel, updateDataYaml, updateDataYamlWithLabels,
      saveImageWithLabel, saveDataset, loadDataset, loadAnnotation, loadAnnotationFromAPI, saveAllYOLOLabels,
      deleteYOLOFile, deleteJSONFile,
    }}>
      {children}
    </DatasetContext.Provider>
  );
};

export { DatasetContext, useDatasetContext, DatasetProvider };
export default DatasetProvider;
