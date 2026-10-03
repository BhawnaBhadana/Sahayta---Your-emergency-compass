import { api } from './api';

export const getMyFamily = () => api.get('/family');
export const addFamilyMember = (payload) => api.post('/family/members', payload);
export const updateMemberStatus = (memberId, status) => api.patch(`/family/members/${memberId}/status`, { status });
export const removeMember = (memberId) => api.delete(`/family/members/${memberId}`);
