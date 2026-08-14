import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Generate signed JWT token
 */
export const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_fixmyroad_2026_super_secure';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  return jwt.sign(
    {
      userId,
      role,
    },
    secret,
    { expiresIn }
  );
};

/**
 * Sanitize user object to exclude sensitive fields (like password)
 */
export const sanitizeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Helper to set HttpOnly cookie and send standardized JSON response
 */
export const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user._id, user.role);

  // Cookie expiration (days to milliseconds)
  const cookieDays = parseInt(process.env.COOKIE_EXPIRES_IN || '1', 10);
  const cookieOptions = {
    expires: new Date(Date.now() + cookieDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      token, // Also returned in body as fallback for non-cookie HTTP clients
      data: {
        user: sanitizeUser(user),
      },
    });
};

/**
 * Register new user service function
 */
export const registerUser = async ({ name, email, password, phone }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = 400;
    throw error;
  }

  // FORCE role = "CITIZEN" regardless of what payload provided
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone: phone ? phone.trim() : '',
    role: 'CITIZEN', // STRICT REQUIREMENT: Ignore role injection
    isActive: true,
  });

  return user;
};

/**
 * Authenticate user service function
 */
export const authenticateUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Find user and explicitly select password field
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Check if user account is active
  if (!user.isActive) {
    const error = new Error('Account is deactivated. Please contact support.');
    error.statusCode = 403;
    throw error;
  }

  // Verify password using bcrypt compare
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  return user;
};
