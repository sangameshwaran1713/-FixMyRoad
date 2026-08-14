import express from 'express';
import { analyzeRoadImage } from '../controllers/aiController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { aiRateLimiter } from '../middleware/aiRateLimiter.js';

const router = express.Router();

// POST /api/ai/analyze - Protected Citizen road image AI analysis
router.post('/analyze', authenticate, authorizeRoles('CITIZEN'), aiRateLimiter, analyzeRoadImage);

export default router;
