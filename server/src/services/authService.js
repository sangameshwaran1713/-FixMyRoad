import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOTPEmail } from './notification/emailNotificationService.js';

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
    username: user.username || null,
    phone: user.phone || '',
    role: user.role,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified || false,
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
 * Register new user service function (Sends 6-digit OTP for Citizen Email Verification)
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

  // Generate 6-digit OTP
  const rawOTP = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  // FORCE role = "CITIZEN" regardless of what payload provided
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone: phone ? phone.trim() : '',
    role: 'CITIZEN', // STRICT REQUIREMENT: Ignore role injection
    isActive: true,
    isEmailVerified: false,
    emailVerificationOTP: rawOTP,
    otpExpiresAt,
  });

  console.log(`\n==================================================`);
  console.log(`📩 CITIZEN EMAIL VERIFICATION OTP`);
  console.log(`To: ${normalizedEmail}`);
  console.log(`OTP Code: ${rawOTP} (Valid for 10 minutes)`);
  console.log(`==================================================\n`);

  // Dispatch real email via SMTP
  try {
    await sendOTPEmail({ recipient: normalizedEmail, otp: rawOTP, name: name.trim() });
  } catch (emailErr) {
    console.error('❌ Failed to dispatch OTP email:', emailErr.message);
  }

  return { user, rawOTP };
};

/**
 * Verify Citizen Email OTP
 */
export const verifyEmailOTP = async ({ email, otp }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+emailVerificationOTP +otpExpiresAt');

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.isEmailVerified) {
    return user;
  }

  if (!user.emailVerificationOTP || user.emailVerificationOTP !== otp.trim()) {
    const error = new Error('Invalid OTP code. Please check your email.');
    error.statusCode = 400;
    throw error;
  }

  if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
    const error = new Error('OTP has expired. Please request a new code.');
    error.statusCode = 400;
    throw error;
  }

  user.isEmailVerified = true;
  user.emailVerificationOTP = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  return user;
};

/**
 * Resend Verification OTP
 */
export const resendVerificationOTP = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.isEmailVerified) {
    const error = new Error('Email is already verified');
    error.statusCode = 400;
    throw error;
  }

  const rawOTP = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailVerificationOTP = rawOTP;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  console.log(`\n==================================================`);
  console.log(`📩 RESENT CITIZEN EMAIL VERIFICATION OTP`);
  console.log(`To: ${normalizedEmail}`);
  console.log(`OTP Code: ${rawOTP} (Valid for 10 minutes)`);
  console.log(`==================================================\n`);

  // Dispatch real email via SMTP
  try {
    await sendOTPEmail({ recipient: normalizedEmail, otp: rawOTP, name: user.name });
  } catch (emailErr) {
    console.error('❌ Failed to dispatch OTP email:', emailErr.message);
  }

  return { success: true, rawOTP };
};

/**
 * Authenticate user service function (Accepts email for Citizens or username/email for Officers/Admins)
 */
export const authenticateUser = async ({ identifier, email, username, password }) => {
  const loginKey = (identifier || email || username || '').toLowerCase().trim();

  if (!loginKey) {
    const error = new Error('Username or Email is required');
    error.statusCode = 400;
    throw error;
  }

  // Find user by either email OR username
  const user = await User.findOne({
    $or: [{ email: loginKey }, { username: loginKey }]
  }).select('+password');
  
  if (!user) {
    const error = new Error('Invalid credentials');
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
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  // Enforce email verification check for CITIZEN role
  if (user.role === 'CITIZEN' && !user.isEmailVerified) {
    const error = new Error('Email verification required. Please enter the OTP sent to your email.');
    error.statusCode = 403;
    error.requiresVerification = true;
    error.email = user.email;
    throw error;
  }

  return user;
};
