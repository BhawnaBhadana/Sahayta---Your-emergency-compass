import { api } from './api';

export const getCommandCenterMetrics = () => api.get('/analytics/command-center');
export const getResponseTimes = () => api.get('/analytics/response-times');
export const getIncidentBreakdown = () => api.get('/analytics/incident-breakdown');
export const getAuditLogs = (limit) => api.get('/analytics/audit-logs', { limit });
export const getIncidentsOverTime = (days) => api.get('/analytics/incidents-over-time', { days });
export const getRates = () => api.get('/analytics/rates');
export const getTeamUtilization = () => api.get('/analytics/team-utilization');
export const getHotspots = (hours, threshold) => api.get('/analytics/hotspots', { hours, threshold });
