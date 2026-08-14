import express from 'express';
import { submitFeedback, getFeedback } from '../controllers/complaintFeedbackController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { feedbackRateLimiter } from '../middleware/feedbackRateLimiter.js';

const router = express.Router();

// POST /api/complaints/:complaintId/feedback - Submit 5-star rating feedback (RESOLVED -> CLOSED)
router.post(
  '/:complaintId/feedback',
  authenticate,
  authorizeRoles('CITIZEN'),
  feedbackRateLimiter,
  submitFeedback
);

// GET /api/complaints/:complaintId/feedback - Retrieve complaint feedback list
router.get(
  '/:complaintId/feedback',
  authenticate,
  getFeedback
);

export default router;
