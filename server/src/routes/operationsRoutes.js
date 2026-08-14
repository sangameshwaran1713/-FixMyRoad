import express from 'express';
import { getOperationsMetrics } from '../controllers/operationsController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { healthRateLimiter } from '../middleware/healthRateLimiter.js';

const router = express.Router();

// GET /api/admin/operations/metrics - Super Admin operational metrics & health
router.get(
  '/admin/operations/metrics',
  authenticate,
  authorizeRoles('SUPER_ADMIN'),
  healthRateLimiter,
  getOperationsMetrics
);

export default router;
