import rateLimit from 'express-rate-limit';

export const healthRateLimiter = rateLimit({
  windowMs: parseInt(process.env.HEALTH_RATE_WINDOW_MS || '3600000', 10), // 1 hour
  max: parseInt(process.env.HEALTH_RATE_LIMIT || '120', 10), // 120 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'HEALTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many system health inspection requests from this IP, please try again after 1 hour.',
  },
});
