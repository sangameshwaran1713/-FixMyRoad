import express from 'express';
import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getComplaintHistory,
} from '../controllers/complaintController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { complaintRateLimiter } from '../middleware/complaintRateLimiter.js';

const router = express.Router();

// POST /api/complaints - Create new complaint (CITIZEN only)
router.post(
  '/',
  authenticate,
  authorizeRoles('CITIZEN'),
  complaintRateLimiter,
  createComplaint
);

// GET /api/complaints/my - Get citizen's own complaints (CITIZEN only)
router.get('/my', authenticate, authorizeRoles('CITIZEN'), getMyComplaints);

// GET /api/complaints/:complaintId - Get single complaint details (RBAC check)
router.get('/:complaintId', authenticate, getComplaintById);

// GET /api/complaints/:complaintId/history - Get status history timeline (RBAC check)
router.get('/:complaintId/history', authenticate, getComplaintHistory);

export default router;
