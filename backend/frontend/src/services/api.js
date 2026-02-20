import axios from 'axios';

const RAILS_URL = import.meta.env.VITE_BACKEND_URL !== undefined ? import.meta.env.VITE_BACKEND_URL : 'http://localhost:5000';
const API_BASE_URL = import.meta.env.VITE_API_URL || `${RAILS_URL}/api/v1`;
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK === 'true';

const ensureAbsoluteUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http') || url.startsWith('data:')) return url;

  // If RAILS_URL is empty (relative path usage), just ensure it starts with /
  if (!RAILS_URL) {
    return url.startsWith('/') ? url : `/${url}`;
  }

  // Ensure we don't double slash
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${RAILS_URL}${normalizedPath}`;
};

console.log('🔧 API Configuration:');
console.log('  RAILS_URL:', RAILS_URL);
console.log('  API_BASE_URL:', API_BASE_URL);
console.log('  Rails Backend');
console.log('  USE_MOCK_DATA:', USE_MOCK_DATA);

// Mock data for testing without backend
const mockProducts = [
  { id: 1, name: 'Fresh Tomatoes', description: 'Ripe red tomatoes', price: 2.99, stock: 15, image: '🍅' },
  { id: 2, name: 'Organic Carrots', description: 'Fresh orange carrots', price: 1.49, stock: 20, image: '🥕' },
  { id: 3, name: 'Crispy Lettuce', description: 'Fresh green lettuce', price: 1.99, stock: 10, image: '🥬' },
  { id: 4, name: 'Sweet Apples', description: 'Red delicious apples', price: 3.99, stock: 25, image: '🍎' },
  { id: 5, name: 'Yellow Bananas', description: 'Fresh ripe bananas', price: 0.99, stock: 30, image: '🍌' },
  { id: 6, name: 'Orange Oranges', description: 'Sweet juicy oranges', price: 4.99, stock: 18, image: '🍊' },
  { id: 7, name: 'Purple Grapes', description: 'Fresh purple grapes', price: 5.99, stock: 12, image: '🍇' },
  { id: 8, name: 'Green Peppers', description: 'Fresh bell peppers', price: 2.49, stock: 8, image: '🫑' },
];

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ENDPOINTS ====================
export const authAPI = {
  signup: (email, password) =>
    api.post('/auth/signup', { email, password }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  checkEmail: (email) =>
    api.post('/auth/check-email', { email }),

  getCurrentUser: () => api.get('/auth/me'),
};

// Helper function to normalize product data from backend
const normalizeProduct = (product) => {
  if (!product) return null;
  try {
    const normalized = {
      id: product.id,
      name: product.name || 'Unknown Product',
      description: product.description || '',
      price: typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0),
      stock: product.stock !== undefined ? product.stock : 0,
      stock_label: product.stock_label || '',
      picture: ensureAbsoluteUrl(product.image_url) || '🥬',
      category: typeof product.category === 'object' ? product.category?.name : (product.category || ''),
      brand: typeof product.brand === 'object' ? product.brand?.name : (product.brand || 'Unknown'),
      brand_image: typeof product.brand === 'object' ? ensureAbsoluteUrl(product.brand?.image_url) : null,
      barcode: product.barcode || '',
      image_url: ensureAbsoluteUrl(product.image_url) || '',
      nutrition: product.nutrition || {},
    };
    return normalized;
  } catch (error) {
    console.error('Error normalizing product:', error, product);
    return {
      id: product?.id || Math.random(),
      name: 'Error Loading Product',
      description: '',
      price: 0,
      stock: 0,
      picture: '❌',
      category: '',
    };
  }
};

// ==================== PRODUCTS ENDPOINTS ====================
export const productsAPI = {
  getAll: (filters = {}) => {
    if (USE_MOCK_DATA) {
      return Promise.resolve({ data: mockProducts });
    }
    return api.get('/products', { params: filters })
      .then(response => {
        // Handle both flattened array and paginated object { data: [], count: 100 }
        let rawProducts = [];
        let count = 0;

        if (Array.isArray(response.data)) {
          rawProducts = response.data;
          count = rawProducts.length;
        } else if (response.data && Array.isArray(response.data.data)) {
          rawProducts = response.data.data;
          count = response.data.count;
        }

        return {
          data: rawProducts.map(normalizeProduct).filter(p => p !== null),
          count: count
        };
      })
      .catch(error => {
        console.error('Error fetching products:', error);
        throw error;
      });
  },

  getById: (id) => {
    if (USE_MOCK_DATA) {
      const product = mockProducts.find(p => p.id === parseInt(id));
      return product ? Promise.resolve({ data: product }) : Promise.reject(new Error('Product not found'));
    }
    return api.get(`/products/${id}`)
      .then(response => ({
        data: normalizeProduct(response.data),
      }))
      .catch(error => {
        console.error(`Error fetching product ${id}:`, error);
        throw error;
      });
  },

  create: (data) =>
    api.post('/products', { product: data }).then(response => ({
      data: normalizeProduct(response.data),
    })),

  update: (id, data) =>
    api.put(`/products/${id}`, { product: data }),

  delete: (id) =>
    api.delete(`/products/${id}`),

  lookupByBarcode: (barcode) =>
    api.get(`/products/lookup/${barcode}`),
};

// ==================== CATEGORIES ENDPOINTS ====================
export const categoriesAPI = {
  getAll: () => api.get('/categories').then(res => ({
    ...res,
    data: res.data.map(cat => ({ ...cat, image_url: ensureAbsoluteUrl(cat.image_url) }))
  })),
  getById: (id) => api.get(`/categories/${id}`).then(res => ({
    ...res,
    data: { ...res.data, image_url: ensureAbsoluteUrl(res.data.image_url) }
  })),
};

// ==================== BRANDS ENDPOINTS ====================
export const brandsAPI = {
  getAll: () => api.get('/brands').then(res => ({
    ...res,
    data: res.data.map(brand => ({ ...brand, image_url: ensureAbsoluteUrl(brand.image_url) }))
  })),
  getById: (id) => api.get(`/brands/${id}`).then(res => ({
    ...res,
    data: { ...res.data, image_url: ensureAbsoluteUrl(res.data.image_url) }
  })),
};

// ==================== ORDERS ENDPOINTS ====================
export const ordersAPI = {
  create: (data) =>
    api.post('/orders', data),

  getAll: (filters = {}) =>
    api.get('/orders', { params: filters }),

  getById: (id) =>
    api.get(`/orders/${id}`),

  updateStatus: (id, status) =>
    api.patch(`/orders/${id}/update_status`, { status }),
};

// ==================== ADMIN ENDPOINTS ====================
export const adminAPI = {
  getDashboardSummary: () =>
    api.get('/admin/dashboard/summary'),

  getDashboardOrders: () =>
    api.get('/admin/dashboard/orders'),
};

// ==================== INVOICES ENDPOINTS ====================
export const invoicesAPI = {
  getAll: (filters = {}) =>
    api.get('/invoices', { params: filters }),

  getById: (id) =>
    api.get(`/invoices/${id}`),

  getByUserId: (userId) =>
    api.get(`/invoices/user/${userId}`),

  create: (data) =>
    api.post('/invoices', data),

  update: (id, data) =>
    api.put(`/invoices/${id}`, data),

  updateStatus: (id, status) =>
    api.put(`/invoices/${id}/status`, { status }),

  delete: (id) =>
    api.delete(`/invoices/${id}`),

  guestCheckout: (data) =>
    api.post('/invoices/checkout/guest', data),
};

// ==================== PAYMENT ENDPOINTS ====================
export const paymentAPI = {
  createPayment: (data) =>
    api.post('/payment/create', data),

  executePayment: (paymentId, payerId) =>
    api.post('/payment/execute', { paymentId, payerId }),

  cancelPayment: () =>
    api.post('/payment/cancel'),
};

// ==================== REPORTS ENDPOINTS ====================
export const reportsAPI = {
  getAll: (params = {}) =>
    api.get('/reports', { params }),

  getSales: (params = {}) =>
    api.get('/reports/sales', { params }),

  getAverageTransaction: (params = {}) =>
    api.get('/reports/average-transaction', { params }),

  getTopProducts: (params = {}) =>
    api.get('/reports/top-products', { params }),

  getActiveCustomers: (params = {}) =>
    api.get('/reports/active-customers', { params }),

  getLowStock: (params = {}) =>
    api.get('/reports/low-stock', { params }),

  getRevenueByCategory: (params = {}) =>
    api.get('/reports/revenue-by-category', { params }),
};

// ==================== USERS ENDPOINTS ====================
export const usersAPI = {
  getAll: (filters = {}) =>
    api.get('/users', { params: filters }),

  getProfile: () =>
    api.get('/users/profile'),

  updateProfile: (data) =>
    api.put('/users/profile', data),

  deleteProfile: () =>
    api.delete('/users/profile'),

  updateUser: (id, data) =>
    api.put(`/users/${id}`, data),

  deleteUser: (id) =>
    api.delete(`/users/${id}`),
};

export default api;
