import express from 'express';
import { getMyNotifications, markRead } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/notifications/my - Get user's own notifications
router.get('/my', authenticate, getMyNotifications);

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', authenticate, markRead);

export default router;
