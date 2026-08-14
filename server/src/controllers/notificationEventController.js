import NotificationEvent from '../models/NotificationEvent.js';
import NotificationDelivery from '../models/NotificationDelivery.js';
import { updateAggregateEventStatus } from '../services/notification/notificationService.js';
import { processPendingNotificationsBatch } from '../services/notification/notificationProcessor.js';

/**
 * @desc    Get notification event details and channel delivery breakdown
 * @route   GET /api/notification-events/:eventId
 * @access  Private (SUPER_ADMIN or assigned MUNICIPALITY_ADMIN)
 */
export const getNotificationEventById = async (req, res, next) => {
  try {
    const event = await NotificationEvent.findOne({ eventId: req.params.eventId })
      .populate('complaintId', 'complaintId issueType severity status')
      .populate('municipalityId', 'name code district')
      .exec();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Notification event not found',
      });
    }

    // RBAC Check: Municipality Admin can only view events for their municipality
    if (req.user.role === 'MUNICIPALITY_ADMIN') {
      const adminMunId = req.user.municipalityId ? req.user.municipalityId.toString() : null;
      const eventMunId = event.municipalityId ? event.municipalityId._id.toString() : null;

      if (!adminMunId || adminMunId !== eventMunId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only inspect notification events for your municipality',
        });
      }
    }

    const deliveries = await NotificationDelivery.find({ notificationEventId: event._id });

    res.status(200).json({
      success: true,
      data: {
        event,
        deliveries,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manually retry FAILED notification deliveries for an event
 * @route   POST /api/notification-events/:eventId/retry
 * @access  Private (SUPER_ADMIN or assigned MUNICIPALITY_ADMIN)
 */
export const retryNotificationEvent = async (req, res, next) => {
  try {
    const event = await NotificationEvent.findOne({ eventId: req.params.eventId });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Notification event not found',
      });
    }

    // RBAC Check
    if (req.user.role === 'MUNICIPALITY_ADMIN') {
      const adminMunId = req.user.municipalityId ? req.user.municipalityId.toString() : null;
      const eventMunId = event.municipalityId ? event.municipalityId.toString() : null;

      if (!adminMunId || adminMunId !== eventMunId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only retry notification events for your municipality',
        });
      }
    }

    // Reset failed deliveries to RETRYING
    const result = await NotificationDelivery.updateMany(
      {
        notificationEventId: event._id,
        status: 'FAILED',
      },
      {
        $set: {
          status: 'RETRYING',
          attempts: 0,
          nextAttemptAt: new Date(),
          errorMessage: null,
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No failed deliveries eligible for retry in this notification event',
      });
    }

    await updateAggregateEventStatus(event._id);

    // Trigger immediate processor run
    processPendingNotificationsBatch();

    const updatedDeliveries = await NotificationDelivery.find({ notificationEventId: event._id });

    res.status(200).json({
      success: true,
      message: `Successfully reset ${result.modifiedCount} failed delivery attempts for retry.`,
      data: {
        eventId: event.eventId,
        deliveries: updatedDeliveries,
      },
    });
  } catch (error) {
    next(error);
  }
};
