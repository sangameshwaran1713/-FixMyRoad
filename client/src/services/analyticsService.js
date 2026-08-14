import api from './api';

export const getMunicipalityAnalyticsApi = async (params = {}) => {
  return await api.get('/municipality/analytics', { params });
};

export const getGlobalAnalyticsApi = async (params = {}) => {
  return await api.get('/admin/analytics', { params });
};

export const downloadMunicipalityCSV = async (params = {}) => {
  const response = await api.get('/municipality/reports/export', {
    params: { ...params, format: 'csv' },
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `FixMyRoad_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const downloadMunicipalityJSON = async (params = {}) => {
  const response = await api.get('/municipality/reports/export', {
    params: { ...params, format: 'json' },
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `FixMyRoad_Report_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const downloadGlobalCSV = async (params = {}) => {
  const response = await api.get('/admin/reports/export', {
    params: { ...params, format: 'csv' },
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `FixMyRoad_Global_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const downloadGlobalJSON = async (params = {}) => {
  const response = await api.get('/admin/reports/export', {
    params: { ...params, format: 'json' },
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `FixMyRoad_Global_Report_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
