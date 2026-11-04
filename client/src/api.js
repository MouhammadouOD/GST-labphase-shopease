const BASE = '/api';

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  register: (name, email, password) =>
    fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    }).then(handle),

  login: (email, password) =>
    fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(handle),

  me: (token) => fetch(`${BASE}/auth/me`, { headers: authHeaders(token) }).then(handle),

  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE}/products${qs ? `?${qs}` : ''}`).then(handle);
  },

  getCategories: () => fetch(`${BASE}/products/categories`).then(handle),

  getProduct: (id) => fetch(`${BASE}/products/${id}`).then(handle),

  createProduct: (token, product) =>
    fetch(`${BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(product),
    }).then(handle),

  updateProduct: (token, id, product) =>
    fetch(`${BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(product),
    }).then(handle),

  deleteProduct: (token, id) =>
    fetch(`${BASE}/products/${id}`, { method: 'DELETE', headers: authHeaders(token) }).then(handle),

  checkout: (token, items) =>
    fetch(`${BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ items }),
    }).then(handle),

  myOrders: (token) => fetch(`${BASE}/orders`, { headers: authHeaders(token) }).then(handle),

  allOrders: (token) => fetch(`${BASE}/orders/all`, { headers: authHeaders(token) }).then(handle),

  updateOrderStatus: (token, id, status) =>
    fetch(`${BASE}/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ status }),
    }).then(handle),
};
