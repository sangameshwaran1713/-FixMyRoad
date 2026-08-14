import rateLimit from 'express-rate-limit';

export const analyticsRateLimiter = rateLimit({
  windowMs: parseInt(process.env.ANALYTICS_RATE_WINDOW_MS || '3600000', 10), // 1 hour
  max: parseInt(process.env.ANALYTICS_RATE_LIMIT || '60', 10), // 60 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'ANALYTICS_RATE_LIMIT_EXCEEDED',
    message: 'Too many analytics requests from this IP, please try again after 1 hour.',
  },
});
