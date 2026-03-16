import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const loginAdmin = (email, password) => 
  api.post('/admin/login', { email, password });

export const logoutAdmin = () => 
  api.post('/admin/logout');

// Public APIs
export const getProperties = (params) => 
  api.get('/properties', { params });

export const getFeaturedProperties = () => 
  api.get('/properties/featured');

export const getDestinations = () => 
  api.get('/properties/destinations');

export const getProperty = (id) => 
  api.get(`/properties/${id}`);

export const getStats = () => 
  api.get('/stats');

export const createBooking = (bookingData) => 
  api.post('/bookings', bookingData);

// Admin APIs
export const getDashboardStats = () => 
  api.get('/admin/dashboard');

export const getAdminProperties = () => 
  api.get('/admin/properties');

export const createProperty = (propertyData) => 
  api.post('/admin/properties', propertyData);

export const updateProperty = (id, propertyData) => 
  api.put(`/admin/properties/${id}`, propertyData);

export const deleteProperty = (id) => 
  api.delete(`/admin/properties/${id}`);

export const getAdminBookings = (status) => 
  api.get('/admin/bookings', { params: { status } });

export const updateBookingStatus = (id, status) => 
  api.put(`/admin/bookings/${id}`, { status });

export default api;
