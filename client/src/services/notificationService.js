import api from './api';

export const getMyNotificationsApi = async () => {
  return await api.get('/notifications/my');
};

export const markNotificationReadApi = async (notificationId) => {
  return await api.patch(`/notifications/${notificationId}/read`);
};
