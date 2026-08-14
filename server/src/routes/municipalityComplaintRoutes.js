import express from 'express';
import {
  getDashboardStats,
  getComplaints,
  getComplaintDetails,
  updateStatus,
  assignComplaint,
  uploadResolutionImage,
  getOfficers,
} from '../controllers/municipalityComplaintController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { verifyMunicipalityComplaintAccess } from '../middleware/municipalityComplaintAccessMiddleware.js';
import { municipalityStatusRateLimiter } from '../middleware/municipalityStatusRateLimiter.js';
import { uploadSingleImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// GET /api/municipality/dashboard/stats - Aggregate stats for admin's municipality
router.get(
  '/dashboard/stats',
  authenticate,
  authorizeRoles('MUNICIPALITY_ADMIN', 'MUNICIPALITY_OFFICER'),
  getDashboardStats
);

// GET /api/municipality/complaints - Paginated filtered list of municipal complaints
router.get(
  '/complaints',
  authenticate,
  authorizeRoles('MUNICIPALITY_ADMIN', 'MUNICIPALITY_OFFICER'),
  getComplaints
);

// GET /api/municipality/officers - List active officers available for assignment
router.get(
  '/officers',
  authenticate,
  authorizeRoles('MUNICIPALITY_ADMIN', 'MUNICIPALITY_OFFICER'),
  getOfficers
);

// GET /api/municipality/complaints/:complaintId - Single complaint details
router.get(
  '/complaints/:complaintId',
  authenticate,
  authorizeRoles('MUNICIPALITY_ADMIN', 'MUNICIPALITY_OFFICER'),
  verifyMunicipalityComplaintAccess,
  getComplaintDetails
);

// PATCH /api/municipality/complaints/:complaintId/status - Update status through state machine
router.patch(
  '/complaints/:complaintId/status',
  authenticate,
  authorizeRoles('MUNICIPALITY_ADMIN', 'MUNICIPALITY_OFFICER'),
  verifyMunicipalityComplaintAccess,
  municipalityStatusRateLimiter,
  updateStatus
);

// PATCH /api/municipality/complaints/:complaintId/assign - Assign officer (ACCEPTED -> ASSIGNED)
router.patch(
  '/complaints/:complaintId/assign',
  authenticate,
  authorizeRoles('MUNICIPALITY_ADMIN'),
  verifyMunicipalityComplaintAccess,
  municipalityStatusRateLimiter,
  assignComplaint
);

// POST /api/municipality/complaints/:complaintId/resolution-image - Upload resolution evidence photo
router.post(
  '/complaints/:complaintId/resolution-image',
  authenticate,
  authorizeRoles('MUNICIPALITY_ADMIN', 'MUNICIPALITY_OFFICER'),
  verifyMunicipalityComplaintAccess,
  uploadSingleImage,
  uploadResolutionImage
);

export default router;
