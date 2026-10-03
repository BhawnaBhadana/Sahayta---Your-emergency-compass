import { api } from './api';

export const createIncident = (payload) => api.post('/reports', payload);
export const listIncidents = (status) => api.get('/reports', { status });
export const getIncident = (id) => api.get(`/reports/${id}`);
export const reviewIncident = (id, action, rejection_reason) => api.patch(`/reports/${id}/review`, { action, rejection_reason });
