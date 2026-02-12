import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('travo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Properties API
export const propertiesAPI = {
  getAll: (params) => api.get('/properties', { params }),
  getFeatured: () => api.get('/properties/featured'),
  getById: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  getNearby: (id) => api.get(`/properties/${id}/nearby`),
  search: (params) => api.get('/search', { params }),
};

// Owner API
export const ownerAPI = {
  getProperties: () => api.get('/owner/properties'),
};

// Admin API
export const adminAPI = {
  getProperties: (params) => api.get('/admin/properties', { params }),
  propertyAction: (data) => api.post('/admin/properties/action', data),
  getStats: () => api.get('/admin/stats'),
};

// Destinations API
export const destinationsAPI = {
  getAll: () => api.get('/destinations'),
};

// Seed data
export const seedData = () => api.post('/seed');

// Format price in INR
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

export default api;
