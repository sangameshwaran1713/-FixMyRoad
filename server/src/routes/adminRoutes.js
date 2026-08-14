import express from 'express';
import { getGlobalStats, getGlobalComplaints } from '../controllers/adminController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// GET /api/admin/dashboard/stats - Super Admin global metrics across all municipalities
router.get(
  '/dashboard/stats',
  authenticate,
  authorizeRoles('SUPER_ADMIN'),
  getGlobalStats
);

// GET /api/admin/complaints - Super Admin multi-tenant global complaint overview
router.get(
  '/complaints',
  authenticate,
  authorizeRoles('SUPER_ADMIN'),
  getGlobalComplaints
);

export default router;
