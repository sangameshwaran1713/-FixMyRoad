import { getCitizenNotifications, markNotificationAsRead } from '../services/notificationService.js';

/**
 * @desc    Get authenticated citizen's notifications
 * @route   GET /api/notifications/my
 * @access  Private (Authenticated users)
 */
export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await getCitizenNotifications(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        notifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private (Notification owner only)
 */
export const markRead = async (req, res, next) => {
  try {
    const notification = await markNotificationAsRead(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notification,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};
