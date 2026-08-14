import rateLimit from 'express-rate-limit';

const maxAiRequests = parseInt(process.env.AI_RATE_LIMIT || '20', 10);
const windowMs = parseInt(process.env.AI_RATE_WINDOW_MS || '3600000', 10);

export const aiRateLimiter = rateLimit({
  windowMs,
  max: maxAiRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: `AI analysis rate limit exceeded. Maximum ${maxAiRequests} requests per hour allowed. Please try again later.`,
  },
});
