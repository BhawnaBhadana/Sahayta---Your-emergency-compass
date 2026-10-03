import { api } from './api';

export const listResources = (category) => api.get('/resources', { category });
export const createResource = (payload) => api.post('/resources', payload);
export const updateResource = (id, payload) => api.patch(`/resources/${id}`, payload);
export const findMatches = (category, quantity, lat, lng) => api.get('/resources/match', { category, quantity, lat, lng });

export const listResourceRequests = () => api.get('/resource-requests');
export const createResourceRequest = (payload) => api.post('/resource-requests', payload);
export const updateResourceRequest = (id, status) => api.patch(`/resource-requests/${id}`, { status });
