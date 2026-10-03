import { api } from './api';

export const listTasks = (params) => api.get('/tasks', params);
export const createTask = (payload) => api.post('/tasks', payload);
export const acceptTask = (id) => api.patch(`/tasks/${id}/accept`);
export const updateTaskStatus = (id, status) => api.patch(`/tasks/${id}/status`, { status });
