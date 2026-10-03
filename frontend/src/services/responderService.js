import { api } from './api';

export const listResponders = () => api.get('/responders');
export const listVolunteers = () => api.get('/responders/volunteers');
export const recommendResponders = (lat, lng, emergency_type) => api.get('/responders/recommend', { lat, lng, emergency_type });
export const updateMyResponderProfile = (payload) => api.patch('/responders/me', payload);
export const updateMyVolunteerProfile = (payload) => api.patch('/responders/volunteers/me', payload);
