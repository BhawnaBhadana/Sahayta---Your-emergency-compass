import { api } from './api';

export const listNotifications = (unreadOnly) => api.get('/notifications', { unread: unreadOnly ? 'true' : undefined });
export const markRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllRead = () => api.patch('/notifications/read-all');
