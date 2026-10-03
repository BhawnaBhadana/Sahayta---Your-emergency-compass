import { api } from './api';

export const listMissingPersons = (status) => api.get('/missing-persons', { status });
export const reportMissingPerson = (payload) => api.post('/missing-persons', payload);
export const updateMissingPersonStatus = (id, status) => api.patch(`/missing-persons/${id}/status`, { status });
