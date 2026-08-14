import express from 'express';
import {
  getNotificationEventById,
  retryNotificationEvent,
} from '../controllers/notificationEventController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// GET /api/notification-events/:eventId - Inspect outbox event delivery status
router.get(
  '/:eventId',
  authenticate,
  authorizeRoles('SUPER_ADMIN', 'MUNICIPALITY_ADMIN'),
  getNotificationEventById
);

// POST /api/notification-events/:eventId/retry - Manually retry failed outbox deliveries
router.post(
  '/:eventId/retry',
  authenticate,
  authorizeRoles('SUPER_ADMIN', 'MUNICIPALITY_ADMIN'),
  retryNotificationEvent
);

export default router;
