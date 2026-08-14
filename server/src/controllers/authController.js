import { 
  registerUser, 
  authenticateUser, 
  sendTokenResponse, 
  sanitizeUser 
} from '../services/authService.js';
import { 
  validateRegisterInput, 
  validateLoginInput 
} from '../validators/authValidators.js';

/**
 * @desc    Register a new user (Strictly forces CITIZEN role)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    // Validate inputs
    const { isValid, errors } = validateRegisterInput({ name, email, password, confirmPassword });
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors.join(', '),
        errors,
      });
    }

    // Register user service (Forces role = CITIZEN)
    const user = await registerUser({ name, email, password, phone });

    // Return token and sanitized user
    sendTokenResponse(user, 201, res, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token via HttpOnly cookie
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    const { isValid, errors } = validateLoginInput({ email, password });
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors.join(', '),
        errors,
      });
    }

    // Authenticate user
    const user = await authenticateUser({ email, password });

    // Return token and sanitized user
    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user & clear HttpOnly cookie
 * @route   POST /api/auth/logout
 * @access  Public / Authenticated
 */
export const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: sanitizeUser(req.user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Development test protected route
 * @route   GET /api/auth/protected-test
 * @access  Private
 */
export const protectedTest = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authenticated request successful',
    user: {
      id: req.user._id,
      role: req.user.role,
    },
  });
};

/**
 * @desc    Development test citizen role route
 * @route   GET /api/auth/citizen-test
 * @access  Private (CITIZEN)
 */
export const citizenTest = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Citizen access authorized',
    user: {
      id: req.user._id,
      role: req.user.role,
    },
  });
};

/**
 * @desc    Development test municipality admin role route
 * @route   GET /api/auth/municipality-test
 * @access  Private (MUNICIPALITY_ADMIN, SUPER_ADMIN)
 */
export const municipalityTest = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Municipality Admin access authorized',
    user: {
      id: req.user._id,
      role: req.user.role,
    },
  });
};

/**
 * @desc    Development test super admin role route
 * @route   GET /api/auth/admin-test
 * @access  Private (SUPER_ADMIN)
 */
export const adminTest = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Super Admin access authorized',
    user: {
      id: req.user._id,
      role: req.user.role,
    },
  });
};
