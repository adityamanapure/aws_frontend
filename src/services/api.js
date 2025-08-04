import axios from 'axios';

// Use the working AWS EC2 API endpoint directly
const API_BASE_URL = 'http://ec2-51-20-79-41.eu-north-1.compute.amazonaws.com';
export const API_URL = `${API_BASE_URL}/api`;

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authorization header interceptor
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('token');

    if (config.url.includes('/admin/')) {
      if (adminToken) {
        config.headers['Authorization'] = `Bearer ${adminToken}`;
      }
    } else if (adminToken && (
      config.url.includes('/api/reels') ||
      config.url.includes('/api/products') ||
      config.url.includes('/api/categories')
    )) {
      config.headers['Authorization'] = `Bearer ${adminToken}`;
    } else if (userToken) {
      config.headers['Authorization'] = `Bearer ${userToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (error.config.url.includes('/admin/')) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
      } else {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;