const BASE = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const request = async (method, path, body) => {
  let response;

  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw { message: 'Không kết nối được tới server. Hãy chắc backend đang chạy ở cổng 5000.' };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw { message: `Lỗi server (${response.status})` };
  }

  if (!response.ok) {
    throw { message: data?.message || `Lỗi ${response.status}` };
  }

  return data;
};

export const api = {
  get: path => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: path => request('DELETE', path),
};

export const authAPI = {
  login: body => api.post('/auth/login', body),
  register: body => api.post('/auth/register', body),
  me: () => api.get('/auth/me'),
  updateProfile: body => api.put('/auth/profile', body),
  changePassword: body => api.put('/auth/change-password', body),
};

export const productAPI = {
  getAll: (query = '') => api.get(`/products${query}`),
  getById: id => api.get(`/products/${id}`),
  getReviews: id => api.get(`/products/${id}/reviews`),
  createReview: body => api.post('/reviews', body),
  create: body => api.post('/products', body),
  update: (id, body) => api.put(`/products/${id}`, body),
  delete: id => api.delete(`/products/${id}`),
  toggle: id => api.patch(`/products/${id}/toggle`),
  myProducts: () => api.get('/farmer/products'),
  lowStock: () => api.get('/farmer/products/low-stock'),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
};

export const cartAPI = {
  get: () => api.get('/cart'),
  add: body => api.post('/cart', body),
  update: (productId, quantity) => api.put(`/cart/${productId}`, { quantity }),
  remove: productId => api.delete(`/cart/${productId}`),
  clear: () => api.delete('/cart'),
};

export const orderAPI = {
  create: body => api.post('/orders', body),
  getAll: () => api.get('/orders'),
  getById: id => api.get(`/orders/${id}`),
  cancel: (id, body) => api.patch(`/orders/${id}/cancel`, body),
  farmerOrders: () => api.get('/farmer/orders'),
  updateStatus: (id, body) => api.patch(`/orders/${id}/status`, body),
};

export const warehouseAPI = {
  getAll: () => api.get('/warehouses'),
  getLocations: warehouseId => api.get(`/warehouses/${warehouseId}/locations`),
  getStock: warehouseId => api.get(`/warehouses/${warehouseId}/stock`),
  updateStockMeta: (warehouseId, productId, body) => api.patch(`/warehouses/${warehouseId}/stock/${productId}`, body),
  getInvoices: () => api.get('/invoices'),
  getInvoiceById: id => api.get(`/invoices/${id}`),
  createInvoice: body => api.post('/invoices', body),
  confirmInvoice: id => api.patch(`/invoices/${id}/confirm`),
  cancelInvoice: id => api.patch(`/invoices/${id}/cancel`),
  getLogs: () => api.get('/inventory-logs'),
  getAlerts: () => api.get('/stock-alerts'),
  resolveAlert: id => api.patch(`/stock-alerts/${id}/resolve`),
};

export const dashboardAPI = {
  admin: () => api.get('/admin/dashboard'),
  farmer: () => api.get('/farmer/dashboard'),
};

export const farmerAPI = {
  getProfile: () => api.get('/farmer/profile'),
  updateProfile: body => api.put('/farmer/profile', body),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
};
