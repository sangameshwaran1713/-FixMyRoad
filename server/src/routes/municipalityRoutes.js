import express from 'express';
import { resolveMunicipality } from '../controllers/municipalityController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { municipalityRateLimiter } from '../middleware/municipalityRateLimiter.js';

const router = express.Router();

// POST /api/municipalities/resolve - Authenticated GeoJSON spatial intersection routing
router.post(
  '/resolve',
  authenticate,
  authorizeRoles('CITIZEN', 'MUNICIPALITY_ADMIN', 'SUPER_ADMIN'),
  municipalityRateLimiter,
  resolveMunicipality
);

export default router;
