import { api } from './api';

export const listAlerts = () => api.get('/alerts');
export const createAlert = (payload) => api.post('/alerts', payload);
export const expireAlert = (id) => api.patch(`/alerts/${id}/expire`);
export const acknowledgeAlert = (id) => api.patch(`/alerts/${id}/acknowledge`);
export const escalateAlert = (id) => api.patch(`/alerts/${id}/escalate`);
export const resolveAlert = (id) => api.patch(`/alerts/${id}/resolve`);
