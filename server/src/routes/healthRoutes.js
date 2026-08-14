import express from 'express';
import { getHealth, getLivenessHealth, getReadinessHealth } from '../controllers/healthController.js';

const router = express.Router();

// Public health inspection routes
router.get('/health', getHealth);
router.get('/health/live', getLivenessHealth);
router.get('/health/ready', getReadinessHealth);

export default router;
