import { api } from './api';

export const listUsers = (role) => api.get('/users', { role });
export const updateUserRole = (id, role) => api.patch(`/users/${id}/role`, { role });
export const setUserActive = (id, is_active) => api.patch(`/users/${id}/active`, { is_active });
export const verifyOrganization = (id) => api.patch(`/users/${id}/verify-org`);
