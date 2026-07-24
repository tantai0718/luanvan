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
  create: body => api.post('/products', body),
  update: (id, body) => api.put(`/products/${id}`, body),
  delete: id => api.delete(`/admin/products/${id}`),
  toggle: id => api.patch(`/products/${id}/toggle`),
};

export const reviewAPI = {
  getByProduct: id => api.get(`/reviews/product/${id}`),
  create: body => api.post('/reviews', body),
  adminAll: (query = '') => api.get(`/reviews/admin${query}`),
  reply: (id, body) => api.patch(`/reviews/admin/${id}/reply`, body),
  deleteReply: id => api.delete(`/reviews/admin/${id}/reply`),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
};

export const bannerAPI = {
  getAll: () => api.get('/admin'),
  adminAll: () => api.get('/admin/banners'),
  create: body => api.post('/admin/banners', body),
  update: (id, body) => api.put(`/admin/banners/${id}`, body),
  delete: id => api.delete(`/admin/banners/${id}`),
  toggle: id => api.patch(`/admin/banners/${id}/toggle`),
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
  createPreorder: body => api.post('/orders/preorder', body),
  getAll: () => api.get('/orders'),
  getById: id => api.get(`/orders/${id}`),
  cancel: (id, body) => api.patch(`/orders/${id}/cancel`, body),

  adminGetById: id => api.get(`/orders/admin/${id}`),
  adminUpdateStatus: (id, body) => api.patch(`/orders/admin/${id}/status`, body),

  adminPreorderSummary: () => api.get('/orders/admin/preorder-summary'),
  adminPreorderSummaryDetail: (ngay, masp) =>
    api.get(`/orders/admin/preorder-summary/detail?ngay=${ngay}&masp=${masp}`),
};

export const subscriptionAPI = {
  create: body => api.post('/subscriptions', body),
  getAll: () => api.get('/subscriptions'),
  cancel: id => api.patch(`/subscriptions/${id}/cancel`),
  adminAll: () => api.get('/admin/subscriptions'),
  adminDeliver: id => api.patch(`/admin/subscriptions/${id}/deliver`),

  adminSummary: () => api.get('/admin/subscriptions/summary'),
  adminSummaryDetail: (ngay, masp) =>
    api.get(`/admin/subscriptions/summary/detail?ngay=${ngay}&masp=${masp}`),
};


export const dashboardAPI = {
  admin: () => api.get('/admin/dashboard'),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: id => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),

  getGlobal: () => api.get('/notifications/global'),

  adminGetAllGlobal: () => api.get('/admin/notifications/global'),
  adminCreate: body => api.post('/admin/notifications/global', body),
  adminUpdate: (id, body) => api.put(`/admin/notifications/global/${id}`, body),
  adminToggle: id => api.patch(`/admin/notifications/global/${id}/toggle`),
  adminDelete: id => api.delete(`/admin/notifications/global/${id}`),

  adminGetOrderHistory: (q = '', page = 1) =>
    api.get(`/admin/notifications/orders?q=${encodeURIComponent(q)}&page=${page}`),
};

export const chatAPI = {
  getMessages: () => api.get('/chat'),
  sendMessage: (body) => api.post('/chat', body),

  getSessions: () => api.get('/chat/admin'),
  getSessionMessages: (id) => api.get(`/chat/admin/${id}`),
  adminSendMessage: (id, body) => api.post(`/chat/admin/${id}`, body),
  closeSession: (id) => api.patch(`/chat/admin/${id}/close`),
};

export const seasonAPI = {
  getAll: () => api.get('/admin/seasons'),
  create: body => api.post('/admin/seasons', body),
  update: (id, body) => api.put(`/admin/seasons/${id}`, body),
  toggle: id => api.patch(`/admin/seasons/${id}/toggle`),
  remove: id => api.delete(`/admin/seasons/${id}`),
  getProducts: id => api.get(`/admin/seasons/${id}/products`),
  addProduct: (id, body) => api.post(`/admin/seasons/${id}/products`, body),
  removeProduct: (id, masp) => api.delete(`/admin/seasons/${id}/products/${masp}`),
};

export const baiVietAPI = {
  getAll: (query = '') => api.get(`/articles${query}`),
  getById: id => api.get(`/articles/${id}`),
  adminAll: (query = '') => api.get(`/articles/admin/all${query}`),
  create: body => api.post('/articles/admin', body),
  update: (id, body) => api.put(`/articles/admin/${id}`, body),
  remove: id => api.delete(`/articles/admin/${id}`),
  uploadImage: body => api.post('/articles/admin/upload', body),
};

export const blogAPI = {
  getAll: (params = '') => api.get(`/blog?${params}`),
  getById: id => api.get(`/blog/${id}`),
  getCategories: () => api.get('/blog/categories'),
  create: body => api.post('/blog', body),
  update: (id, body) => api.put(`/blog/${id}`, body),
  remove: id => api.delete(`/blog/${id}`),
};

export const promotionAPI = {
  getActive: () => api.get('/promotions'),
  adminAll: () => api.get('/admin/promotions'),
  create: body => api.post('/admin/promotions', body),
  update: (id, body) => api.put(`/admin/promotions/${id}`, body),
  toggleStatus: id => api.patch(`/admin/promotions/${id}/status`),
  remove: id => api.delete(`/admin/promotions/${id}`),
};

