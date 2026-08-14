import rateLimit from 'express-rate-limit';

const maxCreates = parseInt(process.env.COMPLAINT_CREATE_RATE_LIMIT || '10', 10);
const windowMs = parseInt(process.env.COMPLAINT_CREATE_RATE_WINDOW_MS || '3600000', 10);

export const complaintRateLimiter = rateLimit({
  windowMs,
  max: maxCreates,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: `Complaint creation rate limit exceeded. Maximum ${maxCreates} submissions per hour allowed. Please try again later.`,
  },
});
