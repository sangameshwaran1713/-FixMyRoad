import api from './api';

export const getSystemHealthApi = async () => {
  return await api.get('/admin/health/system');
};
