import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error.response?.data || error)
  }
)

// 训练 API
export const trainAPI = {
  prepareDataset: (data) => api.post('/train/prepare-dataset', data),
  startTraining: (data) => api.post('/train/start', data),
  getTrainingStatus: (taskId) => api.get(`/train/status/${taskId}`),
  getTrainingCurves: (taskId) => api.get(`/train/curves/${taskId}`, { responseType: 'blob' }),
  stopTraining: (taskId) => api.post(`/train/stop/${taskId}`),
  listModels: () => api.get('/train/models'),
}

// 推理 API
export const inferenceAPI = {
  loadModel: (data) => api.post('/inference/load-model', data),
  predictImage: (formData) => api.post('/inference/predict-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  predictVideo: (formData) => api.post('/inference/predict-video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getInferenceResult: (resultId) => api.get(`/inference/result/${resultId}`),
}

// 标注 API
export const annotationAPI = {
  autoAnnotate: (data) => api.post('/annotation/auto-annotate', data),
  batchUpload: (formData) => api.post('/annotation/batch-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  exportDataset: (data) => api.post('/annotation/export', data),
  downloadDataset: (datasetName) => api.get(`/annotation/download/${datasetName}`, {
    responseType: 'blob'
  }),
}

// LLM API
export const llmAPI = {
  analyze: (data) => api.post('/llm/analyze', data),
  generateReport: (data) => api.post('/llm/generate-report', data),
}

export default api