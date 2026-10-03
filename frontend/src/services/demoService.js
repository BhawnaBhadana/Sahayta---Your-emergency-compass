import { api } from './api';

export const launchScenario = () => api.post('/demo/launch-scenario');
