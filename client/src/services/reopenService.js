import api from './api';

export const createReopenRequestApi = async (complaintId, payload) => {
  return await api.post(`/complaints/${complaintId}/reopen`, payload);
};

export const uploadReopenImageApi = async (complaintId, formData) => {
  return await api.post(`/complaints/${complaintId}/reopen-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getMunicipalityReopenRequestsApi = async (params = {}) => {
  return await api.get('/municipality/reopen-requests', { params });
};

export const getReopenRequestDetailsApi = async (id) => {
  return await api.get(`/municipality/reopen-requests/${id}`);
};

export const acceptReopenRequestApi = async (id, payload = {}) => {
  return await api.patch(`/municipality/reopen-requests/${id}/accept`, payload);
};

export const rejectReopenRequestApi = async (id, payload = {}) => {
  return await api.patch(`/municipality/reopen-requests/${id}/reject`, payload);
};
