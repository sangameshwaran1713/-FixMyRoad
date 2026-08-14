import rateLimit from 'express-rate-limit';

const maxUploads = parseInt(process.env.UPLOAD_RATE_LIMIT || '20', 10);
const windowMs = parseInt(process.env.UPLOAD_RATE_WINDOW_MS || '3600000', 10);

export const uploadRateLimiter = rateLimit({
  windowMs,
  max: maxUploads,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: `Upload rate limit exceeded. Maximum ${maxUploads} uploads per hour allowed. Please try again later.`,
  },
});
