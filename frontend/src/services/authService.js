import { api, setSession, clearSession } from './api';

export async function login(email, password) {
  const data = await api.post('/auth/login', { email, password });
  setSession(data.token, data.user);
  return data.user;
}

export async function register(payload) {
  const data = await api.post('/auth/register', payload);
  setSession(data.token, data.user);
  return data.user;
}

export async function fetchMe() {
  const data = await api.get('/auth/me');
  return data.user;
}

export function logout() {
  clearSession();
}
