import express from 'express';
import { getReverseGeocode } from '../controllers/geocodingController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { geocodingRateLimiter } from '../middleware/geocodingRateLimiter.js';

const router = express.Router();

// GET /api/geocoding/reverse?lat=...&lon=... - Authenticated reverse geocoding
router.get('/reverse', authenticate, geocodingRateLimiter, getReverseGeocode);

export default router;
