import rateLimit from 'express-rate-limit';

const maxResolves = parseInt(process.env.MUNICIPALITY_RESOLVE_RATE_LIMIT || '60', 10);
const windowMs = parseInt(process.env.MUNICIPALITY_RESOLVE_RATE_WINDOW_MS || '3600000', 10);

export const municipalityRateLimiter = rateLimit({
  windowMs,
  max: maxResolves,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: `Municipality resolution rate limit exceeded. Maximum ${maxResolves} requests per hour allowed. Please try again later.`,
  },
});
