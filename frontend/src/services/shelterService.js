import { api } from './api';

export const listShelters = (lat, lng) => api.get('/shelters', { lat, lng });
export const recommendShelters = (lat, lng, needsMedical) => api.get('/shelters/recommend', { lat, lng, needs_medical: needsMedical ? 'true' : undefined });
export const getShelter = (id) => api.get(`/shelters/${id}`);
export const createShelter = (payload) => api.post('/shelters', payload);
export const updateOccupancy = (id, occupied) => api.patch(`/shelters/${id}/occupancy`, { occupied });
