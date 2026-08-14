import express from 'express';
import { getSystemHealthHandler } from '../controllers/systemHealthController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { healthRateLimiter } from '../middleware/healthRateLimiter.js';

const router = express.Router();

// GET /api/admin/health/system - Super Admin real-time system health inspection
router.get(
  '/admin/health/system',
  authenticate,
  authorizeRoles('SUPER_ADMIN'),
  healthRateLimiter,
  getSystemHealthHandler
);

export default router;
