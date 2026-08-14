import rateLimit from 'express-rate-limit';

const maxReopen = parseInt(process.env.REOPEN_RATE_LIMIT || '10', 10);
const windowMs = parseInt(process.env.REOPEN_RATE_WINDOW_MS || '3600000', 10);

export const reopenRateLimiter = rateLimit({
  windowMs,
  max: maxReopen,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: `Reopen request rate limit exceeded. Maximum ${maxReopen} reopen requests per hour allowed.`,
  },
});
