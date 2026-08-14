import Notification from '../models/Notification.js';

export const createInAppNotification = async ({
  userId,
  type = 'COMPLAINT_CREATED',
  title,
  message,
  relatedComplaintId = null,
  session = null,
}) => {
  const notificationData = {
    userId,
    type,
    title,
    message,
    relatedComplaintId,
    read: false,
  };

  if (session) {
    const [created] = await Notification.create([notificationData], { session });
    return created;
  }

  return await Notification.create(notificationData);
};

export const getCitizenNotifications = async (userId) => {
  return await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
};

export const markNotificationAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({ _id: notificationId, userId });
  if (!notification) {
    const error = new Error('Notification not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  notification.read = true;
  await notification.save();
  return notification;
};
