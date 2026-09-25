import express from 'express';
import { 
  register, 
  login, 
  logout, 
  verifyOTP,
  resendOTP,
  getCurrentUser, 
  protectedTest,
  citizenTest,
  municipalityTest,
  adminTest
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public Authentication Endpoints
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/logout', logout);

// Authenticated User Endpoints
router.get('/me', authenticate, getCurrentUser);

// Temporary Development / Testing Endpoints for Phase 2 Validation
router.get('/protected-test', authenticate, protectedTest);
router.get('/citizen-test', authenticate, authorizeRoles('CITIZEN'), citizenTest);
router.get('/municipality-test', authenticate, authorizeRoles('MUNICIPALITY_ADMIN', 'SUPER_ADMIN'), municipalityTest);
router.get('/admin-test', authenticate, authorizeRoles('SUPER_ADMIN'), adminTest);

export default router;
