// REST service layer. Every function maps 1:1 to a backend endpoint (see README → API).
// UI code imports from here and never calls axios directly.
import { api } from './api/client.js';

const data = (p) => p.then((r) => r.data);
const newIdempotencyKey = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const catalogService = {
  listProducts: (params) => data(api.get('/catalog/products', { params })),
  getProduct: (slug) => data(api.get(`/catalog/products/${encodeURIComponent(slug)}`)),
  getProductsByIds: (ids) => (ids.length ? data(api.get('/catalog/products/by-ids', { params: { ids: ids.join(',') } })) : Promise.resolve([])),
  getRelated: (slug) => data(api.get(`/catalog/products/${encodeURIComponent(slug)}/related`)),
  getReviews: (productId) => data(api.get(`/catalog/products/${productId}/reviews`)),
  submitReview: (productId, payload) => data(api.post(`/catalog/products/${productId}/reviews`, payload)),
  getCategories: () => data(api.get('/catalog/categories')),
  getFilters: () => data(api.get('/catalog/filters')),
  getHome: () => data(api.get('/catalog/home')),
  requestRestock: (payload) => data(api.post('/restock-requests', payload)),
  subscribeNewsletter: (email) => data(api.post('/newsletter', { email })),
  getStoreSettings: () => data(api.get('/store/settings')),
};

export const cartService = {
  quote: (payload) => data(api.post('/cart/quote', payload)),
};

export const orderService = {
  /** One idempotency key per checkout attempt prevents duplicate orders on retries/double clicks. */
  newIdempotencyKey,
  placeOrder: (payload, idempotencyKey) => data(api.post('/orders', payload, { headers: { 'Idempotency-Key': idempotencyKey } })),
  track: (reference, phone) => data(api.get('/orders/track', { params: { reference, phone } })),
  myOrders: () => data(api.get('/account/orders')),
  myOrder: (reference) => data(api.get(`/account/orders/${encodeURIComponent(reference)}`)),
  cancelMyOrder: (reference) => data(api.post(`/account/orders/${encodeURIComponent(reference)}/cancel`)),
};

export const authService = {
  login: (payload) => data(api.post('/auth/login', payload)),
  register: (payload) => data(api.post('/auth/register', payload)),
  logout: () => data(api.post('/auth/logout')),
  me: () => data(api.get('/auth/me')),
  forgotPassword: (email) => data(api.post('/auth/forgot-password', { email })),
  resetPassword: (token, password) => data(api.post('/auth/reset-password', { token, password })),
};

export const accountService = {
  updateProfile: (payload) => data(api.put('/account/profile', payload)),
  changePassword: (payload) => data(api.post('/account/password', payload)),
  addAddress: (payload) => data(api.post('/account/addresses', payload)),
  updateAddress: (id, payload) => data(api.put(`/account/addresses/${id}`, payload)),
  deleteAddress: (id) => data(api.delete(`/account/addresses/${id}`)),
};

export const adminService = {
  dashboard: (days) => data(api.get('/admin/dashboard', { params: { days } })),

  products: (params) => data(api.get('/admin/products', { params })),
  product: (id) => data(api.get(`/admin/products/${id}`)),
  createProduct: (payload) => data(api.post('/admin/products', payload)),
  updateProduct: (id, payload) => data(api.put(`/admin/products/${id}`, payload)),
  patchProduct: (id, payload) => data(api.patch(`/admin/products/${id}`, payload)),
  deleteProduct: (id) => data(api.delete(`/admin/products/${id}`)),

  inventory: (params) => data(api.get('/admin/inventory', { params })),
  adjustStock: (payload) => data(api.post('/admin/inventory/adjustments', payload)),
  updateVariantInventory: (variantId, payload) => data(api.patch(`/admin/inventory/${variantId}`, payload)),
  adjustments: (params) => data(api.get('/admin/inventory/adjustments', { params })),

  orders: (params) => data(api.get('/admin/orders', { params })),
  order: (id) => data(api.get(`/admin/orders/${id}`)),
  setOrderStatus: (id, payload) => data(api.post(`/admin/orders/${id}/status`, payload)),
  setPaymentStatus: (id, paymentStatus) => data(api.post(`/admin/orders/${id}/payment`, { paymentStatus })),
  cancelOrder: (id, payload) => data(api.post(`/admin/orders/${id}/cancel`, payload)),
  recordRefund: (id, payload) => data(api.post(`/admin/orders/${id}/refunds`, payload)),
  addOrderNote: (id, text) => data(api.post(`/admin/orders/${id}/notes`, { text })),

  categories: () => data(api.get('/admin/categories')),
  createCategory: (payload) => data(api.post('/admin/categories', payload)),
  updateCategory: (id, payload) => data(api.put(`/admin/categories/${id}`, payload)),
  deleteCategory: (id) => data(api.delete(`/admin/categories/${id}`)),

  coupons: () => data(api.get('/admin/coupons')),
  createCoupon: (payload) => data(api.post('/admin/coupons', payload)),
  updateCoupon: (id, payload) => data(api.put(`/admin/coupons/${id}`, payload)),
  deleteCoupon: (id) => data(api.delete(`/admin/coupons/${id}`)),

  customers: (params) => data(api.get('/admin/customers', { params })),
  customer: (key) => data(api.get(`/admin/customers/${encodeURIComponent(key)}`)),

  content: () => data(api.get('/admin/content')),
  updateContent: (payload) => data(api.put('/admin/content', payload)),

  restockRequests: (params) => data(api.get('/admin/restock-requests', { params })),
  notifyRestock: (ids) => data(api.post('/admin/restock-requests/notify', { ids })),
  deleteRestockRequest: (id) => data(api.delete(`/admin/restock-requests/${id}`)),

  reviews: (params) => data(api.get('/admin/reviews', { params })),
  moderateReview: (id, status) => data(api.patch(`/admin/reviews/${id}`, { status })),
  deleteReview: (id) => data(api.delete(`/admin/reviews/${id}`)),

  settings: () => data(api.get('/admin/settings')),
  updateShipping: (payload) => data(api.put('/admin/settings/shipping', payload)),
  updateStoreSettings: (payload) => data(api.put('/admin/settings/store', payload)),

  resetDemo: () => data(api.post('/demo/reset')),
};
