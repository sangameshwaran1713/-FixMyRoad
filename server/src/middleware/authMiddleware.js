import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  let token;

  // 1. Check HttpOnly cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback check Authorization header (Bearer token)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token provided
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please log in.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_fixmyroad_2026_super_secure';
    
    // Verify JWT payload
    const decoded = jwt.verify(token, secret);

    // Fetch user from database
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    // Check account active status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Access forbidden.',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Token verification failed or expired.',
    });
  }
};
