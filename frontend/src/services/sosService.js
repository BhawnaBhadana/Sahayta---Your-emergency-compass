import { api } from './api';

export const createSos = (payload) => api.post('/sos', payload);
export const listSos = (status) => api.get('/sos', { status });
export const getSos = (id) => api.get(`/sos/${id}`);
export const assignResponder = (id, responder_id) => api.patch(`/sos/${id}/assign`, { responder_id });
export const updateSosStatus = (id, status, note) => api.patch(`/sos/${id}/status`, { status, note });
export const confirmTriage = (id, priority) => api.patch(`/sos/${id}/triage/confirm`, { priority });
