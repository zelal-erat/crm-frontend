import axios from 'axios';

const API_BASE_URL = 'http://localhost:5258/api';

// Axios instance oluşturma
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - JWT token ekleme
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Token yenileme ve hata yönetimi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth servisleri
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  refresh: (payload) => api.post('/auth/refresh', payload),
  logout: () => {
    localStorage.removeItem('token');
  },
};

// Müşteri servisleri
export const customerService = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (customer) => api.post('/customers', customer),
  update: (id, customer) => api.put(`/customers/${id}`, customer),
  delete: (id) => api.delete(`/customers/${id}`),
  // Müşteri-Hizmet Analiz Endpoint'leri
  getServiceUsage: (id) => api.get(`/customers/${id}/service-usage`),
  getServiceAnalysis: () => api.get('/customers/service-analysis'),
  getServiceUsageByCustomer: (params = {}) => api.get('/customers/service-usage-by-customer', { params }),
};

// Fatura servisleri
export const invoiceService = {
  getAll: () => api.get('/invoices'),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (invoice) => api.post('/invoices', invoice),
  // Backend: PUT /api/invoices (id gövdede)
  update: (invoice) => api.put('/invoices', invoice),
  delete: (id) => api.delete(`/invoices/${id}`),
  markAsPaid: (id) => api.put(`/invoices/${id}/mark-paid`),
  getUpcoming: () => api.get('/invoices/upcoming'),
  getOverdue: () => api.get('/invoices/overdue'),
  getServicePrice: (serviceId) => api.get(`/invoices/service-price/${serviceId}`),
  updateOverdue: () => api.post('/invoices/update-overdue'),
  processRenewals: () => api.post('/invoices/process-renewals'),
  search: (customerName, pageNumber = 1, pageSize = 10) => api.get('/invoices/search', {
    params: { customerName, pageNumber, pageSize }
  }),
};

// Hizmet servisleri
export const serviceService = {
  getAll: () => api.get('/services'),
  getById: (id) => api.get(`/services/${id}`),
  create: (service) => api.post('/services', service),
  // Backend: PUT /api/services (id gövdede)
  update: (service) => api.put('/services', service),
  delete: (id) => api.delete(`/services/${id}`),
};

// Dashboard servisleri
export const dashboardService = {
  getStats: () => api.get('/dashboard'),
};

export default api;
