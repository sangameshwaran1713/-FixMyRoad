import express from 'express';
import {
  getMunicipalityAnalyticsHandler,
  getGlobalAnalyticsHandler,
  exportMunicipalityReportHandler,
  exportGlobalReportHandler,
} from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { analyticsRateLimiter } from '../middleware/analyticsRateLimiter.js';
import { exportRateLimiter } from '../middleware/exportRateLimiter.js';

const router = express.Router();

// GET /api/municipality/analytics - Municipal jurisdiction analytics
router.get(
  '/municipality/analytics',
  authenticate,
  authorizeRoles('MUNICIPALITY_ADMIN', 'MUNICIPALITY_OFFICER', 'SUPER_ADMIN'),
  analyticsRateLimiter,
  getMunicipalityAnalyticsHandler
);

// GET /api/admin/analytics - Super Admin global analytics
router.get(
  '/admin/analytics',
  authenticate,
  authorizeRoles('SUPER_ADMIN'),
  analyticsRateLimiter,
  getGlobalAnalyticsHandler
);

// GET /api/municipality/reports/export - Export municipal complaint report (CSV or JSON)
router.get(
  '/municipality/reports/export',
  authenticate,
  authorizeRoles('MUNICIPALITY_ADMIN', 'MUNICIPALITY_OFFICER', 'SUPER_ADMIN'),
  exportRateLimiter,
  exportMunicipalityReportHandler
);

// GET /api/admin/reports/export - Export global report (CSV or JSON) for Super Admin
router.get(
  '/admin/reports/export',
  authenticate,
  authorizeRoles('SUPER_ADMIN'),
  exportRateLimiter,
  exportGlobalReportHandler
);

export default router;
