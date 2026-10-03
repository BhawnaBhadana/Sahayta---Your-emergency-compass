import { api } from './api';

export const listHospitals = (lat, lng) => api.get('/hospitals', { lat, lng });
export const getHospital = (id) => api.get(`/hospitals/${id}`);
export const createHospital = (payload) => api.post('/hospitals', payload);
export const updateCapacity = (id, payload) => api.patch(`/hospitals/${id}/capacity`, payload);
