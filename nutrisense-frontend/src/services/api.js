import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auto attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ns_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getUserProfile = (userId) => API.get(`/auth/profile/${userId}`);

// Health APIs
export const addHealthData = (data) => API.post('/health/add', data);
export const getLatestHealth = (userId) => API.get(`/health/latest/${userId}`);
export const getHealthHistory = (userId) => API.get(`/health/history/${userId}`);
export const getVisualizationData = (userId) => API.get(`/health/visualization/${userId}`);

export default API;