import rateLimit from 'express-rate-limit';

const maxMutations = parseInt(process.env.MUNICIPALITY_STATUS_RATE_LIMIT || '60', 10);
const windowMs = parseInt(process.env.MUNICIPALITY_STATUS_RATE_WINDOW_MS || '3600000', 10);

export const municipalityStatusRateLimiter = rateLimit({
  windowMs,
  max: maxMutations,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: `Municipal complaint mutation rate limit exceeded. Maximum ${maxMutations} updates per hour allowed per IP.`,
  },
});
