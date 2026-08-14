import api from './api';

export const getOperationalMetricsApi = async () => {
  return await api.get('/admin/operations/metrics');
};
