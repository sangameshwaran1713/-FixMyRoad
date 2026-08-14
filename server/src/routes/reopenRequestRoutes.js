import express from 'express';
import {
  createReopen,
  uploadReopenImage,
  getReopenRequests,
  getReopenRequestDetails,
  acceptReopen,
  rejectReopen,
} from '../controllers/reopenRequestController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { reopenRateLimiter } from '../middleware/reopenRateLimiter.js';
import { uploadSingleImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// POST /api/complaints/:complaintId/reopen - Citizen submits reopen request (status remains RESOLVED)
router.post(
  '/complaints/:complaintId/reopen',
  authenticate,
  authorizeRoles('CITIZEN'),
  reopenRateLimiter,
  createReopen
);

// POST /api/complaints/:complaintId/reopen-image - Upload fresh road condition photo evidence
router.post(
  '/complaints/:complaintId/reopen-image',
  authenticate,
  authorizeRoles('CITIZEN'),
  uploadSingleImage,
  uploadReopenImage
);

// GET /api/municipality/reopen-requests - List reopen requests for municipality
router.get(
  '/municipality/reopen-requests',
  authenticate,
  authorizeRoles('MUNICIPALITY_ADMIN', 'MUNICIPALITY_OFFICER', 'SUPER_ADMIN'),
  getReopenRequests
);

// GET /api/municipality/reopen-requests/:id - Single reopen request details
router.get(
  '/municipality/reopen-requests/:id',
  authenticate,
  authorizeRoles('MUNICIPALITY_ADMIN', 'MUNICIPALITY_OFFICER', 'SUPER_ADMIN'),
  getReopenRequestDetails
);

// PATCH /api/municipality/reopen-requests/:id/accept - Admin accepts reopen request (RESOLVED -> UNDER_REVIEW)
router.patch(
  '/municipality/reopen-requests/:id/accept',
  authenticate,
  authorizeRoles('MUNICIPALITY_ADMIN', 'SUPER_ADMIN'),
  acceptReopen
);

// PATCH /api/municipality/reopen-requests/:id/reject - Admin rejects reopen request (complaint remains RESOLVED)
router.patch(
  '/municipality/reopen-requests/:id/reject',
  authenticate,
  authorizeRoles('MUNICIPALITY_ADMIN', 'SUPER_ADMIN'),
  rejectReopen
);

export default router;
