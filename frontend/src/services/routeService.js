import { api } from './api';

export const computeSafeRoute = (start_lat, start_lng, end_lat, end_lng) =>
  api.get('/routes/safe-route', { start_lat, start_lng, end_lat, end_lng });

export const listBlockedRoads = () => api.get('/routes/blocked-roads');
export const reportBlockedRoad = (payload) => api.post('/routes/blocked-roads', payload);
