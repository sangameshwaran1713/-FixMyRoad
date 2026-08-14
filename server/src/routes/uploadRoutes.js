import express from 'express';
import { uploadRoadImage } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { uploadRateLimiter } from '../middleware/uploadRateLimiter.js';

const router = express.Router();

// POST /api/uploads/road-image - Protected, Citizen-only road image upload
router.post(
  '/road-image',
  authenticate,
  authorizeRoles('CITIZEN'),
  uploadRateLimiter,
  upload.single('image'),
  uploadRoadImage
);

export default router;
