import rateLimit from 'express-rate-limit';

export const exportRateLimiter = rateLimit({
  windowMs: parseInt(process.env.EXPORT_RATE_WINDOW_MS || '3600000', 10), // 1 hour
  max: parseInt(process.env.EXPORT_RATE_LIMIT || '20', 10), // 20 report downloads per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'EXPORT_RATE_LIMIT_EXCEEDED',
    message: 'Too many report export requests from this IP, please try again after 1 hour.',
  },
});
