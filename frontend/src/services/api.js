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
  getAll: () => api.get('/admin'), // lay banner cho trang chu
  adminAll: () => api.get('/admin/banners'), // lay banner cho admin
  create: body => api.post('/admin/banners', body), // them banner
  update: (id, body) => api.put(`/admin/banners/${id}`, body), // cap nhat banner
  delete: id => api.delete(`/admin/banners/${id}`),// xoa banner
  toggle: id => api.patch(`/admin/banners/${id}/toggle`),// thay doi trang thai banner
};

export const cartAPI = {
  get: () => api.get('/cart'),
  add: body => api.post('/cart', body),
  update: (productId, quantity) => api.put(`/cart/${productId}`, { quantity }),
  remove: productId => api.delete(`/cart/${productId}`),
  clear: () => api.delete('/cart'),
};

export const orderAPI = {
  create: body => api.post('/orders', body), // tao don hang
  createPreorder: body => api.post('/orders/preorder', body), // tao don hang dat truoc
  getAll: () => api.get('/orders'), // lay tat ca don hang cua nguoi dung
  getById: id => api.get(`/orders/${id}`), // lay chi tiet don hang cua nguoi dung
  cancel: (id, body) => api.patch(`/orders/${id}/cancel`, body),// huy don hang cua nguoi dung

  adminGetById: id => api.get(`/orders/admin/${id}`), // lay chi tiet don hang cua admin
  adminUpdateStatus: (id, body) => api.patch(`/orders/admin/${id}/status`, body), // cap nhat trang thai don hang cua admin
  adminPreorderSummary: () => api.get('/orders/admin/preorder-summary'), // lay danh sach don hang dat truoc cua admin
  adminPreorderSummaryDetail: (ngay, masp) => api.get(`/orders/admin/preorder-summary/detail?ngay=${ngay}&masp=${masp}`), // lay chi tiet don hang dat truoc cua admin
};

export const subscriptionAPI = {
  create: body => api.post('/subscriptions', body), // tao don hang subscription
  getAll: () => api.get('/subscriptions'), // lay tat ca don hang subscription cua nguoi dung
  cancel: id => api.patch(`/subscriptions/${id}/cancel`), // huy don hang subscription cua nguoi dung
  adminAll: () => api.get('/admin/subscriptions'), // lay tat ca don hang subscription cua admin
  adminDeliver: id => api.patch(`/admin/subscriptions/${id}/deliver`), // cap nhat trang thai don hang subscription cua admin
  adminSummary: () => api.get('/admin/subscriptions/summary'), // lay danh sach don hang subscription cua admin
  adminSummaryDetail: (ngay, masp) => api.get(`/admin/subscriptions/summary/detail?ngay=${ngay}&masp=${masp}`), // lay chi tiet don hang subscription cua admin
};


export const dashboardAPI = {
  admin: () => api.get('/admin/dashboard'), // lay thong tin dashboard cua admin
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'), // lay tat ca thong bao cua nguoi dung
  markRead: id => api.patch(`/notifications/${id}/read`), // danh dau thong bao da doc
  markAllRead: () => api.patch('/notifications/read-all'), // danh dau tat ca thong bao da doc

  getGlobal: () => api.get('/notifications/global'), // lay tat ca thong bao toan he thong cua nguoi dung

  adminGetAllGlobal: () => api.get('/admin/notifications/global'), // lay tat ca thong bao toan he thong cua admin
  adminCreate: body => api.post('/admin/notifications/global', body), // tao thong bao toan he thong cua admin
  adminUpdate: (id, body) => api.put(`/admin/notifications/global/${id}`, body), // cap nhat thong bao toan he thong cua admin
  adminToggle: id => api.patch(`/admin/notifications/global/${id}/toggle`), // bat/tat trang thai thong bao toan he thong cua admin
  adminDelete: id => api.delete(`/admin/notifications/global/${id}`), // xoa thong bao toan he thong cua admin

  adminGetOrderHistory: (q = '', page = 1) => api.get(`/admin/notifications/orders?q=${encodeURIComponent(q)}&page=${page}`),
};

export const chatAPI = {
  getMessages: () => api.get('/chat'), // lay danh sach tin nhan cua nguoi dung
  sendMessage: (body) => api.post('/chat', body), // gui tin nhan cua nguoi dung

  getSessions: () => api.get('/chat/admin'),  // lay danh sach phien chat cua admin
  getSessionMessages: (id) => api.get(`/chat/admin/${id}`), // lay danh sach tin nhan cua phien chat cua admin
  adminSendMessage: (id, body) => api.post(`/chat/admin/${id}`, body), // gui tin nhan cua admin
  closeSession: (id) => api.patch(`/chat/admin/${id}/close`), // dong phien chat cua admin
};

export const seasonAPI = {
  getAll: () => api.get('/admin/seasons'), // lay tat ca mua cua admin
  create: body => api.post('/admin/seasons', body), // tao mua moi
  update: (id, body) => api.put(`/admin/seasons/${id}`, body), // cap nhat mua
  toggle: id => api.patch(`/admin/seasons/${id}/toggle`), // bat/tat trang thai mua
  remove: id => api.delete(`/admin/seasons/${id}`), // xoa mua
  getProducts: id => api.get(`/admin/seasons/${id}/products`), // lay danh sach san pham cua mua
  addProduct: (id, body) => api.post(`/admin/seasons/${id}/products`, body), // them san pham vao mua
  removeProduct: (id, masp) => api.delete(`/admin/seasons/${id}/products/${masp}`), // xoa san pham khoi mua
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
  getActive: () => api.get('/promotions'), // lay cac khuyen mai dang hoat dong
  adminAll: () => api.get('/admin/promotions'), // lay tat ca khuyen mai cua admin
  create: body => api.post('/admin/promotions', body), // tao khuyen mai moi
  update: (id, body) => api.put(`/admin/promotions/${id}`, body), // cap nhat khuyen mai
  toggleStatus: id => api.patch(`/admin/promotions/${id}/status`), // bat/tat trang thai khuyen mai
  remove: id => api.delete(`/admin/promotions/${id}`), // xoa khuyen mai
};

