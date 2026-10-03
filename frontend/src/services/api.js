const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'sahayta_token';
const USER_KEY = 'sahayta_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiClientError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, params, isForm = false } = {}) {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const usp = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const qs = usp.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError('Unable to reach Sahayta servers. Check your connection and try again.', 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    if (res.status === 401) clearSession();
    throw new ApiClientError(data?.message || `Request failed (${res.status})`, res.status, data?.details);
  }

  return data;
}

export const api = {
  get: (path, params) => request(path, { method: 'GET', params }),
  post: (path, body, opts = {}) => request(path, { method: 'POST', body, ...opts }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export function fileUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL.replace(/\/api$/, '')}${path}`;
}
