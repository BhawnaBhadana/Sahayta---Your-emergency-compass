import { api } from './api';

export const listTeams = (status) => api.get('/teams', { status });
export const recommendTeams = (lat, lng, emergency_type) => api.get('/teams/recommend', { lat, lng, emergency_type });
export const createTeam = (payload) => api.post('/teams', payload);
export const updateTeam = (id, payload) => api.patch(`/teams/${id}`, payload);
export const assignTeam = (id, payload) => api.post(`/teams/${id}/assign`, payload);
export const updateAssignment = (assignmentId, status) => api.patch(`/teams/assignments/${assignmentId}`, { status });
export const listAssignments = (params) => api.get('/teams/assignments', params);
