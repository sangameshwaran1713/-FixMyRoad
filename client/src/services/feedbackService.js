import api from './api';

export const submitFeedbackApi = async (complaintId, payload) => {
  return await api.post(`/complaints/${complaintId}/feedback`, payload);
};

export const getFeedbackApi = async (complaintId) => {
  return await api.get(`/complaints/${complaintId}/feedback`);
};
