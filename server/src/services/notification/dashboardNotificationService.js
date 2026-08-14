import Notification from '../../models/Notification.js';

/**
 * Creates an in-app Dashboard notification for a municipal administrator.
 */
export const sendDashboardNotification = async ({ recipient, payload }) => {
  // recipient is the userId of the MUNICIPALITY_ADMIN
  const notificationData = {
    userId: recipient,
    type: 'NEW_COMPLAINT',
    title: 'New Road Damage Complaint',
    message: `New complaint ${payload.complaintId || ''} (${payload.issueType || 'ROAD DEFECT'}) reported in ${payload.municipalityName || 'your jurisdiction'}.`,
    relatedComplaintId: payload.complaintMongoId || null,
    read: false,
  };

  const created = await Notification.create(notificationData);

  return {
    success: true,
    provider: 'DASHBOARD_IN_APP',
    providerMessageId: created._id.toString(),
    deliveredAt: new Date(),
  };
};
