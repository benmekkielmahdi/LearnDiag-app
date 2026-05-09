import axios from 'axios';
import type { StudentInput, PredictionResponse, ExplainResponse, HistoryItem } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to include JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const predictionService = {
  // Single prediction + explanation
  predict: async (data: StudentInput): Promise<PredictionResponse> => {
    const response = await api.post<PredictionResponse>('/predict', data);
    return response.data;
  },

  explain: async (data: StudentInput): Promise<ExplainResponse> => {
    const response = await api.post<ExplainResponse>('/explain', data);
    return response.data;
  },

  // Batch prediction (CSV upload)
  batchPredict: async (file: File): Promise<PredictionResponse[]> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<PredictionResponse[]>('/batch_predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getBatchSummary: async (results: PredictionResponse[]): Promise<{ summary: string }> => {
    const response = await api.post<{ summary: string }>('/predict/batch-summary', results);
    return response.data;
  },

  // Recommendation based on a predicted score
  recommend: async (score: number): Promise<string> => {
    const response = await api.post<string>('/recommend', { score });
    return response.data;
  },

  getHistory: async (limit: number = 20): Promise<HistoryItem[]> => {
    const response = await api.get<HistoryItem[]>(`/history?limit=${limit}`);
    return response.data;
  },

  getMetrics: async () => {
    const response = await api.get('/metrics');
    return response.data;
  },

  chat: async (message: string, context?: string) => {
    const response = await api.post('/chat', { message, context });
    return response.data;
  },

  getFeatures: async () => {
    const response = await api.get('/features');
    return response.data;
  },

  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Auth methods
  login: async (formData: any) => {
    const params = new URLSearchParams();
    params.append('username', formData.email);
    params.append('password', formData.password);
    const response = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },

  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  downloadReport: async (data: any) => {
    const response = await api.post('/report/pdf', data, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rapport_${data.full_name}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  getAudioReport: async (text: string, lang: string = 'fr') => {
    const response = await api.post('/report/audio', { text, lang }, { responseType: 'blob' });
    return window.URL.createObjectURL(new Blob([response.data], { type: 'audio/mpeg' }));
  },

  sendEmailReport: async (data: any) => {
    const response = await api.post('/report/email', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/me/profile', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/me/profile', data);
    return response.data;
  },

  downloadBatchReport: async (results: any[], summary: string | null, teacherName: string) => {
    const response = await api.post('/report/batch/pdf', {
      results,
      class_summary: summary,
      teacher_name: teacherName
    }, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Rapport_Global_Classe.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
